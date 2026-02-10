'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RingVisualizer } from './ring-visualizer';
import { PartitionStats } from './partition-stats';
import { LessonGuide } from './lesson-guide';
import { TabbedSidebar } from '@/components/playground/tabbed-sidebar';
import { TutorPanel } from '@/components/playground/tutor-panel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PartitionNode {
  id: string;
  label: string;
  color: string;
  keys: string[];
}

export interface KeyEntry {
  key: string;
  hash: number;
  nodeId: string;
  position: number; // 0-360 for ring modes, 0-255 for range
}

export type PartitionMode = 'simple-hash' | 'consistent-hash' | 'range';

export interface VirtualNode {
  hash: number;
  nodeId: string;
}

export interface PartitionState {
  mode: PartitionMode;
  nodes: PartitionNode[];
  keys: KeyEntry[];
  virtualNodesPerNode: number;
  searchKey: string | null;
  lastRebalance: { moved: number; total: number } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NODE_COLORS = [
  '#059669', '#2563eb', '#d97706', '#dc2626',
  '#7c3aed', '#db2777', '#0891b2', '#65a30d',
];

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const MAX_HASH = 0xFFFFFFFF; // 2^32 - 1

// ---------------------------------------------------------------------------
// Hash functions (deterministic)
// ---------------------------------------------------------------------------

export function simpleHash(key: string): number {
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) & 0xFFFFFFFF;
  }
  return hash >>> 0;
}

function getNodeSimple(key: string, nodeCount: number): number {
  return simpleHash(key) % nodeCount;
}

export function buildRing(nodes: PartitionNode[], vnodes: number): VirtualNode[] {
  const ring: VirtualNode[] = [];
  for (const node of nodes) {
    for (let i = 0; i < vnodes; i++) {
      const hash = simpleHash(`${node.id}-vnode-${i}`);
      ring.push({ hash, nodeId: node.id });
    }
  }
  return ring.sort((a, b) => a.hash - b.hash);
}

function getNodeConsistent(keyHash: number, ring: VirtualNode[]): string {
  if (ring.length === 0) return '';
  for (const vnode of ring) {
    if (vnode.hash >= keyHash) return vnode.nodeId;
  }
  return ring[0].nodeId; // wrap around
}

function getNodeRange(key: string, nodeCount: number): number {
  const firstChar = key.charCodeAt(0);
  const rangeSize = Math.ceil(256 / nodeCount);
  return Math.min(Math.floor(firstChar / rangeSize), nodeCount - 1);
}

// ---------------------------------------------------------------------------
// Key positioning helpers
// ---------------------------------------------------------------------------

function hashToAngle(hash: number): number {
  return (hash / MAX_HASH) * 360;
}

function keyToRangePosition(key: string): number {
  return key.charCodeAt(0);
}

// ---------------------------------------------------------------------------
// Random key generation
// ---------------------------------------------------------------------------

const RANDOM_KEY_PREFIXES = [
  'user', 'order', 'product', 'session', 'event', 'log',
  'doc', 'msg', 'task', 'item', 'record', 'data',
];

function generateRandomKey(): string {
  const prefix = RANDOM_KEY_PREFIXES[Math.floor(Math.random() * RANDOM_KEY_PREFIXES.length)];
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${prefix}:${suffix}`;
}

// ---------------------------------------------------------------------------
// Core: assign a single key to a node given the current state
// ---------------------------------------------------------------------------

function assignKey(
  key: string,
  mode: PartitionMode,
  nodes: PartitionNode[],
  ring: VirtualNode[],
): { nodeId: string; hash: number; position: number } {
  if (nodes.length === 0) {
    return { nodeId: '', hash: 0, position: 0 };
  }

  const hash = simpleHash(key);

  switch (mode) {
    case 'simple-hash': {
      const idx = getNodeSimple(key, nodes.length);
      const nodeId = nodes[idx].id;
      return { nodeId, hash, position: hashToAngle(hash) };
    }
    case 'consistent-hash': {
      const nodeId = getNodeConsistent(hash, ring);
      return { nodeId, hash, position: hashToAngle(hash) };
    }
    case 'range': {
      const idx = getNodeRange(key, nodes.length);
      const nodeId = nodes[idx].id;
      return { nodeId, hash, position: keyToRangePosition(key) };
    }
  }
}

// ---------------------------------------------------------------------------
// Core: rebalance all keys and calculate moves
// ---------------------------------------------------------------------------

function rebalanceAll(
  existingKeys: KeyEntry[],
  mode: PartitionMode,
  nodes: PartitionNode[],
  vnodes: number,
): { keys: KeyEntry[]; moved: number; nodeKeys: Map<string, string[]> } {
  const ring = mode === 'consistent-hash' ? buildRing(nodes, vnodes) : [];
  const nodeKeys = new Map<string, string[]>();
  for (const node of nodes) {
    nodeKeys.set(node.id, []);
  }

  let moved = 0;
  const newKeys: KeyEntry[] = existingKeys.map(entry => {
    const result = assignKey(entry.key, mode, nodes, ring);
    if (result.nodeId !== entry.nodeId) {
      moved++;
    }
    nodeKeys.get(result.nodeId)?.push(entry.key);
    return {
      key: entry.key,
      hash: result.hash,
      nodeId: result.nodeId,
      position: result.position,
    };
  });

  return { keys: newKeys, moved, nodeKeys };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const INITIAL_STATE: PartitionState = {
  mode: 'simple-hash',
  nodes: [],
  keys: [],
  virtualNodesPerNode: 3,
  searchKey: null,
  lastRebalance: null,
};

export function PartitionPlayground() {
  const [state, setState] = useState<PartitionState>(INITIAL_STATE);
  const nextNodeIndex = useRef(0);
  const [proactiveQuestion, setProactiveQuestion] = useState<string | null>(null);
  const lastProactiveRef = useRef(0);

  // Proactive tutor trigger: fires on rebalance with >30% keys moved
  useEffect(() => {
    if (!state.lastRebalance) return;
    const { moved, total } = state.lastRebalance;
    if (total === 0 || (moved / total) <= 0.3) return;

    const now = Date.now();
    if (now - lastProactiveRef.current < 30000) return;
    lastProactiveRef.current = now;

    fetch('/api/playground/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playground: 'partitioning',
        state,
        history: [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.question) setProactiveQuestion(data.question);
      })
      .catch(() => {});
  }, [state.lastRebalance]);

  // ---- Add Node ----
  const addNode = useCallback(() => {
    setState(prev => {
      if (prev.nodes.length >= 8) return prev;
      const idx = nextNodeIndex.current;
      nextNodeIndex.current++;
      const newNode: PartitionNode = {
        id: `node-${idx}`,
        label: NODE_LABELS[idx % NODE_LABELS.length],
        color: NODE_COLORS[idx % NODE_COLORS.length],
        keys: [],
      };
      const newNodes = [...prev.nodes, newNode];
      const { keys, moved, nodeKeys } = rebalanceAll(
        prev.keys, prev.mode, newNodes, prev.virtualNodesPerNode,
      );
      const updatedNodes = newNodes.map(n => ({
        ...n,
        keys: nodeKeys.get(n.id) ?? [],
      }));
      return {
        ...prev,
        nodes: updatedNodes,
        keys,
        lastRebalance: prev.keys.length > 0
          ? { moved, total: prev.keys.length }
          : prev.lastRebalance,
      };
    });
  }, []);

  // ---- Remove Node ----
  const removeNode = useCallback(() => {
    setState(prev => {
      if (prev.nodes.length <= 1) return prev;
      const newNodes = prev.nodes.slice(0, -1);
      const { keys, moved, nodeKeys } = rebalanceAll(
        prev.keys, prev.mode, newNodes, prev.virtualNodesPerNode,
      );
      const updatedNodes = newNodes.map(n => ({
        ...n,
        keys: nodeKeys.get(n.id) ?? [],
      }));
      return {
        ...prev,
        nodes: updatedNodes,
        keys,
        lastRebalance: prev.keys.length > 0
          ? { moved, total: prev.keys.length }
          : prev.lastRebalance,
      };
    });
  }, []);

  // ---- Add Keys ----
  const addKeys = useCallback((count: number) => {
    setState(prev => {
      if (prev.nodes.length === 0) return prev;
      const ring = prev.mode === 'consistent-hash'
        ? buildRing(prev.nodes, prev.virtualNodesPerNode)
        : [];
      const newEntries: KeyEntry[] = [];
      const nodeKeysAdd = new Map<string, string[]>();
      for (const node of prev.nodes) {
        nodeKeysAdd.set(node.id, [...node.keys]);
      }
      for (let i = 0; i < count; i++) {
        const key = generateRandomKey();
        const result = assignKey(key, prev.mode, prev.nodes, ring);
        newEntries.push({
          key,
          hash: result.hash,
          nodeId: result.nodeId,
          position: result.position,
        });
        nodeKeysAdd.get(result.nodeId)?.push(key);
      }
      const updatedNodes = prev.nodes.map(n => ({
        ...n,
        keys: nodeKeysAdd.get(n.id) ?? [],
      }));
      return {
        ...prev,
        nodes: updatedNodes,
        keys: [...prev.keys, ...newEntries],
      };
    });
  }, []);

  // ---- Add Hotspot Keys ----
  const addHotspotKeys = useCallback((count: number) => {
    setState(prev => {
      if (prev.nodes.length === 0) return prev;
      const ring = prev.mode === 'consistent-hash'
        ? buildRing(prev.nodes, prev.virtualNodesPerNode)
        : [];
      const newEntries: KeyEntry[] = [];
      const nodeKeysAdd = new Map<string, string[]>();
      for (const node of prev.nodes) {
        nodeKeysAdd.set(node.id, [...node.keys]);
      }
      for (let i = 0; i < count; i++) {
        const key = `celebrity:${i}`;
        const result = assignKey(key, prev.mode, prev.nodes, ring);
        newEntries.push({
          key,
          hash: result.hash,
          nodeId: result.nodeId,
          position: result.position,
        });
        nodeKeysAdd.get(result.nodeId)?.push(key);
      }
      const updatedNodes = prev.nodes.map(n => ({
        ...n,
        keys: nodeKeysAdd.get(n.id) ?? [],
      }));
      return {
        ...prev,
        nodes: updatedNodes,
        keys: [...prev.keys, ...newEntries],
      };
    });
  }, []);

  // ---- Search Key ----
  const searchKey = useCallback((key: string) => {
    setState(prev => ({
      ...prev,
      searchKey: key.trim() || null,
    }));
  }, []);

  // ---- Set Mode ----
  const setMode = useCallback((mode: PartitionMode) => {
    setState(prev => {
      const { keys, moved, nodeKeys } = rebalanceAll(
        prev.keys, mode, prev.nodes, prev.virtualNodesPerNode,
      );
      const updatedNodes = prev.nodes.map(n => ({
        ...n,
        keys: nodeKeys.get(n.id) ?? [],
      }));
      return {
        ...prev,
        mode,
        nodes: updatedNodes,
        keys,
        lastRebalance: prev.keys.length > 0
          ? { moved, total: prev.keys.length }
          : prev.lastRebalance,
        searchKey: null,
      };
    });
  }, []);

  // ---- Set Virtual Nodes ----
  const setVirtualNodes = useCallback((n: number) => {
    setState(prev => {
      if (prev.mode !== 'consistent-hash') {
        return { ...prev, virtualNodesPerNode: n };
      }
      const { keys, moved, nodeKeys } = rebalanceAll(
        prev.keys, prev.mode, prev.nodes, n,
      );
      const updatedNodes = prev.nodes.map(node => ({
        ...node,
        keys: nodeKeys.get(node.id) ?? [],
      }));
      return {
        ...prev,
        virtualNodesPerNode: n,
        nodes: updatedNodes,
        keys,
        lastRebalance: prev.keys.length > 0
          ? { moved, total: prev.keys.length }
          : prev.lastRebalance,
      };
    });
  }, []);

  // ---- Clear ----
  const clearAll = useCallback(() => {
    nextNodeIndex.current = 0;
    setState(INITIAL_STATE);
  }, []);

  // ---- Initialize with N nodes ----
  const initializeNodes = useCallback((count: number) => {
    nextNodeIndex.current = 0;
    const nodes: PartitionNode[] = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `node-${i}`,
        label: NODE_LABELS[i % NODE_LABELS.length],
        color: NODE_COLORS[i % NODE_COLORS.length],
        keys: [],
      });
      nextNodeIndex.current = i + 1;
    }
    setState({
      ...INITIAL_STATE,
      nodes,
    });
  }, []);

  // ---- Lesson actions ----
  const handleLessonAction = useCallback((action: string) => {
    switch (action) {
      case 'init-3-nodes':
        initializeNodes(3);
        break;
      case 'mode-simple-add-50':
        setMode('simple-hash');
        // Use a small timeout so mode change settles before adding keys
        setTimeout(() => addKeys(50), 50);
        break;
      case 'add-node':
        addNode();
        break;
      case 'mode-consistent':
        setMode('consistent-hash');
        break;
      case 'mode-range':
        setMode('range');
        break;
      case 'add-hotspot':
        addHotspotKeys(20);
        break;
      default:
        break;
    }
  }, [initializeNodes, setMode, addKeys, addNode, addHotspotKeys]);

  return (
    <div className="h-full flex">
      {/* Left: Lesson Guide */}
      <div className="flex-[2] shrink-0 border-r border-j-border overflow-hidden">
        <TabbedSidebar
          disableTutor
          lessons={<LessonGuide onAction={handleLessonAction} />}
          accentColor="#059669"
        />
      </div>

      {/* Center: Ring Visualizer */}
      <div className="flex-[4] min-w-0 border-r border-j-border">
        <RingVisualizer
          state={state}
          onAddNode={addNode}
          onRemoveNode={removeNode}
          onAddKeys={addKeys}
          onSearchKey={searchKey}
          onSetMode={setMode}
          onSetVirtualNodes={setVirtualNodes}
          onClear={clearAll}
        />
      </div>

      {/* Right: Stats */}
      <div className="flex-[3] min-w-0 overflow-y-auto">
        <PartitionStats
          nodes={state.nodes}
          lastRebalance={state.lastRebalance}
          mode={state.mode}
        />
      </div>
    </div>
  );
}
