import { afterEach, describe, expect, it, vi } from 'vitest';
import { latestLearnProgress, saveLearnProgress, type LearnProgress } from '../learn-progress';

const progress = (activeSection: number): LearnProgress => ({
  currentStep: 'learn',
  activeSection,
  completedSections: [],
  sectionState: {},
});

describe('latestLearnProgress', () => {
  afterEach(() => vi.useRealTimers());

  it('is what the page saved last for that lesson, before the debounced POST goes out', () => {
    vi.useFakeTimers();
    expect(latestLearnProgress('lesson-x')).toBeUndefined();
    saveLearnProgress('lesson-x', progress(3));
    saveLearnProgress('lesson-x', progress(6));
    expect(latestLearnProgress('lesson-x')?.activeSection).toBe(6);
    expect(latestLearnProgress('lesson-y')).toBeUndefined();
  });
});
