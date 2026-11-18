import { describe, expect, it } from 'vitest';
import { buildVoiceTokenConfig, VOICE_TOKEN_EXPIRE_MS, VOICE_TOKEN_NEW_SESSION_MS } from '../live-token';

describe('buildVoiceTokenConfig', () => {
  const now = Date.UTC(2026, 10, 18, 12, 0, 0);
  const config = buildVoiceTokenConfig('gemini-3.8-live', now);

  it('is short-lived and few-use', () => {
    expect(config.uses).toBeLessThanOrEqual(3);
    expect(Date.parse(config.expireTime) - now).toBe(VOICE_TOKEN_EXPIRE_MS);
    expect(Date.parse(config.newSessionExpireTime) - now).toBe(VOICE_TOKEN_NEW_SESSION_MS);
    expect(VOICE_TOKEN_EXPIRE_MS).toBeLessThanOrEqual(30 * 60 * 1000);
  });

  it('locks the model and audio output', () => {
    expect(config.liveConnectConstraints.model).toBe('gemini-3.8-live');
    expect(config.liveConnectConstraints.config.responseModalities).toEqual(['AUDIO']);
  });

  it('never locks the client-side fields the tutor needs', () => {
    // An empty or missing lockAdditionalFields locks every LiveConnectConfig
    // field and the client's system instruction is ignored (live-token.ts).
    expect(config.lockAdditionalFields.length).toBeGreaterThan(0);
    const lockedConfig = config.liveConnectConstraints.config as Record<string, unknown>;
    for (const field of ['systemInstruction', 'tools', 'realtimeInputConfig', 'sessionResumption']) {
      expect(lockedConfig[field]).toBeUndefined();
      expect(config.lockAdditionalFields).not.toContain(field);
    }
  });
});
