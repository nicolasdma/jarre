/**
 * Layout engine — pure function that computes positions for concept nodes.
 *
 * Groups concepts by phase (9 rows), applies topological sort within each row,
 * returns pixel positions for SVG rendering.
 *
 * No DOM, no side effects, fully testable.
 */

export interface ConceptNode {
  id: string;
  name: string;
  phase: number;
  masteryLevel: number;
  prerequisites: string[];
}

export interface PositionedNode extends ConceptNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Edge {
  from: string;
  to: string;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: Edge[];
  viewBox: { width: number; height: number };
}

const NODE_WIDTH = 80;
const NODE_HEIGHT = 56;
const NODE_GAP_X = 24;
const NODE_GAP_Y = 16;
export const PHASE_BAND_HEIGHT = 100;
const PHASE_LABEL_WIDTH = 120;
const PADDING = 40;

/**
 * Topological sort within a phase.
 * Falls back to original order if cycles detected.
 */
function topoSortWithinPhase(
  concepts: ConceptNode[],
  allPrereqs: Map<string, string[]>
): ConceptNode[] {
  const ids = new Set(concepts.map((c) => c.id));
  const inPhasePrereqs = new Map<string, string[]>();

  for (const c of concepts) {
    const prereqs = (allPrereqs.get(c.id) ?? []).filter((p) => ids.has(p));
    inPhasePrereqs.set(c.id, prereqs);
  }

  const sorted: ConceptNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(id: string): boolean {
    if (visiting.has(id)) return false; // cycle
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const dep of inPhasePrereqs.get(id) ?? []) {
      if (!visit(dep)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    sorted.push(concepts.find((c) => c.id === id)!);
    return true;
  }

  for (const c of concepts) {
    if (!visited.has(c.id)) {
      if (!visit(c.id)) return concepts; // fallback
    }
  }

  return sorted;
}

/**
 * Compute layout positions for all concept nodes.
 *
 * Phase 1 at bottom (foundation), Phase 9 at top (integration).
 */
export function computeLayout(concepts: ConceptNode[]): LayoutResult {
  // Group by phase
  const byPhase = new Map<number, ConceptNode[]>();
  for (const c of concepts) {
    const group = byPhase.get(c.phase) ?? [];
    group.push(c);
    byPhase.set(c.phase, group);
  }

  // Build prerequisite map
  const prereqMap = new Map<string, string[]>();
  for (const c of concepts) {
    prereqMap.set(c.id, c.prerequisites);
  }

  // Collect edges
  const edges: Edge[] = [];
  for (const c of concepts) {
    for (const p of c.prerequisites) {
      edges.push({ from: p, to: c.id });
    }
  }

  const nodes: PositionedNode[] = [];
  const phases = [9, 8, 7, 6, 5, 4, 3, 2, 1]; // top to bottom

  let maxRowWidth = 0;

  for (let rowIndex = 0; rowIndex < phases.length; rowIndex++) {
    const phase = phases[rowIndex];
    const phaseConcepts = byPhase.get(phase) ?? [];
    const sorted = topoSortWithinPhase(phaseConcepts, prereqMap);

    const bandY = PADDING + rowIndex * PHASE_BAND_HEIGHT;
    const rowWidth = sorted.length * (NODE_WIDTH + NODE_GAP_X) - NODE_GAP_X;
    maxRowWidth = Math.max(maxRowWidth, rowWidth);

    for (let i = 0; i < sorted.length; i++) {
      const c = sorted[i];
      nodes.push({
        ...c,
        x: PHASE_LABEL_WIDTH + PADDING + i * (NODE_WIDTH + NODE_GAP_X),
        y: bandY + (PHASE_BAND_HEIGHT - NODE_HEIGHT) / 2,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }
  }

  const totalWidth = PHASE_LABEL_WIDTH + PADDING * 2 + maxRowWidth + NODE_WIDTH;
  const totalHeight = PADDING * 2 + phases.length * PHASE_BAND_HEIGHT;

  return {
    nodes,
    edges,
    viewBox: { width: Math.max(totalWidth, 1200), height: totalHeight },
  };
}

/**
 * Phase display metadata.
 */
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
