import { describe, expect, it } from 'vitest';
import { decideSessionEnd, learnerAgreedToEnd, LEARNING_MIN_UNCONFIRMED_END_S } from '../session-end';

describe('session end policy', () => {
  it('learning: the end phrase alone does not end it, early or mid-session', () => {
    const d = decideSessionEnd({ policy: 'learning', modelWindow: 'Repasá el rounding. session complete', elapsedS: 240, lastLearnerText: 'El servidor firma el link por 120 segundos.' });
    expect(d.end).toBe(false);
    expect(d.signal).toBe('strong');
  });

  it('learning: ends right after the learner agrees or asks to stop', () => {
    for (const said of ['Sí, pasemos al quiz', 'dale, terminemos', 'quiero parar acá', "yes, let's go to the quiz"]) {
      expect(decideSessionEnd({ policy: 'learning', modelWindow: 'Perfecto. session complete', elapsedS: 120, lastLearnerText: said }).end).toBe(true);
    }
  });

  it('learning: a farewell never ends it, and "para" is not "pará"', () => {
    expect(decideSessionEnd({ policy: 'learning', modelWindow: 'Nos vemos en el quiz, pero antes...', elapsedS: 1200, lastLearnerText: 'sí' }).end).toBe(false);
    expect(learnerAgreedToEnd('lo uso para firmar los links')).toBe(false);
  });

  it('learning: after a generous floor the end phrase counts even without a recognized yes', () => {
    expect(decideSessionEnd({ policy: 'learning', modelWindow: 'session complete', elapsedS: LEARNING_MIN_UNCONFIRMED_END_S, lastLearnerText: 'de una, cerramos' }).end).toBe(true);
  });

  it('interview and default keep their rules', () => {
    expect(decideSessionEnd({ policy: 'interview', modelWindow: 'Thanks, bye!', elapsedS: 300 }).end).toBe(false);
    expect(decideSessionEnd({ policy: 'interview', modelWindow: 'interview complete', elapsedS: 300 }).end).toBe(true);
    expect(decideSessionEnd({ policy: 'default', modelWindow: 'chau!', elapsedS: 31 }).end).toBe(true);
    expect(decideSessionEnd({ policy: 'default', modelWindow: 'session complete', elapsedS: 10 }).end).toBe(false);
  });
});
