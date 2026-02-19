/**
 * Force simulation hook for the knowledge graph.
 *
 * Uses d3-force to compute organic layout with soft phase grouping.
 * Phase 1 at bottom, Phase 9 at top. Resources float near their linked concepts.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceY,
  forceX,
  type Simulation,
} from 'd3-force';
import type { GraphNode, GraphLink, GraphData } from './graph-types';

interface Dimensions {
  width: number;
  height: number;
}

interface SimulationState {
  nodes: GraphNode[];
  links: GraphLink[];
  isStable: boolean;
}

const TOTAL_PHASES = 9;
const NODE_RADIUS = 20;

/** Map phase (1-9) to a Y target: phase 1 at bottom, phase 9 at top. */
function phaseToY(phase: number, height: number): number {
  const padding = 60;
  const usable = height - padding * 2;
  // phase 1 → bottom (large y), phase 9 → top (small y)
  return padding + usable * ((TOTAL_PHASES - phase) / (TOTAL_PHASES - 1));
}

/** Resources get Y from the average phase of linked concepts. */
function resourceTargetY(
  nodeId: string,
  links: GraphLink[],
  nodeMap: Map<string, GraphNode>,
  height: number
): number {
  const linkedConcepts = links
    .filter(
      (l) =>
        l.data.type === 'resource-concept' &&
        (resolveId(l.source) === nodeId || resolveId(l.target) === nodeId)
    )
    .map((l) => {
      const otherId = resolveId(l.source) === nodeId ? resolveId(l.target) : resolveId(l.source);
      return nodeMap.get(otherId);
    })
    .filter((n): n is GraphNode => n != null && n.data.type === 'concept');

  if (linkedConcepts.length === 0) return height / 2;

  const avgPhase =
    linkedConcepts.reduce((sum, n) => sum + (n.data as { phase: number }).phase, 0) /
    linkedConcepts.length;

  return phaseToY(avgPhase, height);
}

function resolveId(nodeOrId: string | number | GraphNode): string {
  if (typeof nodeOrId === 'string') return nodeOrId;
  if (typeof nodeOrId === 'number') return String(nodeOrId);
  return nodeOrId.id;
}

export function useForceSimulation(
  data: GraphData,
  dimensions: Dimensions
): SimulationState & { reheat: () => void } {
  const simRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const [state, setState] = useState<SimulationState>({
    nodes: [],
    links: [],
    isStable: false,
  });

  const reheat = useCallback(() => {
    simRef.current?.alpha(0.5).restart();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    if (data.nodes.length === 0) return;

    // Deep copy nodes/links so d3 can mutate them
    const nodes: GraphNode[] = data.nodes.map((n) => ({ ...n }));
    const links: GraphLink[] = data.links.map((l) => ({ ...l }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Initialize positions near their phase target to speed up convergence
    for (const node of nodes) {
      if (node.data.type === 'concept') {
        const targetY = phaseToY(node.data.phase, dimensions.height);
        node.x = dimensions.width / 2 + (Math.random() - 0.5) * dimensions.width * 0.6;
        node.y = targetY + (Math.random() - 0.5) * 40;
      } else {
        node.x = dimensions.width / 2 + (Math.random() - 0.5) * dimensions.width * 0.4;
        node.y = resourceTargetY(node.id, links, nodeMap, dimensions.height);
      }
    }

    const sim = forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.data.type === 'prerequisite' ? 80 : 60))
          .strength((l) => (l.data.type === 'prerequisite' ? 0.3 : 0.15))
      )
      .force('charge', forceManyBody<GraphNode>().strength(-200).distanceMax(300))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.05))
      .force('collide', forceCollide<GraphNode>(NODE_RADIUS + 8).strength(0.7))
      .force(
        'y',
        forceY<GraphNode>((d) => {
          if (d.data.type === 'concept') {
            return phaseToY(d.data.phase, dimensions.height);
          }
          return resourceTargetY(d.id, links, nodeMap, dimensions.height);
        }).strength(0.12)
      )
      .force(
        'x',
        forceX<GraphNode>(dimensions.width / 2).strength(0.02)
      )
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    sim.on('tick', () => {
      setState({
        nodes: [...nodes],
        links: [...links],
        isStable: sim.alpha() < 0.01,
      });
    });

    sim.on('end', () => {
      setState({
        nodes: [...nodes],
        links: [...links],
        isStable: true,
      });
    });

    simRef.current = sim;

    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [data, dimensions.width, dimensions.height]);

  return { ...state, reheat };
}
