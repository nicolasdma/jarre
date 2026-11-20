import { describe, expect, it } from 'vitest';
import { applyPaceRequest, DEFAULT_PACE, findPaceRequest, isPace, paceLabel, PACE_STEPS } from '../speech-pace';

const kind = (text: string) => findPaceRequest(text)?.kind ?? null;

describe('findPaceRequest', () => {
  it.each([
    'Could you speak slower?',
    'Sorry, can you speak a little bit slower please',
    'slower please',
    'Slower, please.',
    'Can you slow down a bit?',
    'please speak more slowly',
    'Could you say that slowly?',
    "Sorry, you're speaking too fast for me",
    'That was too fast.',
    'Talk slower',
    'más lento',
    'Hablá más lento por favor',
    'mas despacio',
    'muy rápido, no te sigo',
  ])('slower: %s', (text) => {
    expect(kind(text)).toBe('slower');
  });

  it.each([
    'Can you repeat that?',
    'Sorry, could you repeat the question?',
    'Could you say that again?',
    'Say it again, please',
    'Could you rephrase that?',
    "I didn't understand",
    'Sorry, I didnt understand the last part',
    "I didn't catch that",
    'I did not hear you',
    "Sorry, I don't understand what you mean",
    "I couldn't follow that",
    'One more time, please',
    'no entendí',
    'No te entendí, repetí',
    '¿Podés repetir?',
  ])('repeat: %s', (text) => {
    expect(kind(text)).toBe('repeat');
  });

  it.each(['You can speak faster now', 'Could you speak a bit faster?', 'can you go faster', "You're talking too slowly", 'Hablá más rápido'])(
    'faster: %s',
    (text) => {
      expect(kind(text)).toBe('faster');
    },
  );

  it.each(['Normal speed, please', 'You can go back to your normal pace', 'Speak normally', 'velocidad normal'])('normal: %s', (text) => {
    expect(kind(text)).toBe('normal');
  });

  // A coding round is full of "slower" and "faster": none of it is about the interviewer's voice.
  it.each([
    'The brute force is slower because of the nested loop',
    'This would be much faster with a map',
    "It's too slow for ten to the fifth elements",
    'So that is O of n squared, which is slow',
    'A set lookup is faster than scanning the array',
    'I can make it faster by sorting first',
    'Can we do it faster? Yes, with two pointers',
    "I can't get it to work, let me check the loop",
    "I don't understand why this test fails",
    "I don't get why the index is off",
    'Let me run it again',
    'I will repeat the loop for each element',
    'So we go again from the start of the array',
    'This will slow down the lookup',
    'Okay, so I would use a hash map here',
    'The normal case is when the array is sorted',
    '',
  ])('not a request: %s', (text) => {
    expect(findPaceRequest(text)).toBeNull();
  });

  it('asking to repeat it slowly is a request to slow down', () => {
    expect(kind('Could you repeat that slowly?')).toBe('slower');
    expect(kind('Can you say that again, slower please?')).toBe('slower');
  });

  it('a growing utterance counts each request once', () => {
    let text = 'Sorry, could you';
    expect(findPaceRequest(text)).toBeNull();
    text += ' speak slower?';
    const first = findPaceRequest(text);
    expect(first?.kind).toBe('slower');
    text += ' Okay so I would use a map.';
    expect(findPaceRequest(text, first!.end)).toBeNull();
    text += ' Sorry, can you repeat that?';
    expect(findPaceRequest(text, first!.end)?.kind).toBe('repeat');
  });

  it('reads the transcription as it comes: curly apostrophes, capitals, accents', () => {
    expect(kind('I didn’t understand')).toBe('repeat');
    expect(kind('MÁS LENTO')).toBe('slower');
  });
});

describe('applyPaceRequest', () => {
  it('the default is slower than the model, with a step left under it', () => {
    expect(DEFAULT_PACE).toBe(0.8);
    expect(applyPaceRequest(DEFAULT_PACE, 'slower')).toBeLessThan(DEFAULT_PACE);
    expect(isPace(DEFAULT_PACE)).toBe(true);
    expect(isPace(0.85)).toBe(false);
    expect(isPace('0.9')).toBe(false);
  });

  it('"slower" goes down a step each time, to the slowest', () => {
    expect(applyPaceRequest(1, 'slower')).toBe(0.9);
    expect(applyPaceRequest(0.9, 'slower')).toBe(0.8);
    expect(applyPaceRequest(0.8, 'slower')).toBe(0.7);
    expect(applyPaceRequest(0.7, 'slower')).toBe(0.7);
  });

  it('"can you repeat that?" and "I didn\'t understand" slow down a step too', () => {
    expect(applyPaceRequest(1, 'repeat')).toBe(0.9);
    expect(applyPaceRequest(0.8, 'repeat')).toBe(0.7);
    expect(applyPaceRequest(0.7, 'repeat')).toBe(0.7);
  });

  it('"faster" goes up a step, "normal speed" all the way', () => {
    expect(applyPaceRequest(0.7, 'faster')).toBe(0.8);
    expect(applyPaceRequest(1, 'faster')).toBe(1);
    expect(applyPaceRequest(0.7, 'normal')).toBe(1);
  });

  it('every step is offered with its label', () => {
    expect(PACE_STEPS.map(paceLabel)).toEqual(['0.7×', '0.8×', '0.9×', '1.0×']);
  });
});
