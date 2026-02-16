#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for OpenClaw case study resource sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-openclaw.ts
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
  // ── Section 0: Protocolo de Comunicación de Agentes (ACP) ─────────────

  {
    sectionTitle: 'Protocolo de Comunicación de Agentes (ACP)',
    positionAfterHeading: 'Protocolo de Comunicación de Agentes (ACP)',
    sortOrder: 0,
    format: 'mc',
    questionText:
      'Un equipo está diseñando un sistema de agentes donde el cliente necesita enviar señales de cancelación mientras el agente está generando una respuesta en streaming. ¿Qué combinación de tecnologías sería MENOS adecuada para este requisito?',
    options: [
      { label: 'A', text: 'WebSockets bidireccionales con mensajes de control' },
      { label: 'B', text: 'NDJSON sobre streams de proceso con AbortController' },
      { label: 'C', text: 'Server-Sent Events (SSE) como único canal de comunicación' },
      { label: 'D', text: 'gRPC bidirectional streaming con cancellation tokens' },
    ],
    correctAnswer: 'C',
    explanation:
      'SSE es unidireccional (servidor → cliente), por lo que el cliente no puede enviar señales de cancelación por el mismo canal. Necesitaría un canal separado (como un endpoint HTTP adicional) para comunicar cancelaciones, lo que fragmenta la lógica de comunicación. WebSockets, NDJSON con AbortController, y gRPC bidireccional soportan comunicación en ambas direcciones de forma nativa, permitiendo cancelación cooperativa sin canales adicionales.',
  },
  {
    sectionTitle: 'Protocolo de Comunicación de Agentes (ACP)',
    positionAfterHeading: 'Protocolo de Comunicación de Agentes (ACP)',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'El patrón de child process que usa ACP para comunicación local (spawn + stdio pipes) elimina la latencia de red, pero impide que el cliente y el agente se ejecuten en máquinas diferentes.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Al usar spawn de un proceso hijo con stdio pipes, la comunicación ocurre a través del kernel del sistema operativo local (pipes POSIX), no a través de la red. Esto elimina latencia de red y overhead de serialización de protocolos de red, pero inherentemente requiere que ambos procesos estén en la misma máquina. Para ejecución remota, se necesitaría un protocolo de red (WebSockets, HTTP, gRPC). OpenClaw mitiga esta limitación a través del gateway, que puede conectarse a backends remotos.',
  },
  {
    sectionTitle: 'Protocolo de Comunicación de Agentes (ACP)',
    positionAfterHeading: 'Protocolo de Comunicación de Agentes (ACP)',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      'El session-mapper de ACP resuelve identificadores externos (como IDs de conversación de Discord) a session keys internas. ¿Qué problema arquitectónico emergería si se eliminara este componente y se usaran directamente los IDs externos como session keys?',
    options: [
      { label: 'A', text: 'Mayor latencia en la resolución de sesiones' },
      { label: 'B', text: 'Acoplamiento directo entre el formato de identificadores de cada plataforma y el sistema de sesiones interno, rompiendo la extensibilidad al añadir nuevos canales' },
      { label: 'C', text: 'Imposibilidad de mantener sesiones activas por más de 24 horas' },
      { label: 'D', text: 'Pérdida de cifrado end-to-end en las sesiones' },
    ],
    correctAnswer: 'B',
    explanation:
      'Sin el session-mapper, el sistema de sesiones debería entender directamente los formatos de identificadores de cada plataforma (Discord usa snowflake IDs, Telegram usa integers, WhatsApp usa números telefónicos). Cada nueva plataforma requeriría modificar el core del sistema de sesiones en lugar de solo añadir un mapper. El session-mapper actúa como un Anti-Corruption Layer (DDD): traduce entre el modelo externo y el interno, aislando el dominio core de cambios en las integraciones.',
    justificationHint:
      'Piensa en el Single Responsibility Principle aplicado a nivel de componente. ¿Qué pasaría si mañana necesitas integrar Microsoft Teams, que usa GUIDs como identificadores? ¿Cuántos archivos tendrías que modificar con y sin el session-mapper?',
  },

  // ── Section 1: Arquitectura de Plugins y Gestión de Canales ───────────

  {
    sectionTitle: 'Arquitectura de Plugins y Gestión de Canales',
    positionAfterHeading: 'Arquitectura de Plugins y Gestión de Canales',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      'OpenClaw implementa un modelo de seguridad multi-capa con command gating, mention gating, DM policies y group policies. ¿Cuál es la consecuencia principal de este enfoque de defensa en profundidad comparado con un único punto de autorización?',
    options: [
      { label: 'A', text: 'Mayor rendimiento porque las verificaciones se ejecutan en paralelo' },
      { label: 'B', text: 'Si una capa de seguridad tiene un bug o es bypaseada, las capas restantes siguen protegiendo el sistema, a costa de mayor complejidad de configuración' },
      { label: 'C', text: 'Elimina completamente la posibilidad de acceso no autorizado' },
      { label: 'D', text: 'Simplifica el debugging porque cada capa genera logs independientes' },
    ],
    correctAnswer: 'B',
    explanation:
      'La defensa en profundidad es un principio de seguridad donde múltiples capas independientes protegen el sistema. Si el mention gating falla (por ejemplo, el agente responde sin ser mencionado), el command gating todavía verifica que el usuario tenga permiso para ejecutar el comando. Si el command gating falla, las DM/group policies todavía restringen qué acciones son posibles. El trade-off real es complejidad: un administrador debe entender y configurar correctamente todas las capas, y la interacción entre ellas puede producir comportamientos inesperados.',
    justificationHint:
      'Imagina un escenario donde un usuario en un grupo público envía un comando destructivo. Traza el flujo a través de cada capa: mention gating → command gating → group policies. ¿Qué pasaría si solo tuvieras una capa y tuviera un bug?',
  },
  {
    sectionTitle: 'Arquitectura de Plugins y Gestión de Canales',
    positionAfterHeading: 'Arquitectura de Plugins y Gestión de Canales',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'El campo metadata de tipo Record<string, unknown> en NormalizedMessage rompe la abstracción del sistema de canales, porque cualquier lógica que acceda a datos específicos de plataforma dentro de metadata introduce acoplamiento con esa plataforma.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Este es un trade-off explícito del diseño. El formato normalizado NormalizedMessage abstrae las diferencias entre plataformas, pero el campo metadata es una "escape hatch" que permite acceder a datos específicos (como reactions custom de Discord o entities de Telegram). Cualquier código que lea metadata.discord_guild_id está acoplado a Discord y viola la abstracción. Es un ejemplo del Leaky Abstraction principle de Joel Spolsky: toda abstracción no-trivial filtra detalles de implementación. OpenClaw acepta esta filtración controlada como alternativa a perder información de plataforma que podría ser necesaria.',
  },
  {
    sectionTitle: 'Arquitectura de Plugins y Gestión de Canales',
    positionAfterHeading: 'Arquitectura de Plugins y Gestión de Canales',
    sortOrder: 2,
    format: 'mc',
    questionText:
      'El sistema de configuración de canales de OpenClaw usa cascade resolution (canal específico → tipo de canal → defaults globales). ¿A qué patrón conocido es más análogo este enfoque?',
    options: [
      { label: 'A', text: 'Observer pattern: notificar a múltiples suscriptores de cambios de configuración' },
      { label: 'B', text: 'CSS specificity: reglas más específicas sobreescriben las más generales' },
      { label: 'C', text: 'Singleton pattern: asegurar una única instancia de configuración global' },
      { label: 'D', text: 'Factory pattern: crear instancias de configuración según el tipo de canal' },
    ],
    correctAnswer: 'B',
    explanation:
      'La cascade resolution sigue el mismo principio que CSS specificity: primero se busca la regla más específica (configuración explícita del canal), luego la más general (defaults del tipo de canal), y finalmente el fallback global. El usuario solo necesita configurar lo que difiere del comportamiento por defecto, igual que en CSS solo se sobreescriben los estilos que necesitan cambiar. Los sistemas operativos usan un patrón similar: per-user → per-system → built-in defaults.',
  },

  // ── Section 2: Skills y Orquestación de Herramientas ──────────────────

  {
    sectionTitle: 'Skills y Orquestación de Herramientas',
    positionAfterHeading: 'Skills y Orquestación de Herramientas',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'La decisión de OpenClaw de delegar a CLIs externos (como gh para GitHub) en lugar de reimplementar las APIs directamente reduce la superficie de seguridad del sistema porque los CLIs son herramientas auditadas por la comunidad.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Es al revés: invocar procesos externos AMPLÍA la superficie de seguridad. Un CLI externo tiene acceso completo al sistema de archivos y a la red del host, mientras que una llamada HTTP a una API está contenida a la comunicación de red. Si un CLI es comprometido (supply chain attack, PATH hijacking), el atacante obtiene ejecución de código con los privilegios del usuario. La ventaja de los CLIs es reutilización de ecosistema y cobertura de API, no seguridad. La seguridad es explícitamente un trade-off negativo de esta decisión arquitectónica.',
  },
  {
    sectionTitle: 'Skills y Orquestación de Herramientas',
    positionAfterHeading: 'Skills y Orquestación de Herramientas',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      'OpenClaw requiere confirmación explícita del usuario antes de ejecutar acciones destructivas inferidas por el agente. ¿Por qué este patrón es más crítico en un sistema de agentes que en una interfaz tradicional (como un diálogo de confirmación en una GUI)?',
    options: [
      { label: 'A', text: 'Porque los agentes son más lentos para ejecutar acciones que las GUIs' },
      { label: 'B', text: 'Porque la acción fue inferida por un LLM a partir de lenguaje natural, no solicitada explícitamente, lo que aumenta la probabilidad de error de interpretación' },
      { label: 'C', text: 'Porque los agentes no tienen acceso a logs de auditoría' },
      { label: 'D', text: 'Porque las APIs externas no soportan operaciones de undo' },
    ],
    correctAnswer: 'B',
    explanation:
      'En una GUI tradicional, el usuario hace click en "Eliminar repositorio" — la intención es explícita y unívoca. En un agente, el usuario dice "limpia mis repos viejos" y el LLM INTERPRETA qué significa "viejos" y qué significa "limpiar". Esta interpretación puede ser incorrecta: el modelo podría eliminar repos que el usuario quería conservar. La probabilidad de error es inherentemente mayor cuando la intención pasa por interpretación de lenguaje natural, lo que justifica confirmaciones más agresivas que en interfaces donde la intención es directa.',
    justificationHint:
      'Piensa en la cadena: intención del usuario → lenguaje natural → interpretación del LLM → acción. Cada paso introduce posibilidad de error. Compara con GUI: intención → click en botón específico → acción. ¿Cuántos puntos de fallo tiene cada cadena?',
  },
  {
    sectionTitle: 'Skills y Orquestación de Herramientas',
    positionAfterHeading: 'Skills y Orquestación de Herramientas',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál es la diferencia arquitectónica clave entre LangChain Tools y OpenClaw Skills que determina sus contextos de deployment óptimos?',
    options: [
      { label: 'A', text: 'LangChain Tools usan Python y OpenClaw Skills usan TypeScript' },
      { label: 'B', text: 'LangChain Tools son self-contained (in-process) ideales para containers serverless, mientras que OpenClaw Skills dependen de binarios del sistema operativo host, ideales para agentes personales locales' },
      { label: 'C', text: 'LangChain Tools soportan streaming y OpenClaw Skills no' },
      { label: 'D', text: 'OpenClaw Skills son más rápidos porque usan compilación ahead-of-time' },
    ],
    correctAnswer: 'B',
    explanation:
      'LangChain Tools son funciones Python con schemas — se ejecutan in-process sin dependencias externas, lo que las hace portables a cualquier entorno (container, serverless, cloud). OpenClaw Skills frecuentemente delegan a CLIs del sistema (gh, op, osascript), lo que los acopla al entorno del host pero les da acceso a todo el ecosistema de herramientas locales. Un agente en AWS Lambda no puede usar AppleScript; un agente en el MacBook del usuario sí. El diseño del sistema de herramientas debe reflejar el contexto de deployment.',
  },

  // ── Section 3: Memoria Persistente y Autenticación ────────────────────

  {
    sectionTitle: 'Memoria Persistente y Autenticación',
    positionAfterHeading: 'Memoria Persistente y Autenticación',
    sortOrder: 0,
    format: 'mc',
    questionText:
      'OpenClaw usa archivos locales para memoria de corto plazo (memory-core) y LanceDB para largo plazo (memory-lancedb). Si el volumen de memoria de corto plazo creciera a 100,000 entradas, ¿cuál sería el primer problema que aparecería?',
    options: [
      { label: 'A', text: 'Los archivos se corromperían por escrituras concurrentes' },
      { label: 'B', text: 'La búsqueda lineal O(n) sobre archivos planos se volvería un cuello de botella de latencia, mientras que una base de datos indexada mantendría O(log n)' },
      { label: 'C', text: 'El sistema operativo no podría manejar tantos archivos en un directorio' },
      { label: 'D', text: 'Los embeddings de OpenAI fallarían por exceder el rate limit' },
    ],
    correctAnswer: 'B',
    explanation:
      'memory-core usa búsqueda lineal sobre archivos planos, que es O(n). Para las decenas o cientos de entradas típicas de memoria de corto plazo, esto es imperceptible. Pero a 100,000 entradas, cada búsqueda requeriría escanear todos los archivos secuencialmente, lo que podría tomar cientos de milisegundos. Una base de datos con índices (B-tree o hash) resuelve esto en O(log n). Por eso el diseño de OpenClaw usa archivos solo para corto plazo (bajo volumen) y promueve datos a LanceDB (con índices vectoriales) cuando el volumen crece.',
  },
  {
    sectionTitle: 'Memoria Persistente y Autenticación',
    positionAfterHeading: 'Memoria Persistente y Autenticación',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Cuál es el riesgo principal del mecanismo autoCapture que almacena automáticamente "nuggets" de información de cada conversación?',
    options: [
      { label: 'A', text: 'Consume demasiado almacenamiento en disco' },
      { label: 'B', text: 'Puede preservar información que el usuario mencionó casualmente sin intención de que se almacenara permanentemente, creando un problema de privacidad temporal' },
      { label: 'C', text: 'Los nuggets extraídos siempre pierden contexto y se vuelven inútiles' },
      { label: 'D', text: 'Impide que el usuario acceda a sus datos bajo regulaciones GDPR' },
    ],
    correctAnswer: 'B',
    explanation:
      'autoCapture extrae y almacena información de conversaciones automáticamente. Un usuario que menciona "mi ex-pareja se llama María" en contexto de una conversación casual no necesariamente quiere que el agente recuerde esto indefinidamente. La captura automática viola la expectativa de "privacidad temporal" — la suposición de que lo dicho en conversación se olvida naturalmente. memory_forget proporciona control explícito, pero requiere que el usuario sepa qué fue capturado y actúe proactivamente para eliminarlo.',
    justificationHint:
      'Compara con una conversación humana: si le cuentas algo personal a un amigo, esperas que lo recuerde vagamente pero no que lo registre textualmente. ¿Debería un agente tener estándares de retención más estrictos que un humano? ¿Qué implicaciones tiene para la confianza del usuario?',
  },
  {
    sectionTitle: 'Memoria Persistente y Autenticación',
    positionAfterHeading: 'Memoria Persistente y Autenticación',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'El sistema de cooldowns exponenciales para perfiles de autenticación que fallan repetidamente (1 min → 5 min → 30 min) tiene como objetivo principal reducir la carga en los servidores de OpenClaw.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'El objetivo principal es prevenir rate limiting o bloqueo de cuenta por parte del proveedor externo (GitHub, Google, etc.), no proteger los servidores de OpenClaw. Si un refresh token falla porque fue revocado, reintentar agresivamente no resolverá el problema y puede resultar en que el proveedor bloquee la cuenta temporalmente o permanentemente. El cooldown exponencial da tiempo para que problemas transitorios se resuelvan y evita agravar problemas persistentes con retries innecesarios.',
  },

  // ── Section 4: A2UI: Interfaces Generadas por Agentes ─────────────────

  {
    sectionTitle: 'A2UI: Interfaces Generadas por Agentes',
    positionAfterHeading: 'A2UI: Interfaces Generadas por Agentes',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      'A2UI usa una estructura plana con referencias por parentId en lugar de anidamiento (como JSX). ¿Cuál es la razón principal de esta decisión desde la perspectiva de generación por LLMs?',
    options: [
      { label: 'A', text: 'Reduce el tamaño del payload JSON significativamente' },
      { label: 'B', text: 'Los LLMs no pueden generar estructuras anidadas de ningún tipo' },
      { label: 'C', text: 'Cada componente es un objeto independiente que no requiere que el LLM mantenga estado de anidamiento (tracking de brackets y niveles), reduciendo la probabilidad de JSON malformado' },
      { label: 'D', text: 'Permite renderizar componentes en orden alfabético' },
    ],
    correctAnswer: 'C',
    explanation:
      'En una estructura anidada, el LLM debe mantener un stack mental de qué brackets/llaves están abiertos a cada nivel de profundidad. Con 3+ niveles de anidamiento, los LLMs frecuentemente pierden tracking y generan JSON inválido (brackets sin cerrar, niveles incorrectos). La estructura plana con parentId elimina este problema: cada componente es un objeto JSON independiente y autocontenido. El LLM solo necesita generar objetos válidos uno por uno y asignar IDs de referencia, que es una tarea mucho más simple.',
    justificationHint:
      'Genera mentalmente un JSON con 4 niveles de anidamiento. Ahora genera la misma estructura como una lista plana con parentId. ¿En cuál es más probable cometer un error de sintaxis? ¿Qué pasa si el LLM necesita insertar un componente en medio de una estructura ya generada?',
  },
  {
    sectionTitle: 'A2UI: Interfaces Generadas por Agentes',
    positionAfterHeading: 'A2UI: Interfaces Generadas por Agentes',
    sortOrder: 1,
    format: 'mc',
    questionText:
      'Un atacante logra inyectar un prompt que hace que el agente genere un componente A2UI de tipo "script" con código JavaScript malicioso. ¿Qué sucede en el sistema A2UI?',
    options: [
      { label: 'A', text: 'El código se ejecuta en un sandbox aislado' },
      { label: 'B', text: 'El renderer rechaza el componente porque "script" no existe en el catálogo de componentes pre-aprobados, renderizando un fallback genérico o ignorándolo' },
      { label: 'C', text: 'El componente se renderiza pero sin acceso al DOM' },
      { label: 'D', text: 'El sistema detecta el ataque y bloquea al usuario' },
    ],
    correctAnswer: 'B',
    explanation:
      'El modelo de seguridad de A2UI se basa en un catálogo cerrado de componentes pre-aprobados. El renderer verifica que el tipo de cada componente exista en el catálogo ANTES de instanciarlo. "script" no es un tipo válido (solo existen tipos como data-table, action-button, text-block), así que el componente se ignora o se muestra un fallback. Este es el principio fundamental: el JSON del agente es datos no confiables, nunca código ejecutable. No importa qué genere el LLM — si no está en el catálogo, no se renderiza.',
  },
  {
    sectionTitle: 'A2UI: Interfaces Generadas por Agentes',
    positionAfterHeading: 'A2UI: Interfaces Generadas por Agentes',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'A2UI y Generative UI de Vercel (AI SDK) siguen el mismo principio de seguridad: ambos tratan la salida del LLM como datos declarativos y no como código ejecutable.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Son enfoques fundamentalmente diferentes. A2UI trata la salida del LLM como datos declarativos JSON validados contra un catálogo cerrado — nunca se ejecuta código generado por el modelo. Generative UI de Vercel genera componentes React reales server-side que se streaman al cliente como código ejecutable (RSC payloads). Vercel es más expresivo (puede generar cualquier componente React), pero tiene una superficie de seguridad mayor porque el LLM produce código, no datos. A2UI sacrifica expresividad por seguridad al restringir el output a un vocabulario finito de componentes pre-aprobados.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching openclaw-casestudy section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'openclaw-casestudy')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for openclaw-casestudy. Seed sections first.');
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

  console.log('\nCleared existing quizzes for openclaw-casestudy sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for OpenClaw case study`);
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
