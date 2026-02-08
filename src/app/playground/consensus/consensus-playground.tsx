'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RaftCluster } from './raft-engine';
import type { RaftClusterSnapshot } from './raft-engine';
import { ClusterVisualizer } from './cluster-visualizer';
import { LogVisualizer } from './log-visualizer';
import { ControlsPanel } from './controls-panel';
import { LessonGuide } from './lesson-guide';
import { TabbedSidebar } from '@/components/playground/tabbed-sidebar';
import { TutorPanel } from '@/components/playground/tutor-panel';

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
  const clusterRef = useRef<RaftCluster>(new RaftCluster());
  const [snapshot, setSnapshot] = useState<RaftClusterSnapshot>(() =>
    clusterRef.current.snapshot()
  );
  const [mode, setMode] = useState<'step' | 'auto'>('step');
  const [speed, setSpeed] = useState(500);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [proactiveQuestion, setProactiveQuestion] = useState<string | null>(null);
  const lastProactiveRef = useRef(0);

  const updateSnapshot = useCallback(() => {
    setSnapshot(clusterRef.current.snapshot());
  }, []);

  const handleStep = useCallback(() => {
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
    const cmd = nextWriteCommand();
    clusterRef.current.clientWrite(cmd);
    updateSnapshot();
  }, [updateSnapshot]);

  const handleKillNode = useCallback(() => {
    if (!selectedNode) return;
    clusterRef.current.killNode(selectedNode);
    updateSnapshot();
  }, [selectedNode, updateSnapshot]);

  const handleRecoverNode = useCallback(() => {
    if (!selectedNode) return;
    clusterRef.current.recoverNode(selectedNode);
    updateSnapshot();
  }, [selectedNode, updateSnapshot]);

  const handlePartition = useCallback(() => {
    clusterRef.current.createPartition();
    updateSnapshot();
  }, [updateSnapshot]);

  const handleHeal = useCallback(() => {
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
    const leader = clusterRef.current.getLeader();
    if (leader) {
      clusterRef.current.killNode(leader);
      updateSnapshot();
    }
  }, [updateSnapshot]);

  const handleStepUntilElection = useCallback(() => {
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
  useEffect(() => {
    const recentEvents = snapshot.events.slice(-5);
    const hasSignificantEvent = recentEvents.some(
      (e) => e.type === 'elected_leader' || e.type === 'partition_created' || e.type === 'entry_committed'
    );
    if (!hasSignificantEvent) return;

    const now = Date.now();
    if (now - lastProactiveRef.current < 30000) return;
    lastProactiveRef.current = now;

    fetch('/api/playground/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playground: 'consensus',
        state: snapshot,
        history: [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.question) setProactiveQuestion(data.question);
      })
      .catch(() => {});
  }, [snapshot.events.length]);

  const currentLeader = snapshot.nodes.find(
    (n) => n.state === 'leader' && n.status === 'alive'
  );
  const selectedNodeData = selectedNode
    ? snapshot.nodes.find((n) => n.id === selectedNode)
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Top: Lesson Guide + Cluster Viz + Controls */}
      <div className="flex-1 min-h-0 flex">
        {/* Lesson Guide sidebar */}
        <div className="flex-[2] shrink-0 border-r border-[#e8e6e0] overflow-hidden">
          <TabbedSidebar
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
            tutor={
              <TutorPanel
                playground="consensus"
                getState={() => snapshot}
                accentColor="#991b1b"
                proactiveQuestion={proactiveQuestion}
                onDismissProactive={() => setProactiveQuestion(null)}
              />
            }
            hasNotification={!!proactiveQuestion}
            accentColor="#991b1b"
          />
        </div>

        {/* Main area: cluster + controls */}
        <div className="flex-[5] min-w-0 flex flex-col">
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
          <div className="shrink-0 border-t border-[#e8e6e0]">
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
      </div>

      {/* Bottom: Log Visualizer */}
      <div className="h-48 shrink-0 border-t border-[#e8e6e0]">
        <LogVisualizer nodes={snapshot.nodes} />
      </div>
    </div>
  );
}
