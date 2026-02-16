'use client';

import { LessonGuideShell, type LessonStep } from '@/components/playground/lesson-guide-shell';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StreamStep extends LessonStep {
  action: string;
}

export interface LessonGuideProps {
  onReset: () => void;
  onProduce: () => void;
  onAdvanceConsumer: () => void;
  onRewindConsumer: () => void;
  onAddConsumer: () => void;
  onAddPartition: () => void;
  onToggleAuto: () => void;
}

// ---------------------------------------------------------------------------
// Steps data
// ---------------------------------------------------------------------------

const STEPS: StreamStep[] = [
  {
    title: '1. Eventos y el log inmutable',
    theory: `En un sistema de stream processing, los datos se modelan como un log inmutable y append-only de eventos. Cada evento tiene un offset (posicion en el log), un timestamp, una key, y un value. A diferencia de una base de datos donde actualizas registros "in place", aqui NUNCA modificas eventos pasados — solo agregas nuevos al final. Esto es el corazon de Kafka, Kinesis, y Pulsar.

El log es la fuente de verdad. Puedes derivar cualquier estado leyendo el log desde el principio. Esto habilita: replay, auditoria, y multiples consumidores independientes.`,
    action: 'Producir evento',
    observe:
      'Un evento aparece al final de una particion. Nota el offset auto-incrementado, el timestamp, y como el evento queda permanentemente en el log.',
  },
  {
    title: '2. Particiones y paralelismo',
    theory: `Un topic se divide en particiones para escalar horizontalmente. Cada particion es un log independiente con sus propios offsets (empiezan desde 0 en cada particion). La key del evento determina a que particion va (hash(key) % num_particiones).

Las particiones son la unidad de paralelismo: dentro de una particion, el orden esta garantizado. Entre particiones, NO hay orden global. Esto es un trade-off fundamental: mas particiones = mas throughput, pero pierdes el orden total de los eventos.`,
    action: 'Agregar particion',
    observe:
      'Se agrega una nueva particion vacia al broker. Produce varios eventos y nota como la key determina a que particion van. Mensajes con la misma key siempre van a la misma particion.',
  },
  {
    title: '3. Consumer groups y offsets',
    theory: `Los consumidores se organizan en "consumer groups". Cada particion se asigna a exactamente UN consumidor dentro del grupo. Si hay mas consumidores que particiones, algunos quedan idle. Si hay menos, un consumidor lee de multiples particiones.

Cada consumidor trackea su offset — la posicion hasta donde ha leido. El offset es la diferencia clave entre messaging (el broker olvida despues de entregar) y log-based (el consumidor decide cuando avanzar). Si un consumidor se cae y vuelve, puede reanudar desde su ultimo offset committed.`,
    action: 'Avanzar consumidor',
    observe:
      'El consumidor procesa el siguiente evento y su offset avanza. El "lag" (diferencia entre el offset del consumidor y el ultimo offset de la particion) disminuye.',
  },
  {
    title: '4. Consumer lag y backpressure',
    theory: `El "consumer lag" es la diferencia entre el offset mas reciente en la particion y el offset del consumidor. Un lag alto significa que el consumidor no puede mantener el ritmo del productor.

En un sistema real, las opciones son: (1) agregar mas consumidores y particiones para escalar, (2) aplicar backpressure al productor para que vaya mas lento, (3) buffering temporal aceptando mas lag. Kafka no hace backpressure automatico — el lag simplemente crece. Esto es diferente a sistemas como Flink que SI tienen backpressure.`,
    action: 'Activar auto-produccion',
    observe:
      'Con auto-produccion activa, los eventos llegan constantemente. Si no avanzas los consumidores, el lag crece. Agrega consumidores o avanzalos para reducir el lag.',
  },
  {
    title: '5. Rebalanceo y tolerancia a fallos',
    theory: `Cuando un consumidor se agrega o se cae, las particiones se reasignan ("rebalance"). El algoritmo busca distribuir particiones equitativamente. Durante el rebalance, hay una pausa breve donde ningun consumidor lee.

Si un consumidor se cae antes de commitear su offset, los mensajes procesados pero no commiteados se re-procesan por otro consumidor. Esto significa que el sistema ofrece "at-least-once" delivery por defecto. Para "exactly-once", necesitas idempotencia o transacciones.

El rewind (retroceder el offset) es una operacion poderosa: permite re-procesar eventos historicos, por ejemplo cuando despliegas una nueva version de la logica del consumidor.`,
    action: 'Agregar consumidor',
    observe:
      'Al agregar un consumidor al grupo, las particiones se redistribuyen. Nota como cada particion queda asignada a exactamente un consumidor. Prueba retroceder un consumidor para re-procesar eventos.',
  },
];

// ---------------------------------------------------------------------------
// Action mapping
// ---------------------------------------------------------------------------

const LESSON_ACTIONS: Record<
  number,
  (props: LessonGuideProps) => { label: string; handler: () => void }
> = {
  0: (p) => ({ label: 'Producir evento', handler: p.onProduce }),
  1: (p) => ({ label: 'Agregar particion', handler: p.onAddPartition }),
  2: (p) => ({ label: 'Avanzar consumidor', handler: p.onAdvanceConsumer }),
  3: (p) => ({ label: 'Auto produccion', handler: p.onToggleAuto }),
  4: (p) => ({ label: 'Agregar consumidor', handler: p.onAddConsumer }),
};

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const COLORS = {
  accent: '#1e40af',
  visited: '#bfdbfe',
  calloutBg: '#eff6ff',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonGuide(props: LessonGuideProps) {
  return (
    <LessonGuideShell
      steps={STEPS}
      colors={COLORS}
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
              className="w-full text-left px-4 py-2.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-mono text-[12px] tracking-wider transition-colors rounded"
            >
              {action.label}
            </button>
          </div>
        );
      }}
    />
  );
}
