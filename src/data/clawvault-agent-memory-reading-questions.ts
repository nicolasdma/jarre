import type { ReadingQuestion } from '@/app/learn/[resourceId]/reading-questions';

export const clawvaultAgentMemoryQuestions: ReadingQuestion[] = [
  {
    type: 'why',
    question:
      '¿Por qué archivos markdown planos (74% en LoCoMo) superaron a herramientas de memoria especializadas (68.5%)? Si las herramientas especializadas tienen embeddings optimizados y structured storage, ¿qué ventaja fundamental tiene el texto plano con YAML frontmatter que compensa la falta de sofisticación técnica?',
    concept: 'Plain markdown superiority over specialized memory tools',
    hint: 'Piensa en cómo los LLMs fueron entrenados: billones de tokens de texto plano, markdown, y documentación. ¿Qué formato "entienden" mejor nativamente? ¿Qué overhead introduce una herramienta especializada entre el LLM y la información?',
  },
  {
    type: 'why',
    question:
      '¿Por qué ClawVault necesita regex post-processing después de que el LLM comprime memorias? Si el LLM es capaz de resumir y extraer información, ¿qué falla específica ocurre con los keywords durante la compresión, y por qué el LLM no puede evitarlo por sí mismo?',
    concept: 'LLM keyword rewriting during compression',
    hint: 'Los LLMs tienen una tendencia natural a parafrasear y "mejorar" el texto que procesan. Si un keyword exacto como "[[budget-routing]]" se convierte en "routing del presupuesto", ¿qué se rompe en el knowledge graph de wiki-links?',
  },
  {
    type: 'tradeoff',
    question:
      'El sistema de budget-aware context injection prioriza memorias como Critical > Notable > Background. Esto controla cuánto contexto se inyecta al LLM. ¿Qué trade-off existe entre inyectar agresivamente (muchas memorias Critical) vs conservadoramente (solo las más relevantes)? ¿Cómo cambia el análisis si el context window del modelo es de 8K vs 128K tokens?',
    concept: 'Budget-aware context injection tiers',
    hint: 'Más contexto significa más información disponible, pero también más ruido, más tokens consumidos, y mayor probabilidad de que el LLM se distraiga o ignore instrucciones. ¿Qué pasa con la latencia y el costo por request cuando saturás el context window?',
  },
  {
    type: 'tradeoff',
    question:
      'ClawVault usa el vault index pattern: escanear un índice antes de hacer embedding search. Esto agrega un paso de lectura secuencial antes de la búsqueda semántica. ¿Cuándo este overhead adicional se justifica y cuándo es mejor ir directamente a vector search? ¿Cómo escala cada enfoque cuando el vault tiene 100 memorias vs 100,000?',
    concept: 'Vault index scan vs direct embedding search',
    hint: 'Un índice plano es O(n) para escanear pero no requiere infraestructura de embeddings. Vector search es O(log n) con un índice ANN pero requiere mantener embeddings actualizados. ¿En qué punto de escala se cruzan las curvas de costo?',
  },
  {
    type: 'connection',
    question:
      '¿Cómo se relaciona la arquitectura de ClawVault (markdown + wiki-links + YAML frontmatter) con los conceptos de RAG y vector search de la Fase 3? Específicamente: ¿en qué se diferencia el retrieval basado en wiki-links (knowledge graph explícito) del retrieval por embedding similarity? ¿Cuándo el grafo asociativo supera al vector search, y cuándo necesitás ambos?',
    concept: 'Wiki-link knowledge graph vs embedding-based RAG retrieval',
    hint: 'Los embeddings capturan similitud semántica pero pierden relaciones explícitas entre entidades. Un wiki-link como [[decision-usar-postgres]] conecta memorias por relación causal, no por similitud de contenido. ¿Puede un embedding capturar que una decisión causó una lección aprendida?',
  },
  {
    type: 'design_decision',
    question:
      'Estás diseñando el sistema de memoria para un coding agent que asiste a un equipo de 5 desarrolladores durante meses. Necesitás: (1) recordar decisiones arquitectónicas, (2) preferencias de estilo de cada dev, (3) relaciones entre componentes del sistema. ¿Elegirías la arquitectura ClawVault (archivos locales, zero cloud) o un sistema con vector DB centralizada (Pinecone/Weaviate)? Justificá considerando data sovereignty, latencia de retrieval, y mantenibilidad del knowledge graph.',
    concept: 'ClawVault local-first vs centralized vector DB for team agents',
    hint: 'Con archivos locales tenés data sovereignty total y cero dependencia de servicios externos, pero ¿cómo compartís memorias entre agentes de distintos devs? Con una vector DB centralizada resolvés el acceso compartido, pero ¿quién es dueño de los datos y qué pasa cuando el servicio tiene downtime?',
  },
  {
    type: 'error_detection',
    question:
      '"La taxonomía de memoria de ClawVault (decisions, preferences, relationships, commitments, lessons) es innecesaria. Basta con guardar todo como texto plano y dejar que el embedding search encuentre lo relevante por similitud semántica, ya que los modelos modernos con context windows de 128K pueden procesar todo el vault sin necesidad de categorizar." ¿Qué errores fundamentales tiene este razonamiento?',
    concept: 'Memory type taxonomy vs flat embedding search',
    hint: 'Hay al menos dos errores. Primero: ¿qué pasa con el budget-aware injection si no sabés si una memoria es una decisión crítica o un background preference? Segundo: que un modelo pueda recibir 128K tokens no significa que los procese con la misma atención — investigá "lost in the middle" en LLMs.',
  },
];
