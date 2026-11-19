import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useBrowserLanguage } from '../use-browser-language';

function Probe() {
  return createElement('span', null, useBrowserLanguage());
}

describe('useBrowserLanguage', () => {
  it('renders Spanish on the server even when the runtime has an English navigator', () => {
    // Node 21+ exposes navigator.language = "en-US": reading it during the server render made
    // the auth pages render English and fail hydration (React #418) in a Spanish browser.
    expect(renderToString(createElement(Probe))).toBe('<span>es</span>');
  });
});
