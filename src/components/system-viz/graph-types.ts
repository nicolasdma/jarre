/**
 * Types and data builder for the force-directed knowledge graph.
 *
 * Two node types: concepts (curriculum) and resources (user-added).
 * Two edge types: prerequisite (concept→concept) and resource-concept link.
 *
 * Compatible with react-force-graph-3d's {nodes, links} format.
 */

import type { UserResourceType, ConceptRelationship } from '@/types';

export type { UserResourceType } from '@/types';

// ============================================================================
// NODE TYPES
// ============================================================================

export interface ConceptNodeData {
  type: 'concept';
  id: string;
  name: string;
  phase: number;
  masteryLevel: number;
  prerequisites: string[];
  definition?: string;
}

export interface ResourceNodeData {
  type: 'resource';
  id: string;
  title: string;
  resourceType: UserResourceType;
  url: string | null;
}

export type GraphNodeData = ConceptNodeData | ResourceNodeData;

/** Graph node — react-force-graph-3d adds x/y/z at runtime. */
export interface GraphNode {
  id: string;
  data: GraphNodeData;
  // Added by react-force-graph at runtime
  x?: number;
  y?: number;
  z?: number;
}

// ============================================================================
// EDGE TYPES
// ============================================================================

export interface PrerequisiteEdge {
  type: 'prerequisite';
  source: string;
  target: string;
}

export interface ResourceConceptEdge {
  type: 'resource-concept';
  source: string;
  target: string;
  relevanceScore: number;
  relationship: ConceptRelationship;
}

export type GraphEdge = PrerequisiteEdge | ResourceConceptEdge;

/** Graph link — source/target are node IDs (resolved by the library at runtime). */
export interface GraphLink {
  source: string;
  target: string;
  data: GraphEdge;
}

// ============================================================================
// GRAPH DATA
// ============================================================================

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ============================================================================
// INPUT TYPES (from server)
// ============================================================================

export interface ConceptInput {
  id: string;
  name: string;
  phase: number;
  masteryLevel: number;
  prerequisites: string[];
}

export interface ResourceInput {
  id: string;
  title: string;
  type: UserResourceType;
  url: string | null;
}

export interface ResourceConceptLinkInput {
  userResourceId: string;
  conceptId: string;
  relevanceScore: number;
  relationship: ConceptRelationship;
}

// ============================================================================
// BUILD GRAPH
// ============================================================================

export function buildGraphData(
  concepts: ConceptInput[],
  definitions: Record<string, string>,
  resources: ResourceInput[],
  resourceLinks: ResourceConceptLinkInput[]
): GraphData {
  const conceptIds = new Set(concepts.map((c) => c.id));

  const conceptNodes: GraphNode[] = concepts.map((c) => ({
    id: c.id,
    data: {
      type: 'concept' as const,
      id: c.id,
      name: c.name,
      phase: c.phase,
      masteryLevel: c.masteryLevel,
      prerequisites: c.prerequisites,
      definition: definitions[c.id],
    },
  }));

  // Only include resources that have at least one valid concept link
  const linkedResourceIds = new Set(
    resourceLinks
      .filter((rl) => conceptIds.has(rl.conceptId))
      .map((rl) => rl.userResourceId)
  );

  const resourceNodes: GraphNode[] = resources
    .filter((r) => linkedResourceIds.has(r.id))
    .map((r) => ({
      id: `res-${r.id}`,
      data: {
        type: 'resource' as const,
        id: r.id,
        title: r.title,
        resourceType: r.type,
        url: r.url,
      },
    }));

  const nodes = [...conceptNodes, ...resourceNodes];

  // Prerequisite edges (concept → concept)
  const prereqLinks: GraphLink[] = [];
  for (const c of concepts) {
    for (const prereqId of c.prerequisites) {
      if (conceptIds.has(prereqId)) {
        prereqLinks.push({
          source: prereqId,
          target: c.id,
          data: { type: 'prerequisite', source: prereqId, target: c.id },
        });
      }
    }
  }

  // Resource-concept edges
  const resourceConceptLinks: GraphLink[] = resourceLinks
    .filter((rl) => conceptIds.has(rl.conceptId) && linkedResourceIds.has(rl.userResourceId))
    .map((rl) => ({
      source: `res-${rl.userResourceId}`,
      target: rl.conceptId,
      data: {
        type: 'resource-concept' as const,
        source: `res-${rl.userResourceId}`,
        target: rl.conceptId,
        relevanceScore: rl.relevanceScore,
        relationship: rl.relationship,
      },
    }));

  return {
    nodes,
    links: [...prereqLinks, ...resourceConceptLinks],
  };
}

// ============================================================================
// PHASE METADATA & COLORS
// ============================================================================

export const PHASE_META: Record<number, { label: string; labelEs: string; color: string }> = {
  0: { label: 'Math', labelEs: 'Matemáticas', color: '#94A3B8' },
  1: { label: 'Distributed', labelEs: 'Distribuidos', color: '#6B8E6B' },
  2: { label: 'ML Infra', labelEs: 'Infra ML', color: '#60A5FA' },
  3: { label: 'Transformers', labelEs: 'Transformers', color: '#D4B896' },
  4: { label: 'Agents', labelEs: 'Agentes', color: '#4a6b4a' },
  5: { label: 'RAG & Memory', labelEs: 'RAG + Memoria', color: '#60A5FA' },
  6: { label: 'Multimodal', labelEs: 'Multimodal', color: '#c4a07a' },
  7: { label: 'Safety', labelEs: 'Seguridad', color: '#FCD34D' },
  8: { label: 'Inference', labelEs: 'Inferencia', color: '#D4B896' },
  9: { label: 'Integration', labelEs: 'Integración', color: '#7DA07D' },
  10: { label: 'Enterprise', labelEs: 'Enterprise', color: '#8B7355' },
  11: { label: 'LLM Systems', labelEs: 'Sistemas LLM', color: '#6B8E6B' },
};

/** Get the hex color for a phase number. */
export function getPhaseColor(phase: number): string {
  return PHASE_META[phase]?.color ?? '#94A3B8';
}

// ============================================================================
// NODE STYLE (phase color + mastery affects opacity/radius)
// ============================================================================

export interface NodeStyle {
  color: string;
  opacity: number;
  radius: number;
  wireframe: boolean;
  glowOpacity: number;
  labelColor: string;
}

/** Combine phase (color) + mastery (opacity, radius, wireframe) into a single style. */
export function getNodeStyle(phase: number, masteryLevel: number): NodeStyle {
  const color = getPhaseColor(phase);

  switch (masteryLevel) {
    case 0:
      return { color, opacity: 0.12, radius: 3, wireframe: true, glowOpacity: 0.02, labelColor: '#475569' };
    case 1:
      return { color, opacity: 0.75, radius: 4, wireframe: false, glowOpacity: 0.12, labelColor: '#F1F5F9' };
    case 2:
      return { color, opacity: 0.9, radius: 5, wireframe: false, glowOpacity: 0.15, labelColor: '#F8FAFC' };
    case 3:
      return { color, opacity: 1.0, radius: 6, wireframe: false, glowOpacity: 0.22, labelColor: '#FFFFFF' };
    case 4:
      return { color, opacity: 1.0, radius: 7, wireframe: false, glowOpacity: 0.25, labelColor: '#FFFFFF' };
    default:
      return { color, opacity: 0.12, radius: 3, wireframe: true, glowOpacity: 0.02, labelColor: '#475569' };
  }
}
