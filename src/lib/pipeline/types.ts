/**
 * Jarre - Pipeline Types
 *
 * Type definitions for the YouTube → Course auto-generation pipeline.
 * Each stage produces a typed output that feeds into the next stage.
 */

// ============================================================================
// PIPELINE CONFIG & STATUS
// ============================================================================

export interface PipelineConfig {
  jobId: string;
  userId: string;
  url: string;
  title?: string;
  targetLanguage: string;
}

export type PipelineStage =
  | 'resolve'
  | 'segment'
  | 'content'
  | 'quizzes'
  | 'video_map'
  | 'concepts'
  | 'write_db';

export type PipelineJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface PipelineStatus {
  jobId: string;
  status: PipelineJobStatus;
  currentStage: PipelineStage | null;
  stagesCompleted: number;
  totalStages: number;
  resourceId: string | null;
  error: string | null;
  failedStage: string | null;
}

// ============================================================================
// STAGE OUTPUTS
// ============================================================================

export interface TranscriptSnippet {
  text: string;
  start: number;
  duration: number;
}

export interface YouTubeChapter {
  title: string;
  startSeconds: number;
}

export interface ResolveOutput {
  videoId: string;
  title: string;
  durationSeconds: number;
  language: string;
  snippets: TranscriptSnippet[];
  chapters: YouTubeChapter[];
  fullTranscript: string;
}

export interface SegmentSection {
  title: string;
  conceptName: string;
  conceptSlug: string;
  startSeconds: number;
  endSeconds: number;
  transcriptText: string;
}

export interface SegmentOutput {
  sections: SegmentSection[];
}

export interface ContentSection {
  title: string;
  conceptName: string;
  conceptSlug: string;
  contentMarkdown: string;
  headings: string[];
  startSeconds: number;
  endSeconds: number;
}

export interface ActivateData {
  summary: string;
  sections: Array<{
    number: number;
    title: string;
    description: string;
  }>;
  keyConcepts: string[];
  insight: string;
}

export interface ContentOutput {
  sections: ContentSection[];
  activateData: ActivateData;
}

export interface InlineQuizDef {
  positionAfterHeading: string;
  sortOrder: number;
  format: 'mc' | 'tf' | 'mc2';
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
  justificationHint?: string;
}

export interface QuizOutput {
  quizzesBySection: Array<{
    sectionTitle: string;
    quizzes: InlineQuizDef[];
  }>;
}

export interface VideoSegmentDef {
  positionAfterHeading: string;
  sortOrder: number;
  youtubeVideoId: string;
  startSeconds: number;
  endSeconds: number;
  label: string;
}

export interface VideoMapOutput {
  segmentsBySection: Array<{
    sectionTitle: string;
    segments: VideoSegmentDef[];
  }>;
}

export interface ConceptOutput {
  concepts: Array<{ id: string; name: string; slug: string; isNew: boolean }>;
  resourceConcepts: Array<{ conceptId: string; isPrerequisite: boolean }>;
}

export interface WriteOutput {
  resourceId: string;
  sectionsCreated: number;
  quizzesCreated: number;
  videoSegmentsCreated: number;
  conceptsLinked: number;
}

// ============================================================================
// AGGREGATED PIPELINE DATA (passed between stages)
// ============================================================================

export interface PipelineData {
  resolve?: ResolveOutput;
  segment?: SegmentOutput;
  content?: ContentOutput;
  quizzes?: QuizOutput;
  videoMap?: VideoMapOutput;
  concepts?: ConceptOutput;
  write?: WriteOutput;
}
