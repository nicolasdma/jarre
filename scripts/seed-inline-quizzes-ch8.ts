#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for DDIA Ch8 (The Trouble with Distributed Systems) sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-ch8.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Quiz definitions — keyed by section_title (to resolve section_id at runtime)
// ============================================================================

interface QuizDef {
  sectionTitle: string;
  positionAfterHeading: string;
  sortOrder: number;
  format: 'mc' | 'tf' | 'mc2';
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
  justificationHint?: string;
}

const QUIZZES: QuizDef[] = [
  // ── Section 0: Fallas y Fallos Parciales ─────────────────────────────

  {
    sectionTitle: 'Fallas y Fallos Parciales',
    positionAfterHeading: 'Fallas y Fallos Parciales',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál es la diferencia fundamental entre un fallo en un solo computador y un fallo en un sistema distribuido?',
    options: [
      { label: 'A', text: 'En un solo computador los fallos son más frecuentes' },
      { label: 'B', text: 'En un sistema distribuido los fallos son parciales: parte del sistema puede fallar mientras el resto funciona' },
      { label: 'C', text: 'Los sistemas distribuidos no pueden tener fallos de hardware' },
      { label: 'D', text: 'Un solo computador nunca tiene fallos de software' },
    ],
    correctAnswer: 'B',
    explanation:
      'Un computador individual tiende a ser "todo o nada": funciona completamente o falla por completo (crash). En un sistema distribuido, los fallos parciales son la norma: un nodo puede estar caído mientras otros siguen operando, y puede ser imposible saber si algo funcionó o no.',
  },
  {
    sectionTitle: 'Fallas y Fallos Parciales',
    positionAfterHeading: 'Computación en la Nube y Supercomputación',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Por qué la supercomputación (HPC) y la computación en la nube tratan los fallos de forma diferente?',
    options: [
      { label: 'A', text: 'La supercomputación usa hardware más barato' },
      { label: 'B', text: 'La supercomputación hace checkpoint y reinicia todo el trabajo ante un fallo; la nube debe tolerar fallos parciales sin detener el servicio' },
      { label: 'C', text: 'La nube no necesita manejar fallos porque el hardware es más fiable' },
      { label: 'D', text: 'La supercomputación usa redes más lentas' },
    ],
    correctAnswer: 'B',
    explanation:
      'Los sistemas HPC tratan la computadora como un sistema de un solo nodo: ante un fallo, hacen checkpoint periódico y reinician desde el último checkpoint. Los servicios en la nube deben seguir sirviendo usuarios incluso durante fallos parciales, por lo que necesitan tolerancia a fallos incorporada en el diseño del software.',
    justificationHint:
      'Piensa en un cálculo científico que tarda días vs. un servicio web que sirve millones de usuarios. ¿Cuál puede permitirse detener todo y reiniciar? ¿Cuál no?',
  },
  {
    sectionTitle: 'Fallas y Fallos Parciales',
    positionAfterHeading: 'Construir un sistema fiable a partir de componentes no fiables',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Es imposible construir un sistema más fiable que sus componentes individuales.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Es posible y es una práctica estándar en ingeniería. Ejemplos: los códigos de corrección de errores permiten transmisión correcta sobre canales ruidosos; TCP proporciona transferencia fiable sobre IP (que pierde paquetes). El sistema como un todo puede ofrecer garantías más fuertes que sus componentes individuales.',
  },

  // ── Section 1: Redes No Fiables ──────────────────────────────────────

  {
    sectionTitle: 'Redes No Fiables',
    positionAfterHeading: 'Redes no fiables',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'Si envías una solicitud a otro nodo y no recibes respuesta, puedes determinar con certeza si el mensaje se perdió, el nodo está caído, o la respuesta se perdió.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'En una red asíncrona, la ausencia de respuesta es completamente ambigua. No puedes distinguir entre: (1) la solicitud se perdió, (2) la solicitud está en cola, (3) el nodo remoto falló, (4) el nodo remoto es lento, (5) la respuesta se perdió. Solo sabes que no recibiste respuesta.',
  },
  {
    sectionTitle: 'Redes No Fiables',
    positionAfterHeading: 'Fallas de red en la práctica',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Qué revelan los estudios sobre fallas de red en datacenters reales?',
    options: [
      { label: 'A', text: 'Las fallas de red son extremadamente raras y pueden ignorarse' },
      { label: 'B', text: 'Las fallas de red son sorprendentemente comunes, incluso en entornos controlados' },
      { label: 'C', text: 'Solo ocurren por errores humanos, nunca por hardware' },
      { label: 'D', text: 'Solo afectan a redes públicas, no a redes internas del datacenter' },
    ],
    correctAnswer: 'B',
    explanation:
      'Estudios de empresas como Microsoft y Google muestran que las fallas de red en datacenters son sorprendentemente frecuentes: un switch de red de mediana escala puede fallar ~5 veces al mes. Incluso conexiones redundantes no eliminan el problema. No es una cuestión teórica sino una realidad operacional.',
  },
  {
    sectionTitle: 'Redes No Fiables',
    positionAfterHeading: 'Detección de Fallos',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿En qué caso limitado SÍ puedes obtener retroalimentación explícita de que un nodo no está disponible?',
    options: [
      { label: 'A', text: 'Cuando el nodo envía un mensaje "estoy muriendo" antes de caer' },
      { label: 'B', text: 'Cuando recibes un RST/ICMP del sistema operativo del nodo (proceso caído, puerto cerrado)' },
      { label: 'C', text: 'Cuando el timeout expira' },
      { label: 'D', text: 'Cuando otro nodo confirma que el primero está muerto' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si el proceso del nodo remoto murió pero la máquina sigue funcionando, el SO puede enviar un paquete RST o FIN indicando que la conexión fue rechazada. Pero si el nodo entero está caído, no hay nadie que envíe esa señal. Los timeouts siguen siendo la principal herramienta de detección.',
    justificationHint:
      'Distingue entre: proceso muerto (el SO puede informar) vs. máquina muerta (nadie puede informar) vs. red particionada (los paquetes nunca llegan). Solo en el primer caso hay retroalimentación explícita.',
  },
  {
    sectionTitle: 'Redes No Fiables',
    positionAfterHeading: 'Timeouts y Retrasos Ilimitados',
    sortOrder: 3,
    format: 'mc',
    questionText:
      '¿Por qué no existe un timeout "correcto" universal para detectar fallos en redes asíncronas?',
    options: [
      { label: 'A', text: 'Porque los protocolos de red no soportan timeouts' },
      { label: 'B', text: 'Porque las redes asíncronas tienen retrasos ilimitados y no garantizan un tiempo máximo de entrega' },
      { label: 'C', text: 'Porque los relojes de los nodos no están sincronizados' },
      { label: 'D', text: 'Porque los timeouts solo funcionan en redes síncronas' },
    ],
    correctAnswer: 'B',
    explanation:
      'En redes asíncronas (como Ethernet/IP), no hay límite superior garantizado para la latencia. Un paquete puede tardar milisegundos o minutos. Un timeout corto genera falsos positivos; uno largo aumenta el tiempo de detección. La elección es siempre un tradeoff experimental, no una constante derivable.',
  },
  {
    sectionTitle: 'Redes No Fiables',
    positionAfterHeading: 'Redes síncronas versus asíncronas',
    sortOrder: 4,
    format: 'tf',
    questionText:
      'Una red telefónica (circuit-switched) y una red Ethernet (packet-switched) ofrecen las mismas garantías de latencia.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Una red telefónica establece un circuito dedicado con ancho de banda reservado, garantizando latencia acotada. Ethernet es packet-switched: los paquetes comparten ancho de banda y sufren queueing delays variables. Ethernet optimiza throughput (utilización del ancho de banda) a costa de garantías de latencia.',
    justificationHint:
      'La red telefónica reserva 16 bits cada 250μs para tu llamada, nadie más puede usar ese espacio. En Ethernet, tus paquetes compiten con los de todos. ¿Cuál tiene latencia predecible?',
  },

  // ── Section 2: Relojes No Confiables ─────────────────────────────────

  {
    sectionTitle: 'Relojes No Confiables',
    positionAfterHeading: 'Relojes de hora del día',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Por qué los relojes de hora del día (time-of-day clocks) son problemáticos para medir duraciones?',
    options: [
      { label: 'A', text: 'Porque no tienen suficiente resolución' },
      { label: 'B', text: 'Porque pueden saltar hacia atrás o adelante al sincronizarse con NTP' },
      { label: 'C', text: 'Porque solo funcionan en la zona horaria local' },
      { label: 'D', text: 'Porque requieren acceso a internet' },
    ],
    correctAnswer: 'B',
    explanation:
      'Los relojes de hora del día se sincronizan periódicamente con NTP. Si el reloj local se adelantó, NTP puede hacer que "salte hacia atrás" (reset). Esto significa que la diferencia entre dos lecturas puede ser negativa, haciendo que las mediciones de duración sean poco fiables. Para medir duraciones, se usan relojes monotónicos.',
  },
  {
    sectionTitle: 'Relojes No Confiables',
    positionAfterHeading: 'Relojes monotónicos',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Un reloj monotónico siempre avanza hacia adelante y nunca puede retroceder.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Esa es precisamente la garantía de un reloj monotónico: el valor siempre es mayor o igual que el anterior. Es ideal para medir intervalos de tiempo (elapsed time) dentro de un mismo nodo. Sin embargo, el valor absoluto no tiene significado entre nodos diferentes, porque cada nodo tiene su propio punto de referencia.',
  },
  {
    sectionTitle: 'Relojes No Confiables',
    positionAfterHeading: 'Sincronización y Precisión de Relojes',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál de estos NO es un problema real documentado con la sincronización de relojes?',
    options: [
      { label: 'A', text: 'Un reloj de cuarzo puede desviarse ~17 segundos por día' },
      { label: 'B', text: 'NTP puede ser afectado por congestión de red, limitando su precisión' },
      { label: 'C', text: 'Las máquinas virtuales tienen relojes perfectos porque el hypervisor los sincroniza' },
      { label: 'D', text: 'Servidores NTP mal configurados pueden reportar horas incorrectas' },
    ],
    correctAnswer: 'C',
    explanation:
      'Las VMs tienen problemas ADICIONALES con los relojes: cuando una VM es pausada (ej: live migration), su reloj se congela. Al resumir, puede haber un salto significativo. El hypervisor no garantiza relojes perfectos; de hecho, es una fuente adicional de imprecisión.',
  },
  {
    sectionTitle: 'Relojes No Confiables',
    positionAfterHeading: 'Depender de Relojes Sincronizados',
    sortOrder: 3,
    format: 'mc2',
    questionText:
      '¿Qué puede salir mal cuando se usan timestamps de relojes sincronizados para determinar el orden de eventos en diferentes nodos?',
    options: [
      { label: 'A', text: 'Nada, los relojes NTP son suficientemente precisos para ordenar eventos' },
      { label: 'B', text: 'Una escritura causalmente posterior podría recibir un timestamp menor y ser descartada incorrectamente (LWW)' },
      { label: 'C', text: 'Los timestamps ocupan demasiado espacio en disco' },
      { label: 'D', text: 'Los timestamps solo funcionan en bases de datos relacionales' },
    ],
    correctAnswer: 'B',
    explanation:
      'Con Last Write Wins (LWW), si el Nodo A escribe x=1 en t=100 y el Nodo B (cuyo reloj está adelantado) escribe x=2 en t=105, la escritura con t=105 "gana". Pero si causalmente x=1 debía ganar (fue posterior en realidad), el sesgo del reloj causó pérdida silenciosa de datos.',
    justificationHint:
      'Imagina dos clientes escribiendo a la misma clave. El Cliente A escribe primero pero su nodo tiene el reloj atrasado 5ms. El Cliente B escribe después pero su nodo tiene el reloj adelantado. ¿Quién "gana" con LWW? ¿Es correcto?',
  },
  {
    sectionTitle: 'Relojes No Confiables',
    positionAfterHeading: 'Pausas de Procesos',
    sortOrder: 4,
    format: 'mc',
    questionText:
      '¿Cuál es un ejemplo de pausa de proceso que puede causar problemas en sistemas distribuidos?',
    options: [
      { label: 'A', text: 'Un context switch del sistema operativo entre threads' },
      { label: 'B', text: 'Una pausa de garbage collection (GC) stop-the-world que detiene el proceso por varios segundos' },
      { label: 'C', text: 'Un page fault que tarda microsegundos' },
      { label: 'D', text: 'Una operación de CPU intensiva que tarda milisegundos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las pausas GC stop-the-world pueden detener todos los threads de un proceso durante segundos o incluso minutos. Durante ese tiempo, el nodo no responde a heartbeats y otros nodos pueden declararlo muerto. Cuando el GC termina, el nodo "despierta" sin saber que fue declarado muerto, creando situaciones peligrosas.',
  },

  // ── Section 3: Conocimiento, Verdad y Mentiras ───────────────────────

  {
    sectionTitle: 'Conocimiento, Verdad y Mentiras',
    positionAfterHeading: 'Conocimiento, verdad y mentiras',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'Un nodo en un sistema distribuido puede confiar completamente en su propia evaluación de la situación del sistema.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Un nodo no puede confiar en su propio juicio. Puede creer que es el líder, pero si una pausa GC lo dejó incomunicado, los demás pueden haber elegido un nuevo líder. La "verdad" en un sistema distribuido no la define un nodo individual sino el consenso de la mayoría (quórum).',
  },
  {
    sectionTitle: 'Conocimiento, Verdad y Mentiras',
    positionAfterHeading: 'La verdad la define la mayoría',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Por qué los sistemas distribuidos usan quórums (mayorías) para tomar decisiones?',
    options: [
      { label: 'A', text: 'Porque es más rápido que consultar a todos los nodos' },
      { label: 'B', text: 'Porque un nodo individual puede estar equivocado sobre el estado del sistema, pero una mayoría reduce el riesgo de decisiones incorrectas' },
      { label: 'C', text: 'Porque los algoritmos de consenso requieren un número impar de nodos' },
      { label: 'D', text: 'Porque es una tradición de los sistemas bizantinos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Un nodo puede estar sufriendo una pausa GC, una partición de red, o simplemente estar lento. Si ese nodo tomara decisiones unilaterales (ej: "soy el líder"), podría causar inconsistencias. Un quórum asegura que al menos una mayoría está de acuerdo, y dos mayorías siempre se solapan en al menos un nodo.',
  },
  {
    sectionTitle: 'Conocimiento, Verdad y Mentiras',
    positionAfterHeading: 'Tokens de fencing',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cómo funciona un fencing token para prevenir que un nodo "zombie" cause daño?',
    options: [
      { label: 'A', text: 'Mata el proceso del nodo zombie automáticamente' },
      { label: 'B', text: 'Cada vez que se otorga un lock, se emite un token monotónicamente creciente; el servidor de almacenamiento rechaza escrituras con tokens más viejos' },
      { label: 'C', text: 'Envía un heartbeat especial que despierta al nodo pausado' },
      { label: 'D', text: 'Bloquea las conexiones de red del nodo zombie' },
    ],
    correctAnswer: 'B',
    explanation:
      'Un fencing token es un número que crece con cada otorgamiento de lock. Si el Nodo A obtiene el lock con token 33, se pausa, y el Nodo B obtiene el lock con token 34, cuando A "despierta" e intenta escribir con token 33, el servidor de almacenamiento rechaza la operación porque ya vio token 34.',
    justificationHint:
      'Es como un sistema de turnos: si tu número es 33 pero el mostrador ya atendió al 34, tu turno expiró. No importa que creas que sigues teniendo el lock.',
  },
  {
    sectionTitle: 'Conocimiento, Verdad y Mentiras',
    positionAfterHeading: 'Fallas Bizantinas',
    sortOrder: 3,
    format: 'tf',
    questionText:
      'La mayoría de los sistemas distribuidos en datacenters necesitan tolerancia a fallas bizantinas.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Las fallas bizantinas (nodos que mienten o envían datos corruptos intencionalmente) son relevantes en sistemas sin confianza (ej: blockchain, sistemas aeroespaciales). En un datacenter donde controlas todos los nodos, se asume que los nodos son "honestos pero falibles". Implementar tolerancia bizantina es extremadamente costoso y rara vez justificado.',
  },

  // ── Section 4: Modelos de Sistema y Corrección ───────────────────────

  {
    sectionTitle: 'Modelos de Sistema y Corrección',
    positionAfterHeading: 'Modelo del Sistema y la Realidad',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuáles son los tres modelos de sistema respecto al timing que describe Kleppmann?',
    options: [
      { label: 'A', text: 'Síncrono, asíncrono, semi-síncrono' },
      { label: 'B', text: 'Redes síncronas, parcialmente síncronas y asíncronas' },
      { label: 'C', text: 'Rápido, lento y variable' },
      { label: 'D', text: 'Determinista, probabilístico y caótico' },
    ],
    correctAnswer: 'B',
    explanation:
      'El modelo síncrono asume cotas superiores para latencia y desfase de reloj. El parcialmente síncrono asume que se comporta como síncrono la mayoría del tiempo pero puede exceder los límites. El asíncrono no asume ninguna cota temporal. El modelo parcialmente síncrono es el más realista para sistemas reales.',
  },
  {
    sectionTitle: 'Modelos de Sistema y Corrección',
    positionAfterHeading: 'Corrección de un algoritmo',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Qué significa que un algoritmo sea "correcto" en el contexto de sistemas distribuidos?',
    options: [
      { label: 'A', text: 'Que siempre termina en tiempo finito' },
      { label: 'B', text: 'Que satisface sus propiedades requeridas en todas las situaciones que el modelo de sistema permite' },
      { label: 'C', text: 'Que nunca produce errores de ejecución' },
      { label: 'D', text: 'Que funciona correctamente en el caso promedio' },
    ],
    correctAnswer: 'B',
    explanation:
      'La corrección se define formalmente: un algoritmo es correcto si sus propiedades se cumplen en todas las situaciones posibles dentro del modelo de sistema asumido. Si el modelo permite crashes, el algoritmo debe funcionar ante crashes. Si permite retrasos ilimitados, debe funcionar con cualquier retraso.',
  },
  {
    sectionTitle: 'Modelos de Sistema y Corrección',
    positionAfterHeading: 'Seguridad y vivacidad',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Cuál es la diferencia entre una propiedad de seguridad (safety) y una de vivacidad (liveness)?',
    options: [
      { label: 'A', text: 'Safety se refiere a encriptación; liveness a disponibilidad' },
      { label: 'B', text: 'Safety dice "nada malo sucede" y si se viola es en un punto específico; liveness dice "algo bueno eventualmente sucede"' },
      { label: 'C', text: 'Safety es obligatoria; liveness es opcional' },
      { label: 'D', text: 'Safety se garantiza con hardware; liveness con software' },
    ],
    correctAnswer: 'B',
    explanation:
      'Safety = "nada malo sucede" (ej: nunca dos nodos son líder simultáneamente). Si se viola, puedes señalar el momento exacto. Liveness = "algo bueno eventualmente sucede" (ej: eventualmente se elige un líder). Los sistemas deben garantizar safety siempre, pero pueden relajar liveness ante fallos.',
    justificationHint:
      'Ejemplo: "unicidad" (no se emiten dos tokens de fencing iguales) es safety. "Disponibilidad" (eventualmente se puede obtener un lock) es liveness. ¿Cuál es más peligroso violar?',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching Ch8 section IDs from Supabase...\n');

  // Fetch all sections for ddia-ch8
  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'ddia-ch8')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for ddia-ch8. Seed sections first.');
    process.exit(1);
  }

  console.log(`Found ${sections.length} sections:`);
  const titleToId = new Map<string, string>();
  for (const s of sections) {
    console.log(`  ${s.section_title} → ${s.id}`);
    titleToId.set(s.section_title, s.id);
  }

  // Clear existing quizzes for these sections
  const sectionIds = sections.map((s) => s.id);
  const { error: deleteError } = await supabase
    .from('inline_quizzes')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Error clearing existing quizzes:', deleteError);
    process.exit(1);
  }

  console.log('\nCleared existing quizzes for Ch8 sections.');

  // Resolve section IDs and insert quizzes
  const toInsert = [];
  let skipped = 0;

  for (const quiz of QUIZZES) {
    const sectionId = titleToId.get(quiz.sectionTitle);
    if (!sectionId) {
      console.warn(`  Warning: No section found for "${quiz.sectionTitle}", skipping.`);
      skipped++;
      continue;
    }

    toInsert.push({
      section_id: sectionId,
      position_after_heading: quiz.positionAfterHeading,
      sort_order: quiz.sortOrder,
      format: quiz.format,
      question_text: quiz.questionText,
      options: quiz.options,
      correct_answer: quiz.correctAnswer,
      explanation: quiz.explanation,
      justification_hint: quiz.justificationHint ?? null,
      is_active: true,
    });
  }

  if (toInsert.length === 0) {
    console.error('No quizzes to insert. Check section title matching.');
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from('inline_quizzes')
    .insert(toInsert);

  if (insertError) {
    console.error('Error inserting quizzes:', insertError);
    process.exit(1);
  }

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for DDIA Ch8`);
  if (skipped > 0) {
    console.log(`  (${skipped} skipped due to missing sections)`);
  }

  // Summary by section
  const countBySection = new Map<string, number>();
  const formatCount = { mc: 0, tf: 0, mc2: 0 };
  for (const q of toInsert) {
    const title = [...titleToId.entries()].find(([, id]) => id === q.section_id)?.[0] ?? 'unknown';
    countBySection.set(title, (countBySection.get(title) ?? 0) + 1);
    formatCount[q.format as keyof typeof formatCount]++;
  }
  console.log('\nPer-section breakdown:');
  for (const [title, count] of countBySection) {
    console.log(`  ${title}: ${count} quizzes`);
  }
  console.log(`\nBy format: MC=${formatCount.mc}, TF=${formatCount.tf}, MC2=${formatCount.mc2}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
