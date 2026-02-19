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
// PHASE METADATA
// ============================================================================

export const PHASE_META: Record<number, { label: string; labelEs: string; color: string }> = {
  1: { label: 'Distributed', labelEs: 'Distribuidos', color: 'var(--j-accent)' },
  2: { label: 'ML Infra', labelEs: 'Infra ML', color: 'var(--j-info)' },
  3: { label: 'Transformers', labelEs: 'Transformers', color: 'var(--j-warm)' },
  4: { label: 'Agents', labelEs: 'Agentes', color: 'var(--j-accent-muted)' },
  5: { label: 'RAG & Memory', labelEs: 'RAG + Memoria', color: 'var(--j-info)' },
  6: { label: 'Multimodal', labelEs: 'Multimodal', color: 'var(--j-warm-dark)' },
  7: { label: 'Safety', labelEs: 'Seguridad', color: 'var(--j-error)' },
  8: { label: 'Inference', labelEs: 'Inferencia', color: 'var(--j-warm)' },
  9: { label: 'Integration', labelEs: 'Integracion', color: 'var(--j-accent)' },
};

// ============================================================================
// MASTERY COLORS (for Three.js materials)
// ============================================================================

export interface MasteryColor {
  color: string;
  glowColor: string;
  opacity: number;
  radius: number;
  wireframe: boolean;
}

/** Mastery color palette for 3D rendering. */
export function getMasteryColor(level: number): MasteryColor {
  switch (level) {
    case 0:
      return { color: '#374151', glowColor: '#374151', opacity: 0.3, radius: 3, wireframe: true };
    case 1:
      return { color: '#06b6d4', glowColor: '#06b6d4', opacity: 0.9, radius: 4, wireframe: false };
    case 2:
      return { color: '#3b82f6', glowColor: '#3b82f6', opacity: 1, radius: 5, wireframe: false };
    case 3:
      return { color: '#f59e0b', glowColor: '#f59e0b', opacity: 1, radius: 6, wireframe: false };
    case 4:
      return { color: '#fbbf24', glowColor: '#fbbf24', opacity: 1, radius: 7, wireframe: false };
    default:
      return { color: '#374151', glowColor: '#374151', opacity: 0.3, radius: 3, wireframe: true };
  }
}
