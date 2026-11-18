import { describe, expect, it } from 'vitest';
import { EndSensitivity, Type } from '@google/genai';
import { TURN_TAKING } from '../live-models';
import { TUTOR_TOOLS } from '../tool-declarations';

// live-models.ts and tool-declarations.ts spell the SDK's enum values as
// strings so the lesson bundle does not carry the SDK. They must stay equal.
describe('SDK enum literals', () => {
  it('turn taking uses the SDK end-of-speech value', () => {
    for (const cfg of Object.values(TURN_TAKING)) {
      expect(cfg.automaticActivityDetection?.endOfSpeechSensitivity).toBe(EndSensitivity.END_SENSITIVITY_LOW);
    }
  });

  it('tool schemas use the SDK Type values', () => {
    const allowed = new Set<string>([Type.OBJECT, Type.STRING, Type.BOOLEAN, Type.NUMBER, Type.INTEGER, Type.ARRAY]);
    const seen: string[] = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const rec = node as Record<string, unknown>;
      if (typeof rec.type === 'string') seen.push(rec.type);
      Object.values(rec).forEach(walk);
    };
    walk(TUTOR_TOOLS);
    expect(seen.length).toBeGreaterThan(0);
    for (const t of seen) expect(allowed.has(t)).toBe(true);
  });
});
