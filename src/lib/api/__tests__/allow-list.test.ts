import { describe, expect, it } from 'vitest';
import { DEFAULT_ALLOWED_USER_IDS, isAllowedUser, parseAllowedUserIds, signupOpen } from '../allow-list';

const OWNER = '6aa740cf-ada1-47a8-a30e-daa4612683fb';
const GUEST = '3cf95062-d369-490e-b55b-487090413089';
const STRANGER = '00000000-0000-4000-8000-000000000000';

describe('allow-list', () => {
  it('defaults to the owner and the guest when the env var is unset or empty', () => {
    expect(DEFAULT_ALLOWED_USER_IDS).toEqual([OWNER, GUEST]);
    for (const raw of [undefined, '', '  ', ',']) {
      expect(isAllowedUser(OWNER, raw)).toBe(true);
      expect(isAllowedUser(GUEST, raw)).toBe(true);
      expect(isAllowedUser(STRANGER, raw)).toBe(false);
    }
  });

  it('uses only the ids in ALLOWED_USER_IDS when set', () => {
    expect(isAllowedUser(OWNER, `${OWNER}`)).toBe(true);
    expect(isAllowedUser(GUEST, `${OWNER}`)).toBe(false);
    expect(isAllowedUser(STRANGER, ` ${OWNER} , ${STRANGER.toUpperCase()} `)).toBe(true);
  });

  it('refuses a missing user and opens only with *', () => {
    expect(isAllowedUser(null, undefined)).toBe(false);
    expect(isAllowedUser('', '*')).toBe(false);
    expect(parseAllowedUserIds('*')).toBe('any');
    expect(isAllowedUser(STRANGER, '*')).toBe(true);
  });

  it('closes sign-up in production unless explicitly reopened', () => {
    expect(signupOpen('production', undefined)).toBe(false);
    expect(signupOpen('production', '1')).toBe(true);
    expect(signupOpen('development', undefined)).toBe(true);
  });
});
