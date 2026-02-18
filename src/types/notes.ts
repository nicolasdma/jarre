/**
 * TypeScript types for resource notes
 */

export interface NoteSubsection {
  id: string;
  title: string;
  order: number;
  content: string; // markdown content
}

export interface NoteSection {
  id: string;
  title: string;
  order: number;
  subsections: NoteSubsection[];
}

