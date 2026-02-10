'use client';

import { useState } from 'react';

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  observe: string;
}

interface LessonGuideProps {
  onReset: () => void;
  onStep: () => void;
  onStepUntilElection: () => void;
  onKillLeader: () => void;
  onToggleMode: () => void;
  onClientWrite: () => void;
  onPartition: () => void;
  onHeal: () => void;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. El problema del consenso',
    theory: `En un sistema distribuido, los nodos pueden fallar, los mensajes pueden perderse, y los relojes no estan sincronizados. ¿Como logras que N maquinas se pongan de acuerdo en un valor? Este es el "problema del consenso". FLP demostro que es IMPOSIBLE resolver en un sistema asincrono con al menos 1 fallo. Raft lo resuelve en la practica con timeouts (sacrificando la garantia teorica de que siempre termina).`,
    action: 'Iniciar cluster',
    observe:
      '5 nodos comienzan como followers. Nadie es leader. Los timers de eleccion cuentan hacia atras. Haz click en "Step" para avanzar un tick.',
  },
  {
    title: '2. Los tres estados',
    theory: `Cada nodo esta en uno de tres estados: Follower (estado inicial, espera heartbeats del leader), Candidate (cuando el timer de eleccion llega a 0, intenta ser lider), Leader (gano la eleccion, envia heartbeats, acepta escrituras). Las transiciones: Follower → Candidate (timeout), Candidate → Leader (gana votos), Candidate → Follower (pierde o nuevo term), Leader → Follower (ve un term mayor).`,
    action: 'Step hasta eleccion',
    observe:
      'Mira como un nodo se convierte en Candidate (amarillo), pide votos, y se vuelve Leader (verde) si gana la mayoria.',
  },
  {
    title: '3. Eleccion de lider',
    theory: `Cuando el timer de un follower llega a 0 (no recibio heartbeat), se convierte en Candidate: incrementa su term, vota por si mismo, y envia RequestVote a todos. Si recibe votos de la MAYORIA (3 de 5), se convierte en Leader. Si otro nodo tiene un term mayor, se rinde y vuelve a Follower. Los timers son RANDOM para evitar que todos intenten al mismo tiempo (split vote).`,
    action: 'Matar leader',
    observe:
      'El leader muere. Despues de unos ticks, un follower timeout y empieza una eleccion. Los mensajes RequestVote (azul) viajan a los demas nodos.',
  },
  {
    title: '4. Terminos: la logica del tiempo',
    theory: `Los "terms" son el reloj logico de Raft. Cada eleccion incrementa el term. Si un nodo recibe un mensaje con un term mayor al suyo, INMEDIATAMENTE actualiza su term y se convierte en Follower (se rinde). Si recibe un mensaje con un term menor, lo ignora. Los terms garantizan que solo puede haber UN leader por term (porque cada nodo solo vota una vez por term).`,
    action: 'Observar terms',
    observe:
      'Mira como los terms suben con cada eleccion. Si matas al leader y hay una nueva eleccion, el term sube. Todos los nodos convergen al mismo term.',
  },
  {
    title: '5. Heartbeats y timeouts',
    theory: `El leader envia "heartbeats" (AppendEntries vacios) periodicamente a todos los followers. Cada follower reinicia su timer de eleccion cuando recibe un heartbeat. Si el timer llega a 0 (no llego ningun heartbeat), el follower asume que el leader murio e inicia una eleccion. El timeout es random (8-15 ticks en este demo) para evitar que todos voten al mismo tiempo.`,
    action: 'Activar auto mode',
    observe:
      'En auto mode, ves los heartbeats (verde claro) viajando del leader a los followers periodicamente. Los timers se reinician con cada heartbeat.',
  },
  {
    title: '6. Replicacion del log',
    theory: `Cuando un client escribe un dato, va al leader. El leader agrega la entry a su log y la envia a los followers via AppendEntries. La entry esta UNCOMMITTED (amarilla) hasta que la mayoria (3 de 5) la confirma. Entonces el leader la marca como COMMITTED (verde) y la aplica. Los followers tambien commitean cuando el leader les dice el nuevo commitIndex.`,
    action: 'Client Write',
    observe:
      'Una entry amarilla aparece en el log del leader. Los AppendEntries viajan a los followers. Cuando 3 nodos la tienen, se vuelve verde (committed).',
  },
  {
    title: '7. Commit y durabilidad',
    theory: `Una entry solo se commitea cuando la MAYORIA de nodos la tiene. ¿Por que la mayoria y no todos? Porque si esperas a todos, un nodo muerto bloquea todo el sistema. Con mayoria, puedes tolerar F fallos con 2F+1 nodos (5 nodos toleran 2 fallos). Una vez committed, la entry NUNCA se pierde (porque cualquier eleccion futura requiere al menos un nodo que la tenga).`,
    action: 'Escribir y observar commit',
    observe:
      'Haz varios writes. Mira como cada uno se commitea cuando la mayoria confirma. El commitIndex avanza en todos los nodos.',
  },
  {
    title: '8. Garantias de seguridad',
    theory: `Raft garantiza: (1) Election Safety — maximo 1 leader por term. (2) Leader Append-Only — el leader nunca sobreescribe ni borra de su log. (3) Log Matching — si dos logs tienen una entry con el mismo index y term, son identicos hasta ese punto. (4) Leader Completeness — una entry committed aparece en todos los leaders futuros. (5) State Machine Safety — si un nodo aplica una entry, ningun otro aplica una entry diferente en el mismo index.`,
    action: 'Verificar garantias',
    observe:
      'Estas garantias se pueden verificar observando el cluster. Intenta romperlas — no deberia ser posible.',
  },
  {
    title: '9. Particiones de red',
    theory: `Imagina que la red se parte en dos: 3 nodos en un lado, 2 en el otro. El lado con la mayoria (3) elige un leader y sigue funcionando. El lado con la minoria (2) NO PUEDE elegir leader (no tiene mayoria) y se detiene. Cuando la red se cura, los nodos de la minoria se ponen al dia. NO hay split brain porque se necesita MAYORIA para cualquier decision.`,
    action: 'Crear particion',
    observe:
      'El cluster se divide. El lado con 3 nodos funciona normalmente. El lado con 2 nodos intenta elecciones pero nunca gana (necesita 3 votos). Al curar, se sincronizan.',
  },
  {
    title: '10. Nodo recuperado',
    theory: `Cuando un nodo muerto revive, vuelve como follower con su log viejo. El leader le envia las entries que le faltan via AppendEntries. El nodo se pone al dia ("catches up") sin interrumpir al cluster. Si el nodo tenia entries que nunca se commitearon (era el leader viejo), las pierde al sincronizarse con el nuevo leader.`,
    action: 'Matar nodo, escribir datos, recuperar nodo',
    observe:
      'Mata un nodo, escribe datos, y recuperalo. Mira como el leader le envia las entries faltantes y el nodo se pone al dia.',
  },
  {
    title: '11. Linearizability',
    theory: `Linearizability es la garantia de consistencia mas fuerte: toda operacion parece ocurrir instantaneamente en un punto entre su inicio y su fin. Con Raft, las lecturas del leader son linearizables (siempre devuelve el valor mas reciente committed). Las lecturas de los followers NO son linearizables (pueden devolver datos viejos). Para lecturas linearizables de followers, se necesitan "read leases" o "read indexes".`,
    action: 'Observar consistencia',
    observe:
      'Las lecturas del leader siempre reflejan el ultimo commit. Un follower puede estar atrasado.',
  },
  {
    title: '12. Trade-offs: Raft vs Paxos, CAP',
    theory: `Raft es mas facil de entender que Paxos (su predecesor) pero hace las mismas garantias. Ambos son protocolos de consenso "basados en leader" (el leader es el cuello de botella). CAP theorem: en presencia de una Partition, debes elegir entre Consistency y Availability. Raft elige Consistency (la minoria se detiene). Dynamo/Cassandra eligen Availability (todos responden pero pueden divergir). No hay respuesta correcta — solo tradeoffs.`,
    action: 'Explorar libremente',
    observe:
      'Experimenta con particiones, crashes, y escrituras. ¿Puedes crear una situacion donde se pierdan datos committed? (No deberias poder.)',
  },
];

const LESSON_ACTIONS: Record<
  number,
  (props: LessonGuideProps) => { label: string; handler: () => void }
> = {
  0: (p) => ({ label: 'Iniciar cluster', handler: p.onReset }),
  1: (p) => ({ label: 'Step hasta eleccion', handler: p.onStepUntilElection }),
  2: (p) => ({ label: 'Matar leader', handler: p.onKillLeader }),
  3: (p) => ({ label: 'Step', handler: p.onStep }),
  4: (p) => ({ label: 'Activar auto mode', handler: p.onToggleMode }),
  5: (p) => ({ label: 'Client Write', handler: p.onClientWrite }),
  6: (p) => ({ label: 'Client Write', handler: p.onClientWrite }),
  7: (p) => ({ label: 'Step', handler: p.onStep }),
  8: (p) => ({ label: 'Crear particion', handler: p.onPartition }),
  9: (p) => ({ label: 'Step', handler: p.onStep }),
  10: (p) => ({ label: 'Step', handler: p.onStep }),
  11: (p) => ({ label: 'Explorar libremente', handler: p.onStep }),
};

export function LessonGuide(props: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = LESSONS[currentStep];
  const action = LESSON_ACTIONS[currentStep]?.(props);

  return (
    <div className="h-full flex flex-col bg-j-bg">
      {/* Header */}
      <div className="px-5 py-3 border-b border-j-border flex items-center justify-between shrink-0">
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
        <h2 className="font-mono text-sm text-j-text font-medium mb-4">
          {step.title}
        </h2>

        {/* Theory */}
        <div className="mb-5">
          {step.theory.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="text-[13px] text-[#444] leading-relaxed mb-2 last:mb-0"
            >
              {para}
            </p>
          ))}
        </div>

        {/* Action button */}
        {action && (
          <div className="mb-5">
            <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
              Accion
            </p>
            <button
              onClick={action.handler}
              className="w-full text-left px-4 py-2.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-mono text-[12px] tracking-wider transition-colors rounded"
            >
              {action.label}
            </button>
          </div>
        )}

        {/* What to observe */}
        <div className="bg-[#fef2f2] px-4 py-3 border-l-2 border-[#991b1b] rounded-r">
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-1">
            Que observar
          </p>
          <p className="text-[12px] text-[#555] leading-relaxed">
            {step.observe}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-j-border flex items-center justify-between shrink-0">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                  ? 'bg-[#991b1b]'
                  : i < currentStep
                    ? 'bg-[#fecaca]'
                    : 'bg-[#ddd]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentStep((s) => Math.min(LESSONS.length - 1, s + 1))
          }
          disabled={currentStep === LESSONS.length - 1}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
