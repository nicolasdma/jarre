/**
 * 3D Force-directed knowledge graph using react-force-graph-3d (Three.js/WebGL).
 *
 * Immersive dark experience: orbital rotation, depth, luminous glow nodes,
 * glassmorphism overlays. Full viewport, cinematic entrance.
 *
 * Premium interactions: camera fly-to, hover highlighting, pulsing selection ring.
 *
 * Performance notes:
 * - Geometries are pooled by radius (shared across nodes of same mastery level)
 * - Hover uses direct material mutation + prop setters (NOT refresh())
 * - Neighbor map and link metadata are pre-computed in useMemo
 * - Selection ring uses __threeObj binding (no scene.traverse)
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import SpriteText from 'three-spritetext';
import type {
  GraphData,
  ConceptNodeData,
  ResourceNodeData,
  ConceptInput,
  ResourceInput,
  ResourceConceptLinkInput,
} from './graph-types';
import { buildGraphData, getNodeStyle, getPhaseColor, PHASE_META, INACTIVE_COLOR } from './graph-types';
import { ConceptDetailPanel } from './concept-detail-panel';

// react-force-graph-3d requires `window` — dynamic import with SSR disabled
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

// ============================================================================
// TYPES
// ============================================================================

interface ForceGraphVisualizationProps {
  concepts: ConceptInput[];
  definitions: Record<string, string>;
  resources: ResourceInput[];
  resourceLinks: ResourceConceptLinkInput[];
  language: 'es' | 'en';
}

/** Materials stored per node for mutable hover dimming. */
interface NodeMaterials {
  main: THREE.MeshBasicMaterial;
  glow: THREE.MeshBasicMaterial;
  label: SpriteText | null;
  baseMainOpacity: number;
  baseGlowOpacity: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Extract our typed data from the library's runtime node object. */
function getNodeData(node: any): ConceptNodeData | ResourceNodeData | null {
  return node?.data ?? null;
}

/** Resolve link endpoint to node ID (works pre- and post-simulation). */
function resolveEndpointId(ref: any): string | null {
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object' && ref !== null) return ref.id ?? null;
  return null;
}

function getNodeLabel(node: any): string {
  const data = getNodeData(node);
  if (!data) return '';
  return data.type === 'concept' ? data.name : data.title;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// GEOMETRY POOL — shared across nodes of same radius (immutable, safe to share)
// ============================================================================

const sphereGeometryCache = new Map<number, THREE.SphereGeometry>();
const glowGeometryCache = new Map<number, THREE.SphereGeometry>();

function getPooledSphereGeometry(radius: number): THREE.SphereGeometry {
  let geo = sphereGeometryCache.get(radius);
  if (!geo) {
    geo = new THREE.SphereGeometry(radius, 24, 16);
    sphereGeometryCache.set(radius, geo);
  }
  return geo;
}

function getPooledGlowGeometry(radius: number): THREE.SphereGeometry {
  const glowRadius = radius * 2;
  let geo = glowGeometryCache.get(glowRadius);
  if (!geo) {
    geo = new THREE.SphereGeometry(glowRadius, 16, 12);
    glowGeometryCache.set(glowRadius, geo);
  }
  return geo;
}

// Resource geometries — single instance each
let resourceMainGeo: THREE.OctahedronGeometry | null = null;
let resourceGlowGeo: THREE.OctahedronGeometry | null = null;

function getResourceMainGeometry(): THREE.OctahedronGeometry {
  if (!resourceMainGeo) resourceMainGeo = new THREE.OctahedronGeometry(2.5);
  return resourceMainGeo;
}

function getResourceGlowGeometry(): THREE.OctahedronGeometry {
  if (!resourceGlowGeo) resourceGlowGeo = new THREE.OctahedronGeometry(4);
  return resourceGlowGeo;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CAMERA_FLY_DURATION = 1200;
const CAMERA_FLY_DISTANCE = 60;
const DIM_OPACITY_FACTOR = 0.15;
const HOVER_GLOW_BOOST = 1.8;
const HOVER_LINK_WIDTH_MULTIPLIER = 2;
const HOVER_LINK_PARTICLES = 6;
const HOVER_TICK_THROTTLE_MS = 50;
const SELECTION_RING_MIN_OPACITY = 0.15;
const SELECTION_RING_MAX_OPACITY = 0.4;
const SELECTION_RING_PULSE_SPEED = 0.003;

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

  // Hover state as ref (material mutations don't need re-render)
  const hoveredNodeIdRef = useRef<string | null>(null);
  // Counter to force new link callback identities on hover change.
  // React re-render is cheap; the library sees new prop refs → re-evaluates
  // accessors without _flushObjects (no geometry destruction).
  const [hoverTick, setHoverTick] = useState(0);

  // Material refs for mutable hover dimming
  const nodeMaterialsMap = useRef(new Map<string, NodeMaterials>());

  // Selection ring ref
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const selectionRingAnimId = useRef<number>(0);
  const prevSelectedGroupRef = useRef<THREE.Group | null>(null);

  // Measure container (debounced to avoid rapid re-renders)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      });
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      // Clean up hover throttle timer
      if (hoverTickTimerRef.current) {
        clearTimeout(hoverTickTimerRef.current);
        hoverTickTimerRef.current = null;
      }
    };
  }, []);

  // Build graph data
  const graphData: GraphData = useMemo(
    () => buildGraphData(concepts, definitions, resources, resourceLinks),
    [concepts, definitions, resources, resourceLinks]
  );

  // Pre-computed neighbor map: nodeId → Set of connected nodeIds
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const link of graphData.links) {
      const srcId = link.source;
      const tgtId = link.target;

      if (!map.has(srcId)) map.set(srcId, new Set());
      if (!map.has(tgtId)) map.set(tgtId, new Set());
      map.get(srcId)!.add(tgtId);
      map.get(tgtId)!.add(srcId);
    }
    return map;
  }, [graphData.links]);

  // Stable ref to neighborMap for use in callbacks without re-creating them
  const neighborMapRef = useRef(neighborMap);
  neighborMapRef.current = neighborMap;

  // Concept lookup by ID
  const conceptMap = useMemo(
    () => new Map(concepts.map((c) => [c.id, c])),
    [concepts]
  );

  // Pre-computed link metadata: linkKey → { isResource, bothStudied, phaseColor }
  // Avoids repeated endpoint data resolution in per-link accessors
  const linkMetaMap = useMemo(() => {
    const meta = new Map<string, { isResource: boolean; bothStudied: boolean; bothActive: boolean; phaseColor: string }>();
    for (const link of graphData.links) {
      const key = `${link.source}→${link.target}`;
      const isResource = link.data.type === 'resource-concept';

      let bothStudied = false;
      let bothActive = false;
      let phaseColor = '#94A3B8';

      if (!isResource) {
        const srcConcept = conceptMap.get(link.source);
        const tgtConcept = conceptMap.get(link.target);
        const srcMastery = srcConcept?.masteryLevel ?? 0;
        const tgtMastery = tgtConcept?.masteryLevel ?? 0;
        bothActive = srcMastery >= 1 && tgtMastery >= 1;
        bothStudied = bothActive;
        if (srcConcept) {
          phaseColor = getPhaseColor(srcConcept.phase);
        }
      }

      meta.set(key, { isResource, bothStudied, bothActive, phaseColor });
    }
    return meta;
  }, [graphData.links, conceptMap]);

  // Node map for detail panel lookups
  const nodeMap = useMemo(
    () => new Map(graphData.nodes.map((n) => [n.id, n])),
    [graphData.nodes]
  );

  // Active phases for legend (only show phases that have concepts)
  const activePhasesForLegend = useMemo(() => {
    const activePhases = new Set(concepts.map((c) => c.phase));
    return Object.entries(PHASE_META)
      .filter(([key]) => activePhases.has(Number(key)))
      .map(([key, meta]) => [Number(key), meta] as [number, typeof meta]);
  }, [concepts]);

  // Selected node for detail panel
  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;

  // ============================================================================
  // THREE.JS NODE FACTORY — pooled geometries, material refs for hover
  // ============================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createNodeObject = useCallback((node: any): THREE.Object3D => {
    const group = new THREE.Group();
    const data = getNodeData(node);
    if (!data) return group;

    if (data.type === 'concept') {
      const style = getNodeStyle(data.phase, data.masteryLevel);
      const labelFontSize = data.masteryLevel === 0 ? 2.0 : 3.0;

      // Main sphere — pooled geometry
      const material = new THREE.MeshBasicMaterial({
        color: style.color,
        transparent: true,
        opacity: style.opacity,
        wireframe: style.wireframe,
      });
      group.add(new THREE.Mesh(getPooledSphereGeometry(style.radius), material));

      // Glow halo — pooled geometry
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: style.color,
        transparent: true,
        opacity: style.glowOpacity,
        side: THREE.BackSide,
      });
      group.add(new THREE.Mesh(getPooledGlowGeometry(style.radius), glowMaterial));

      // Label
      const label = new SpriteText(data.name, labelFontSize, style.labelColor);
      label.fontFace = 'Inter, system-ui, sans-serif';
      label.fontWeight = '500';
      label.backgroundColor = 'rgba(0,0,0,0.5)';
      label.padding = 1.5;
      label.borderRadius = 2;
      label.position.set(0, -(style.radius + 4), 0);
      group.add(label);

      nodeMaterialsMap.current.set(node.id, {
        main: material,
        glow: glowMaterial,
        label,
        baseMainOpacity: style.opacity,
        baseGlowOpacity: style.glowOpacity,
      });
    } else {
      // Resource node — pooled geometries
      const mainMat = new THREE.MeshBasicMaterial({
        color: '#8b5cf6',
        transparent: true,
        opacity: 0.8,
      });
      group.add(new THREE.Mesh(getResourceMainGeometry(), mainMat));

      const glowMat = new THREE.MeshBasicMaterial({
        color: '#8b5cf6',
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
      });
      group.add(new THREE.Mesh(getResourceGlowGeometry(), glowMat));

      nodeMaterialsMap.current.set(node.id, {
        main: mainMat,
        glow: glowMat,
        label: null,
        baseMainOpacity: 0.8,
        baseGlowOpacity: 0.06,
      });
    }

    return group;
  }, []);

  // ============================================================================
  // LINK CALLBACKS — use pre-computed metadata, read hoveredNodeIdRef
  // ============================================================================

  /** Resolve link key for metadata lookup. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLinkMeta = useCallback((link: any) => {
    const srcId = resolveEndpointId(link.source);
    const tgtId = resolveEndpointId(link.target);
    const key = `${srcId}→${tgtId}`;
    return linkMetaMap.get(key) ?? { isResource: false, bothStudied: false, bothActive: false, phaseColor: '#94A3B8' };
  }, [linkMetaMap]);

  /** Check if a link is connected to the currently hovered node. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isLinkConnectedToHover = useCallback((link: any): boolean => {
    const hId = hoveredNodeIdRef.current;
    if (!hId) return false;
    const srcId = resolveEndpointId(link.source);
    const tgtId = resolveEndpointId(link.target);
    return srcId === hId || tgtId === hId;
  }, []);

  // Link callbacks include hoverTick in deps so their identity changes on hover.
  // The library detects new prop refs → re-evaluates accessors (no _flushObjects).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLinkColor = useCallback((link: any): string => {
    const meta = getLinkMeta(link);
    if (meta.isResource) {
      return isLinkConnectedToHover(link) ? '#a78bfa' : '#8b5cf6';
    }
    if (!meta.bothActive) return INACTIVE_COLOR;
    return meta.phaseColor;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getLinkMeta, isLinkConnectedToHover, hoverTick]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLinkWidth = useCallback((link: any): number => {
    const meta = getLinkMeta(link);
    const isHovered = isLinkConnectedToHover(link);
    if (meta.isResource) {
      return isHovered ? 0.5 * HOVER_LINK_WIDTH_MULTIPLIER : 0.5;
    }
    const base = meta.bothStudied ? 2.0 : 1.0;
    return isHovered ? base * HOVER_LINK_WIDTH_MULTIPLIER : base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getLinkMeta, isLinkConnectedToHover, hoverTick]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLinkParticles = useCallback((link: any): number => {
    const meta = getLinkMeta(link);
    const isHovered = isLinkConnectedToHover(link);
    if (meta.isResource) {
      return isHovered ? 3 : 0;
    }
    if (!meta.bothActive) return 0;
    if (isHovered) return HOVER_LINK_PARTICLES;
    return meta.bothStudied ? 3 : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getLinkMeta, isLinkConnectedToHover, hoverTick]);

  // ============================================================================
  // HOVER HANDLER — differential material updates + throttled tick
  // ============================================================================

  // Track which nodes are currently in "bright" state to enable differential updates
  const brightSetRef = useRef(new Set<string>());
  const hoverTickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeHover = useCallback((node: any | null) => {
    const newId: string | null = node?.id ?? null;
    const prevId = hoveredNodeIdRef.current;
    if (newId === prevId) return;

    hoveredNodeIdRef.current = newId;
    const prevBright = brightSetRef.current;
    const neighbors = newId ? neighborMapRef.current.get(newId) ?? new Set<string>() : new Set<string>();

    // Build new bright set (hovered node + its neighbors)
    const newBright = new Set<string>();
    if (newId) {
      newBright.add(newId);
      neighbors.forEach((id) => newBright.add(id));
    }

    if (!newId) {
      // Hover ended — restore only the previously dimmed nodes
      prevBright.forEach((id) => {
        // These were bright — already at base, skip
      });
      // Restore all dimmed nodes to base
      nodeMaterialsMap.current.forEach((mats, nodeId) => {
        if (!prevBright.has(nodeId)) {
          // Was dimmed, restore
          mats.main.opacity = mats.baseMainOpacity;
          mats.glow.opacity = mats.baseGlowOpacity;
          if (mats.label) mats.label.material.opacity = 1;
        }
      });
      // Also restore previously bright nodes' glow (undo boost)
      prevBright.forEach((id) => {
        const mats = nodeMaterialsMap.current.get(id);
        if (mats) mats.glow.opacity = mats.baseGlowOpacity;
      });
    } else {
      // Differential: only update nodes whose state changed
      nodeMaterialsMap.current.forEach((mats, nodeId) => {
        const wasBright = !prevId || prevBright.has(nodeId);
        const isBright = newBright.has(nodeId);

        if (wasBright && !isBright) {
          // Was bright, now dimmed
          mats.main.opacity = mats.baseMainOpacity * DIM_OPACITY_FACTOR;
          mats.glow.opacity = mats.baseGlowOpacity * DIM_OPACITY_FACTOR;
          if (mats.label) mats.label.material.opacity = DIM_OPACITY_FACTOR;
        } else if (!wasBright && isBright) {
          // Was dimmed, now bright
          mats.main.opacity = mats.baseMainOpacity;
          mats.glow.opacity = nodeId === newId
            ? Math.min(mats.baseGlowOpacity * HOVER_GLOW_BOOST, 0.5)
            : mats.baseGlowOpacity;
          if (mats.label) mats.label.material.opacity = 1;
        } else if (isBright && nodeId === newId) {
          // Hovered node gets glow boost
          mats.glow.opacity = Math.min(mats.baseGlowOpacity * HOVER_GLOW_BOOST, 0.5);
        } else if (isBright) {
          // Neighbor, restore normal glow (might have been boosted as prev hovered)
          mats.glow.opacity = mats.baseGlowOpacity;
        }
        // Nodes that stayed dimmed or stayed bright+neighbor → no update needed
      });
    }

    brightSetRef.current = newBright;

    // Cursor feedback
    const el = containerRef.current;
    if (el) el.style.cursor = newId ? 'pointer' : 'default';

    // Throttled tick bump — avoids queuing renders during fast mouse movement
    if (!hoverTickTimerRef.current) {
      hoverTickTimerRef.current = setTimeout(() => {
        hoverTickTimerRef.current = null;
        setHoverTick(t => t + 1);
      }, HOVER_TICK_THROTTLE_MS);
    }
  }, []);

  // ============================================================================
  // CAMERA FLY-TO ON NODE CLICK
  // ============================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    const id = node?.id as string | undefined;
    if (!id) return;

    setSelectedId((prev) => (prev === id ? null : id));

    // Camera fly-to
    const fg = fgRef.current;
    if (fg && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
      const distRatio = 1 + CAMERA_FLY_DISTANCE / Math.hypot(node.x, node.y, node.z || 1);
      fg.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        { x: node.x, y: node.y, z: node.z },
        CAMERA_FLY_DURATION
      );
    }
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedId(null);
    fgRef.current?.zoomToFit(1000, 20);
  }, []);

  // ============================================================================
  // SELECTION RING — uses __threeObj binding (no scene.traverse)
  // ============================================================================

  useEffect(() => {
    // Clean up previous ring
    if (selectionRingRef.current && prevSelectedGroupRef.current) {
      prevSelectedGroupRef.current.remove(selectionRingRef.current);
      selectionRingRef.current.geometry.dispose();
      (selectionRingRef.current.material as THREE.Material).dispose();
      selectionRingRef.current = null;
    }
    if (selectionRingAnimId.current) {
      cancelAnimationFrame(selectionRingAnimId.current);
      selectionRingAnimId.current = 0;
    }
    prevSelectedGroupRef.current = null;

    if (!selectedId || !fgRef.current) return;

    // Use __threeObj binding from the library instead of expensive scene.traverse
    const selectedGraphNode = nodeMap.get(selectedId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const threeObj = (selectedGraphNode as any)?.__threeObj as THREE.Group | undefined;

    // Fallback: if __threeObj not available, try scene traverse
    let group: THREE.Group | null = threeObj instanceof THREE.Group ? threeObj : null;

    if (!group) {
      const scene = fgRef.current.scene?.();
      if (!scene) return;
      scene.traverse((obj: THREE.Object3D) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objData = (obj as any).__data;
        if (objData && objData.id === selectedId && obj instanceof THREE.Group) {
          group = obj as THREE.Group;
        }
      });
    }

    if (!group) return;
    const targetGroup: THREE.Group = group;

    // Determine ring size from node data
    const nodeData = selectedGraphNode?.data;
    const radius = nodeData?.type === 'concept'
      ? getNodeStyle(nodeData.phase, nodeData.masteryLevel).radius
      : 2.5;

    // Create pulsing ring
    const ringGeometry = new THREE.TorusGeometry(radius + 2, 0.3, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: SELECTION_RING_MAX_OPACITY,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    targetGroup.add(ring);

    selectionRingRef.current = ring;
    prevSelectedGroupRef.current = targetGroup;

    // Pulse animation
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const t = (Math.sin(elapsed * SELECTION_RING_PULSE_SPEED) + 1) / 2;
      ringMaterial.opacity = SELECTION_RING_MIN_OPACITY + t * (SELECTION_RING_MAX_OPACITY - SELECTION_RING_MIN_OPACITY);
      selectionRingAnimId.current = requestAnimationFrame(animate);
    };
    selectionRingAnimId.current = requestAnimationFrame(animate);

    return () => {
      if (selectionRingAnimId.current) {
        cancelAnimationFrame(selectionRingAnimId.current);
      }
    };
  }, [selectedId, nodeMap]);

  // ============================================================================
  // BLOOM + AUTO-ROTATE SETUP
  // ============================================================================

  const bloomAdded = useRef(false);
  useEffect(() => {
    if (!fgRef.current || bloomAdded.current) return;
    const fg = fgRef.current;

    const controls = fg.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
    }

    try {
      const composer = fg.postProcessingComposer?.();
      if (composer) {
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(dimensions.width, dimensions.height),
          1.5,  // strength
          0.8,  // radius
          0.1   // threshold
        );
        composer.addPass(bloomPass);
        bloomAdded.current = true;
      }
    } catch {
      // Bloom not supported — proceed without it
    }
  }, [dimensions.width, dimensions.height]);

  const handleEngineStop = useCallback(() => {
    if (!isReady) {
      setIsReady(true);
      setTimeout(() => {
        fgRef.current?.zoomToFit(800, 20);
      }, 200);
    }
  }, [isReady]);

  // Stats (memoized — don't recompute on hoverTick re-renders)
  const stats = useMemo(() => ({
    totalConcepts: concepts.length,
    totalMastered: concepts.filter((c) => c.masteryLevel >= 1).length,
    totalResources: resources.length,
  }), [concepts, resources]);
  const { totalConcepts, totalMastered, totalResources } = stats;

  return (
    <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="absolute inset-0 bg-[#0F172A]" />

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
            backgroundColor="#0F172A"
            nodeThreeObject={createNodeObject}
            nodeLabel={getNodeLabel}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            enableNodeDrag={false}
            linkColor={getLinkColor}
            linkWidth={getLinkWidth}
            linkOpacity={0.4}
            linkDirectionalParticles={getLinkParticles}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleColor={getLinkColor}
            linkCurvature={0.2}
            linkCurveRotation={0.5}
            linkHoverPrecision={4}
            warmupTicks={100}
            cooldownTime={3000}
            onEngineStop={handleEngineStop}
            onBackgroundClick={handleBackgroundClick}
            showNavInfo={false}
          />
        )}
      </div>

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-500 uppercase animate-pulse">
            {language === 'es' ? 'Construyendo grafo...' : 'Building graph...'}
          </div>
        </div>
      )}

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

      <div
        className="absolute top-4 right-4 px-3 py-2 rounded-lg font-mono text-[9px] pointer-events-none"
        style={{
          backdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
          maxWidth: 200,
        }}
      >
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {activePhasesForLegend.map(([phaseNum, meta]) => (
            <span key={phaseNum} className="flex items-center gap-1 text-slate-300">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {language === 'es' ? meta.labelEs : meta.label}
            </span>
          ))}
          {totalResources > 0 && (
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-2 rotate-45 bg-purple-500" style={{ width: 7, height: 7 }} />
              {language === 'es' ? 'Recurso' : 'Resource'}
            </span>
          )}
        </div>
        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-slate-500 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full border border-slate-600" />
            L0
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            L4
          </span>
          <span className="text-slate-600 ml-1">
            {language === 'es' ? 'opacidad + tamaño' : 'opacity + size'}
          </span>
        </div>
      </div>

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
