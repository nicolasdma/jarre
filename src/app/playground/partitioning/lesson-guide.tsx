'use client';

import { type LessonStep, LessonGuideShell } from '@/components/playground/lesson-guide-shell';

interface PartitioningStep extends LessonStep {
  actionLabel: string;
  actionId: string;
}

interface LessonGuideProps {
  onAction: (actionId: string) => void;
}

const STEPS: PartitioningStep[] = [
  {
    title: '1. Por que particionar',
    theory: `Cuando una sola maquina no puede manejar todos los datos o todo el trafico, divides los datos en particiones (tambien llamadas "shards"). Cada particion vive en un nodo distinto. Asi puedes escalar horizontalmente: mas nodos = mas capacidad.

El reto: ¿como decides que datos van a que nodo? Si lo haces mal, un nodo se sobrecarga mientras los demas estan ociosos. Si lo haces bien, el trafico se distribuye uniformemente.

Este es el tema central del Capitulo 6 de DDIA (Designing Data-Intensive Applications).`,
    actionLabel: 'Empezar con 3 nodos',
    actionId: 'init-3-nodes',
    observe: 'Tres nodos aparecen en el anillo, cada uno con un color distinto. Aun no hay datos — agrega keys para ver como se distribuyen.',
  },
  {
    title: '2. Hash simple: modulo N',
    theory: `La forma mas simple: hash(key) % N, donde N es el numero de nodos. El hash convierte cualquier string en un numero. Modulo N te dice a que nodo va.

Es simple y distribuye bien... hasta que cambias N.

El hash que usamos (djb2) es determinista: el mismo string siempre produce el mismo numero. Esto es fundamental — si el hash fuera aleatorio, nunca podrias encontrar tus datos.`,
    actionLabel: 'Modo Hash Simple + agregar 50 keys',
    actionId: 'mode-simple-add-50',
    observe: 'Las keys se distribuyen mas o menos uniformemente entre los 3 nodos. Mira el panel de stats: el skew ratio deberia ser cercano a 1.',
  },
  {
    title: '3. Agregar un nodo: el desastre del rehashing',
    theory: `Con hash simple (key % N), si N cambia de 3 a 4, TODAS las keys se recalculan. key % 3 ≠ key % 4 para la mayoria de keys.

En la practica, ~66% de las keys se mueven a un nodo diferente. Con millones de keys, esto significa mover millones de datos por la red. Inaceptable en produccion.

Este es el problema fundamental del hash simple y la razon por la que existe consistent hashing.`,
    actionLabel: 'Agregar un nodo',
    actionId: 'add-node',
    observe: 'Mira cuantas keys se movieron en "Ultimo Rebalance". Con hash simple, la mayoria cambian de nodo. La barra roja indica que mas del 50% de las keys se movieron — un desastre en produccion.',
  },
  {
    title: '4. Consistent hashing: la solucion',
    theory: `Consistent hashing pone los nodos Y las keys en un anillo (de 0 a 2^32). Cada key va al primer nodo que encuentra al avanzar en el sentido del reloj.

Cuando AGREGAS un nodo, solo las keys entre el nodo anterior y el nuevo se mueven (~1/N del total). Cuando QUITAS un nodo, solo sus keys se redistribuyen.

El truco: "virtual nodes" — cada nodo fisico aparece multiples veces en el anillo para distribuir mejor. Con pocos virtual nodes la distribucion es desigual. Con muchos (50-150), se acerca a la perfeccion.

DynamoDB, Cassandra y Riak usan variantes de consistent hashing.`,
    actionLabel: 'Cambiar a Consistent Hash',
    actionId: 'mode-consistent',
    observe: 'El anillo ahora muestra virtual nodes (ticks pequenos). Agrega/quita un nodo y mira cuantas keys se mueven — muchas menos que con hash simple. Usa el slider de virtual nodes para ver como afecta la distribucion.',
  },
  {
    title: '5. Range partitioning',
    theory: `En vez de hashear, divides el keyspace en rangos ordenados. Nodo A tiene keys "a-f", nodo B tiene "g-m", etc.

Ventaja: consultas por rango son eficientes. Si quieres todos los usuarios de "garcia" a "lopez", van a 1-2 particiones, no a todas.

Desventaja: los rangos pueden ser desiguales. Si muchas keys empiezan con la misma letra, ese nodo se sobrecarga. HBase y muchas bases SQL usan range partitioning.`,
    actionLabel: 'Cambiar a Range',
    actionId: 'mode-range',
    observe: 'La visualizacion cambia a barras horizontales. Las keys se agrupan por su primer caracter. ¿La distribucion es uniforme? Probablemente no — los prefijos aleatorios no cubren todo el abecedario por igual.',
  },
  {
    title: '6. Hotspots: el problema de las celebrities',
    theory: `Si Justin Bieber tuitea, millones de requests van al mismo key ("user:justinbieber"). Sin importar como particiones, ese nodo se sobrecarga. Esto se llama "hotspot".

Hash partitioning ayuda (distribuye keys uniformemente) pero no resuelve hotspots en un solo key. Range partitioning es peor — todas las keys similares van al mismo nodo.

Solucion parcial: agregar un sufijo random al key (user:bieber:01, user:bieber:02...) y distribuir entre multiples nodos. Pero leer requiere consultar todos los sufijos y combinar. No hay almuerzo gratis.`,
    actionLabel: 'Agregar hotspot',
    actionId: 'add-hotspot',
    observe: 'Se agregaron 20 keys "celebrity:X". En range mode, todas van al mismo nodo (empiezan con "c"). Cambia a hash mode para ver como se distribuyen mejor. ¿Cual maneja mejor el hotspot?',
  },
  {
    title: '7. Partitioning + Replication',
    theory: `En la practica, cada particion se replica a multiples nodos (para tolerancia a fallos). Asi que cada nodo tiene VARIAS particiones, algunas como lider y otras como replicas.

Si un nodo muere, sus particiones lider se migran a las replicas. El sistema sigue funcionando sin perder datos.

El Capitulo 5 (Replicacion) y el 6 (Partitioning) trabajan juntos. Replicacion da disponibilidad y durabilidad. Partitioning da escalabilidad y rendimiento.

Kafka, por ejemplo, particiona los topics Y replica cada particion a N brokers.`,
    actionLabel: 'Conceptual',
    actionId: 'noop',
    observe: 'Este concepto se vive en el Replication Lab. Aqui lo mencionamos para conectar los temas. La combinacion de partitioning + replication es la base de cualquier sistema distribuido serio.',
  },
  {
    title: '8. Indices secundarios',
    theory: `Si particionas por user_id, ¿como buscas por email? Necesitas un indice secundario. Dos opciones:

(1) Document-partitioned (local index): cada particion tiene su propio indice sobre sus datos locales. Escritura rapida (solo actualiza 1 particion), lectura lenta (scatter-gather: consulta TODAS las particiones y combina). MongoDB usa este enfoque.

(2) Term-partitioned (global index): el indice mismo esta particionado por termino. Lectura rapida (va a 1 particion del indice), escritura lenta (actualizar multiples particiones del indice). DynamoDB global secondary indexes funcionan asi.

El tradeoff es: lectura rapida + escritura lenta, o escritura rapida + lectura lenta. No hay almuerzo gratis.`,
    actionLabel: 'Conceptual',
    actionId: 'noop',
    observe: 'Esta leccion es teorica. El tradeoff fundamental: scatter-gather (local index) vs. cross-partition writes (global index). La eleccion depende del patron de acceso de tu aplicacion.',
  },
];

const COLORS = {
  accent: '#059669',
  visited: '#a7f3d0',
  calloutBg: '#d1fae5',
} as const;

export function LessonGuide({ onAction }: LessonGuideProps) {
  return (
    <LessonGuideShell
      steps={STEPS}
      colors={COLORS}
      renderAction={(stepIndex) => {
        const step = STEPS[stepIndex];
        return (
          <div className="mb-5">
            <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
              Accion
            </p>
            {step.actionId !== 'noop' ? (
              <button
                onClick={() => onAction(step.actionId)}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-[#059669] hover:bg-[#047857] transition-colors">
                  <span className="text-white/60 font-mono text-[11px] shrink-0">{'>'}</span>
                  <span className="text-white font-mono text-[11px]">{step.actionLabel}</span>
                  <span className="ml-auto text-white/40 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    click
                  </span>
                </div>
              </button>
            ) : (
              <div className="px-3 py-2 bg-[#f0efe8] border border-j-border">
                <span className="font-mono text-[11px] text-j-text-secondary">
                  {step.actionLabel} — sin interaccion
                </span>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
