'use client';

import { useSyncExternalStore } from 'react';

export type BrowserLanguage = 'es' | 'en';

const noSubscription = () => () => {};

function readBrowserLanguage(): BrowserLanguage {
  return navigator.language?.split('-')[0] === 'en' ? 'en' : 'es';
}

/**
 * The browser's language for pages rendered before we know the user (login,
 * sign-up, password reset). The server always renders Spanish; the browser
 * switches after hydration. Reading `navigator` during render broke hydration:
 * Node 21+ has a global `navigator` whose language is en-US, so the server
 * rendered English and a Spanish browser hit React error #418.
 */
export function useBrowserLanguage(): BrowserLanguage {
  return useSyncExternalStore(noSubscription, readBrowserLanguage, () => 'es');
}
