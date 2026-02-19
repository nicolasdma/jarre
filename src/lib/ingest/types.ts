/**
 * Jarre - Ingestion Pipeline Types
 *
 * Types for the external resource ingestion pipeline:
 * content resolution → concept extraction → curriculum linking.
 */

import type { ConceptRelationship } from '@/types';

/** Raw extracted concept from LLM analysis of external content */
export interface ExtractedConceptRaw {
  name: string;
  description: string;
  relevance: number; // 0-1, how central this concept is to the resource
}

/** A link between an extracted concept and a curriculum concept */
export interface ConceptLink {
  extractedConceptName: string;
  curriculumConceptId: string;
  curriculumConceptName: string;
  relationship: ConceptRelationship;
  relevanceScore: number; // 0-1
  explanation: string;
}

/** Result of content resolution step */
export interface ResolvedContent {
  rawContent: string | null;
  source: 'transcript' | 'user_notes' | 'none';
}

/** Result of concept extraction step */
export interface ExtractionResult {
  summary: string;
  concepts: ExtractedConceptRaw[];
  tokensUsed: number;
}

/** Result of curriculum linking step */
export interface LinkingResult {
  links: ConceptLink[];
  coverageScore: number; // 0-1, how much of the curriculum this resource touches
  tokensUsed: number;
}

/** Final result of the full ingestion pipeline */
export interface IngestResult {
  resourceId: string;
  summary: string;
  extractedConcepts: ExtractedConceptRaw[];
  links: ConceptLink[];
  coverageScore: number;
  totalTokensUsed: number;
}
