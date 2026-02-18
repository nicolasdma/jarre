'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RaftCluster } from './raft-engine';
import type { RaftClusterSnapshot } from './raft-engine';
import { ClusterVisualizer } from './cluster-visualizer';
import { LogVisualizer } from './log-visualizer';
import { ControlsPanel } from './controls-panel';
import { LessonGuide } from './lesson-guide';
import { PlaygroundLayout } from '@/components/playground/playground-layout';

let writeCounter = 0;

function nextWriteCommand(): string {
  writeCounter++;
  const ops = ['SET', 'SET', 'SET', 'PUT', 'DEL'];
  const keys = ['x', 'y', 'z', 'count', 'flag', 'name', 'mode'];
  const values = [
    writeCounter.toString(),
    String(Math.floor(Math.random() * 100)),
    'true',
    'false',
    'ok',
  ];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const key = keys[Math.floor(Math.random() * keys.length)];
  if (op === 'DEL') return `DEL ${key}`;
  const val = values[Math.floor(Math.random() * values.length)];
  return `${op} ${key}=${val}`;
}

export function ConsensusPlayground() {
  const clusterRef = useRef<RaftCluster | null>(null);
  const [snapshot, setSnapshot] = useState<RaftClusterSnapshot | null>(null);
  const [mode, setMode] = useState<'step' | 'auto'>('step');
  const [speed, setSpeed] = useState(500);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [proactiveQuestion, setProactiveQuestion] = useState<string | null>(null);
  const lastProactiveRef = useRef(0);

  // Initialize cluster only on the client to avoid hydration mismatch
  // (RaftCluster uses Math.random() for election timers)
  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = new RaftCluster();
      setSnapshot(clusterRef.current.snapshot());
    }
  }, []);

  const updateSnapshot = useCallback(() => {
    if (!clusterRef.current) return;
    setSnapshot(clusterRef.current.snapshot());
  }, []);

  const handleStep = useCallback(() => {
    if (!clusterRef.current) return;
    clusterRef.current.step();
    updateSnapshot();
  }, [updateSnapshot]);

  const handleToggleMode = useCallback(() => {
    setMode((prev) => (prev === 'step' ? 'auto' : 'step'));
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  const handleClientWrite = useCallback(() => {
    if (!clusterRef.current) return;
    const cmd = nextWriteCommand();
    clusterRef.current.clientWrite(cmd);
    updateSnapshot();
  }, [updateSnapshot]);

  const handleKillNode = useCallback(() => {
    if (!selectedNode || !clusterRef.current) return;
    clusterRef.current.killNode(selectedNode);
    updateSnapshot();
  }, [selectedNode, updateSnapshot]);

  const handleRecoverNode = useCallback(() => {
    if (!selectedNode || !clusterRef.current) return;
    clusterRef.current.recoverNode(selectedNode);
    updateSnapshot();
  }, [selectedNode, updateSnapshot]);

  const handlePartition = useCallback(() => {
    if (!clusterRef.current) return;
    clusterRef.current.createPartition();
    updateSnapshot();
  }, [updateSnapshot]);

  const handleHeal = useCallback(() => {
    if (!clusterRef.current) return;
    clusterRef.current.healPartition();
    updateSnapshot();
  }, [updateSnapshot]);

  const handleReset = useCallback(() => {
    writeCounter = 0;
    clusterRef.current = new RaftCluster();
    setMode('step');
    setSelectedNode(null);
    updateSnapshot();
  }, [updateSnapshot]);

  const handleSelectNode = useCallback((id: string) => {
    setSelectedNode((prev) => (prev === id ? null : id));
  }, []);

  const handleKillLeader = useCallback(() => {
    if (!clusterRef.current) return;
    const leader = clusterRef.current.getLeader();
    if (leader) {
      clusterRef.current.killNode(leader);
      updateSnapshot();
    }
  }, [updateSnapshot]);

  const handleStepUntilElection = useCallback(() => {
    if (!clusterRef.current) return;
    // Step up to 20 ticks or until a leader is elected
    for (let i = 0; i < 20; i++) {
      const events = clusterRef.current.step();
      const elected = events.some((e) => e.type === 'elected_leader');
      if (elected) break;
    }
    updateSnapshot();
  }, [updateSnapshot]);

  // Auto mode interval
  useEffect(() => {
    if (mode === 'auto') {
      autoRef.current = setInterval(() => {
        if (!clusterRef.current) return;
        clusterRef.current.step();
        setSnapshot(clusterRef.current.snapshot());
      }, speed);
    } else {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
    }
    return () => {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
    };
  }, [mode, speed]);

  // Proactive tutor trigger: fires on significant events
  const fetchConsensusTutor = useCallback(async () => {
    if (!snapshot) return;
    const recentEvents = snapshot.events.slice(-5);
    const hasSignificantEvent = recentEvents.some(
      (e) => e.type === 'elected_leader' || e.type === 'partition_created' || e.type === 'entry_committed'
    );
    if (!hasSignificantEvent) return;

    const now = Date.now();
    if (now - lastProactiveRef.current < 30000) return;
    lastProactiveRef.current = now;

    try {
      const res = await fetch('/api/playground/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playground: 'consensus',
          state: snapshot,
          history: [],
        }),
      });
      const data = await res.json();
      if (data.question) setProactiveQuestion(data.question);
    } catch {
      // Proactive question is optional — don't block on errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.events.length]);

  useEffect(() => {
    fetchConsensusTutor();
  }, [fetchConsensusTutor]);

  // Don't render until cluster is initialized on the client
  if (!snapshot) {
    return (
      <div className="h-full flex items-center justify-center text-j-text-muted">
        Initializing cluster...
      </div>
    );
  }

  const currentLeader = snapshot.nodes.find(
    (n) => n.state === 'leader' && n.status === 'alive'
  );
  const selectedNodeData = selectedNode
    ? snapshot.nodes.find((n) => n.id === selectedNode)
    : null;

  return (
    <PlaygroundLayout
      accentColor="#991b1b"
      disableTutor
      lessons={
        <LessonGuide
          onReset={handleReset}
          onStep={handleStep}
          onStepUntilElection={handleStepUntilElection}
          onKillLeader={handleKillLeader}
          onToggleMode={handleToggleMode}
          onClientWrite={handleClientWrite}
          onPartition={handlePartition}
          onHeal={handleHeal}
        />
      }
      bottomPanel={<LogVisualizer nodes={snapshot.nodes} />}
    >
      <div className="h-full flex flex-col">
        {/* Cluster visualization */}
        <div className="flex-1 min-h-0">
          <ClusterVisualizer
            nodes={snapshot.nodes}
            messages={snapshot.messages}
            partition={snapshot.partition}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
            onKillNode={handleKillNode}
          />
        </div>

        {/* Controls */}
        <div className="shrink-0 border-t border-j-border">
          <ControlsPanel
            mode={mode}
            speed={speed}
            tick={snapshot.tick}
            currentLeader={currentLeader?.id ?? null}
            selectedNode={selectedNode}
            selectedNodeStatus={selectedNodeData?.status ?? null}
            isPartitioned={snapshot.partition !== null}
            onStep={handleStep}
            onToggleMode={handleToggleMode}
            onSpeedChange={handleSpeedChange}
            onClientWrite={handleClientWrite}
            onKillNode={handleKillNode}
            onRecoverNode={handleRecoverNode}
            onPartition={handlePartition}
            onHeal={handleHeal}
            onReset={handleReset}
          />
        </div>
      </div>
    </PlaygroundLayout>
  );
}
