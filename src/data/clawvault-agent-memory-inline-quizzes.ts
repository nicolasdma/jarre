export interface InlineQuiz {
  sectionTitle: string;
  positionAfterHeading: string;
  sortOrder: number;
  format: 'mc' | 'tf' | 'mc2';
  questionText: string;
  options?: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  academicReference?: string;
}

export const clawvaultAgentMemoryQuizzes: InlineQuiz[] = [
  // ─────────────────────────────────────────────────────────
  // SECCIÓN 1: Context Death (el problema central)
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Context Death',
    positionAfterHeading: 'El problema central de los agentes sin memoria',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Qué es "context death" en el contexto de agentes conversacionales?',
    options: [
      {
        label: 'A',
        text: 'Un error de programación donde el context window se desborda y el agente crashea',
      },
      {
        label: 'B',
        text: 'La pérdida completa de información acumulada cuando una sesión de conversación termina o el contexto se llena',
      },
      {
        label: 'C',
        text: 'La degradación de rendimiento cuando un LLM procesa más de 128K tokens',
      },
      {
        label: 'D',
        text: 'Un ataque de seguridad donde se inyecta texto basura para agotar el context window',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'Context death se refiere a la pérdida de toda la información que el agente acumuló durante interacciones previas cuando la sesión termina o el context window se satura. El agente "muere" informativamente: decisiones, preferencias del usuario, compromisos adquiridos, todo se pierde. Esto hace que cada nueva sesión arranque desde cero, como si el agente tuviera amnesia total. Es el problema fundamental que ClawVault intenta resolver.',
    academicReference: 'ClawVault, Versatly 2026',
  },
  {
    sectionTitle: 'Context Death',
    positionAfterHeading: 'El problema central de los agentes sin memoria',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Ampliar el context window a 1 millón de tokens resuelve completamente el problema de context death, ya que toda la historia de conversación cabe en una sola sesión.',
    correctAnswer: 'Falso',
    explanation:
      'Un context window más grande solo posterga el problema, no lo resuelve. Primero, existe el fenómeno "lost in the middle": los LLMs prestan menos atención a la información en el centro de contextos muy largos. Segundo, más tokens implican mayor latencia y costo por request. Tercero, la información sin estructurar pierde relevancia con el volumen: el agente no puede distinguir qué es crítico de qué es ruido. ClawVault resuelve esto con memoria persistente estructurada, no con más contexto bruto.',
    academicReference: 'ClawVault, Versatly 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 2: Research — LoCoMo benchmark
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'LoCoMo Benchmark Results',
    positionAfterHeading: 'Markdown vs herramientas especializadas',
    sortOrder: 3,
    format: 'mc',
    questionText:
      'Según los resultados del benchmark LoCoMo, ¿cuál fue el rendimiento de archivos markdown planos vs herramientas de memoria especializadas?',
    options: [
      {
        label: 'A',
        text: 'Markdown 68.5% vs especializadas 74%',
      },
      {
        label: 'B',
        text: 'Markdown 74% vs especializadas 68.5%',
      },
      {
        label: 'C',
        text: 'Markdown 82% vs especializadas 79%',
      },
      {
        label: 'D',
        text: 'Ambos empataron alrededor del 70%',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'Los archivos markdown planos alcanzaron un 74% en el benchmark LoCoMo, superando a las herramientas de memoria especializadas que obtuvieron 68.5%. Esta diferencia de 5.5 puntos porcentuales es contraintuitiva: las herramientas especializadas tienen embeddings optimizados y storage estructurado, pero el texto plano con formato markdown resulta ser el formato que los LLMs "entienden" mejor nativamente, ya que fueron entrenados con billones de tokens de texto plano y documentación markdown.',
    academicReference: 'LoCoMo Benchmark',
  },
  {
    sectionTitle: 'LoCoMo Benchmark Results',
    positionAfterHeading: 'Por qué markdown gana',
    sortOrder: 4,
    format: 'tf',
    questionText:
      'Las herramientas de memoria especializadas superaron al markdown plano en el benchmark LoCoMo gracias a sus embeddings optimizados y structured storage.',
    correctAnswer: 'Falso',
    explanation:
      'Es exactamente lo contrario. Markdown plano obtuvo 74% vs 68.5% de las herramientas especializadas. La razón fundamental es que los LLMs fueron pre-entrenados con enormes cantidades de texto plano y markdown. Cuando la información se presenta en un formato que el modelo ya "entiende" nativamente, se reduce la fricción en el procesamiento. Las herramientas especializadas introducen capas de abstracción (serialización, deserialización, formatos propietarios) que pueden degradar la calidad del retrieval.',
    academicReference: 'LoCoMo Benchmark',
  },
  {
    sectionTitle: 'LoCoMo Benchmark Results',
    positionAfterHeading: 'Implicaciones para el diseño de memoria',
    sortOrder: 5,
    format: 'mc',
    questionText:
      '¿Cuál es la implicación arquitectónica principal del resultado del benchmark LoCoMo para el diseño de sistemas de memoria de agentes?',
    options: [
      {
        label: 'A',
        text: 'Que se deben usar bases de datos vectoriales exclusivamente para almacenar memorias',
      },
      {
        label: 'B',
        text: 'Que la complejidad técnica del sistema de almacenamiento no correlaciona con mejor retrieval, y formatos nativos al LLM son preferibles',
      },
      {
        label: 'C',
        text: 'Que los benchmarks no son confiables para evaluar sistemas de memoria',
      },
      {
        label: 'D',
        text: 'Que solo se necesitan context windows más grandes para resolver el problema de memoria',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El resultado del LoCoMo demuestra que sofisticación técnica no equivale a mejor rendimiento. Un sistema más simple (archivos markdown) superó a sistemas más complejos (herramientas especializadas con embeddings). La implicación es que el formato de almacenamiento debe alinearse con cómo el LLM procesa información internamente. ClawVault toma esta lección y construye toda su arquitectura alrededor de archivos markdown con YAML frontmatter, un formato que los LLMs comprenden nativamente.',
    academicReference: 'LoCoMo Benchmark',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 3: The Obsidian Insight
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'The Obsidian Insight',
    positionAfterHeading: 'Archivos como unidad de memoria',
    sortOrder: 6,
    format: 'mc',
    questionText:
      '¿Cuál es la analogía central del "Obsidian Insight" que adopta ClawVault?',
    options: [
      {
        label: 'A',
        text: 'Usar bases de datos SQL como sistema de memoria del agente',
      },
      {
        label: 'B',
        text: 'Tratar archivos markdown con YAML frontmatter como la unidad atómica de memoria, igual que Obsidian trata notas como unidades de conocimiento',
      },
      {
        label: 'C',
        text: 'Conectar el agente a Obsidian como backend de almacenamiento',
      },
      {
        label: 'D',
        text: 'Usar el motor de búsqueda de Obsidian para hacer retrieval de memorias',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El "Obsidian Insight" es la idea de que archivos individuales de markdown con YAML frontmatter sirven como la unidad atómica de memoria del agente. Cada archivo es una memoria autocontenida con metadatos estructurados (tipo, prioridad, fecha, tags) en el frontmatter YAML y contenido legible en el cuerpo markdown. No se trata de usar Obsidian como herramienta, sino de adoptar su modelo mental: archivos como first-class citizens del conocimiento.',
    academicReference: 'ClawVault, Versatly 2026',
  },
  {
    sectionTitle: 'The Obsidian Insight',
    positionAfterHeading: 'YAML frontmatter como metadatos',
    sortOrder: 7,
    format: 'mc2',
    questionText:
      '¿Cuáles de los siguientes son beneficios reales de usar YAML frontmatter en los archivos de memoria? (Selecciona todos los correctos)',
    options: [
      {
        label: 'A',
        text: 'Permite metadata estructurada (tipo, prioridad, fecha) sin sacrificar la legibilidad del contenido',
      },
      {
        label: 'B',
        text: 'Es parseable programáticamente y al mismo tiempo comprensible para el LLM sin transformaciones',
      },
      {
        label: 'C',
        text: 'Encripta automáticamente el contenido de la memoria para proteger datos sensibles',
      },
      {
        label: 'D',
        text: 'Permite filtrar y priorizar memorias por metadatos antes de inyectarlas al contexto del LLM',
      },
    ],
    correctAnswer: 'A,B,D',
    explanation:
      'A es correcto: el frontmatter YAML separa metadatos del contenido sin contaminar la legibilidad. B es correcto: YAML es tanto parseable por código como comprensible por LLMs, ya que aparece extensamente en datos de entrenamiento. D es correcto: los metadatos permiten el sistema de budget-aware injection, filtrando por prioridad y tipo antes de inyectar. C es falso: YAML frontmatter no proporciona encriptación; la seguridad de datos se maneja por la arquitectura zero-cloud y data sovereignty.',
    academicReference: 'ClawVault, Versatly 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 4: Memory Types
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Memory Types',
    positionAfterHeading: 'Taxonomía de memorias',
    sortOrder: 8,
    format: 'mc',
    questionText:
      '¿Cuáles son los cinco tipos de memoria que define la taxonomía de ClawVault?',
    options: [
      {
        label: 'A',
        text: 'Decisions, preferences, relationships, commitments, lessons',
      },
      {
        label: 'B',
        text: 'Facts, opinions, events, people, locations',
      },
      {
        label: 'C',
        text: 'Short-term, long-term, episodic, semantic, procedural',
      },
      {
        label: 'D',
        text: 'Critical, notable, background, archived, deleted',
      },
    ],
    correctAnswer: 'A',
    explanation:
      'ClawVault define cinco tipos: decisions (elecciones arquitectónicas o de diseño), preferences (gustos y estilos del usuario), relationships (conexiones entre entidades del sistema), commitments (promesas o acuerdos que el agente debe cumplir), y lessons (aprendizajes de errores o experiencias pasadas). La opción C describe tipos de memoria cognitiva humana, no la taxonomía de ClawVault. La opción D describe niveles de prioridad, no tipos de memoria.',
    academicReference: 'ClawVault, Versatly 2026',
  },
  {
    sectionTitle: 'Memory Types',
    positionAfterHeading: 'Importancia de la categorización',
    sortOrder: 9,
    format: 'tf',
    questionText:
      'La categorización en cinco tipos de memoria es un detalle cosmético; el agente funcionaría igual si todas las memorias se guardaran como texto plano sin tipo.',
    correctAnswer: 'Falso',
    explanation:
      'La categorización es funcional, no cosmética. Sin tipos, el sistema de budget-aware injection no puede priorizar correctamente: ¿cómo sabrías si una memoria es un commitment crítico que el agente debe cumplir, o una preference de background? Los tipos permiten: (1) filtrar por relevancia según el contexto de la conversación, (2) aplicar diferentes niveles de prioridad por defecto, y (3) estructurar el knowledge graph con relaciones semánticas significativas entre tipos distintos.',
    academicReference: 'ClawVault, Versatly 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 5: Memory Graph
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Memory Graph',
    positionAfterHeading: 'Wiki-links como memoria asociativa',
    sortOrder: 10,
    format: 'mc',
    questionText:
      '¿Cómo construye ClawVault su knowledge graph de memorias?',
    options: [
      {
        label: 'A',
        text: 'Mediante embeddings vectoriales que calculan similitud coseno entre memorias',
      },
      {
        label: 'B',
        text: 'Mediante wiki-links ([[nombre-memoria]]) dentro del contenido markdown, creando un grafo asociativo explícito',
      },
      {
        label: 'C',
        text: 'Mediante una base de datos de grafos Neo4j que almacena nodos y relaciones',
      },
      {
        label: 'D',
        text: 'Mediante tags jerárquicos que organizan memorias en carpetas anidadas',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'ClawVault usa wiki-links (sintaxis [[nombre]]) dentro del contenido markdown para crear conexiones explícitas entre memorias. Esto forma un grafo asociativo donde las relaciones son declaradas por el agente, no inferidas por similitud semántica. La ventaja sobre embeddings es que captura relaciones causales y contextuales que la similitud semántica no puede detectar. Por ejemplo, [[decision-usar-postgres]] conectada a [[lesson-migraciones-complejas]] expresa una relación causal explícita.',
    academicReference: 'ClawVault, Versatly 2026',
  },
  {
    sectionTitle: 'Memory Graph',
    positionAfterHeading: 'Regex post-processing',
    sortOrder: 11,
    format: 'mc',
    questionText:
      '¿Por qué ClawVault necesita regex post-processing después de que el LLM comprime memorias?',
    options: [
      {
        label: 'A',
        text: 'Para corregir errores gramaticales que el LLM introduce durante la compresión',
      },
      {
        label: 'B',
        text: 'Porque el LLM tiende a parafrasear y reescribir keywords exactos como [[wiki-links]], rompiendo las conexiones del grafo',
      },
      {
        label: 'C',
        text: 'Para convertir el output del LLM de JSON a markdown',
      },
      {
        label: 'D',
        text: 'Para eliminar información redundante que el LLM no detecta',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'Los LLMs tienen una tendencia natural a parafrasear y "mejorar" texto. Durante la compresión de memorias, el LLM puede convertir un keyword exacto como "[[budget-routing]]" en "routing del presupuesto" o "[[decision-usar-postgres]]" en "la decisión de usar PostgreSQL". Esto rompe los wiki-links que forman el knowledge graph. El regex post-processing restaura estos keywords a su forma exacta original, manteniendo la integridad del grafo asociativo.',
    academicReference: 'ClawVault, Versatly 2026',
  },
  {
    sectionTitle: 'Memory Graph',
    positionAfterHeading: 'Regex post-processing',
    sortOrder: 12,
    format: 'mc2',
    questionText:
      '¿Cuáles de las siguientes son ventajas del grafo basado en wiki-links sobre un sistema puramente basado en embeddings? (Selecciona todos los correctos)',
    options: [
      {
        label: 'A',
        text: 'Captura relaciones causales explícitas entre memorias que los embeddings no pueden inferir',
      },
      {
        label: 'B',
        text: 'No requiere infraestructura de vector database ni modelo de embeddings',
      },
      {
        label: 'C',
        text: 'Es más rápido que vector search para cualquier tamaño de vault',
      },
      {
        label: 'D',
        text: 'Las conexiones son auditables y comprensibles por humanos al inspeccionar los archivos',
      },
    ],
    correctAnswer: 'A,B,D',
    explanation:
      'A es correcto: un wiki-link expresa relación intencional (causal, contextual), no mera similitud semántica. B es correcto: los wiki-links son texto plano parseado con regex, sin necesidad de embeddings ni vector DB. D es correcto: cualquier humano puede abrir un archivo markdown y ver exactamente qué memorias están conectadas. C es falso: para vaults muy grandes (100K+ memorias), un índice ANN de vectores puede ser más eficiente que escanear todas las conexiones del grafo; la ventaja del wiki-link es cualitativa, no de velocidad bruta.',
    academicReference: 'ClawVault, Versatly 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 6: Observational Memory
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Observational Memory',
    positionAfterHeading: 'Compresión y prioridad',
    sortOrder: 13,
    format: 'mc',
    questionText:
      '¿Cuáles son los tres niveles de prioridad que usa ClawVault para budget-aware context injection?',
    options: [
      {
        label: 'A',
        text: 'High, Medium, Low',
      },
      {
        label: 'B',
        text: 'Critical (rojo), Notable (amarillo), Background (verde) — representados como tags de prioridad',
      },
      {
        label: 'C',
        text: 'P0, P1, P2 usando numeración estándar',
      },
      {
        label: 'D',
        text: 'Urgent, Important, Nice-to-have',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'ClawVault define tres niveles de prioridad con indicadores visuales: Critical (rojo), Notable (amarillo) y Background (verde). Estos tags determinan el orden y la agresividad con que las memorias se inyectan en el contexto del LLM. Las memorias Critical siempre se inyectan primero, las Notable solo si hay budget restante, y las Background solo si sobra espacio. Esto es budget-aware injection: la cantidad de contexto inyectado se adapta al presupuesto de tokens disponible.',
    academicReference: 'ClawVault, Versatly 2026',
  },
  {
    sectionTitle: 'Observational Memory',
    positionAfterHeading: 'Budget-aware injection',
    sortOrder: 14,
    format: 'tf',
    questionText:
      'En el sistema de budget-aware injection, si el context window está casi lleno, se inyectan todas las memorias igual pero con un resumen más corto de cada una.',
    correctAnswer: 'Falso',
    explanation:
      'Budget-aware injection no reduce el tamaño de cada memoria; reduce la cantidad de memorias inyectadas. El sistema prioriza jerárquicamente: primero inyecta todas las memorias Critical, luego Notable si hay budget, y finalmente Background si sobra espacio. Si el context window está casi lleno, las memorias Background y posiblemente Notable se omiten completamente, no se resumen. La compresión ocurre en un paso anterior (observational memory compression), no en el momento de la injection.',
    academicReference: 'ClawVault, Versatly 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 7: Vault Index Pattern
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Vault Index Pattern',
    positionAfterHeading: 'Index file vs embedding search',
    sortOrder: 15,
    format: 'mc',
    questionText:
      '¿En qué consiste el vault index pattern de ClawVault?',
    options: [
      {
        label: 'A',
        text: 'Crear un índice invertido de todas las palabras en el vault para búsqueda full-text',
      },
      {
        label: 'B',
        text: 'Mantener un archivo índice que el agente escanea primero para ubicar memorias relevantes, antes de recurrir a embedding search',
      },
      {
        label: 'C',
        text: 'Indexar todos los archivos en una base de datos SQLite para queries rápidos',
      },
      {
        label: 'D',
        text: 'Usar el sistema de archivos del SO como índice, organizando memorias en carpetas por tipo',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El vault index pattern consiste en mantener un archivo índice central que contiene una referencia resumida de cada memoria en el vault. Cuando el agente necesita recuperar información, primero escanea este índice para identificar qué memorias son relevantes, y luego lee los archivos completos. Este paso previo de "índice" es más barato que hacer embedding search sobre todo el vault, y no requiere infraestructura de vector database. El trade-off es que el escaneo del índice es O(n), lo que puede ser lento con vaults muy grandes.',
    academicReference: 'ClawVault, Versatly 2026',
  },
  {
    sectionTitle: 'Vault Index Pattern',
    positionAfterHeading: 'Comparación con embeddings',
    sortOrder: 16,
    format: 'mc',
    questionText:
      '¿Cuándo el vault index pattern deja de ser práctico y conviene migrar a embedding search?',
    options: [
      {
        label: 'A',
        text: 'Cuando el vault tiene más de 10 memorias',
      },
      {
        label: 'B',
        text: 'Cuando el número de memorias crece tanto que el escaneo O(n) del índice es más lento que una búsqueda ANN sobre embeddings, típicamente con vaults muy grandes',
      },
      {
        label: 'C',
        text: 'Nunca; el vault index pattern siempre es superior a embeddings',
      },
      {
        label: 'D',
        text: 'Cuando se necesita buscar por tipo de memoria en vez de por contenido',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El vault index pattern escala linealmente O(n) porque requiere escanear todo el índice. Embedding search con un índice ANN (Approximate Nearest Neighbors) escala O(log n). Para vaults pequeños a medianos, el overhead del vault index es mínimo y no requiere infraestructura adicional. Pero cuando el vault crece a decenas de miles de memorias, el escaneo lineal se vuelve un cuello de botella y la inversión en infraestructura de embeddings se justifica.',
    academicReference: 'ClawVault, Versatly 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 8: Zero Cloud / Data Sovereignty
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Zero Cloud / Data Sovereignty',
    positionAfterHeading: 'Arquitectura local-first',
    sortOrder: 17,
    format: 'mc',
    questionText:
      '¿Qué significa "zero cloud" en la arquitectura de ClawVault?',
    options: [
      {
        label: 'A',
        text: 'Que el agente no usa ningún LLM y todo el procesamiento es local',
      },
      {
        label: 'B',
        text: 'Que todas las memorias se almacenan localmente en archivos del usuario, sin depender de servicios cloud para persistencia de datos',
      },
      {
        label: 'C',
        text: 'Que el sistema funciona completamente offline sin conexión a internet',
      },
      {
        label: 'D',
        text: 'Que se usa edge computing en vez de servidores centralizados',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'Zero cloud significa que la persistencia de memorias es 100% local: los archivos markdown viven en el sistema de archivos del usuario, no en servidores de terceros. Esto no significa que el agente funcione offline (aún necesita llamar a un LLM para inferencia), sino que los datos del usuario nunca salen de su máquina para ser almacenados. Esto garantiza data sovereignty: el usuario es dueño absoluto de sus datos y no depende de la disponibilidad o políticas de un servicio cloud.',
    academicReference: 'ClawVault, Versatly 2026',
  },
  {
    sectionTitle: 'Zero Cloud / Data Sovereignty',
    positionAfterHeading: 'Trade-offs de la arquitectura local',
    sortOrder: 18,
    format: 'mc2',
    questionText:
      '¿Cuáles de los siguientes son beneficios reales de la arquitectura zero cloud de ClawVault? (Selecciona todos los correctos)',
    options: [
      {
        label: 'A',
        text: 'Data sovereignty total: el usuario es dueño de todos sus datos de memoria',
      },
      {
        label: 'B',
        text: 'Cero dependencia de servicios externos para la persistencia de datos',
      },
      {
        label: 'C',
        text: 'Permite compartir memorias entre múltiples agentes de diferentes usuarios de forma nativa',
      },
      {
        label: 'D',
        text: 'Las memorias son inspeccionables y editables directamente por el usuario con cualquier editor de texto',
      },
    ],
    correctAnswer: 'A,B,D',
    explanation:
      'A es correcto: al ser local, los datos pertenecen completamente al usuario. B es correcto: no hay riesgo de que un servicio cloud tenga downtime y se pierda acceso a las memorias. D es correcto: al ser archivos markdown planos, cualquier editor de texto permite inspeccionar, editar y auditar las memorias del agente. C es falso: la arquitectura local-first dificulta (no facilita) compartir memorias entre usuarios, ya que cada vault es local a una máquina. Este es un trade-off explícito del diseño zero cloud.',
    academicReference: 'ClawVault, Versatly 2026',
  },
];
