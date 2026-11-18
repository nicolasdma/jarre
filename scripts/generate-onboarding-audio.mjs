// The onboarding voice intro's clips, from src/data/onboarding-intro.json (one file for every lesson).
//
// Usage:
//   node scripts/generate-onboarding-audio.mjs [--lang es] [--only welcome,reminder] [--check]
//
// - Same method as the practice audios (~/Desktop/demaria/50-aprender/entrevistas/_herramientas/
//   generar-audios-estilo.mjs): a style lead-in plus the text to Gemini TTS, the spoken lead-in cut with
//   local Whisper word timings. Only the free-tier keys, in the same order; a daily-quota 429 moves to
//   the next key and stops when all are out (no other TTS service).
// - Only variants with an `audio` path are generated, into public/<path>; an existing file is skipped
//   unless named in --only.
// - Every clip is checked with Whisper: the transcript has to say the whole script (≥ 92 % of its words,
//   in order) and the first and last words. --check only re-runs that check on the files there.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const DATA = join(ROOT, 'src/data/onboarding-intro.json');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const LANG = opt('--lang') ?? 'es';
const ONLY = opt('--only')?.split(',') ?? null;
const CHECK_ONLY = args.includes('--check');

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const VOICE = process.env.VOICE || data.voice || 'Sulafat';
const MODEL = 'gemini-3.8-flash-tts';
const LEAD_IN = {
  es: 'Leé esto en voz alta en español rioplatense, con calidez y calma, sin apuro, como alguien que le da la bienvenida a una persona que empieza a estudiar: ',
  en: 'Read this aloud warmly and calmly, unhurried, like someone welcoming a person who is starting to study: ',
}[LANG];

const keyFrom = (f) => (existsSync(f) ? readFileSync(f, 'utf8').match(/^GEMINI_API_KEY=["']?([^"'\n]+)/m)?.[1] : null);
const KEYS = [
  ['extra', keyFrom(process.env.HOME + '/.config/demaria/gemini-tts.env')],
  ['jarre', keyFrom(join(ROOT, '.env.local'))],
  ['avatar-landing', keyFrom(process.env.HOME + '/Desktop/avatar-landing/.env.local')],
].filter(([, k]) => k);

class QuotaExhausted extends Error {}
let keyIndex = 0;

async function tts(text) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (keyIndex >= KEYS.length) throw new QuotaExhausted('every free-tier key is out of daily quota');
    const [keyName, key] = KEYS[keyIndex];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${LEAD_IN}"${text}"` }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
      }),
    });
    if (res.ok) {
      const j = await res.json();
      const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part) throw new Error('no audio in response');
      const rate = Number(part.inlineData.mimeType?.match(/rate=(\d+)/)?.[1] ?? 24000);
      return { pcm: Buffer.from(part.inlineData.data, 'base64'), rate, keyName };
    }
    const body = await res.text();
    if (res.status === 429 && /PerDay|per day|daily/i.test(body)) {
      console.log(`  ${keyName}: daily quota exhausted`);
      keyIndex++;
      continue;
    }
    if (res.status !== 429 && res.status < 500) throw new Error(`TTS ${res.status}: ${body.slice(0, 300)}`);
    console.log(`  ${keyName}: ${res.status}, retry ${attempt} in ${30 * attempt}s`);
    await new Promise((r) => setTimeout(r, 30_000 * attempt));
  }
  throw new Error('TTS kept failing');
}

const WORK = join(tmpdir(), 'jarre-onboarding-audio');
mkdirSync(WORK, { recursive: true });
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const norm = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const wordsOf = (t) => t.split(/\s+/).map(norm).filter(Boolean);

function whisperWords(file, name) {
  const json = join(WORK, `${name}.json`);
  rmSync(json, { force: true });
  execFileSync('mlx_whisper', [file, '--model', 'mlx-community/whisper-large-v3-turbo', '--language', LANG, '--word-timestamps', 'True',
    '--output-format', 'json', '--output-dir', WORK, '--output-name', name, '--verbose', 'False'], { stdio: 'ignore' });
  return JSON.parse(readFileSync(json, 'utf8').replace(/\bNaN\b/g, 'null')).segments.flatMap((s) => s.words || []).map((w) => ({ ...w, n: norm(w.word) }));
}

const same = (a, b) => a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a)));

/** Where the script starts in what was heard: after the lead-in, its first three words in a row. */
function textStart(words, text) {
  const first = wordsOf(text).slice(0, 3);
  for (let i = 0; i < words.length; i++) {
    if (first.every((w, k) => words[i + k] && same(words[i + k].n, w))) return i;
  }
  return -1;
}

/** Share of the script's words heard, in order (longest common subsequence). */
function coverage(heard, script) {
  const a = heard, b = script;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diag = 0;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = same(a[i - 1], b[j - 1]) ? diag + 1 : Math.max(prev[j], prev[j - 1]);
      diag = up;
    }
  }
  return prev[b.length] / b.length;
}

function check(file, text, name) {
  const heard = whisperWords(file, `${name}--check`).map((w) => w.n);
  const script = wordsOf(text);
  const cov = coverage(heard, script);
  const firstOk = heard.length > 0 && same(heard[0], script[0]);
  const lastOk = heard.length > 0 && same(heard[heard.length - 1], script[script.length - 1]);
  return { ok: cov >= 0.92 && firstOk && lastOk, cov, firstOk, lastOk, len: dur(file), heard: heard.join(' ') };
}

const variants = Object.entries(data.variants)
  .map(([id, v]) => ({ id, ...v[LANG] }))
  .filter((v) => v.audio && (!ONLY || ONLY.includes(v.id)));
if (!variants.length) throw new Error(`no ${LANG} variant with an audio path`);

let failed = 0;
for (const v of variants) {
  const out = join(ROOT, 'public', v.audio);
  mkdirSync(dirname(out), { recursive: true });
  if (!CHECK_ONLY && (ONLY || !existsSync(out))) {
    if (!KEYS.length) throw new Error('no free-tier GEMINI_API_KEY found');
    let r;
    try {
      r = await tts(v.text);
    } catch (e) {
      if (e instanceof QuotaExhausted) {
        console.log(`STOP: ${e.message}. Still to generate: ${variants.filter((x) => !existsSync(join(ROOT, 'public', x.audio))).map((x) => x.id).join(', ')}`);
        console.log(`Retry tomorrow: node scripts/generate-onboarding-audio.mjs --lang ${LANG}`);
        process.exit(2);
      }
      throw e;
    }
    const raw = join(WORK, `${v.id}.pcm`);
    const orig = join(WORK, `${v.id}-orig.m4a`);
    writeFileSync(raw, r.pcm);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 's16le', '-ar', String(r.rate), '-ac', '1', '-i', raw, '-c:a', 'aac', '-b:a', '64k', orig]);
    const words = whisperWords(orig, `${v.id}--orig`);
    const i = textStart(words, v.text);
    if (i < 0) {
      console.log(`CHECK ${v.id}: the script's start was not found; heard "${words.slice(0, 25).map((w) => w.word).join('').trim()}"`);
      failed++;
      continue;
    }
    const startAt = i === 0 ? 0 : Math.max(0, words[i].start - 0.12);
    const endAt = Math.min(dur(orig), words[words.length - 1].end + 0.35);
    const len = endAt - startAt;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', startAt.toFixed(3), '-i', orig, '-t', len.toFixed(3),
      '-af', `afade=t=in:st=0:d=0.04,afade=t=out:st=${(len - 0.12).toFixed(3)}:d=0.12`, '-c:a', 'aac', '-b:a', '64k', out]);
    console.log(`  ${v.id} [${r.keyName}, ${VOICE}]: lead-in ${i > 0 ? `cut at ${startAt.toFixed(2)}s` : 'not spoken'}`);
  }
  if (!existsSync(out)) { console.log(`MISSING ${v.id}: ${out}`); failed++; continue; }
  const c = check(out, v.text, v.id);
  const wpm = Math.round(wordsOf(v.text).length / (c.len / 60));
  console.log(`${c.ok ? 'OK   ' : 'CHECK'} ${v.id}: ${c.len.toFixed(1)} s, ${wpm} wpm, ${(c.cov * 100).toFixed(0)} % of the script heard in order, first word ${c.firstOk ? 'ok' : 'missing'}, last word ${c.lastOk ? 'ok' : 'missing'}`);
  if (!c.ok) { console.log(`  heard: ${c.heard}`); failed++; }
}
process.exit(failed ? 1 : 0);
