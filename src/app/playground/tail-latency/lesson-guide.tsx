'use client';

import { LessonGuideShell, type LessonStep } from '@/components/playground/lesson-guide-shell';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TailLatencyStep extends LessonStep {
  action: string;
}

export interface LessonGuideProps {
  onRunBatch: () => void;
  onSetFanout: (k: number) => void;
  onToggleHedging: () => void;
  onToggleTied: () => void;
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STEPS: TailLatencyStep[] = [
  {
    title: '1. La cola que muerde: tail latency',
    theory: `En un sistema con muchos servidores, la latencia de cada request individual sigue una distribucion: la mayoria responde rapido (p50), pero algunos tardan mucho mas (p99, p999). Estos "outliers" no son bugs — son inherentes: garbage collection, page faults, background tasks, contention por CPU/disco. Google encontro que incluso en servidores bien optimizados, el p99 puede ser 10x el p50. El paper "The Tail at Scale" (Dean & Barroso, 2013) explora por que esto importa y como mitigarlo.`,
    action: 'Ejecutar batch de requests',
    observe:
      'Observa el histograma: la mayoria de requests se agrupan a la izquierda (rapidos), pero hay una cola larga hacia la derecha. Nota la diferencia entre p50 y p99.',
  },
  {
    title: '2. Fan-out amplifica la cola',
    theory: `Cuando un request del usuario toca MULTIPLES servidores en paralelo (fan-out), la latencia total es el MAXIMO de las latencias individuales. Si cada servidor tiene 1% de probabilidad de ser lento, con fan-out a 100 servidores, la probabilidad de que AL MENOS UNO sea lento es: 1 - (0.99)^100 = 63%. Con fan-out a 1000: 99.99%. Esto significa que el p99 de un servidor individual se convierte en el p50 del sistema completo. Este es el insight central del paper.`,
    action: 'Aumentar fan-out a 10',
    observe:
      'Al aumentar el fan-out, la distribucion de latencia total se desplaza hacia la derecha. El p50 del sistema se acerca al p99 individual. Compara los percentiles antes y despues.',
  },
  {
    title: '3. Hedged requests: apostar doble',
    theory: `La solucion mas elegante del paper: enviar el request a DOS servidores, y usar la primera respuesta que llegue. Si el primer servidor es un outlier lento, el segundo probablemente responde rapido. El costo es ~5% mas de carga (porque cancelas el duplicado cuando llega la primera respuesta). Google reporto que hedged requests redujeron el p99 de 1800ms a 74ms en BigTable. La clave: solo enviar el hedge despues de un timeout (ej: si no responde en el p95 individual), no inmediatamente.`,
    action: 'Activar hedged requests',
    observe:
      'Con hedging activado, los spikes extremos desaparecen. El p99 baja dramaticamente. Observa como los requests "hedged" (naranja) rescatan a los lentos.',
  },
  {
    title: '4. Tied requests: coordinacion inteligente',
    theory: `Una mejora sobre hedged requests: enviar el request a DOS servidores inmediatamente, pero incluyendo la identidad del otro servidor. Cuando uno empieza a procesarlo, le dice al otro "ya lo tengo, cancelalo". Esto es mas eficiente que hedged requests porque: (1) no esperas un timeout para enviar el segundo, (2) el servidor que no procesa libera recursos inmediatamente. Google llama a esto "tied requests" porque las dos copias estan "atadas" entre si.`,
    action: 'Activar tied requests',
    observe:
      'Similar a hedging pero mas eficiente. Nota que los requests redundantes se cancelan mas rapido, reduciendo el trabajo desperdiciado.',
  },
  {
    title: '5. El tradeoff fundamental',
    theory: `Las tecnicas del paper son un tradeoff clasico: recursos extra vs latencia predecible. Hedged requests usan ~5% mas CPU/red. Tied requests usan ~2% mas. Pero la reduccion en tail latency es dramatica. En sistemas donde la experiencia del usuario depende del percentil mas lento (porque TODOS los shards deben responder), este tradeoff es casi siempre favorable. La leccion mas profunda: en sistemas a escala, la variabilidad importa tanto como la media. Optimizar para el caso comun no basta — hay que domesticar la cola.`,
    action: 'Experimentar libremente',
    observe:
      'Juega con todos los parametros. Intenta: (1) fan-out alto sin hedging, (2) fan-out alto con hedging, (3) compara tied vs hedged. Mira como cambian los percentiles.',
  },
];

const LESSON_ACTIONS: Record<
  number,
  (props: LessonGuideProps) => { label: string; handler: () => void }
> = {
  0: (p) => ({ label: 'Ejecutar batch', handler: p.onRunBatch }),
  1: (p) => ({ label: 'Fan-out = 10', handler: () => p.onSetFanout(10) }),
  2: (p) => ({ label: 'Activar hedging', handler: p.onToggleHedging }),
  3: (p) => ({ label: 'Activar tied requests', handler: p.onToggleTied }),
  4: (p) => ({ label: 'Reset', handler: p.onReset }),
};

const ACCENT = '#b45309';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonGuide(props: LessonGuideProps) {
  return (
    <LessonGuideShell
      steps={STEPS}
      colors={{ accent: ACCENT, visited: '#fde68a', calloutBg: '#fffbeb' }}
      renderAction={(stepIndex) => {
        const action = LESSON_ACTIONS[stepIndex]?.(props);
        if (!action) return null;
        return (
          <div className="mb-5">
            <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
              Accion
            </p>
            <button
              onClick={action.handler}
              className="w-full text-left px-4 py-2.5 text-white font-mono text-[12px] tracking-wider transition-colors rounded"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#92400e')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = ACCENT)
              }
            >
              {action.label}
            </button>
          </div>
        );
      }}
    />
  );
}
