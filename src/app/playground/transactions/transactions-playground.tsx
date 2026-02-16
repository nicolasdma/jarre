'use client';

import { useState, useCallback } from 'react';
import { TabbedSidebar } from '@/components/playground/tabbed-sidebar';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IsolationLevel = 'read_committed' | 'snapshot' | 'serializable';
type Scenario = 'dirty_read' | 'read_skew' | 'lost_update' | 'write_skew';

interface Transaction {
  id: string;
  label: string;
  color: string;
  operations: Operation[];
  status: 'active' | 'committed' | 'aborted';
}

interface Operation {
  type: 'read' | 'write' | 'commit' | 'abort';
  target: string;
  value?: number;
  readValue?: number;
  blocked?: boolean;
  timestamp: number;
}

interface SimulationState {
  accounts: Record<string, number>;
  transactions: Transaction[];
  anomaly: string | null;
  step: number;
  maxSteps: number;
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

function buildScenario(scenario: Scenario, isolation: IsolationLevel): SimulationState {
  switch (scenario) {
    case 'dirty_read':
      return {
        accounts: { A: 500, B: 500 },
        transactions: [
          {
            id: 'T1', label: 'T1: Transferencia', color: '#991b1b',
            operations: [
              { type: 'write', target: 'A', value: 400, timestamp: 1 },
              { type: 'write', target: 'B', value: 600, timestamp: 3 },
              { type: 'commit', target: '', timestamp: 4 },
            ],
            status: 'active',
          },
          {
            id: 'T2', label: 'T2: Lectura', color: '#8b7355',
            operations: [
              { type: 'read', target: 'A', timestamp: 2 },
              { type: 'read', target: 'B', timestamp: 5 },
              { type: 'commit', target: '', timestamp: 6 },
            ],
            status: 'active',
          },
        ],
        anomaly: isolation === 'read_committed'
          ? null
          : null,
        step: 0,
        maxSteps: 6,
      };

    case 'read_skew':
      return {
        accounts: { A: 500, B: 500 },
        transactions: [
          {
            id: 'T1', label: 'T1: Transferencia', color: '#991b1b',
            operations: [
              { type: 'read', target: 'A', timestamp: 2 },
              { type: 'write', target: 'A', value: 400, timestamp: 3 },
              { type: 'write', target: 'B', value: 600, timestamp: 4 },
              { type: 'commit', target: '', timestamp: 5 },
            ],
            status: 'active',
          },
          {
            id: 'T2', label: 'T2: Alice lee saldo', color: '#8b7355',
            operations: [
              { type: 'read', target: 'A', timestamp: 1 },
              { type: 'read', target: 'B', timestamp: 6 },
              { type: 'commit', target: '', timestamp: 7 },
            ],
            status: 'active',
          },
        ],
        anomaly: null,
        step: 0,
        maxSteps: 7,
      };

    case 'lost_update':
      return {
        accounts: { counter: 42 },
        transactions: [
          {
            id: 'T1', label: 'T1: Incrementar', color: '#991b1b',
            operations: [
              { type: 'read', target: 'counter', timestamp: 1 },
              { type: 'write', target: 'counter', value: 43, timestamp: 3 },
              { type: 'commit', target: '', timestamp: 4 },
            ],
            status: 'active',
          },
          {
            id: 'T2', label: 'T2: Incrementar', color: '#8b7355',
            operations: [
              { type: 'read', target: 'counter', timestamp: 2 },
              { type: 'write', target: 'counter', value: 43, timestamp: 5 },
              { type: 'commit', target: '', timestamp: 6 },
            ],
            status: 'active',
          },
        ],
        anomaly: null,
        step: 0,
        maxSteps: 6,
      };

    case 'write_skew':
      return {
        accounts: { alice_oncall: 1, bob_oncall: 1, total_oncall: 2 },
        transactions: [
          {
            id: 'T1', label: 'T1: Alice se retira', color: '#991b1b',
            operations: [
              { type: 'read', target: 'total_oncall', timestamp: 1 },
              { type: 'write', target: 'alice_oncall', value: 0, timestamp: 3 },
              { type: 'commit', target: '', timestamp: 5 },
            ],
            status: 'active',
          },
          {
            id: 'T2', label: 'T2: Bob se retira', color: '#8b7355',
            operations: [
              { type: 'read', target: 'total_oncall', timestamp: 2 },
              { type: 'write', target: 'bob_oncall', value: 0, timestamp: 4 },
              { type: 'commit', target: '', timestamp: 6 },
            ],
            status: 'active',
          },
        ],
        anomaly: null,
        step: 0,
        maxSteps: 6,
      };
  }
}

function getAnomalyResult(scenario: Scenario, isolation: IsolationLevel): string | null {
  switch (scenario) {
    case 'dirty_read':
      return isolation === 'read_committed'
        ? null
        : null; // Read committed prevents dirty reads
    case 'read_skew':
      if (isolation === 'read_committed') return 'Alice ve A=$500 (antes) y B=$600 (despues). Total: $1100. Read skew!';
      return null; // Snapshot and serializable prevent it
    case 'lost_update':
      if (isolation === 'read_committed' || isolation === 'snapshot')
        return 'Ambos leyeron 42 y escribieron 43. El contador deberia ser 44. Lost update!';
      return null; // Serializable prevents it
    case 'write_skew':
      if (isolation !== 'serializable')
        return '0 doctores de guardia. Ambos verificaron "hay 2", ambos se fueron. Write skew!';
      return 'SSI detecta el conflicto y aborta una transaccion. El invariante se preserva.';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TransactionsPlayground() {
  const [scenario, setScenario] = useState<Scenario>('read_skew');
  const [isolation, setIsolation] = useState<IsolationLevel>('read_committed');
  const [state, setState] = useState(() => buildScenario('read_skew', 'read_committed'));
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(() => {
    const newState = buildScenario(scenario, isolation);
    setState(newState);
    setIsRunning(true);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step > newState.maxSteps) {
        clearInterval(interval);
        setIsRunning(false);
        setState((s) => ({ ...s, anomaly: getAnomalyResult(scenario, isolation), step: newState.maxSteps }));
        return;
      }
      setState((s) => ({ ...s, step }));
    }, 800);
  }, [scenario, isolation]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setState(buildScenario(scenario, isolation));
  }, [scenario, isolation]);

  const scenarios: { id: Scenario; label: string; desc: string }[] = [
    { id: 'dirty_read', label: 'Dirty Read', desc: 'Leer datos no commiteados' },
    { id: 'read_skew', label: 'Read Skew', desc: 'Leer datos de diferentes momentos' },
    { id: 'lost_update', label: 'Lost Update', desc: 'Sobrescribir cambios concurrentes' },
    { id: 'write_skew', label: 'Write Skew', desc: 'Violar invariante con escrituras a objetos distintos' },
  ];

  const isolationLevels: { id: IsolationLevel; label: string }[] = [
    { id: 'read_committed', label: 'Read Committed' },
    { id: 'snapshot', label: 'Snapshot Isolation' },
    { id: 'serializable', label: 'Serializable (SSI)' },
  ];

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Scenario selector */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
              Anomalia
            </p>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setScenario(s.id); setState(buildScenario(s.id, isolation)); }}
                  disabled={isRunning}
                  className={`p-3 border text-left transition-colors ${
                    scenario === s.id
                      ? 'border-[#991b1b] bg-[#991b1b]/5'
                      : 'border-j-border hover:border-j-text/30'
                  } disabled:opacity-50`}
                >
                  <p className="font-mono text-xs text-j-text">{s.label}</p>
                  <p className="text-[10px] text-j-text-tertiary">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Isolation level selector */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
              Nivel de aislamiento
            </p>
            <div className="flex gap-2">
              {isolationLevels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setIsolation(l.id); setState(buildScenario(scenario, l.id)); }}
                  disabled={isRunning}
                  className={`flex-1 py-2 border font-mono text-[11px] tracking-wider transition-colors ${
                    isolation === l.id
                      ? 'border-[#991b1b] bg-[#991b1b] text-white'
                      : 'border-j-border text-j-text-tertiary hover:text-j-text'
                  } disabled:opacity-50`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline visualization */}
          <div className="border border-j-border p-6">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
              Timeline de ejecucion
            </p>

            {/* Accounts state */}
            <div className="flex gap-4 mb-6">
              {Object.entries(state.accounts).map(([key, val]) => (
                <div key={key} className="px-3 py-2 bg-white/50 border border-j-border">
                  <p className="font-mono text-[10px] text-j-text-tertiary uppercase">{key}</p>
                  <p className="font-mono text-lg text-j-text">{val}</p>
                </div>
              ))}
            </div>

            {/* Transaction timelines */}
            <div className="space-y-4">
              {state.transactions.map((tx) => (
                <div key={tx.id}>
                  <p className="font-mono text-[11px] mb-2" style={{ color: tx.color }}>
                    {tx.label}
                  </p>
                  <div className="flex gap-1">
                    {tx.operations.map((op, i) => {
                      const isActive = state.step >= op.timestamp;
                      return (
                        <div
                          key={i}
                          className={`flex-1 py-2 px-2 border text-center transition-all duration-300 ${
                            isActive
                              ? 'border-current opacity-100'
                              : 'border-j-border opacity-30'
                          }`}
                          style={{ borderColor: isActive ? tx.color : undefined }}
                        >
                          <p className="font-mono text-[10px]" style={{ color: isActive ? tx.color : undefined }}>
                            {op.type === 'read' && `READ ${op.target}`}
                            {op.type === 'write' && `WRITE ${op.target}=${op.value}`}
                            {op.type === 'commit' && 'COMMIT'}
                            {op.type === 'abort' && 'ABORT'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Result */}
            {state.anomaly && (
              <div className={`mt-6 p-4 border-l-2 ${
                state.anomaly.includes('!') ? 'border-[#991b1b] bg-[#991b1b]/5' : 'border-green-700 bg-green-700/5'
              }`}>
                <p className={`text-sm ${state.anomaly.includes('!') ? 'text-[#991b1b]' : 'text-green-700'}`}>
                  {state.anomaly}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex-1 py-3 bg-[#991b1b] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#7f1d1d] transition-colors disabled:opacity-50"
            >
              {isRunning ? 'Ejecutando...' : 'Ejecutar escenario'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-j-border font-mono text-[11px] tracking-wider uppercase text-j-text-tertiary hover:text-j-text transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <TabbedSidebar
        accentColor="#991b1b"
        disableTutor
        lessons={
          <LessonGuide
            onRunScenario={handleRun}
            onSetScenario={(s: Scenario) => { setScenario(s); setState(buildScenario(s, isolation)); }}
            onSetIsolation={(l: IsolationLevel) => { setIsolation(l); setState(buildScenario(scenario, l)); }}
            onReset={handleReset}
          />
        }
      />
    </div>
  );
}
