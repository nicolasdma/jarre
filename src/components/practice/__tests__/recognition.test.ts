import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chooseRecognizer,
  recognitionError,
  shouldTryServerAfter,
  withServerFallback,
  type Recognition,
  type RecognitionCtor,
  type RecognizerEnv,
} from '../recognition';
import {
  ServerRecognition,
  isIosDevice,
  micErrorCode,
  pickRecordingType,
  transcribeErrorCode,
} from '../server-recognition';

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15';
const DESKTOP_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

const env = (over: Partial<RecognizerEnv>): RecognizerEnv => ({
  hasNative: true,
  ios: false,
  canRecord: true,
  nativeBroken: false,
  override: null,
  ...over,
});

describe('which recognizer a drill uses', () => {
  it('desktop Chrome keeps the browser recognizer', () => {
    expect(isIosDevice(DESKTOP_CHROME, 0)).toBe(false);
    expect(chooseRecognizer(env({ ios: isIosDevice(DESKTOP_CHROME, 0) }))).toBe('native');
  });

  it('every iOS browser goes to the server, Safari included, even with webkitSpeechRecognition present', () => {
    for (const [ua, touch] of [[IPHONE_SAFARI, 5], [IPHONE_CHROME, 5], [IPAD_AS_MAC, 5]] as const) {
      expect(isIosDevice(ua, touch)).toBe(true);
      expect(chooseRecognizer(env({ ios: true, hasNative: true }))).toBe('server');
    }
    // A real Mac (no touch) is not an iPad.
    expect(isIosDevice(IPAD_AS_MAC, 0)).toBe(false);
  });

  it('no SpeechRecognition (Firefox) goes to the server when it can record, else nothing', () => {
    expect(chooseRecognizer(env({ hasNative: false }))).toBe('server');
    expect(chooseRecognizer(env({ hasNative: false, canRecord: false }))).toBe('none');
  });

  it('after the browser recognizer refused while the mic worked, the page stays on the server', () => {
    expect(chooseRecognizer(env({ nativeBroken: true }))).toBe('server');
  });

  it('iOS without a way to record (plain http on the LAN) keeps what the browser has', () => {
    expect(chooseRecognizer(env({ ios: true, canRecord: false }))).toBe('native');
  });

  it('?stt= forces an engine', () => {
    expect(chooseRecognizer(env({ override: 'server' }))).toBe('server');
    expect(chooseRecognizer(env({ ios: true, override: 'native' }))).toBe('native');
  });
});

describe('after a refusal of the browser recognizer', () => {
  it('a blocked mic stays blocked; a dismissed prompt is not asked again', () => {
    expect(shouldTryServerAfter('not-allowed', 'denied')).toBe(false);
    expect(shouldTryServerAfter('not-allowed', 'prompt')).toBe(false);
    expect(shouldTryServerAfter('service-not-allowed', 'denied')).toBe(false);
  });

  it('a mic that works with a recognizer that refuses tries the server', () => {
    expect(shouldTryServerAfter('not-allowed', 'granted')).toBe(true);
    expect(shouldTryServerAfter('not-allowed', 'unknown')).toBe(true);
    expect(shouldTryServerAfter('service-not-allowed', 'prompt')).toBe(true);
    expect(shouldTryServerAfter('network', 'granted')).toBe(false);
  });
});

/** A browser recognizer that refuses (or hears `said`) on start. */
function fakeNative(outcome: { error?: string; said?: string }) {
  const made: Recognition[] = [];
  class Native implements Recognition {
    lang = '';
    continuous = false;
    interimResults = false;
    onresult: Recognition['onresult'] = null;
    onerror: Recognition['onerror'] = null;
    onend: Recognition['onend'] = null;
    constructor() {
      made.push(this);
    }
    start() {
      queueMicrotask(() => {
        if (outcome.error) this.onerror?.({ error: outcome.error });
        if (outcome.said) this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: outcome.said } }] });
        this.onend?.();
      });
    }
    stop() {}
    abort() {}
  }
  return { Native: Native as RecognitionCtor, made };
}

function fakeServer(said: string) {
  const started: Recognition[] = [];
  class Server implements Recognition {
    lang = '';
    continuous = false;
    interimResults = false;
    endOnSilenceMs = 0;
    onresult: Recognition['onresult'] = null;
    onerror: Recognition['onerror'] = null;
    onend: Recognition['onend'] = null;
    onphase: Recognition['onphase'] = null;
    start() {
      started.push(this);
      queueMicrotask(() => {
        this.onphase?.('recording');
        this.onphase?.('transcribing');
        this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: said } }] });
        this.onend?.();
      });
    }
    stop() {}
    abort() {}
  }
  return { Server: Server as RecognitionCtor, started };
}

function listen(rec: Recognition) {
  const log: string[] = [];
  return new Promise<string[]>((resolve) => {
    rec.onresult = (e) => log.push(`result:${e.results[0][0].transcript}`);
    rec.onerror = (e) => log.push(`error:${e.error}`);
    rec.onphase = (p) => log.push(`phase:${p}`);
    rec.onend = () => {
      log.push('end');
      resolve(log);
    };
    rec.start();
  });
}

describe('the browser recognizer with the server behind it', () => {
  it('passes the browser recognizer through untouched when it works (desktop Chrome)', async () => {
    const { Native } = fakeNative({ said: 'hello there' });
    const { Server, started } = fakeServer('never');
    const Ctor = withServerFallback(Native, { canUseServer: async () => true, Server, onSwitch: () => {} });
    const rec = new Ctor();
    rec.continuous = true;
    expect(await listen(rec)).toEqual(['result:hello there', 'end']);
    expect(started).toHaveLength(0);
  });

  it('not-allowed while the mic works: the same take goes on with the server and the page switches', async () => {
    const { Native } = fakeNative({ error: 'not-allowed' });
    const { Server, started } = fakeServer('data integrity');
    const onSwitch = vi.fn();
    const Ctor = withServerFallback(Native, { canUseServer: async () => true, Server, onSwitch });
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.endOnSilenceMs = 1600;
    expect(await listen(rec)).toEqual(['phase:recording', 'phase:transcribing', 'result:data integrity', 'end']);
    expect(started).toHaveLength(1);
    expect(started[0].lang).toBe('en-US');
    expect(started[0].endOnSilenceMs).toBe(1600);
    expect(onSwitch).toHaveBeenCalledOnce();
  });

  it('a real mic denial still says so', async () => {
    const { Native } = fakeNative({ error: 'not-allowed' });
    const { Server, started } = fakeServer('never');
    const Ctor = withServerFallback(Native, { canUseServer: async () => false, Server, onSwitch: () => {} });
    expect(await listen(new Ctor())).toEqual(['error:not-allowed', 'end']);
    expect(started).toHaveLength(0);
  });

  it('other errors are not held', async () => {
    const { Native } = fakeNative({ error: 'no-speech' });
    const { Server } = fakeServer('never');
    const canUseServer = vi.fn(async () => true);
    const Ctor = withServerFallback(Native, { canUseServer, Server, onSwitch: () => {} });
    expect(await listen(new Ctor())).toEqual(['error:no-speech', 'end']);
    expect(canUseServer).not.toHaveBeenCalled();
  });
});

describe('server recognizer helpers', () => {
  it('records MP4 on iOS and Opus elsewhere', () => {
    const safari = (t: string) => t === 'audio/mp4';
    const chrome = (t: string) => t.startsWith('audio/webm');
    expect(pickRecordingType(safari, true)).toBe('audio/mp4');
    expect(pickRecordingType(chrome, false)).toBe('audio/webm;codecs=opus');
    expect(pickRecordingType(() => false, false)).toBe('');
  });

  it('turns a mic refusal into an honest message, with the iPhone steps on iOS', () => {
    expect(micErrorCode({ name: 'NotAllowedError' }, true)).toBe('mic-blocked-ios');
    expect(micErrorCode({ name: 'NotAllowedError' }, false)).toBe('not-allowed');
    expect(micErrorCode({ name: 'NotFoundError' }, true)).toBe('audio-capture');
    expect(recognitionError('mic-blocked-ios')).toMatch(/Micrófono › Permitir/);
  });

  it('network and transcription failures have their own messages', () => {
    expect(transcribeErrorCode(null)).toBe('transcribe-network');
    expect(transcribeErrorCode(429)).toBe('transcribe-limit');
    expect(transcribeErrorCode(502)).toBe('transcribe-failed');
    for (const code of ['transcribe-network', 'transcribe-limit', 'transcribe-failed']) {
      expect(recognitionError(code)).not.toMatch(/bloqueó/);
    }
  });
});

describe('ServerRecognition', () => {
  let tracks: { stop: ReturnType<typeof vi.fn> }[];
  let fetchMock: ReturnType<typeof vi.fn>;
  let getUserMedia: ReturnType<typeof vi.fn>;

  class FakeRecorder {
    static isTypeSupported = (t: string) => t === 'audio/mp4';
    state: 'inactive' | 'recording' = 'inactive';
    mimeType = 'audio/mp4';
    ondataavailable: ((e: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    start() {
      this.state = 'recording';
    }
    stop() {
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob([new Uint8Array(4000)], { type: 'audio/mp4' }) });
      this.onstop?.();
    }
  }

  beforeEach(() => {
    tracks = [{ stop: vi.fn() }];
    getUserMedia = vi.fn(async () => ({ getTracks: () => tracks }));
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ text: 'data integrity means' }), { status: 200 }));
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('navigator', { userAgent: IPHONE_SAFARI, maxTouchPoints: 5, mediaDevices: { getUserMedia } });
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('records, transcribes on stop, gives one final result, closes the mic', async () => {
    const rec = new ServerRecognition();
    const log: string[] = [];
    rec.onphase = (p) => log.push(p);
    rec.onresult = (e) => log.push(`result:${e.results[0][0].transcript}`);
    rec.onend = () => log.push('end');
    rec.start();
    await flush();
    expect(log).toEqual(['recording']);
    vi.setSystemTime(Date.now() + 2000);
    rec.stop();
    await flush();
    await flush();
    expect(log).toEqual(['recording', 'transcribing', 'result:data integrity means', 'end']);
    expect(tracks[0].stop).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/practice/transcribe');
    const sent = (init as RequestInit).body as FormData;
    expect((sent.get('audio') as Blob).type).toBe('audio/mp4');
  });

  it('abort drops the take: nothing is sent, the mic closes, it ends as aborted', async () => {
    const rec = new ServerRecognition();
    const log: string[] = [];
    rec.onerror = (e) => log.push(`error:${e.error}`);
    rec.onend = () => log.push('end');
    rec.start();
    await flush();
    rec.abort();
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tracks[0].stop).toHaveBeenCalled();
    expect(log).toEqual(['error:aborted', 'end']);
  });

  it('a denied mic on the iPhone says how to allow it', async () => {
    getUserMedia.mockRejectedValueOnce(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
    const rec = new ServerRecognition();
    const log: string[] = [];
    rec.onerror = (e) => log.push(`error:${e.error}`);
    rec.onend = () => log.push('end');
    rec.start();
    await flush();
    expect(log).toEqual(['error:mic-blocked-ios', 'end']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a failed transcription is not a mic problem', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 502 }));
    const rec = new ServerRecognition();
    const log: string[] = [];
    rec.onerror = (e) => log.push(`error:${e.error}`);
    rec.onend = () => log.push('end');
    rec.start();
    await flush();
    vi.setSystemTime(Date.now() + 2000);
    rec.stop();
    await flush();
    await flush();
    expect(log).toEqual(['error:transcribe-failed', 'end']);
  });

  it('a tap-and-release take sends nothing and ends quietly', async () => {
    const rec = new ServerRecognition();
    const log: string[] = [];
    rec.onerror = (e) => log.push(`error:${e.error}`);
    rec.onend = () => log.push('end');
    rec.start();
    await flush();
    rec.stop();
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log).toEqual(['end']);
  });
});
