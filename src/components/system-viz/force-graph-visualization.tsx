/**
 * 3D Force-directed knowledge graph using react-force-graph-3d (Three.js/WebGL).
 *
 * Immersive dark experience: orbital rotation, depth, luminous glow nodes,
 * glassmorphism overlays. Full viewport, cinematic entrance.
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import type {
  GraphData,
  GraphNode,
  ConceptNodeData,
  ResourceNodeData,
  ConceptInput,
  ResourceInput,
  ResourceConceptLinkInput,
} from './graph-types';
import { buildGraphData, getMasteryColor } from './graph-types';
import { ConceptDetailPanel } from './concept-detail-panel';

// react-force-graph-3d requires `window` — dynamic import with SSR disabled
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

// ============================================================================
// TYPES — the library uses `any`-based node/link objects at runtime
// ============================================================================

interface ForceGraphVisualizationProps {
  concepts: ConceptInput[];
  definitions: Record<string, string>;
  resources: ResourceInput[];
  resourceLinks: ResourceConceptLinkInput[];
  language: 'es' | 'en';
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Extract our typed data from the library's runtime node object. */
function getNodeData(node: any): ConceptNodeData | ResourceNodeData | null {
  return node?.data ?? null;
}

/** Resolve a link endpoint (string before simulation, object after). */
function resolveEndpointData(ref: any): ConceptNodeData | ResourceNodeData | null {
  if (typeof ref === 'object' && ref !== null) return getNodeData(ref);
  return null;
}

// ============================================================================
// THREE.JS NODE FACTORY
// ============================================================================

function createNodeObject(node: any): THREE.Object3D {
  const group = new THREE.Group();
  const data = getNodeData(node);
  if (!data) return group;

  if (data.type === 'concept') {
    const mastery = getMasteryColor(data.masteryLevel);

    // Main sphere
    const geometry = new THREE.SphereGeometry(mastery.radius, 24, 16);
    const material = new THREE.MeshLambertMaterial({
      color: mastery.color,
      transparent: true,
      opacity: mastery.opacity,
      wireframe: mastery.wireframe,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Glow halo for L1+
    if (data.masteryLevel >= 1) {
      const glowScale = 1.6;
      const glowGeometry = new THREE.SphereGeometry(mastery.radius * glowScale, 16, 12);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: mastery.glowColor,
        transparent: true,
        opacity: data.masteryLevel >= 3 ? 0.12 : 0.07,
        side: THREE.BackSide,
      });
      group.add(new THREE.Mesh(glowGeometry, glowMaterial));
    }

    // Label for L1+ concepts
    if (data.masteryLevel >= 1) {
      const label = new SpriteText(data.name, 2.5, '#e2e8f0');
      label.fontFace = 'Inter, system-ui, sans-serif';
      label.fontWeight = '500';
      label.backgroundColor = 'rgba(0,0,0,0.5)';
      label.padding = 1.5;
      label.borderRadius = 2;
      label.position.set(0, -(mastery.radius + 4), 0);
      group.add(label);
    }
  } else {
    // Resource node — octahedron (diamond shape)
    const geometry = new THREE.OctahedronGeometry(2.5);
    const material = new THREE.MeshLambertMaterial({
      color: '#8b5cf6',
      transparent: true,
      opacity: 0.8,
    });
    group.add(new THREE.Mesh(geometry, material));

    // Subtle glow
    const glowGeometry = new THREE.OctahedronGeometry(4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: '#8b5cf6',
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    group.add(new THREE.Mesh(glowGeometry, glowMaterial));
  }

  return group;
}

// ============================================================================
// LINK HELPERS
// ============================================================================

function getLinkMasteryLevel(link: any): number {
  const sourceData = resolveEndpointData(link.source);
  const targetData = resolveEndpointData(link.target);

  const sourceLevel = sourceData?.type === 'concept' ? sourceData.masteryLevel : 0;
  const targetLevel = targetData?.type === 'concept' ? targetData.masteryLevel : 0;

  return Math.min(sourceLevel, targetLevel);
}

function getLinkColor(link: any): string {
  const minLevel = getLinkMasteryLevel(link);
  if (minLevel >= 1) {
    const sourceData = resolveEndpointData(link.source);
    if (sourceData?.type === 'concept') {
      return getMasteryColor(sourceData.masteryLevel).color;
    }
    return '#06b6d4';
  }
  return '#1e293b';
}

function getLinkWidth(link: any): number {
  return getLinkMasteryLevel(link) >= 1 ? 1.5 : 0.3;
}

function getLinkParticles(link: any): number {
  return getLinkMasteryLevel(link) >= 1 ? 2 : 0;
}

function getNodeLabel(node: any): string {
  const data = getNodeData(node);
  if (!data) return '';
  return data.type === 'concept' ? data.name : data.title;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// COMPONENT
// ============================================================================

export function ForceGraphVisualization({
  concepts,
  definitions,
  resources,
  resourceLinks,
  language,
}: ForceGraphVisualizationProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build graph data
  const graphData: GraphData = useMemo(
    () => buildGraphData(concepts, definitions, resources, resourceLinks),
    [concepts, definitions, resources, resourceLinks]
  );

  // Node map for detail panel lookups
  const nodeMap = useMemo(
    () => new Map(graphData.nodes.map((n) => [n.id, n])),
    [graphData.nodes]
  );

  // Selected node for detail panel
  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;

  // Handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    const id = node?.id as string | undefined;
    if (id) setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleEngineStop = useCallback(() => {
    if (!isReady) {
      setIsReady(true);
      setTimeout(() => {
        fgRef.current?.zoomToFit(800, 80);
      }, 200);
    }
  }, [isReady]);

  // Stats
  const totalConcepts = concepts.length;
  const totalMastered = concepts.filter((c) => c.masteryLevel >= 1).length;
  const totalResources = resources.length;

  return (
    <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Dark background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #0a1628 0%, #050a15 70%)',
        }}
      />

      {/* 3D graph container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          opacity: isReady ? 1 : 0,
          transition: 'opacity 1.5s ease-out',
        }}
      >
        {dimensions.width > 0 && dimensions.height > 0 && (
          <ForceGraph3D
            ref={fgRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="#050a15"
            nodeThreeObject={createNodeObject}
            nodeLabel={getNodeLabel}
            onNodeClick={handleNodeClick}
            enableNodeDrag={true}
            linkColor={getLinkColor}
            linkWidth={getLinkWidth}
            linkOpacity={0.6}
            linkDirectionalParticles={getLinkParticles}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleColor={getLinkColor}
            warmupTicks={100}
            cooldownTime={3000}
            onEngineStop={handleEngineStop}
            onBackgroundClick={handleBackgroundClick}
            showNavInfo={false}
          />
        )}
      </div>

      {/* Loading indicator */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-500 uppercase animate-pulse">
            {language === 'es' ? 'Construyendo grafo...' : 'Building graph...'}
          </div>
        </div>
      )}

      {/* Glassmorphism stats overlay — top left */}
      <div
        className="absolute top-4 left-4 px-4 py-3 rounded-lg pointer-events-none"
        style={{
          backdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.2em] text-slate-400 uppercase">
            {totalMastered}/{totalConcepts} {language === 'es' ? 'activos' : 'active'}
          </span>
          {totalResources > 0 && (
            <span className="font-mono text-[10px] tracking-[0.2em] text-purple-400 uppercase">
              {totalResources} {language === 'es' ? 'recursos' : 'resources'}
            </span>
          )}
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/10" style={{ width: 120 }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totalConcepts > 0 ? (totalMastered / totalConcepts) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
            }}
          />
        </div>
      </div>

      {/* Glassmorphism legend — top right */}
      <div
        className="absolute top-4 right-4 px-3 py-2 rounded-lg flex gap-3 font-mono text-[9px] pointer-events-none"
        style={{
          backdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-2 h-2 rounded-full border border-gray-600" />
          L0
        </span>
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          L1
        </span>
        <span className="flex items-center gap-1.5 text-blue-400">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          L2
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          L3
        </span>
        <span className="flex items-center gap-1.5 text-yellow-300">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          L4
        </span>
        <span className="flex items-center gap-1.5 text-purple-400">
          <span className="w-2 h-2 rotate-45 bg-purple-500" style={{ width: 7, height: 7 }} />
          {language === 'es' ? 'Recurso' : 'Resource'}
        </span>
      </div>

      {/* Controls hint — bottom right */}
      <div
        className="absolute bottom-4 right-4 px-3 py-2 rounded-lg font-mono text-[9px] text-slate-500 pointer-events-none"
        style={{
          backdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        {language === 'es'
          ? 'Arrastra para rotar · Scroll para zoom · Click en nodo para detalles'
          : 'Drag to rotate · Scroll to zoom · Click node for details'}
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <ConceptDetailPanel
          node={selectedNode}
          definition={
            selectedNode.data.type === 'concept'
              ? definitions[selectedNode.data.id]
              : undefined
          }
          onClose={() => setSelectedId(null)}
          language={language}
        />
      )}
    </div>
  );
}
