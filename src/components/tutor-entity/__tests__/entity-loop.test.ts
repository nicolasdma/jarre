import { describe, expect, it } from 'vitest';
import { entityShouldAnimate, SETTLE_MS } from '../entity-loop';

const rest = { voiceActive: false, hovered: false, settleUntil: 0, now: 10_000, reducedMotion: false, visible: true };

describe('tutor entity loop', () => {
  it('draws no frames at rest: one still frame, no loop', () => {
    expect(entityShouldAnimate(rest)).toBe(false);
  });

  it('animates while hovered, during a voice session, and while easing back', () => {
    expect(entityShouldAnimate({ ...rest, hovered: true })).toBe(true);
    expect(entityShouldAnimate({ ...rest, voiceActive: true })).toBe(true);
    expect(entityShouldAnimate({ ...rest, settleUntil: rest.now + SETTLE_MS })).toBe(true);
    expect(entityShouldAnimate({ ...rest, settleUntil: rest.now - 1 })).toBe(false);
  });

  it('never animates hidden, without a size, or with reduced motion', () => {
    for (const blocked of [{ visible: false }, { reducedMotion: true }]) {
      expect(entityShouldAnimate({ ...rest, hovered: true, voiceActive: true, ...blocked })).toBe(false);
    }
  });
});
