export interface QuestionBankEntry {
  concept_id: string;
  type: 'definition' | 'fact' | 'property' | 'guarantee' | 'complexity' | 'comparison' | 'scenario' | 'limitation' | 'error_spot';
  format: 'open' | 'mc' | 'tf';
  question_text: string;
  expected_answer: string;
  options?: { label: string; text: string }[];
  correct_answer?: string;
  explanation?: string;
  difficulty: 1 | 2 | 3;
  related_concept_id?: string;
}

export const clawvaultAgentMemoryBank: QuestionBankEntry[] = [
  // ─── DEFINITION (4 questions, difficulty 1) ───────────────────────────

  {
    concept_id: 'external-memory',
    type: 'definition',
    format: 'open',
    question_text:
      '¿Qué es el problema de "context death" en agentes de IA y por qué es crítico para sistemas multi-sesión?',
    expected_answer:
      'Context death es la pérdida total de memoria del agente entre sesiones. Cada vez que un agente inicia una nueva conversación, pierde todo el contexto acumulado: decisiones previas, preferencias del usuario, compromisos adquiridos y lecciones aprendidas. Es crítico porque obliga al usuario a re-explicar todo, el agente repite errores ya corregidos, y no puede mantener coherencia en proyectos largos.',
    difficulty: 1,
  },

  {
    concept_id: 'external-memory',
    type: 'definition',
    format: 'mc',
    question_text:
      '¿Qué es el patrón vault index en ClawVault y por qué es más eficiente que embeddings para la mayoría de queries?',
    expected_answer:
      'Es un archivo índice que el agente escanea primero para decidir qué archivos de memoria cargar. Es más eficiente que embeddings porque evita la complejidad de vectorizar, almacenar y hacer similarity search para queries que se resuelven con una simple búsqueda textual en el índice.',
    options: [
      { label: 'A', text: 'Un vector store local que indexa todos los archivos markdown con embeddings on-device' },
      { label: 'B', text: 'Un archivo índice escaneado primero por el agente para decidir qué archivos de memoria cargar, sin necesidad de embeddings' },
      { label: 'C', text: 'Una base de datos SQLite que almacena metadatos de cada nota para búsqueda rápida' },
      { label: 'D', text: 'Un sistema de tags jerárquicos que reemplaza la necesidad de búsqueda semántica' },
    ],
    correct_answer: 'B',
    explanation:
      'El vault index es un patrón minimalista: un archivo plano que actúa como tabla de contenidos. El agente lo lee primero y decide qué archivos específicos necesita, evitando la infraestructura de embeddings para queries directas.',
    difficulty: 1,
  },

  {
    concept_id: 'memory-management',
    type: 'definition',
    format: 'open',
    question_text:
      '¿Cuáles son los seis tipos de memoria que ClawVault clasifica y por qué es importante tiparlos?',
    expected_answer:
      'Los seis tipos son: decisions (decisiones tomadas), preferences (preferencias del usuario), relationships (relaciones entre conceptos o personas), commitments (compromisos adquiridos), lessons (lecciones aprendidas de errores) y handoffs (contexto de transición entre sesiones). Tiparlos es importante porque permite priorizar qué inyectar en el contexto limitado del LLM: un commitment activo es más urgente que una preference general.',
    difficulty: 1,
  },

  {
    concept_id: 'external-memory',
    type: 'definition',
    format: 'open',
    question_text:
      '¿Qué es el "Obsidian insight" en el que se basa ClawVault y qué tres características técnicas aprovecha?',
    expected_answer:
      'El insight es que las notas de Obsidian son simplemente archivos markdown en el filesystem. Las tres características técnicas que aprovecha son: (1) notas como archivos planos en disco, (2) YAML frontmatter para metadatos estructurados, y (3) wiki-links ([[nota]]) para crear conexiones entre notas. Esto permite construir un knowledge graph sin infraestructura adicional.',
    difficulty: 1,
  },

  // ─── FACT / PROPERTY (4 questions, difficulty 1-2) ────────────────────

  {
    concept_id: 'embeddings',
    type: 'fact',
    format: 'mc',
    question_text:
      '¿Qué resultado arrojó el benchmark LoCoMo al comparar archivos markdown simples contra herramientas especializadas de memoria?',
    expected_answer:
      'Los archivos markdown obtuvieron 74% de precisión contra 68.5% de las herramientas especializadas.',
    options: [
      { label: 'A', text: 'Markdown 68.5% vs herramientas especializadas 74%' },
      { label: 'B', text: 'Markdown 74% vs herramientas especializadas 68.5%' },
      { label: 'C', text: 'Markdown 82% vs herramientas especializadas 79%' },
      { label: 'D', text: 'Markdown 61% vs herramientas especializadas 74%' },
    ],
    correct_answer: 'B',
    explanation:
      'El benchmark LoCoMo demostró que archivos markdown simples superaron a herramientas especializadas de memoria por 5.5 puntos porcentuales (74% vs 68.5%), validando el enfoque file-based de ClawVault.',
    difficulty: 1,
  },

  {
    concept_id: 'memory-management',
    type: 'property',
    format: 'open',
    question_text:
      '¿Cómo funciona la inyección de contexto budget-aware en ClawVault y qué sistema de prioridades utiliza?',
    expected_answer:
      'ClawVault clasifica las memorias en tres niveles de prioridad para inyección al contexto del LLM: rojo (Critical) para memorias urgentes como commitments activos y decisiones recientes, amarillo (Notable) para preferencias y relaciones relevantes, y verde (Background) para contexto general y lecciones pasadas. El sistema inyecta primero las rojas, luego las amarillas si queda presupuesto de tokens, y finalmente las verdes con el espacio restante.',
    difficulty: 2,
  },

  {
    concept_id: 'external-memory',
    type: 'property',
    format: 'tf',
    question_text:
      'Verdadero o Falso: ClawVault requiere servicios cloud para funcionar y almacena los datos de memoria en servidores remotos.',
    expected_answer:
      'Falso. ClawVault opera con zero cloud y full data sovereignty. Toda la memoria se almacena como archivos locales en el filesystem del usuario, sin depender de servicios externos ni enviar datos a la nube.',
    correct_answer: 'false',
    explanation:
      'Uno de los principios fundamentales de ClawVault es la soberanía total de datos. Al usar archivos markdown locales, el usuario mantiene control completo sin dependencia de infraestructura cloud.',
    difficulty: 1,
  },

  {
    concept_id: 'memory-management',
    type: 'fact',
    format: 'open',
    question_text:
      '¿Qué problema causa la compresión LLM en las memorias del agente y cómo lo soluciona ClawVault?',
    expected_answer:
      'Cuando un LLM comprime o reescribe memorias para ahorrar tokens, tiende a reemplazar keywords técnicos específicos con sinónimos o paráfrasis, perdiendo precisión en los términos clave. ClawVault lo soluciona aplicando regex post-processing después de la compresión: expresiones regulares que detectan y restauran los keywords originales que el LLM pudo haber alterado durante la reescritura.',
    difficulty: 2,
  },

  // ─── COMPARISON (3 questions, difficulty 2) ───────────────────────────

  {
    concept_id: 'vector-search',
    type: 'comparison',
    format: 'open',
    question_text:
      'Compara el enfoque de ClawVault (vault index + archivos markdown) con vector databases para memoria de agentes. ¿En qué casos cada uno es superior?',
    expected_answer:
      'ClawVault con vault index es superior cuando: las queries son directas y resolubles por búsqueda textual, el volumen de memorias es manejable, se prioriza simplicidad operacional y data sovereignty. Vector databases son superiores cuando: el volumen de memorias es masivo (miles de documentos), las queries requieren búsqueda semántica genuina (encontrar memorias conceptualmente relacionadas pero con vocabulario diferente), o se necesita similarity search a escala. El benchmark LoCoMo sugiere que para la mayoría de casos de uso de agentes, el enfoque file-based supera a los especializados.',
    difficulty: 2,
    related_concept_id: 'embeddings',
  },

  {
    concept_id: 'memory-management',
    type: 'comparison',
    format: 'mc',
    question_text:
      '¿Cuál es la ventaja principal de memoria tipada (decisions, preferences, commitments...) frente a memoria no tipada (texto libre sin categorías)?',
    expected_answer:
      'La memoria tipada permite priorización automática en la inyección de contexto: el sistema sabe que un commitment activo es más urgente que una preference general.',
    options: [
      { label: 'A', text: 'La memoria tipada ocupa menos tokens porque usa códigos de tipo en lugar de texto descriptivo' },
      { label: 'B', text: 'La memoria tipada permite priorización automática en la inyección de contexto según urgencia y relevancia del tipo' },
      { label: 'C', text: 'La memoria tipada es más fácil de comprimir por el LLM porque tiene estructura predefinida' },
      { label: 'D', text: 'La memoria tipada permite usar embeddings más precisos porque cada tipo genera un vector space separado' },
    ],
    correct_answer: 'B',
    explanation:
      'El tipado de memorias habilita el sistema budget-aware de ClawVault: al saber que un dato es un commitment vs una preference, puede decidir automáticamente qué inyectar primero cuando el presupuesto de tokens es limitado.',
    difficulty: 2,
    related_concept_id: 'external-memory',
  },

  {
    concept_id: 'external-memory',
    type: 'comparison',
    format: 'open',
    question_text:
      'Compara ClawVault con servicios como Mem0 y Zep. ¿Qué trade-offs fundamentales existen entre el enfoque file-based local y los servicios de memoria gestionados?',
    expected_answer:
      'ClawVault ofrece: zero cloud, full data sovereignty, sin costos recurrentes, inspección directa de archivos, y el benchmark LoCoMo muestra que archivos markdown superan herramientas especializadas. Los servicios como Mem0 y Zep ofrecen: búsqueda semántica avanzada con embeddings, escalabilidad automática, APIs listas para producción, y gestión de memoria distribuida. El trade-off fundamental es control y simplicidad (ClawVault) vs features avanzados y escalabilidad (servicios gestionados).',
    difficulty: 2,
    related_concept_id: 'vector-search',
  },

  // ─── SCENARIO (4 questions, difficulty 2-3) ───────────────────────────

  {
    concept_id: 'memory-management',
    type: 'scenario',
    format: 'open',
    question_text:
      'Estás diseñando la memoria para un coding agent que trabaja en proyectos de larga duración (meses). El agente debe recordar decisiones arquitectónicas, tech debt identificado, y promesas de refactor. ¿Cómo estructurarías las memorias usando el modelo ClawVault?',
    expected_answer:
      'Usaría los tipos de memoria de ClawVault así: decisions para decisiones arquitectónicas (por qué se eligió PostgreSQL sobre MongoDB, por qué se usó microservicios), commitments para promesas de refactor con fechas estimadas, lessons para tech debt identificado y errores pasados. Cada nota tendría YAML frontmatter con fecha, prioridad y proyecto. Wiki-links conectarían decisiones relacionadas (ej: [[decision-db-choice]] linkeado desde [[commitment-migrate-queries]]). El vault index listaría las notas por proyecto y tipo, y la inyección budget-aware priorizaría commitments activos y decisions recientes sobre lessons antiguas.',
    difficulty: 2,
    related_concept_id: 'external-memory',
  },

  {
    concept_id: 'external-memory',
    type: 'scenario',
    format: 'open',
    question_text:
      'Tu agente tiene un context window de 8K tokens y necesita recordar 200 memorias acumuladas. ¿Cómo implementarías la selección de qué memorias inyectar usando los principios de ClawVault?',
    expected_answer:
      'Primero, el agente escanea el vault index para identificar memorias relevantes al query actual. Luego aplica el sistema budget-aware de tres niveles: inyecta todas las memorias rojas (Critical) relevantes, como commitments activos y decisiones del proyecto actual. Si queda presupuesto, añade las amarillas (Notable) como preferences y relationships. Con el espacio restante, incluye verdes (Background). Si aun así excede los 8K, aplica compresión LLM con regex post-processing para preservar keywords técnicos. El vault index evita cargar las 200 memorias: solo se leen los archivos que el índice identifica como relevantes.',
    difficulty: 2,
    related_concept_id: 'memory-management',
  },

  {
    concept_id: 'memory-management',
    type: 'scenario',
    format: 'open',
    question_text:
      'Un equipo quiere adoptar ClawVault pero tiene 5 agentes diferentes que comparten contexto sobre el mismo cliente. ¿Cómo manejarías la memoria compartida y qué limitaciones del enfoque file-based aparecerían?',
    expected_answer:
      'Con archivos locales, la memoria compartida requiere un vault centralizado accesible por los 5 agentes (ej: directorio compartido o repo Git). Los wiki-links permitirían que cada agente cree notas referenciando las de otros. Sin embargo, aparecen limitaciones: concurrencia de escritura (dos agentes editando el mismo archivo), consistencia eventual si se usa Git sync, falta de locks nativos, y el vault index podría convertirse en bottleneck si todos lo leen/escriben simultáneamente. En este punto, un servicio gestionado como Mem0 o Zep con APIs de concurrencia podría ser más apropiado.',
    difficulty: 3,
    related_concept_id: 'external-memory',
  },

  {
    concept_id: 'vector-search',
    type: 'scenario',
    format: 'open',
    question_text:
      'Tu agente necesita encontrar una memoria sobre "la vez que el deploy falló por un conflicto de versiones de Node" pero la nota está guardada como "Incident: production outage due to runtime mismatch". ¿Cómo manejaría esto ClawVault vs un sistema basado en embeddings?',
    expected_answer:
      'ClawVault con vault index tendría dificultades: la búsqueda textual no conectaría "conflicto de versiones de Node" con "runtime mismatch" a menos que el índice o los tags del frontmatter contengan ambos términos. Un sistema de embeddings capturaría la relación semántica entre ambas frases y encontraría la nota por similarity. Este es precisamente el caso donde embeddings son superiores: queries con vocabulario diferente al de la memoria almacenada. ClawVault lo mitigaría parcialmente con wiki-links (si la nota está linkeada desde otras notas con términos diversos) y YAML tags descriptivos.',
    difficulty: 3,
    related_concept_id: 'embeddings',
  },

  // ─── LIMITATION (2 questions, difficulty 3) ───────────────────────────

  {
    concept_id: 'external-memory',
    type: 'limitation',
    format: 'open',
    question_text:
      '¿En qué escenarios específicos la memoria file-based de ClawVault se convierte en una mala elección a pesar de los resultados del benchmark LoCoMo?',
    expected_answer:
      'ClawVault es mala elección cuando: (1) el volumen de memorias escala a miles de documentos, donde el vault index lineal se vuelve lento y los embeddings con ANN search son órdenes de magnitud más rápidos; (2) múltiples agentes necesitan acceso concurrente con escritura, donde la falta de locks y transacciones causa conflictos; (3) las queries son predominantemente semánticas con vocabulario variable, donde la búsqueda textual del índice falla; (4) se requiere distribución geográfica de la memoria, imposible con archivos locales; (5) el entorno de ejecución es serverless o efímero sin filesystem persistente.',
    difficulty: 3,
    related_concept_id: 'vector-search',
  },

  {
    concept_id: 'memory-management',
    type: 'limitation',
    format: 'open',
    question_text:
      '¿Qué limitaciones tiene el knowledge graph basado en wiki-links de ClawVault comparado con un graph database dedicado como Neo4j?',
    expected_answer:
      'Las limitaciones son: (1) los wiki-links son unidireccionales por defecto (A linkea a B, pero B no sabe que A la referencia, a menos que se implemente backlink scanning); (2) no hay tipado de relaciones (un wiki-link no distingue entre "depende de", "contradice", o "extiende"); (3) traversal queries complejas (encontrar todos los nodos a 3 saltos de distancia) requieren parsing recursivo de archivos, mientras Neo4j lo resuelve con Cypher en milisegundos; (4) no hay índices sobre propiedades de relaciones; (5) la consistencia del grafo depende de que los archivos referenciados existan, sin validación automática de integridad referencial.',
    difficulty: 3,
    related_concept_id: 'external-memory',
  },

  // ─── ERROR_SPOT (2 questions, difficulty 3) ───────────────────────────

  {
    concept_id: 'embeddings',
    type: 'error_spot',
    format: 'open',
    question_text:
      'Encuentra el error en esta afirmación: "El benchmark LoCoMo demuestra que los embeddings y vector databases son inútiles para memoria de agentes, ya que archivos markdown simples siempre los superan en precisión."',
    expected_answer:
      'Hay dos errores. Primero, el benchmark LoCoMo mostró que markdown supera a herramientas especializadas en un escenario específico (74% vs 68.5%), pero esto no significa que embeddings sean "inútiles": son superiores para búsqueda semántica con vocabulario variable y para volúmenes masivos de memoria. Segundo, la palabra "siempre" es incorrecta: el benchmark mide un conjunto particular de tareas de memoria conversacional, no todos los posibles casos de uso. Para queries que requieren matching conceptual (no textual), los embeddings seguirán siendo superiores.',
    difficulty: 3,
    related_concept_id: 'vector-search',
  },

  {
    concept_id: 'memory-management',
    type: 'error_spot',
    format: 'open',
    question_text:
      'Encuentra el error en esta afirmación: "La compresión LLM es la solución ideal para manejar memorias largas en ClawVault: el LLM resume las notas preservando toda la información relevante, eliminando la necesidad de budget-aware injection."',
    expected_answer:
      'Hay dos errores fundamentales. Primero, la compresión LLM NO preserva toda la información: el artículo documenta que el LLM reescribe keywords técnicos con sinónimos o paráfrasis, perdiendo precisión terminológica. Por eso ClawVault necesita regex post-processing para restaurar los keywords originales. Segundo, la compresión NO elimina la necesidad de budget-aware injection: son mecanismos complementarios, no sustitutos. Primero se seleccionan las memorias relevantes por prioridad (budget-aware), y luego se comprimen si es necesario para caber en el context window. Sin priorización, comprimirías memorias irrelevantes desperdiciando tokens.',
    difficulty: 3,
    related_concept_id: 'external-memory',
  },
];
