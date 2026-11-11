/**
 * One word or term, read by the browser's English voice. The drill audio has
 * no word timings, so a single word cannot be cut from it; the browser voice
 * (en-US, slowed down) is the next best thing and works offline.
 */

export const canSpeak = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

function englishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'en-US' && v.localService) ?? voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
}

/** Read `text` in English at `rate` (0.8: a bit slower than normal). Cancels whatever was being read. */
export function speakEnglish(text: string, rate = 0.8): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  const voice = englishVoice();
  if (voice) u.voice = voice;
  synth.speak(u);
}
