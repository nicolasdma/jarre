'use client';

import { useState } from 'react';
import type { SimConfig } from './replication-playground';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonAction {
  label: string;
  action: string;
  args?: Record<string, unknown>;
}

interface LessonStep {
  title: string;
  theory: string;
  actions: LessonAction[];
  observe: string;
}

interface LessonGuideProps {
  actions: {
    startSimulation: () => void;
    writeToLeader: (key?: string, value?: string) => void;
    readFromNode: (nodeId: string) => void;
    crashNode: (nodeId: string) => void;
    recoverNode: (nodeId: string) => void;
    partitionNetwork: () => void;
    healPartition: () => void;
    toggleMode: () => void;
    setReplicationDelay: (ms: number) => void;
    simulateReadAfterWrite: () => void;
    simulateMonotonicRead: () => void;
    simulateSplitBrain: () => void;
    resetSimulation: () => void;
  };
  config: SimConfig;
  isPartitioned: boolean;
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

const LESSONS: LessonStep[] = [
  {
    title: '1. Por que replicar',
    theory: `Replicar = mantener una copia de los datos en varias maquinas. Tres razones:

(1) Tolerancia a fallos: si una maquina muere, otra tiene los datos.
(2) Latencia: un usuario en Europa lee de un servidor europeo, no uno americano.
(3) Escalar lecturas: 1 maquina escribe, 10 maquinas leen.

El problema: ¿como mantienes las copias sincronizadas?`,
    actions: [
      { label: 'Iniciar simulacion', action: 'startSimulation' },
    ],
    observe: 'Tres nodos aparecen. El leader (arriba) es el unico que acepta escrituras. Los followers (abajo) reciben copias.',
  },
  {
    title: '2. Leader-based replication',
    theory: `El modelo mas comun. Un nodo es el "leader" (tambien llamado master o primary). Solo el leader acepta escrituras.

Cuando recibes un write, el leader lo aplica y lo envia a los followers. Los followers aplican los cambios en el mismo orden.

Los clients pueden leer de cualquier nodo (leader o follower).`,
    actions: [
      { label: 'Escribir dato', action: 'writeToLeader', args: { key: 'user', value: 'alice' } },
    ],
    observe: 'El write llega al leader, se replica a los followers. Mira las flechas animadas mostrando el flujo de datos.',
  },
  {
    title: '3. Async vs Sync',
    theory: `Sync: el leader espera a que TODOS los followers confirmen antes de responder al client. Ventaja: si el leader muere, los followers tienen los datos. Desventaja: si un follower esta lento, TODO se pone lento.

Async: el leader responde inmediatamente y replica "cuando pueda". Ventaja: rapido. Desventaja: si el leader muere antes de replicar, se pierden datos.

La mayoria de sistemas usan async o semi-sync (1 follower sync, el resto async).`,
    actions: [
      { label: 'Cambiar modo', action: 'toggleMode' },
      { label: 'Escribir dato', action: 'writeToLeader', args: { key: 'lang', value: 'es' } },
    ],
    observe: 'En modo sync, el write no se "completa" hasta que los followers confirmen. En async, se completa inmediatamente. Mira la diferencia de velocidad.',
  },
  {
    title: '4. Replication lag',
    theory: `En async, los followers SIEMPRE estan detras del leader. La diferencia se llama "replication lag".

Si el lag es de 500ms, un follower tiene datos de hace 500ms. Normalmente esto es imperceptible (milisegundos). Pero si hay un pico de escrituras, el lag puede crecer a segundos o minutos.

Y ahi aparecen los problemas de consistencia.`,
    actions: [
      { label: 'Aumentar delay a 2s', action: 'setReplicationDelay', args: { delay: 2000 } },
      { label: 'Escribir dato 1', action: 'writeToLeader', args: { key: 'city', value: 'paris' } },
      { label: 'Escribir dato 2', action: 'writeToLeader', args: { key: 'color', value: 'rojo' } },
      { label: 'Escribir dato 3', action: 'writeToLeader', args: { key: 'score', value: '99' } },
    ],
    observe: 'Con delay alto, los followers tardan en recibir las escrituras. Escribe varios datos rapido y mira como los followers se "atrasan".',
  },
  {
    title: '5. Read-after-write consistency',
    theory: `Escribes "color=azul" al leader. Inmediatamente lees de un follower. El follower aun no recibio la replica. Te devuelve "color=rojo" (el valor viejo).

Esto se llama "read-after-write violation". Desde tu perspectiva: guardaste algo y no aparece.

Solucion comun: leer del leader si el dato fue escrito recientemente. O: esperar a que el follower este al dia.`,
    actions: [
      { label: 'Simular violacion', action: 'simulateReadAfterWrite' },
    ],
    observe: 'El evento aparece en rojo en el log. El follower devolvio un valor viejo porque la replica no llego todavia.',
  },
  {
    title: '6. Monotonic reads',
    theory: `Lees de follower-1 y obtienes version 5. Luego lees de follower-2 y obtienes version 3. Viajaste atras en el tiempo.

Esto se llama "monotonic read violation". Desde tu perspectiva: la app muestra datos, refrescas, y los datos son MAS VIEJOS.

Solucion: sticky sessions — siempre leer del mismo follower.`,
    actions: [
      { label: 'Simular violacion', action: 'simulateMonotonicRead' },
    ],
    observe: 'El log muestra la violacion: leiste version 5 y luego version 3. Los datos "retrocedieron".',
  },
  {
    title: '7. Consistent prefix reads',
    theory: `Imagina una conversacion: "¿Cual es el resultado?" -> "El resultado es 42".

Si la respuesta se replica antes que la pregunta, un lector ve: "El resultado es 42" seguido de "¿Cual es el resultado?". El orden causal se rompio.

Esto es mas relevante en bases de datos particionadas.`,
    actions: [],
    observe: 'Este tipo de violacion es mas comun en bases de datos particionadas (Ch6). Aqui lo mencionamos por completitud.',
  },
  {
    title: '8. Failover: el leader muere',
    theory: `Si el leader se cae, necesitas elegir un nuevo leader de entre los followers. Esto se llama "failover".

Problemas:
(1) ¿Como saber que el leader realmente murio (no solo esta lento)? Usas timeouts.
(2) ¿Cual follower eliges? El que tenga mas datos replicados.
(3) ¿Que pasa con las escrituras que el viejo leader tenia pero no replico? Se pierden (en async).`,
    actions: [
      { label: 'Crashear leader', action: 'crashNode', args: { nodeId: 'leader' } },
    ],
    observe: 'El leader se pone rojo. Despues del failover, un follower se convierte en el nuevo leader. Los datos no replicados se pierden.',
  },
  {
    title: '9. Split brain: dos leaders',
    theory: `Split brain: debido a una particion de red, dos nodos creen ser el leader. Ambos aceptan escrituras. Cuando la particion se cura, los datos han DIVERGIDO — dos valores distintos para la misma key.

Este es uno de los modos de fallo mas peligrosos. Raft/Paxos lo resuelven (Ch8-9).`,
    actions: [
      { label: 'Simular split brain', action: 'simulateSplitBrain' },
    ],
    observe: 'Dos nodos se vuelven leader. Ambos aceptan escrituras. Cuando se cura la particion, los datos estan en conflicto.',
  },
  {
    title: '10. Multi-leader replication',
    theory: `En vez de 1 leader, tienes N leaders (uno por datacenter). Cada leader acepta escrituras locales y replica a los demas.

Ventaja: baja latencia para escrituras locales.

Desventaja: conflictos cuando dos leaders escriben la misma key al mismo tiempo. Requiere "conflict resolution" (last-write-wins, merge functions, CRDTs).

No lo simulamos aqui — es un tema avanzado.`,
    actions: [],
    observe: 'Este modelo se usa en CockroachDB y sistemas multi-datacenter. El problema central: resolver conflictos.',
  },
  {
    title: '11. Trade-offs finales',
    theory: `Consistencia vs disponibilidad: si exiges que todos los followers esten al dia (sync), tu sistema se detiene si uno falla. Si permites lag (async), puedes tener datos inconsistentes.

No hay solucion perfecta — solo tradeoffs.

DDIA Ch5 te prepara para entender por que existen protocolos como Raft (Ch9): garantizar consenso en un mundo de fallos y particiones.`,
    actions: [
      { label: 'Explorar libremente', action: 'resetSimulation' },
    ],
    observe: 'Combina crashes, partitions, lecturas y escrituras. ¿Puedes romper la consistencia? ¿Puedes prevenirla?',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonGuide({ actions, config, isPartitioned }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = LESSONS[currentStep];

  function executeAction(lessonAction: LessonAction) {
    switch (lessonAction.action) {
      case 'startSimulation':
        actions.startSimulation();
        break;
      case 'writeToLeader': {
        const args = lessonAction.args as { key?: string; value?: string } | undefined;
        actions.writeToLeader(args?.key, args?.value);
        break;
      }
      case 'readFromNode': {
        const args = lessonAction.args as { nodeId: string } | undefined;
        if (args?.nodeId) actions.readFromNode(args.nodeId);
        break;
      }
      case 'crashNode': {
        const args = lessonAction.args as { nodeId: string } | undefined;
        if (args?.nodeId) actions.crashNode(args.nodeId);
        break;
      }
      case 'recoverNode': {
        const args = lessonAction.args as { nodeId: string } | undefined;
        if (args?.nodeId) actions.recoverNode(args.nodeId);
        break;
      }
      case 'partitionNetwork':
        actions.partitionNetwork();
        break;
      case 'healPartition':
        actions.healPartition();
        break;
      case 'toggleMode':
        actions.toggleMode();
        break;
      case 'setReplicationDelay': {
        const args = lessonAction.args as { delay: number } | undefined;
        if (args?.delay !== undefined) actions.setReplicationDelay(args.delay);
        break;
      }
      case 'simulateReadAfterWrite':
        actions.simulateReadAfterWrite();
        break;
      case 'simulateMonotonicRead':
        actions.simulateMonotonicRead();
        break;
      case 'simulateSplitBrain':
        actions.simulateSplitBrain();
        break;
      case 'resetSimulation':
        actions.resetSimulation();
        actions.startSimulation();
        break;
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#faf9f6]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#e8e6e0] flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Guia
        </span>
        <span className="font-mono text-[10px] text-[#a0a090]">
          {currentStep + 1} / {LESSONS.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        {/* Step title */}
        <h2 className="font-mono text-sm text-[#2c2c2c] font-medium mb-4">
          {step.title}
        </h2>

        {/* Theory */}
        <div className="mb-5">
          {step.theory.split('\n\n').map((para, i) => (
            <p key={i} className="text-[13px] text-[#444] leading-relaxed mb-2 last:mb-0">
              {para}
            </p>
          ))}
        </div>

        {/* Action buttons */}
        {step.actions.length > 0 && (
          <div className="mb-5">
            <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
              Acciones
            </p>
            <div className="space-y-1.5">
              {step.actions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => executeAction(a)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2d4a6a] hover:bg-[#1e3a5f] transition-colors rounded">
                    <span className="text-[#a0c4e8] font-mono text-[11px] shrink-0">{'>'}</span>
                    <span className="text-white font-mono text-[11px]">{a.label}</span>
                    <span className="ml-auto text-[#6b94b8] font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      click
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* What to observe */}
        <div className="bg-[#f0f4f8] px-4 py-3 border-l-2 border-[#2d4a6a] rounded-r">
          <p className="font-mono text-[10px] text-[#5a7a9a] uppercase tracking-wider mb-1">
            Que observar
          </p>
          <p className="text-[12px] text-[#444] leading-relaxed">
            {step.observe}
          </p>
        </div>

        {/* Current config summary */}
        <div className="mt-4 px-3 py-2 bg-[#f8f8f4] border border-[#e8e6e0] rounded">
          <p className="font-mono text-[9px] text-[#a0a090] uppercase tracking-wider mb-1">
            Estado actual
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="font-mono text-[10px] text-[#555]">
              Modo: <span className="text-[#2d4a6a] font-medium">{config.mode}</span>
            </span>
            <span className="font-mono text-[10px] text-[#555]">
              Delay: <span className="text-[#2d4a6a] font-medium">{config.replicationDelay}ms</span>
            </span>
            <span className="font-mono text-[10px] text-[#555]">
              Red: <span className={isPartitioned ? 'text-[#d97706] font-medium' : 'text-[#4a5d4a] font-medium'}>
                {isPartitioned ? 'particionada' : 'ok'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-[#e8e6e0] flex items-center justify-between shrink-0">
        <button
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="font-mono text-[11px] text-[#7a7a6e] hover:text-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        {/* Step dots */}
        <div className="flex gap-1.5">
          {LESSONS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-[#2d4a6a]'
                  : i < currentStep
                    ? 'bg-[#6b94b8]'
                    : 'bg-[#ddd]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentStep(s => Math.min(LESSONS.length - 1, s + 1))}
          disabled={currentStep === LESSONS.length - 1}
          className="font-mono text-[11px] text-[#7a7a6e] hover:text-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
