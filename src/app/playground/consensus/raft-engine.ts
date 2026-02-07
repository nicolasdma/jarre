// raft-engine.ts — Pure TypeScript Raft consensus implementation
// NO React, NO DOM. Just logic.

export interface RaftNode {
  id: string;
  state: 'follower' | 'candidate' | 'leader';
  currentTerm: number;
  votedFor: string | null;
  log: LogEntry[];
  commitIndex: number;
  lastApplied: number;
  electionTimeout: number;
  electionTimer: number;
  status: 'alive' | 'dead';
  nextIndex: Record<string, number>;
  matchIndex: Record<string, number>;
  votesReceived: Set<string>;
}

export interface LogEntry {
  term: number;
  command: string;
  index: number;
}

export type RaftMessage =
  | {
      type: 'RequestVote';
      from: string;
      to: string;
      term: number;
      candidateId: string;
      lastLogIndex: number;
      lastLogTerm: number;
    }
  | {
      type: 'RequestVoteResponse';
      from: string;
      to: string;
      term: number;
      voteGranted: boolean;
    }
  | {
      type: 'AppendEntries';
      from: string;
      to: string;
      term: number;
      leaderId: string;
      prevLogIndex: number;
      prevLogTerm: number;
      entries: LogEntry[];
      leaderCommit: number;
    }
  | {
      type: 'AppendEntriesResponse';
      from: string;
      to: string;
      term: number;
      success: boolean;
      matchIndex: number;
    };

export interface InFlightMessage {
  message: RaftMessage;
  deliverAt: number;
  progress: number;
  id: string;
}

export interface RaftEvent {
  tick: number;
  nodeId: string;
  type:
    | 'election_start'
    | 'vote_granted'
    | 'vote_rejected'
    | 'elected_leader'
    | 'heartbeat_sent'
    | 'entry_appended'
    | 'entry_committed'
    | 'node_killed'
    | 'node_recovered'
    | 'term_updated'
    | 'step_down'
    | 'partition_created'
    | 'partition_healed';
  description: string;
}

export interface Partition {
  group1: string[];
  group2: string[];
}

let messageCounter = 0;

function nextMessageId(): string {
  return `msg-${messageCounter++}`;
}

export class RaftCluster {
  nodes: RaftNode[];
  messages: InFlightMessage[];
  events: RaftEvent[];
  tick: number;
  partition: Partition | null;

  private static MESSAGE_DELAY = 2;
  private static ELECTION_TIMEOUT_MIN = 8;
  private static ELECTION_TIMEOUT_MAX = 15;
  private static HEARTBEAT_INTERVAL = 3;

  constructor() {
    this.nodes = [];
    this.messages = [];
    this.events = [];
    this.tick = 0;
    this.partition = null;
    this.initialize();
  }

  initialize(): void {
    messageCounter = 0;
    this.nodes = Array.from({ length: 5 }, (_, i) => {
      const timeout = this.randomElectionTimeout();
      return {
        id: `node-${i}`,
        state: 'follower' as const,
        currentTerm: 0,
        votedFor: null,
        log: [],
        commitIndex: -1,
        lastApplied: -1,
        electionTimeout: timeout,
        electionTimer: timeout,
        status: 'alive' as const,
        nextIndex: {},
        matchIndex: {},
        votesReceived: new Set<string>(),
      };
    });
    this.messages = [];
    this.events = [];
    this.tick = 0;
    this.partition = null;
  }

  private randomElectionTimeout(): number {
    return (
      RaftCluster.ELECTION_TIMEOUT_MIN +
      Math.floor(
        Math.random() *
          (RaftCluster.ELECTION_TIMEOUT_MAX - RaftCluster.ELECTION_TIMEOUT_MIN)
      )
    );
  }

  private otherNodeIds(nodeId: string): string[] {
    return this.nodes.filter((n) => n.id !== nodeId).map((n) => n.id);
  }

  private getNode(id: string): RaftNode | undefined {
    return this.nodes.find((n) => n.id === id);
  }

  private lastLogIndex(node: RaftNode): number {
    return node.log.length - 1;
  }

  private lastLogTerm(node: RaftNode): number {
    if (node.log.length === 0) return 0;
    return node.log[node.log.length - 1].term;
  }

  private majorityCount(): number {
    return Math.floor(this.nodes.length / 2) + 1;
  }

  canCommunicate(from: string, to: string): boolean {
    if (!this.partition) return true;
    const { group1, group2 } = this.partition;
    if (group1.includes(from) && group1.includes(to)) return true;
    if (group2.includes(from) && group2.includes(to)) return true;
    return false;
  }

  private sendMessage(msg: RaftMessage): void {
    this.messages.push({
      message: msg,
      deliverAt: this.tick + RaftCluster.MESSAGE_DELAY,
      progress: 0,
      id: nextMessageId(),
    });
  }

  private stepDownToFollower(
    node: RaftNode,
    newTerm: number,
    events: RaftEvent[]
  ): void {
    const oldState = node.state;
    node.currentTerm = newTerm;
    node.state = 'follower';
    node.votedFor = null;
    node.votesReceived = new Set();
    node.electionTimer = this.randomElectionTimeout();
    if (oldState !== 'follower') {
      events.push({
        tick: this.tick,
        nodeId: node.id,
        type: 'step_down',
        description: `${node.id} paso a follower (term ${newTerm})`,
      });
    }
    events.push({
      tick: this.tick,
      nodeId: node.id,
      type: 'term_updated',
      description: `${node.id} actualizo term a ${newTerm}`,
    });
  }

  // ------- Election -------

  private startElection(node: RaftNode): RaftEvent[] {
    const events: RaftEvent[] = [];

    node.currentTerm++;
    node.state = 'candidate';
    node.votedFor = node.id;
    node.votesReceived = new Set([node.id]);
    node.electionTimer = this.randomElectionTimeout();

    events.push({
      tick: this.tick,
      nodeId: node.id,
      type: 'election_start',
      description: `${node.id} inicio eleccion (term ${node.currentTerm})`,
    });

    const others = this.otherNodeIds(node.id);
    for (const otherId of others) {
      this.sendMessage({
        type: 'RequestVote',
        from: node.id,
        to: otherId,
        term: node.currentTerm,
        candidateId: node.id,
        lastLogIndex: this.lastLogIndex(node),
        lastLogTerm: this.lastLogTerm(node),
      });
    }

    return events;
  }

  // ------- Heartbeats -------

  private sendHeartbeats(leader: RaftNode): RaftEvent[] {
    const events: RaftEvent[] = [];
    const others = this.otherNodeIds(leader.id);

    for (const otherId of others) {
      const nextIdx = leader.nextIndex[otherId] ?? leader.log.length;
      const prevLogIndex = nextIdx - 1;
      const prevLogTerm =
        prevLogIndex >= 0 && prevLogIndex < leader.log.length
          ? leader.log[prevLogIndex].term
          : 0;
      const entries = leader.log.slice(nextIdx);

      this.sendMessage({
        type: 'AppendEntries',
        from: leader.id,
        to: otherId,
        term: leader.currentTerm,
        leaderId: leader.id,
        prevLogIndex,
        prevLogTerm,
        entries,
        leaderCommit: leader.commitIndex,
      });
    }

    events.push({
      tick: this.tick,
      nodeId: leader.id,
      type: 'heartbeat_sent',
      description: `${leader.id} envio heartbeat (term ${leader.currentTerm})`,
    });

    return events;
  }

  // ------- Message handlers -------

  private handleMessage(node: RaftNode, msg: RaftMessage): RaftEvent[] {
    switch (msg.type) {
      case 'RequestVote':
        return this.handleRequestVote(node, msg);
      case 'RequestVoteResponse':
        return this.handleRequestVoteResponse(node, msg);
      case 'AppendEntries':
        return this.handleAppendEntries(node, msg);
      case 'AppendEntriesResponse':
        return this.handleAppendEntriesResponse(node, msg);
    }
  }

  private handleRequestVote(
    node: RaftNode,
    msg: Extract<RaftMessage, { type: 'RequestVote' }>
  ): RaftEvent[] {
    const events: RaftEvent[] = [];

    // If the candidate's term is higher, step down
    if (msg.term > node.currentTerm) {
      this.stepDownToFollower(node, msg.term, events);
    }

    // Reject if candidate's term is stale
    if (msg.term < node.currentTerm) {
      this.sendMessage({
        type: 'RequestVoteResponse',
        from: node.id,
        to: msg.from,
        term: node.currentTerm,
        voteGranted: false,
      });
      events.push({
        tick: this.tick,
        nodeId: node.id,
        type: 'vote_rejected',
        description: `${node.id} rechazo voto para ${msg.candidateId} (term viejo)`,
      });
      return events;
    }

    // Check if we can grant the vote
    const canVote =
      node.votedFor === null || node.votedFor === msg.candidateId;

    // Check log is at least as up-to-date as ours
    const candidateLogOk = this.isLogUpToDate(
      msg.lastLogIndex,
      msg.lastLogTerm,
      node
    );

    if (canVote && candidateLogOk) {
      node.votedFor = msg.candidateId;
      node.electionTimer = this.randomElectionTimeout();
      this.sendMessage({
        type: 'RequestVoteResponse',
        from: node.id,
        to: msg.from,
        term: node.currentTerm,
        voteGranted: true,
      });
      events.push({
        tick: this.tick,
        nodeId: node.id,
        type: 'vote_granted',
        description: `${node.id} voto por ${msg.candidateId} (term ${node.currentTerm})`,
      });
    } else {
      this.sendMessage({
        type: 'RequestVoteResponse',
        from: node.id,
        to: msg.from,
        term: node.currentTerm,
        voteGranted: false,
      });
      events.push({
        tick: this.tick,
        nodeId: node.id,
        type: 'vote_rejected',
        description: `${node.id} rechazo voto para ${msg.candidateId} (${
          !canVote ? 'ya voto' : 'log no actualizado'
        })`,
      });
    }

    return events;
  }

  /**
   * Raft log up-to-date check:
   * The candidate's log is at least as up-to-date if:
   *   - candidate's last log term > our last log term, OR
   *   - same last log term AND candidate's last log index >= our last log index
   */
  private isLogUpToDate(
    candidateLastLogIndex: number,
    candidateLastLogTerm: number,
    node: RaftNode
  ): boolean {
    const myLastTerm = this.lastLogTerm(node);
    const myLastIndex = this.lastLogIndex(node);
    if (candidateLastLogTerm !== myLastTerm) {
      return candidateLastLogTerm > myLastTerm;
    }
    return candidateLastLogIndex >= myLastIndex;
  }

  private handleRequestVoteResponse(
    node: RaftNode,
    msg: Extract<RaftMessage, { type: 'RequestVoteResponse' }>
  ): RaftEvent[] {
    const events: RaftEvent[] = [];

    if (msg.term > node.currentTerm) {
      this.stepDownToFollower(node, msg.term, events);
      return events;
    }

    // Ignore if we're no longer a candidate or term doesn't match
    if (node.state !== 'candidate' || msg.term !== node.currentTerm) {
      return events;
    }

    if (msg.voteGranted) {
      node.votesReceived.add(msg.from);

      // Check if we have majority
      if (node.votesReceived.size >= this.majorityCount()) {
        this.becomeLeader(node, events);
      }
    }

    return events;
  }

  private becomeLeader(node: RaftNode, events: RaftEvent[]): void {
    node.state = 'leader';
    node.votesReceived = new Set();

    // Initialize nextIndex and matchIndex for all followers
    const lastIdx = node.log.length;
    for (const other of this.otherNodeIds(node.id)) {
      node.nextIndex[other] = lastIdx;
      node.matchIndex[other] = -1;
    }

    // Reset heartbeat timer to send immediately
    node.electionTimer = 1;

    events.push({
      tick: this.tick,
      nodeId: node.id,
      type: 'elected_leader',
      description: `${node.id} es el nuevo LEADER (term ${node.currentTerm})`,
    });
  }

  private handleAppendEntries(
    node: RaftNode,
    msg: Extract<RaftMessage, { type: 'AppendEntries' }>
  ): RaftEvent[] {
    const events: RaftEvent[] = [];

    // If leader's term is higher, update
    if (msg.term > node.currentTerm) {
      this.stepDownToFollower(node, msg.term, events);
    }

    // Reject if term is stale
    if (msg.term < node.currentTerm) {
      this.sendMessage({
        type: 'AppendEntriesResponse',
        from: node.id,
        to: msg.from,
        term: node.currentTerm,
        success: false,
        matchIndex: -1,
      });
      return events;
    }

    // Valid AppendEntries from current leader — reset election timer
    // Also convert candidate back to follower if we see a valid leader
    if (node.state === 'candidate') {
      node.state = 'follower';
      node.votedFor = null;
      node.votesReceived = new Set();
      events.push({
        tick: this.tick,
        nodeId: node.id,
        type: 'step_down',
        description: `${node.id} volvio a follower (leader ${msg.leaderId} activo)`,
      });
    }
    node.electionTimer = this.randomElectionTimeout();

    // Check if our log matches at prevLogIndex
    if (msg.prevLogIndex >= 0) {
      if (msg.prevLogIndex >= node.log.length) {
        // We don't have the entry at prevLogIndex
        this.sendMessage({
          type: 'AppendEntriesResponse',
          from: node.id,
          to: msg.from,
          term: node.currentTerm,
          success: false,
          matchIndex: node.log.length - 1,
        });
        return events;
      }
      if (node.log[msg.prevLogIndex].term !== msg.prevLogTerm) {
        // Term mismatch — delete this entry and everything after
        node.log = node.log.slice(0, msg.prevLogIndex);
        this.sendMessage({
          type: 'AppendEntriesResponse',
          from: node.id,
          to: msg.from,
          term: node.currentTerm,
          success: false,
          matchIndex: node.log.length - 1,
        });
        return events;
      }
    }

    // Append new entries (avoiding duplicates)
    for (const entry of msg.entries) {
      if (entry.index < node.log.length) {
        // Entry already exists — check for conflict
        if (node.log[entry.index].term !== entry.term) {
          // Conflict: delete this entry and all that follow
          node.log = node.log.slice(0, entry.index);
          node.log.push({ ...entry });
        }
        // If terms match, entry is already there, skip
      } else {
        node.log.push({ ...entry });
        events.push({
          tick: this.tick,
          nodeId: node.id,
          type: 'entry_appended',
          description: `${node.id} agrego entry [${entry.index}] "${entry.command}" (term ${entry.term})`,
        });
      }
    }

    // Update commitIndex
    if (msg.leaderCommit > node.commitIndex) {
      const oldCommit = node.commitIndex;
      node.commitIndex = Math.min(msg.leaderCommit, node.log.length - 1);
      if (node.commitIndex > oldCommit) {
        events.push({
          tick: this.tick,
          nodeId: node.id,
          type: 'entry_committed',
          description: `${node.id} commiteo hasta index ${node.commitIndex}`,
        });
      }
    }

    // Apply committed entries
    while (node.lastApplied < node.commitIndex) {
      node.lastApplied++;
    }

    this.sendMessage({
      type: 'AppendEntriesResponse',
      from: node.id,
      to: msg.from,
      term: node.currentTerm,
      success: true,
      matchIndex: node.log.length - 1,
    });

    return events;
  }

  private handleAppendEntriesResponse(
    node: RaftNode,
    msg: Extract<RaftMessage, { type: 'AppendEntriesResponse' }>
  ): RaftEvent[] {
    const events: RaftEvent[] = [];

    if (msg.term > node.currentTerm) {
      this.stepDownToFollower(node, msg.term, events);
      return events;
    }

    if (node.state !== 'leader' || msg.term !== node.currentTerm) {
      return events;
    }

    if (msg.success) {
      // Update nextIndex and matchIndex for the follower
      node.nextIndex[msg.from] = msg.matchIndex + 1;
      node.matchIndex[msg.from] = msg.matchIndex;

      // Try to advance commitIndex
      const commitEvents = this.advanceCommitIndex(node);
      events.push(...commitEvents);
    } else {
      // Decrement nextIndex and retry
      const current = node.nextIndex[msg.from] ?? 1;
      node.nextIndex[msg.from] = Math.max(0, current - 1);
    }

    return events;
  }

  private advanceCommitIndex(leader: RaftNode): RaftEvent[] {
    const events: RaftEvent[] = [];

    // For each index N > commitIndex, check if a majority of matchIndex[i] >= N
    // and log[N].term == currentTerm
    for (let n = leader.log.length - 1; n > leader.commitIndex; n--) {
      if (leader.log[n].term !== leader.currentTerm) {
        // Raft only commits entries from the current term
        continue;
      }

      // Count how many nodes have this entry (including the leader)
      let replicatedCount = 1; // leader has it
      for (const otherId of this.otherNodeIds(leader.id)) {
        if ((leader.matchIndex[otherId] ?? -1) >= n) {
          replicatedCount++;
        }
      }

      if (replicatedCount >= this.majorityCount()) {
        leader.commitIndex = n;
        while (leader.lastApplied < leader.commitIndex) {
          leader.lastApplied++;
        }
        events.push({
          tick: this.tick,
          nodeId: leader.id,
          type: 'entry_committed',
          description: `${leader.id} commiteo entry [${n}] (mayoria alcanzada)`,
        });
        break; // Commit this and all prior entries
      }
    }

    return events;
  }

  // ------- Public API -------

  step(): RaftEvent[] {
    const tickEvents: RaftEvent[] = [];
    this.tick++;

    // 1. Deliver messages that have arrived
    const delivered: InFlightMessage[] = [];
    const pending: InFlightMessage[] = [];

    for (const msg of this.messages) {
      const sentAt = msg.deliverAt - RaftCluster.MESSAGE_DELAY;
      const elapsed = this.tick - sentAt;
      msg.progress = Math.min(1, elapsed / RaftCluster.MESSAGE_DELAY);

      if (this.tick >= msg.deliverAt) {
        delivered.push(msg);
      } else {
        pending.push(msg);
      }
    }
    this.messages = pending;

    // Process delivered messages
    for (const { message } of delivered) {
      const targetNode = this.getNode(message.to);
      if (!targetNode || targetNode.status === 'dead') continue;
      if (!this.canCommunicate(message.from, message.to)) continue;

      const events = this.handleMessage(targetNode, message);
      tickEvents.push(...events);
    }

    // 2. Process each alive node's timer
    for (const node of this.nodes) {
      if (node.status === 'dead') continue;

      if (node.state === 'leader') {
        node.electionTimer--;
        if (node.electionTimer <= 0) {
          node.electionTimer = RaftCluster.HEARTBEAT_INTERVAL;
          const hbEvents = this.sendHeartbeats(node);
          tickEvents.push(...hbEvents);
        }
      } else {
        node.electionTimer--;
        if (node.electionTimer <= 0) {
          const elEvents = this.startElection(node);
          tickEvents.push(...elEvents);
        }
      }
    }

    this.events.push(...tickEvents);
    return tickEvents;
  }

  clientWrite(command: string): RaftEvent[] {
    const events: RaftEvent[] = [];
    const leader = this.nodes.find(
      (n) => n.state === 'leader' && n.status === 'alive'
    );

    if (!leader) {
      events.push({
        tick: this.tick,
        nodeId: '',
        type: 'entry_appended',
        description: `No hay leader activo. No se puede escribir "${command}".`,
      });
      this.events.push(...events);
      return events;
    }

    const entry: LogEntry = {
      term: leader.currentTerm,
      command,
      index: leader.log.length,
    };

    leader.log.push(entry);

    // Update matchIndex for self
    leader.matchIndex[leader.id] = leader.log.length - 1;

    events.push({
      tick: this.tick,
      nodeId: leader.id,
      type: 'entry_appended',
      description: `${leader.id} agrego entry [${entry.index}] "${command}" (term ${entry.term})`,
    });

    this.events.push(...events);
    return events;
  }

  killNode(id: string): RaftEvent[] {
    const events: RaftEvent[] = [];
    const node = this.getNode(id);
    if (!node || node.status === 'dead') return events;

    node.status = 'dead';
    node.state = 'follower';
    node.votesReceived = new Set();

    // Remove all in-flight messages from/to this node
    this.messages = this.messages.filter(
      (m) => m.message.from !== id && m.message.to !== id
    );

    events.push({
      tick: this.tick,
      nodeId: id,
      type: 'node_killed',
      description: `${id} fue eliminado`,
    });

    this.events.push(...events);
    return events;
  }

  recoverNode(id: string): RaftEvent[] {
    const events: RaftEvent[] = [];
    const node = this.getNode(id);
    if (!node || node.status === 'alive') return events;

    node.status = 'alive';
    node.state = 'follower';
    node.votedFor = null;
    node.votesReceived = new Set();
    node.electionTimer = this.randomElectionTimeout();

    events.push({
      tick: this.tick,
      nodeId: id,
      type: 'node_recovered',
      description: `${id} se recupero como follower`,
    });

    this.events.push(...events);
    return events;
  }

  createPartition(): RaftEvent[] {
    const events: RaftEvent[] = [];

    // Find the leader to try to put it in minority for more drama
    const leader = this.nodes.find(
      (n) => n.state === 'leader' && n.status === 'alive'
    );
    const aliveNodes = this.nodes.filter((n) => n.status === 'alive');

    if (aliveNodes.length < 3) {
      return events;
    }

    let group1: string[];
    let group2: string[];

    if (leader) {
      // Put leader in minority (2 nodes) for interesting behavior
      const othersAlive = aliveNodes.filter((n) => n.id !== leader.id);
      // Pick 1 random other to go with the leader into minority
      const shuffled = othersAlive.sort(() => Math.random() - 0.5);
      group2 = [leader.id, shuffled[0].id];
      group1 = shuffled.slice(1).map((n) => n.id);
    } else {
      // Random split: 3 and 2
      const shuffled = aliveNodes.sort(() => Math.random() - 0.5);
      group1 = shuffled.slice(0, 3).map((n) => n.id);
      group2 = shuffled.slice(3).map((n) => n.id);
    }

    this.partition = { group1, group2 };

    // Drop in-flight messages that cross partition
    this.messages = this.messages.filter((m) =>
      this.canCommunicate(m.message.from, m.message.to)
    );

    events.push({
      tick: this.tick,
      nodeId: '',
      type: 'partition_created',
      description: `Particion: [${group1.join(', ')}] | [${group2.join(', ')}]`,
    });

    this.events.push(...events);
    return events;
  }

  healPartition(): RaftEvent[] {
    const events: RaftEvent[] = [];

    if (!this.partition) return events;

    this.partition = null;

    events.push({
      tick: this.tick,
      nodeId: '',
      type: 'partition_healed',
      description: 'Particion curada. Todos los nodos pueden comunicarse.',
    });

    this.events.push(...events);
    return events;
  }

  getLeader(): string | null {
    const leader = this.nodes.find(
      (n) => n.state === 'leader' && n.status === 'alive'
    );
    return leader?.id ?? null;
  }

  /** Create a deep-copy snapshot for React state (strips Set to array for serialization) */
  snapshot(): RaftClusterSnapshot {
    return {
      nodes: this.nodes.map((n) => ({
        ...n,
        log: n.log.map((e) => ({ ...e })),
        nextIndex: { ...n.nextIndex },
        matchIndex: { ...n.matchIndex },
        votesReceived: Array.from(n.votesReceived),
      })),
      messages: this.messages.map((m) => ({
        ...m,
        message: { ...m.message } as RaftMessage,
      })),
      events: [...this.events],
      tick: this.tick,
      partition: this.partition
        ? { group1: [...this.partition.group1], group2: [...this.partition.group2] }
        : null,
    };
  }
}

export interface RaftNodeSnapshot
  extends Omit<RaftNode, 'votesReceived'> {
  votesReceived: string[];
}

export interface RaftClusterSnapshot {
  nodes: RaftNodeSnapshot[];
  messages: InFlightMessage[];
  events: RaftEvent[];
  tick: number;
  partition: Partition | null;
}
