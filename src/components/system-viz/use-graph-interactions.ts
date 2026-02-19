/**
 * Zoom/pan and drag interactions for the force graph.
 *
 * - d3-zoom on the root <g> element for pan/zoom
 * - d3-drag on individual nodes for repositioning (sets fx/fy)
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { zoom as d3Zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { drag as d3Drag } from 'd3-drag';
import { select } from 'd3-selection';
import 'd3-transition';
import type { GraphNode } from './graph-types';

export interface ZoomState {
  transform: ZoomTransform;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export function useGraphZoom(svgRef: React.RefObject<SVGSVGElement | null>): ZoomState {
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    select(svg).call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    return () => {
      select(svg).on('.zoom', null);
    };
  }, [svgRef]);

  const zoomIn = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    const sel = select(svg);
    sel.transition().duration(300).call(zoomRef.current.scaleBy as never, 1.3);
  }, [svgRef]);

  const zoomOut = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    const sel = select(svg);
    sel.transition().duration(300).call(zoomRef.current.scaleBy as never, 0.7);
  }, [svgRef]);

  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    const sel = select(svg);
    sel.transition().duration(500).call(zoomRef.current.transform as never, zoomIdentity);
  }, [svgRef]);

  return { transform, zoomIn, zoomOut, resetZoom };
}

/**
 * Creates a d3-drag behavior for graph nodes.
 * On drag start, pins the node (fx/fy). On drag end, releases it.
 */
export function useNodeDrag(onDragStart?: () => void) {
  const dragBehavior = useRef(
    d3Drag<SVGGElement, GraphNode>()
      .on('start', function (_event, d) {
        d.fx = d.x;
        d.fy = d.y;
        onDragStart?.();
      })
      .on('drag', function (event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function (_event, d) {
        d.fx = null;
        d.fy = null;
      })
  );

  return dragBehavior.current;
}
