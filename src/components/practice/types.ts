export interface PracticeDrill {
  slug: string;
  title: string;
  priority: number;
  textEn: string;
  textEs: string | null;
  /** Short-lived signed URL, or null when the drill has no audio yet. */
  audioUrl: string | null;
  /** The lesson concept (section) it practices; null: the "De memoria" group. */
  conceptId: string | null;
}

export type PracticeMode = 'listen' | 'copy' | 'repeat' | 'sentences' | 'recall' | 'interview';
/** The modes that practice one drill (the interview is a step of its own). */
export type DrillMode = Exclude<PracticeMode, 'interview'>;

export const PRACTICE_MODES: { id: PracticeMode; label: string }[] = [
  { id: 'listen', label: 'Escuchar' },
  { id: 'copy', label: 'Copiar' },
  { id: 'repeat', label: 'Repetir' },
  { id: 'sentences', label: 'Frase por frase' },
  // Last of the drill steps: answer from the question alone (recall.ts).
  { id: 'recall', label: 'Pregunta → respuesta' },
  { id: 'interview', label: 'Entrevista' },
];

export const DRILL_MODES = PRACTICE_MODES.filter((m): m is { id: DrillMode; label: string } => m.id !== 'interview');

export function isDrillMode(value: string | null | undefined): value is DrillMode {
  return DRILL_MODES.some((m) => m.id === value);
}

/**
 * A mode from a link. The old `shadow` (free-running shadowing) is now Frase
 * por frase; `dictation` was removed (2026-11-11) and opens Escuchar.
 */
export function drillModeFromParam(value: string | null | undefined): DrillMode | null {
  if (value === 'shadow') return 'sentences';
  if (value === 'dictation') return 'listen';
  return isDrillMode(value) ? value : null;
}

export function isPracticeMode(value: string | undefined): value is PracticeMode {
  return PRACTICE_MODES.some((m) => m.id === value);
}
