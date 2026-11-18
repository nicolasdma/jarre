import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '../safe-redirect';

describe('safeRedirectPath', () => {
  it('keeps same-site paths with query and hash', () => {
    expect(safeRedirectPath('/learn/abc?x=1#s2')).toBe('/learn/abc?x=1#s2');
    expect(safeRedirectPath('/')).toBe('/');
  });

  it('rejects anything that leaves the site', () => {
    for (const bad of [
      '//evil.com',
      '//evil.com/path',
      '/\\evil.com',
      '/\\/evil.com',
      'https://evil.com',
      'javascript:alert(1)',
      'evil.com',
      '/\tevil',
      '\\\\evil.com',
      ' //evil.com',
    ]) {
      expect(safeRedirectPath(bad)).toBe('/');
    }
  });

  it('falls back on empty input', () => {
    expect(safeRedirectPath(null)).toBe('/');
    expect(safeRedirectPath('', '/library')).toBe('/library');
  });
});
