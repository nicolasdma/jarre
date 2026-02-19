/**
 * Types and data builder for the force-directed knowledge graph.
 *
 * Two node types: concepts (curriculum) and resources (user-added).
 * Two edge types: prerequisite (concept→concept) and resource-concept link.
 */

import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
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

/** Runtime node with simulation position (mutated by d3-force). */
export interface GraphNode extends SimulationNodeDatum {
  id: string;
  data: GraphNodeData;
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

/** Runtime link with resolved node references (mutated by d3-force). */
export interface GraphLink extends SimulationLinkDatum<GraphNode> {
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
// MASTERY STYLES (reusable)
// ============================================================================

export interface MasteryStyle {
  fill: string;
  stroke: string;
  dasharray: string;
  opacity: number;
  textFill: string;
}

export function getMasteryStyle(
  level: number,
  isSelected: boolean,
  isHighlighted: boolean
): MasteryStyle {
  const boost = isSelected || isHighlighted;

  switch (level) {
    case 0:
      return {
        fill: 'var(--j-bg)',
        stroke: 'var(--j-border)',
        dasharray: '4 3',
        opacity: boost ? 0.7 : 0.35,
        textFill: 'var(--j-text-tertiary)',
      };
    case 1:
      return {
        fill: 'var(--j-accent-light)',
        stroke: 'var(--j-accent)',
        dasharray: '',
        opacity: boost ? 1 : 0.9,
        textFill: 'var(--j-text)',
      };
    case 2:
      return {
        fill: 'var(--j-accent-light)',
        stroke: 'var(--j-accent)',
        dasharray: '',
        opacity: 1,
        textFill: 'var(--j-text)',
      };
    case 3:
      return {
        fill: 'var(--j-warm-light)',
        stroke: 'var(--j-warm)',
        dasharray: '',
        opacity: 1,
        textFill: 'var(--j-text)',
      };
    case 4:
      return {
        fill: 'var(--j-accent-light)',
        stroke: 'var(--j-accent)',
        dasharray: '',
        opacity: 1,
        textFill: 'var(--j-accent)',
      };
    default:
      return {
        fill: 'var(--j-bg)',
        stroke: 'var(--j-border)',
        dasharray: '4 3',
        opacity: 0.35,
        textFill: 'var(--j-text-tertiary)',
      };
  }
}
