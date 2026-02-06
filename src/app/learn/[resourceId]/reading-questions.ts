export interface ReadingQuestion {
  type: 'tradeoff' | 'why' | 'connection' | 'error_detection' | 'design_decision';
  question: string;
  concept: string;
  hint?: string;
}

export const READING_QUESTIONS: Record<string, ReadingQuestion[]> = {
  'ddia-ch1': [
    {
      type: 'why',
      question:
        '¿Por qué Kleppmann separa "faults" de "failures"? Si un disco se corrompe pero el sistema sigue respondiendo, ¿es una fault o una failure? ¿Qué implica para el diseño?',
      concept: 'Fault tolerance',
      hint: 'Piensa en la diferencia entre un componente que falla y el sistema completo que deja de funcionar.',
    },
    {
      type: 'tradeoff',
      question:
        'Twitter eligió entre fan-out on write y fan-out on read para las timelines. ¿Qué trade-off hay en cada enfoque y por qué terminaron con un híbrido?',
      concept: 'Fan-out strategies',
      hint: 'Considera qué pasa con usuarios que tienen millones de seguidores.',
    },
    {
      type: 'design_decision',
      question:
        '¿Por qué los percentiles (p99, p999) son más útiles que el promedio para entender el rendimiento real de un sistema?',
      concept: 'Percentiles y latencia',
      hint: 'Un promedio de 100ms puede esconder que el 1% de los usuarios espera 10 segundos.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se relaciona "tail latency amplification" con sistemas distribuidos? Si un request depende de 5 servicios en paralelo, ¿qué pasa con el p99 del request completo?',
      concept: 'Tail latency amplification',
    },
    {
      type: 'error_detection',
      question:
        '"Para hacer un sistema más confiable, lo mejor es eliminar la intervención humana." ¿Qué está mal con esta afirmación según el capítulo?',
      concept: 'Operabilidad',
      hint: 'Kleppmann argumenta que los humanos son inevitables — la clave es cómo diseñas para ellos.',
    },
    {
      type: 'why',
      question:
        '¿Por qué Kleppmann argumenta que la mantenibilidad es más importante que la performance? ¿Qué tiene que ver con el costo real de un sistema a lo largo de su vida?',
      concept: 'Mantenibilidad vs performance',
    },
  ],

  'ddia-ch2': [
    {
      type: 'design_decision',
      question:
        'El modelo relacional ganó contra el jerárquico (IMS) y el de red (CODASYL). ¿Qué ventaja fundamental lo permitió, y por qué los otros hacían difícil evolucionar una app?',
      concept: 'Evolución de modelos de datos',
      hint: 'Piensa en qué pasa cuando necesitas agregar una relación que no existía en el diseño original.',
    },
    {
      type: 'tradeoff',
      question:
        'Un JSON anidado (CV con educación, experiencia) parece más natural que tablas normalizadas. ¿En qué momento esta ventaja se convierte en desventaja?',
      concept: 'Document model vs relacional',
      hint: 'Considera qué pasa cuando necesitas buscar "todos los que estudiaron en X universidad".',
    },
    {
      type: 'connection',
      question:
        '¿Qué tienen en común las "many-to-many relationships" en document DBs con el viejo problema del modelo de red (CODASYL)? ¿Estamos repitiendo la historia?',
      concept: 'Many-to-many en documentos',
    },
    {
      type: 'why',
      question:
        '¿Por qué "schema-on-read" vs "schema-on-write" es mejor analogía que "schemaless"? ¿Qué implica cada uno para la evolución del código?',
      concept: 'Schema-on-read vs schema-on-write',
      hint: 'Schemaless sugiere ausencia de estructura, pero la estructura siempre existe — la pregunta es dónde se valida.',
    },
    {
      type: 'error_detection',
      question:
        '"Las bases de datos de documentos siempre son más rápidas que las relacionales porque evitan joins costosos." ¿Por qué es incorrecto?',
      concept: 'Performance de document DBs',
      hint: 'Piensa en qué pasa cuando la app necesita hacer los joins que la DB no hace.',
    },
    {
      type: 'design_decision',
      question:
        '¿En qué caso concreto elegirías grafos sobre relacional? No genéricamente — da un ejemplo donde SQL se vuelve insostenible.',
      concept: 'Graph databases',
    },
    {
      type: 'tradeoff',
      question:
        'MapReduce fue reemplazado por modelos más declarativos. ¿Qué limitación fundamental tiene un modelo imperativo para el optimizador de consultas?',
      concept: 'Declarativo vs imperativo',
      hint: 'Si le dices al sistema cómo hacerlo paso a paso, ¿qué libertad le queda para optimizar?',
    },
  ],

  'ddia-ch3': [
    {
      type: 'why',
      question:
        '¿Por qué un append-only log tiene O(n) para lecturas pero O(1) para escrituras? ¿Qué estructura agregas para lecturas rápidas y qué costo tiene?',
      concept: 'Append-only log + índices',
      hint: 'El log es simple pero necesitas una estructura auxiliar que apunte a posiciones en el log.',
    },
    {
      type: 'tradeoff',
      question:
        'Un hash index (Bitcask) ofrece O(1) para lecturas Y escrituras. Suena perfecto. ¿Cuáles son las dos limitaciones fatales?',
      concept: 'Hash index limitations',
      hint: 'Piensa en qué pasa con range queries y con datasets que no caben en memoria.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conecta "compaction" en LSM-Trees con write amplification? Si un dato se escribe una vez, ¿cuántas veces termina escrito en disco y por qué?',
      concept: 'Write amplification',
    },
    {
      type: 'design_decision',
      question:
        'Los B-Trees reescriben 4KB para cambiar un byte. Los LSM-Trees solo hacen append. ¿Por qué entonces los B-Trees dominan en bases transaccionales (PostgreSQL, MySQL)?',
      concept: 'B-Trees vs LSM-Trees',
      hint: 'Piensa en predictibilidad de lecturas y en qué necesita un sistema transaccional.',
    },
    {
      type: 'error_detection',
      question:
        '"Los LSM-Trees son siempre más rápidos que los B-Trees para escrituras porque son secuenciales." ¿En qué escenario se anula esta ventaja?',
      concept: 'LSM-Tree write performance',
      hint: 'Compaction no es gratis — ¿qué pasa cuando el sistema está bajo alta carga de escritura?',
    },
    {
      type: 'why',
      question:
        '¿Por qué se necesita un WAL si ya tienes la estructura principal en disco? ¿Qué escenario exacto cubre el WAL que la estructura principal no cubre sola?',
      concept: 'Write-Ahead Log',
    },
    {
      type: 'tradeoff',
      question:
        'OLTP vs OLAP: ¿por qué no usar la misma base de datos para ambos? ¿Qué trade-off de storage engine lo impide?',
      concept: 'OLTP vs OLAP',
      hint: 'Row-oriented vs column-oriented no es solo formato — afecta qué operaciones son rápidas.',
    },
  ],
};

export const QUESTION_TYPE_LABELS: Record<ReadingQuestion['type'], string> = {
  tradeoff: 'Trade-off',
  why: 'Por qué',
  connection: 'Conexión',
  error_detection: 'Detección de error',
  design_decision: 'Decisión de diseño',
};

export const QUESTION_TYPE_COLORS: Record<ReadingQuestion['type'], string> = {
  tradeoff: 'text-[#8b6914] bg-[#8b6914]/8',
  why: 'text-[#4a5d4a] bg-[#4a5d4a]/8',
  connection: 'text-[#5a6b8a] bg-[#5a6b8a]/8',
  error_detection: 'text-[#8b4a4a] bg-[#8b4a4a]/8',
  design_decision: 'text-[#6b5a8a] bg-[#6b5a8a]/8',
};
