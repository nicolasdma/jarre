/**
 * Which lessons show code in JS | TS tabs.
 *
 * Scoped on purpose: the tabs are opt-in per lesson so the rest of the library
 * renders exactly as before. Add a lesson id here (and, later, the feed can
 * read the same set) to turn the tabs on for it.
 */

export const CODE_TABS_LESSON_IDS = new Set<string>(['3y-health-tecnica-v2', '3y-health-tecnica-repaso']);

/** True when `resourceId`'s code snippets should render as JS | TS tabs. */
export function lessonHasCodeTabs(resourceId: string | undefined): boolean {
  return !!resourceId && CODE_TABS_LESSON_IDS.has(resourceId);
}
