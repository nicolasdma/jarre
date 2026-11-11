export interface PracticeDrill {
  slug: string;
  title: string;
  priority: number;
  textEn: string;
  textEs: string | null;
  /** Short-lived signed URL, or null when the drill has no audio yet. */
  audioUrl: string | null;
}

export type PracticeMode = 'listen' | 'copy' | 'dictation' | 'repeat' | 'shadow';

export const PRACTICE_MODES: { id: PracticeMode; label: string }[] = [
  { id: 'listen', label: 'Escuchar' },
  { id: 'copy', label: 'Copiar' },
  { id: 'dictation', label: 'Dictado' },
  { id: 'repeat', label: 'Repetir' },
  { id: 'shadow', label: 'Shadowing' },
];

export function isPracticeMode(value: string | undefined): value is PracticeMode {
  return PRACTICE_MODES.some((m) => m.id === value);
}
