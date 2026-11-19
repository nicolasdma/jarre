import { describe, expect, it, vi } from 'vitest';
import {
  MAX_AUDIO_BYTES,
  MAX_BODY_BYTES,
  baseAudioType,
  handleTranscribe,
  isAllowedAudioType,
  transcribeInstruction,
  transcribeLanguage,
  type TranscribeDeps,
} from '../transcribe';

const OK_BUDGET = { allowed: true, used: 0, limit: 1, remaining: 1, message: 'ok' };

function deps(over: Partial<TranscribeDeps> = {}): TranscribeDeps & { calls: { transcribe: number; logged: number[] } } {
  const calls = { transcribe: 0, logged: [] as number[] };
  return {
    calls,
    rateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
    budget: async () => OK_BUDGET,
    transcribe: async () => {
      calls.transcribe++;
      return { text: ' data integrity means ', tokens: 251 };
    },
    logTokens: (t) => calls.logged.push(t),
    ...over,
  };
}

function request(audio: Blob | string | null, extra: Record<string, string> = {}, headers: Record<string, string> = {}): Request {
  const form = new FormData();
  if (audio !== null) form.set('audio', audio as Blob);
  for (const [k, v] of Object.entries(extra)) form.set(k, v);
  return new Request('http://localhost/api/practice/transcribe', { method: 'POST', body: form, headers });
}

const clip = (bytes = 2048, type = 'audio/mp4') => new Blob([new Uint8Array(bytes)], { type });

describe('transcribe route guards', () => {
  it('transcribes an iPhone take (audio/mp4) and logs its tokens', async () => {
    const d = deps();
    const res = await handleTranscribe(request(clip(2048, 'audio/mp4;codecs=mp4a.40.2')), d);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: 'data integrity means' });
    expect(d.calls.transcribe).toBe(1);
    expect(d.calls.logged).toEqual([251]);
  });

  it('refuses a body declared over the cap before reading it or spending anything', async () => {
    const d = deps();
    const res = await handleTranscribe(request(clip(), {}, { 'content-length': String(MAX_BODY_BYTES + 1) }), d);
    expect(res.status).toBe(413);
    expect(d.calls.transcribe).toBe(0);
  });

  it('refuses an oversized clip', async () => {
    const d = deps();
    const res = await handleTranscribe(request(clip(MAX_AUDIO_BYTES + 1)), d);
    expect(res.status).toBe(413);
    expect((await res.json()).reason).toBe('too_large');
    expect(d.calls.transcribe).toBe(0);
  });

  it('refuses a missing, empty or non-audio upload', async () => {
    for (const body of [null, 'text', clip(0)]) {
      const res = await handleTranscribe(request(body), deps());
      expect(res.status).toBe(400);
    }
    const res = await handleTranscribe(request(clip(100, 'video/mp4')), deps());
    expect(res.status).toBe(415);
  });

  it('answers 429 with Retry-After when the per-user rate limit is hit, without calling the model', async () => {
    const d = deps({ rateLimit: () => ({ allowed: false, retryAfterMs: 12_300 }) });
    const res = await handleTranscribe(request(clip()), d);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('13');
    expect((await res.json()).reason).toBe('rate_limit');
    expect(d.calls.transcribe).toBe(0);
  });

  it('answers 429 when the daily spend cap is reached', async () => {
    const budget = vi.fn(async () => ({ ...OK_BUDGET, allowed: false, reason: 'daily_cap' as const, message: 'Daily AI usage limit reached.' }));
    const d = deps({ budget });
    const res = await handleTranscribe(request(clip()), d);
    expect(res.status).toBe(429);
    expect((await res.json()).reason).toBe('daily_cap');
    expect(d.calls.transcribe).toBe(0);
  });

  it('answers 502 when the model fails, never its message', async () => {
    const d = deps({ transcribe: async () => { throw new Error('API key not valid: secret-ish detail'); } });
    const res = await handleTranscribe(request(clip()), d);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.reason).toBe('upstream');
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('sends the base media type and a safe language to the model', async () => {
    const transcribe = vi.fn(async () => ({ text: 'hi', tokens: 0 }));
    await handleTranscribe(request(clip(10, 'audio/webm;codecs=opus'), { lang: 'xx; drop' }), deps({ transcribe }));
    expect(transcribe).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'audio/webm', language: 'en-US' }));
  });
});

describe('transcribe helpers', () => {
  it('accepts what browsers record, nothing else', () => {
    for (const t of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/x-m4a', 'audio/wav']) expect(isAllowedAudioType(t)).toBe(true);
    for (const t of ['', 'video/webm', 'application/json', 'text/plain']) expect(isAllowedAudioType(t)).toBe(false);
    expect(baseAudioType('audio/mp4;codecs=mp4a.40.2')).toBe('audio/mp4');
  });

  it('keeps the language to a locale tag', () => {
    expect(transcribeLanguage('es-AR')).toBe('es-AR');
    expect(transcribeLanguage(undefined)).toBe('en-US');
    expect(transcribeLanguage('<script>')).toBe('en-US');
  });

  it('asks for what was said, never the corrected text', () => {
    const text = transcribeInstruction('en-US');
    expect(text).toMatch(/Never correct/);
    expect(text).toMatch(/English/);
  });
});
