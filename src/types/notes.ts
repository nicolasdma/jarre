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

export interface ResourceNotes {
  id: string;
  userId: string;
  resourceId: string;
  sections: NoteSection[];
  createdAt: string;
  updatedAt: string;
}

// Database row type (snake_case)
export interface ResourceNotesRow {
  id: string;
  user_id: string;
  resource_id: string;
  sections: NoteSection[];
  canvas_data: unknown;
  split_position: number;
  created_at: string;
  updated_at: string;
}
