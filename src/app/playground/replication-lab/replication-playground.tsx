'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { NodeDiagram } from './node-diagram';
import { EventLog } from './event-log';
import { LessonGuide } from './lesson-guide';
import { PlaygroundLayout } from '@/components/playground/playground-layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataEntry {
  value: string;
  version: number;
}

export interface ReplicationNode {
  id: string;
  role: 'leader' | 'follower';
  status: 'healthy' | 'crashed' | 'partitioned';
  data: Map<string, DataEntry>;
  replicationDelay: number;
}

export interface ReplicationMessage {
  id: string;
  type: 'write' | 'replicate' | 'ack';
  from: string;
  to: string;
  key: string;
  value: string;
  version: number;
  sentAt: number;
  deliverAt: number;
  status: 'in-flight' | 'delivered' | 'dropped';
  progress: number;
}

export interface EventLogEntry {
  id: number;
  timestamp: number;
  type: 'write' | 'read' | 'replicate' | 'crash' | 'recover' | 'partition' | 'heal' | 'violation';
  nodeId: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
}

export interface SimConfig {
  mode: 'sync' | 'async';
  replicationDelay: number;
  autoFailover: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _nextMsgId = 0;
function nextMsgId(): string {
  return `msg-${++_nextMsgId}`;
}

let _nextEventId = 0;
function nextEventId(): number {
  return ++_nextEventId;
}

function cloneNodes(nodes: ReplicationNode[]): ReplicationNode[] {
  return nodes.map(n => ({
    ...n,
    data: new Map(n.data),
  }));
}

function serializableData(data: Map<string, DataEntry>): Array<[string, DataEntry]> {
  return Array.from(data.entries());
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function createInitialNodes(): ReplicationNode[] {
  return [
    { id: 'leader', role: 'leader', status: 'healthy', data: new Map(), replicationDelay: 0 },
    { id: 'follower-1', role: 'follower', status: 'healthy', data: new Map(), replicationDelay: 0 },
    { id: 'follower-2', role: 'follower', status: 'healthy', data: new Map(), replicationDelay: 0 },
  ];
}

const INITIAL_CONFIG: SimConfig = {
  mode: 'async',
  replicationDelay: 800,
  autoFailover: true,
};

// Auto-generated write data
const AUTO_KEYS = ['user', 'color', 'city', 'lang', 'score', 'status', 'role', 'email', 'tier', 'plan'];
const AUTO_VALUES = ['alice', 'blue', 'paris', 'es', '100', 'active', 'admin', 'a@b.com', 'pro', 'free'];
let _autoWriteIndex = 0;

function nextAutoWrite(): { key: string; value: string } {
  const idx = _autoWriteIndex % AUTO_KEYS.length;
  _autoWriteIndex++;
  return { key: AUTO_KEYS[idx], value: AUTO_VALUES[idx] };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReplicationPlayground() {
  const [nodes, setNodes] = useState<ReplicationNode[]>(createInitialNodes);
  const [messages, setMessages] = useState<ReplicationMessage[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [config, setConfig] = useState<SimConfig>(INITIAL_CONFIG);
  const [isPartitioned, setIsPartitioned] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [globalVersion, setGlobalVersion] = useState(0);
  const [lastReadVersions, setLastReadVersions] = useState<Map<string, number>>(new Map());
  const [started, setStarted] = useState(false);
  const [proactiveQuestion, setProactiveQuestion] = useState<string | null>(null);
  const lastProactiveRef = useRef(0);

  // Refs for the simulation tick to access latest state without re-subscribing
  const nodesRef = useRef(nodes);
  const messagesRef = useRef(messages);
  const eventsRef = useRef(events);
  const configRef = useRef(config);
  const isPartitionedRef = useRef(isPartitioned);
  const globalVersionRef = useRef(globalVersion);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { isPartitionedRef.current = isPartitioned; }, [isPartitioned]);
  useEffect(() => { globalVersionRef.current = globalVersion; }, [globalVersion]);

  // Proactive tutor trigger: fires on violation, crash, or split brain events
  useEffect(() => {
    if (events.length === 0) return;
    const lastEvent = events[events.length - 1];
    const isSignificant = lastEvent.type === 'violation' || lastEvent.type === 'crash' || lastEvent.description.includes('SPLIT BRAIN');
    if (!isSignificant) return;

    const now = Date.now();
    if (now - lastProactiveRef.current < 30000) return;
    lastProactiveRef.current = now;

    fetch('/api/playground/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playground: 'replication',
        state: { nodes, events: events.slice(-10), config, isPartitioned, violations },
        history: [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.question) setProactiveQuestion(data.question);
      })
      .catch(() => {});
  }, [events.length]);

  // ------------------------------------------------------------------
  // Simulation tick
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentMessages = [...messagesRef.current];
      const currentNodes = cloneNodes(nodesRef.current);
      const newEvents: EventLogEntry[] = [];
      let changed = false;

      for (const msg of currentMessages) {
        if (msg.status !== 'in-flight') continue;

        // Calculate progress
        const duration = msg.deliverAt - msg.sentAt;
        const elapsed = now - msg.sentAt;
        msg.progress = Math.min(1, elapsed / Math.max(duration, 1));

        const targetNode = currentNodes.find(n => n.id === msg.to);
        const sourceNode = currentNodes.find(n => n.id === msg.from);

        // Drop messages to/from crashed nodes
        if (targetNode?.status === 'crashed' || sourceNode?.status === 'crashed') {
          msg.status = 'dropped';
          changed = true;
          continue;
        }

        // Drop messages across partition boundary
        if (isPartitionedRef.current) {
          const partitionedGroup = ['follower-2'];
          const mainGroup = ['leader', 'follower-1'];
          const fromPartitioned = partitionedGroup.includes(msg.from);
          const toPartitioned = partitionedGroup.includes(msg.to);
          const fromMain = mainGroup.includes(msg.from);
          const toMain = mainGroup.includes(msg.to);
          if ((fromPartitioned && toMain) || (fromMain && toPartitioned)) {
            msg.status = 'dropped';
            changed = true;
            continue;
          }
        }

        // Deliver when progress complete
        if (msg.progress >= 1) {
          msg.status = 'delivered';
          changed = true;

          if (targetNode && msg.type === 'replicate') {
            const existing = targetNode.data.get(msg.key);
            if (!existing || existing.version < msg.version) {
              targetNode.data.set(msg.key, { value: msg.value, version: msg.version });
            }
            newEvents.push({
              id: nextEventId(),
              timestamp: now,
              type: 'replicate',
              nodeId: msg.to,
              description: `${msg.to} recibio replica: ${msg.key}=${msg.value} (v${msg.version})`,
              severity: 'info',
            });
          }
        }
      }

      if (changed) {
        setNodes(currentNodes);
        setMessages(currentMessages.filter(m => {
          if (m.status === 'dropped') return false;
          if (m.status === 'delivered') return false;
          return true;
        }));
        if (newEvents.length > 0) {
          setEvents(prev => [...prev, ...newEvents]);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [started]);

  // ------------------------------------------------------------------
  // Emitter helper
  // ------------------------------------------------------------------

  const addEvent = useCallback((entry: Omit<EventLogEntry, 'id' | 'timestamp'>) => {
    const ev: EventLogEntry = { ...entry, id: nextEventId(), timestamp: Date.now() };
    setEvents(prev => [...prev, ev]);
    return ev;
  }, []);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  const writeToLeader = useCallback((key?: string, value?: string) => {
    if (!started) setStarted(true);

    const currentNodes = nodesRef.current;
    const leader = currentNodes.find(n => n.role === 'leader' && n.status === 'healthy');
    if (!leader) {
      addEvent({ type: 'write', nodeId: 'leader', description: 'No hay leader disponible para escribir', severity: 'error' });
      return;
    }

    const auto = nextAutoWrite();
    const k = key ?? auto.key;
    const v = value ?? auto.value;

    const newVersion = globalVersionRef.current + 1;
    setGlobalVersion(newVersion);

    // Apply to leader immediately
    setNodes(prev => {
      const next = cloneNodes(prev);
      const l = next.find(n => n.id === leader.id);
      if (l) l.data.set(k, { value: v, version: newVersion });
      return next;
    });

    addEvent({
      type: 'write',
      nodeId: leader.id,
      description: `WRITE ${k}=${v} (v${newVersion}) en ${leader.id}`,
      severity: 'info',
    });

    // Replicate to followers
    const now = Date.now();
    const delay = configRef.current.replicationDelay;
    const followers = currentNodes.filter(n => n.role === 'follower');

    const newMessages: ReplicationMessage[] = followers.map(f => ({
      id: nextMsgId(),
      type: 'replicate' as const,
      from: leader.id,
      to: f.id,
      key: k,
      value: v,
      version: newVersion,
      sentAt: now,
      deliverAt: now + delay,
      status: 'in-flight' as const,
      progress: 0,
    }));

    setMessages(prev => [...prev, ...newMessages]);
  }, [started, addEvent]);

  const readFromNode = useCallback((nodeId: string) => {
    if (!started) setStarted(true);

    const currentNodes = nodesRef.current;
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.status === 'crashed') {
      addEvent({ type: 'read', nodeId, description: `READ fallido: ${nodeId} esta caido`, severity: 'error' });
      return;
    }

    // Read the latest entry by version
    let latestKey = '';
    let latestEntry: DataEntry | null = null;
    for (const [k, entry] of node.data) {
      if (!latestEntry || entry.version > latestEntry.version) {
        latestKey = k;
        latestEntry = entry;
      }
    }

    if (!latestEntry) {
      addEvent({ type: 'read', nodeId, description: `READ de ${nodeId}: (vacio)`, severity: 'info' });
      return;
    }

    addEvent({
      type: 'read',
      nodeId,
      description: `READ de ${nodeId}: ${latestKey}=${latestEntry.value} (v${latestEntry.version})`,
      severity: 'info',
    });

    // Check read-after-write violation
    const leader = currentNodes.find(n => n.role === 'leader');
    if (leader && node.role === 'follower') {
      const leaderEntry = leader.data.get(latestKey);
      if (leaderEntry && leaderEntry.version > latestEntry.version) {
        const violationMsg = `READ-AFTER-WRITE: ${nodeId} devolvio v${latestEntry.version} pero leader tiene v${leaderEntry.version} para "${latestKey}"`;
        addEvent({ type: 'violation', nodeId, description: violationMsg, severity: 'error' });
        setViolations(prev => [...prev, violationMsg]);
      }
    }

    // Check monotonic read violation
    const prevVersion = lastReadVersions.get(nodeId === 'follower-1' ? 'follower-2' : 'follower-1');
    if (prevVersion !== undefined && latestEntry.version < prevVersion && node.role === 'follower') {
      const violationMsg = `MONOTONIC READ: leiste v${prevVersion} antes, ahora ${nodeId} devolvio v${latestEntry.version} — viajaste atras en el tiempo`;
      addEvent({ type: 'violation', nodeId, description: violationMsg, severity: 'error' });
      setViolations(prev => [...prev, violationMsg]);
    }
    setLastReadVersions(prev => {
      const next = new Map(prev);
      next.set(nodeId, latestEntry!.version);
      return next;
    });
  }, [started, addEvent, lastReadVersions]);

  const crashNode = useCallback((nodeId: string) => {
    const currentNodes = nodesRef.current;
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node || node.status === 'crashed') return;

    setNodes(prev => {
      const next = cloneNodes(prev);
      const target = next.find(n => n.id === nodeId);
      if (target) target.status = 'crashed';
      return next;
    });

    addEvent({
      type: 'crash',
      nodeId,
      description: `${nodeId} se cayo (crashed)`,
      severity: 'warning',
    });

    // If the crashed node is the leader and autoFailover is on, promote a follower
    if (node.role === 'leader' && configRef.current.autoFailover) {
      setTimeout(() => {
        setNodes(prev => {
          const next = cloneNodes(prev);
          // Find the healthiest follower (most data)
          const candidates = next.filter(n => n.role === 'follower' && n.status === 'healthy');
          if (candidates.length === 0) return next;

          let best = candidates[0];
          for (const c of candidates) {
            let cMaxVersion = 0;
            for (const entry of c.data.values()) {
              if (entry.version > cMaxVersion) cMaxVersion = entry.version;
            }
            let bestMaxVersion = 0;
            for (const entry of best.data.values()) {
              if (entry.version > bestMaxVersion) bestMaxVersion = entry.version;
            }
            if (cMaxVersion > bestMaxVersion) best = c;
          }

          const promoted = next.find(n => n.id === best.id);
          if (promoted) promoted.role = 'leader';

          return next;
        });

        addEvent({
          type: 'recover',
          nodeId: 'system',
          description: `FAILOVER: un follower fue promovido a leader`,
          severity: 'warning',
        });

        // Check for unreplicated data lost
        const crashedLeader = nodesRef.current.find(n => n.id === nodeId);
        const newLeader = nodesRef.current.find(n => n.role === 'leader' && n.status === 'healthy');
        if (crashedLeader && newLeader) {
          let lostWrites = 0;
          for (const [key, entry] of crashedLeader.data) {
            const newLeaderEntry = newLeader.data.get(key);
            if (!newLeaderEntry || newLeaderEntry.version < entry.version) {
              lostWrites++;
            }
          }
          if (lostWrites > 0) {
            const lostMsg = `Se perdieron ${lostWrites} escritura(s) no replicada(s) del viejo leader`;
            addEvent({ type: 'violation', nodeId, description: lostMsg, severity: 'error' });
            setViolations(prev => [...prev, lostMsg]);
          }
        }
      }, 1500);
    }
  }, [addEvent]);

  const recoverNode = useCallback((nodeId: string) => {
    const currentNodes = nodesRef.current;
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node || node.status !== 'crashed') return;

    setNodes(prev => {
      const next = cloneNodes(prev);
      const target = next.find(n => n.id === nodeId);
      if (!target) return next;

      target.status = 'healthy';

      // If there is a leader, sync data from it
      const leader = next.find(n => n.role === 'leader' && n.status === 'healthy' && n.id !== nodeId);
      if (leader) {
        target.role = 'follower';
        // Copy all leader data to the recovered node
        for (const [k, v] of leader.data) {
          target.data.set(k, { ...v });
        }
      }

      return next;
    });

    addEvent({
      type: 'recover',
      nodeId,
      description: `${nodeId} se recupero y sincronizo con el leader`,
      severity: 'info',
    });
  }, [addEvent]);

  const partitionNetwork = useCallback(() => {
    setIsPartitioned(true);
    addEvent({
      type: 'partition',
      nodeId: 'network',
      description: 'PARTICION DE RED: follower-2 esta aislado del leader y follower-1',
      severity: 'warning',
    });

    // Set follower-2 status to partitioned
    setNodes(prev => {
      const next = cloneNodes(prev);
      const f2 = next.find(n => n.id === 'follower-2');
      if (f2 && f2.status === 'healthy') f2.status = 'partitioned';
      return next;
    });
  }, [addEvent]);

  const healPartition = useCallback(() => {
    setIsPartitioned(false);
    addEvent({
      type: 'heal',
      nodeId: 'network',
      description: 'Red curada: follower-2 reconectado',
      severity: 'info',
    });

    // Set follower-2 status back to healthy
    setNodes(prev => {
      const next = cloneNodes(prev);
      const f2 = next.find(n => n.id === 'follower-2');
      if (f2 && f2.status === 'partitioned') f2.status = 'healthy';
      return next;
    });

    // Sync follower-2 with leader
    setTimeout(() => {
      setNodes(prev => {
        const next = cloneNodes(prev);
        const leader = next.find(n => n.role === 'leader' && n.status === 'healthy');
        const f2 = next.find(n => n.id === 'follower-2');
        if (leader && f2) {
          for (const [k, v] of leader.data) {
            const existing = f2.data.get(k);
            if (!existing || existing.version < v.version) {
              f2.data.set(k, { ...v });
            }
          }
        }
        return next;
      });
    }, 500);
  }, [addEvent]);

  const toggleMode = useCallback(() => {
    setConfig(prev => {
      const next = { ...prev, mode: prev.mode === 'sync' ? 'async' as const : 'sync' as const };
      addEvent({
        type: 'write',
        nodeId: 'config',
        description: `Modo cambiado a ${next.mode.toUpperCase()}`,
        severity: 'info',
      });
      return next;
    });
  }, [addEvent]);

  const setReplicationDelay = useCallback((delay: number) => {
    setConfig(prev => ({ ...prev, replicationDelay: delay }));
  }, []);

  const startSimulation = useCallback(() => {
    setStarted(true);
    addEvent({
      type: 'write',
      nodeId: 'system',
      description: 'Simulacion iniciada. 1 leader + 2 followers.',
      severity: 'info',
    });
  }, [addEvent]);

  const simulateReadAfterWrite = useCallback(() => {
    if (!started) setStarted(true);

    // Write to leader
    const k = 'color';
    const v = 'azul';
    const newVersion = globalVersionRef.current + 1;
    setGlobalVersion(newVersion);

    setNodes(prev => {
      const next = cloneNodes(prev);
      const leader = next.find(n => n.role === 'leader');
      if (leader) leader.data.set(k, { value: v, version: newVersion });
      return next;
    });

    addEvent({
      type: 'write',
      nodeId: 'leader',
      description: `WRITE ${k}=${v} (v${newVersion}) en leader`,
      severity: 'info',
    });

    // Send replication with large delay
    const now = Date.now();
    const delay = Math.max(configRef.current.replicationDelay, 2000);
    const currentNodes = nodesRef.current;
    const followers = currentNodes.filter(n => n.role === 'follower');

    const newMessages: ReplicationMessage[] = followers.map(f => ({
      id: nextMsgId(),
      type: 'replicate' as const,
      from: 'leader',
      to: f.id,
      key: k,
      value: v,
      version: newVersion,
      sentAt: now,
      deliverAt: now + delay,
      status: 'in-flight' as const,
      progress: 0,
    }));

    setMessages(prev => [...prev, ...newMessages]);

    // Immediately read from follower-1 (will get stale data)
    setTimeout(() => {
      const currentNodes2 = nodesRef.current;
      const f1 = currentNodes2.find(n => n.id === 'follower-1');
      if (!f1) return;

      const entry = f1.data.get(k);
      if (entry) {
        addEvent({
          type: 'read',
          nodeId: 'follower-1',
          description: `READ de follower-1: ${k}=${entry.value} (v${entry.version})`,
          severity: 'info',
        });
      } else {
        addEvent({
          type: 'read',
          nodeId: 'follower-1',
          description: `READ de follower-1: ${k}=(no existe aun)`,
          severity: 'info',
        });
      }

      const violationMsg = `READ-AFTER-WRITE: escribiste ${k}=${v} pero follower-1 todavia no lo tiene`;
      addEvent({ type: 'violation', nodeId: 'follower-1', description: violationMsg, severity: 'error' });
      setViolations(prev => [...prev, violationMsg]);
    }, 200);
  }, [started, addEvent]);

  const simulateMonotonicRead = useCallback(() => {
    if (!started) setStarted(true);

    const currentNodes = nodesRef.current;
    const f1 = currentNodes.find(n => n.id === 'follower-1');
    const f2 = currentNodes.find(n => n.id === 'follower-2');

    if (!f1 || !f2) return;

    // Find the max version on f1
    let f1MaxVersion = 0;
    let f1MaxKey = '';
    let f1MaxValue = '';
    for (const [k, entry] of f1.data) {
      if (entry.version > f1MaxVersion) {
        f1MaxVersion = entry.version;
        f1MaxKey = k;
        f1MaxValue = entry.value;
      }
    }

    // Find the max version on f2
    let f2MaxVersion = 0;
    let f2MaxKey = '';
    let f2MaxValue = '';
    for (const [k, entry] of f2.data) {
      if (entry.version > f2MaxVersion) {
        f2MaxVersion = entry.version;
        f2MaxKey = k;
        f2MaxValue = entry.value;
      }
    }

    if (f1MaxVersion === 0 && f2MaxVersion === 0) {
      addEvent({
        type: 'read',
        nodeId: 'system',
        description: 'No hay datos en los followers. Escribe algunos datos primero.',
        severity: 'warning',
      });
      return;
    }

    // Read from the one with higher version first
    const [first, second] = f1MaxVersion >= f2MaxVersion
      ? [{ id: 'follower-1', key: f1MaxKey, value: f1MaxValue, version: f1MaxVersion },
         { id: 'follower-2', key: f2MaxKey, value: f2MaxValue, version: f2MaxVersion }]
      : [{ id: 'follower-2', key: f2MaxKey, value: f2MaxValue, version: f2MaxVersion },
         { id: 'follower-1', key: f1MaxKey, value: f1MaxValue, version: f1MaxVersion }];

    addEvent({
      type: 'read',
      nodeId: first.id,
      description: `READ de ${first.id}: ${first.key}=${first.value} (v${first.version})`,
      severity: 'info',
    });

    setTimeout(() => {
      addEvent({
        type: 'read',
        nodeId: second.id,
        description: `READ de ${second.id}: ${second.key}=${second.value} (v${second.version})`,
        severity: 'info',
      });

      if (second.version < first.version) {
        const violationMsg = `MONOTONIC READ: leiste v${first.version} de ${first.id}, luego v${second.version} de ${second.id} — retrocediste en el tiempo`;
        addEvent({ type: 'violation', nodeId: second.id, description: violationMsg, severity: 'error' });
        setViolations(prev => [...prev, violationMsg]);
      } else {
        addEvent({
          type: 'read',
          nodeId: 'system',
          description: 'Ambos followers estan al dia — no hay violacion. Intenta con mas delay o partition.',
          severity: 'info',
        });
      }
    }, 500);
  }, [started, addEvent]);

  const simulateSplitBrain = useCallback(() => {
    if (!started) setStarted(true);

    // First, partition the network
    setIsPartitioned(true);
    setNodes(prev => {
      const next = cloneNodes(prev);
      const f2 = next.find(n => n.id === 'follower-2');
      if (f2) f2.status = 'partitioned';
      return next;
    });

    addEvent({
      type: 'partition',
      nodeId: 'network',
      description: 'PARTICION DE RED: follower-2 aislado',
      severity: 'warning',
    });

    // After a short delay, crash the leader
    setTimeout(() => {
      setNodes(prev => {
        const next = cloneNodes(prev);
        const leader = next.find(n => n.id === 'leader');
        if (leader) leader.status = 'crashed';
        return next;
      });

      addEvent({
        type: 'crash',
        nodeId: 'leader',
        description: 'Leader se cayo durante la particion',
        severity: 'warning',
      });

      // Both sides elect a leader
      setTimeout(() => {
        setNodes(prev => {
          const next = cloneNodes(prev);
          const f1 = next.find(n => n.id === 'follower-1');
          const f2 = next.find(n => n.id === 'follower-2');
          if (f1) f1.role = 'leader';
          if (f2) {
            f2.role = 'leader';
            f2.status = 'healthy';
          }
          return next;
        });

        addEvent({
          type: 'violation',
          nodeId: 'system',
          description: 'SPLIT BRAIN: follower-1 Y follower-2 se creen leader. Dos leaders aceptando escrituras!',
          severity: 'error',
        });

        setViolations(prev => [...prev, 'SPLIT BRAIN: dos nodos se creen leader simultaneamente']);

        // Write conflicting data to both
        setTimeout(() => {
          const newVersion1 = globalVersionRef.current + 1;
          const newVersion2 = globalVersionRef.current + 2;
          setGlobalVersion(newVersion2);

          setNodes(prev => {
            const next = cloneNodes(prev);
            const f1 = next.find(n => n.id === 'follower-1');
            const f2 = next.find(n => n.id === 'follower-2');
            if (f1) f1.data.set('status', { value: 'active', version: newVersion1 });
            if (f2) f2.data.set('status', { value: 'inactive', version: newVersion2 });
            return next;
          });

          addEvent({
            type: 'write',
            nodeId: 'follower-1',
            description: `WRITE status=active (v${newVersion1}) en follower-1 (como leader)`,
            severity: 'info',
          });

          addEvent({
            type: 'write',
            nodeId: 'follower-2',
            description: `WRITE status=inactive (v${newVersion2}) en follower-2 (como leader)`,
            severity: 'info',
          });

          addEvent({
            type: 'violation',
            nodeId: 'system',
            description: 'CONFLICTO: status=active en un lado, status=inactive en el otro. Los datos divergieron.',
            severity: 'error',
          });

          setViolations(prev => [...prev, 'Datos divergentes: status=active vs status=inactive']);
        }, 800);
      }, 1000);
    }, 800);
  }, [started, addEvent]);

  const resetSimulation = useCallback(() => {
    setNodes(createInitialNodes());
    setMessages([]);
    setEvents([]);
    setConfig(INITIAL_CONFIG);
    setIsPartitioned(false);
    setViolations([]);
    setGlobalVersion(0);
    setLastReadVersions(new Map());
    _autoWriteIndex = 0;
    _nextMsgId = 0;
    _nextEventId = 0;
  }, []);

  // ------------------------------------------------------------------
  // Actions object passed to LessonGuide
  // ------------------------------------------------------------------

  const actions = {
    startSimulation,
    writeToLeader,
    readFromNode,
    crashNode,
    recoverNode,
    partitionNetwork,
    healPartition,
    toggleMode,
    setReplicationDelay,
    simulateReadAfterWrite,
    simulateMonotonicRead,
    simulateSplitBrain,
    resetSimulation,
  };

  return (
    <PlaygroundLayout
      accentColor="#2d4a6a"
      disableTutor
      lessons={<LessonGuide actions={actions} config={config} isPartitioned={isPartitioned} />}
      rightPanel={<EventLog events={events} />}
    >
      <div className="h-full border-r border-j-border">
        <NodeDiagram
          nodes={nodes}
          messages={messages}
          config={config}
          onWrite={() => writeToLeader()}
          onReadFromNode={readFromNode}
          onCrashNode={crashNode}
          onRecoverNode={recoverNode}
          onPartition={partitionNetwork}
          onHeal={healPartition}
          onToggleMode={toggleMode}
          onDelayChange={setReplicationDelay}
          isPartitioned={isPartitioned}
          violations={violations}
        />
      </div>
    </PlaygroundLayout>
  );
}
