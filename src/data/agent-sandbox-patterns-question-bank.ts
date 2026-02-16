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

export const agentSandboxPatternsBank: QuestionBankEntry[] = [
  // ─── DEFINITION (4 questions, difficulty 1) ───────────────────────────

  {
    concept_id: 'tool-use',
    type: 'definition',
    format: 'open',
    question_text:
      '¿Qué es el patrón "Agent IN Sandbox" (Pattern 1) en el contexto de la conexión de agentes con sandboxes?',
    expected_answer:
      'Es un patrón arquitectónico donde el agente se ejecuta dentro del sandbox (por ejemplo, un contenedor Docker o VM). La comunicación con el exterior ocurre a través de una capa de red (HTTP o WebSocket). El agente tiene acceso directo al filesystem y al entorno de ejecución, similar a cómo un desarrollador trabaja localmente.',
    difficulty: 1,
  },

  {
    concept_id: 'tool-use',
    type: 'definition',
    format: 'open',
    question_text:
      '¿Qué es el patrón "Sandbox as Tool" (Pattern 2) y cómo se diferencia estructuralmente del Pattern 1?',
    expected_answer:
      'Es un patrón donde el agente se ejecuta localmente o en tu servidor, y llama al sandbox de forma remota vía API cuando necesita ejecutar código. A diferencia del Pattern 1, el agente y el sandbox están desacoplados: el agente mantiene su estado fuera del sandbox y solo envía instrucciones de ejecución.',
    difficulty: 1,
  },

  {
    concept_id: 'tool-use',
    type: 'definition',
    format: 'mc',
    question_text:
      '¿Qué tipos de sandboxes quedan explícitamente EXCLUIDOS del análisis de Harrison Chase?',
    expected_answer:
      'Los sandboxes a nivel de proceso (como bubblewrap) y los sandboxes a nivel de lenguaje (como Pyodide). El artículo se enfoca exclusivamente en sandboxes que proveen un "computador completo": contenedores Docker o VMs.',
    options: [
      { label: 'A', text: 'Sandboxes de red (network namespaces) y sandboxes de kernel (seccomp)' },
      { label: 'B', text: 'Sandboxes a nivel de proceso (bubblewrap) y a nivel de lenguaje (Pyodide)' },
      { label: 'C', text: 'Sandboxes de GPU (NVIDIA containers) y sandboxes de almacenamiento (cgroups)' },
      { label: 'D', text: 'Sandboxes de CI/CD (GitHub Actions) y sandboxes serverless (Lambda)' },
    ],
    correct_answer: 'B',
    explanation:
      'El artículo se limita a sandboxes que ofrecen un entorno de ejecución completo (como Docker o VMs), excluyendo explícitamente los que operan a nivel de proceso o de lenguaje.',
    difficulty: 1,
  },

  {
    concept_id: 'tool-use',
    type: 'definition',
    format: 'open',
    question_text:
      '¿Qué significa que un sandbox provea un "computador completo" según el artículo de Harrison Chase?',
    expected_answer:
      'Se refiere a entornos de ejecución aislados que ofrecen un sistema operativo completo, filesystem propio, capacidad de instalar paquetes y ejecutar procesos arbitrarios. Esto incluye contenedores Docker y máquinas virtuales, a diferencia de sandboxes limitados como Pyodide (solo JavaScript/Python en browser) o bubblewrap (restricción de procesos individuales).',
    difficulty: 1,
  },

  // ─── FACT / PROPERTY (4 questions, difficulty 1-2) ────────────────────

  {
    concept_id: 'tool-use',
    type: 'fact',
    format: 'mc',
    question_text:
      '¿Cuál de los siguientes es un servicio de sandbox mencionado en el artículo de Harrison Chase?',
    expected_answer: 'E2B, Modal, Daytona, Runloop son algunos de los servicios mencionados.',
    options: [
      { label: 'A', text: 'AWS Lambda, Google Cloud Run, Azure Functions' },
      { label: 'B', text: 'E2B, Modal, Daytona, Runloop' },
      { label: 'C', text: 'Docker Hub, Kubernetes, Terraform' },
      { label: 'D', text: 'Vercel, Netlify, Railway' },
    ],
    correct_answer: 'B',
    explanation:
      'El artículo menciona E2B, Modal, Daytona, Runloop, Zo Computer, Witan Labs y OpenCode como servicios de sandbox para agentes.',
    difficulty: 1,
  },

  {
    concept_id: 'tool-use',
    type: 'property',
    format: 'open',
    question_text:
      'En el Pattern 2 (Sandbox as Tool), ¿cómo mitigan los proveedores el problema de latencia acumulada por múltiples llamadas de ejecución?',
    expected_answer:
      'Los proveedores ofrecen sesiones con estado (stateful sessions) donde las variables, archivos y paquetes instalados persisten entre invocaciones. Esto reduce los round trips necesarios, ya que no hay que reinstalar dependencias ni recrear estado en cada llamada al sandbox.',
    difficulty: 2,
  },

  {
    concept_id: 'tool-use',
    type: 'property',
    format: 'tf',
    question_text:
      'Verdadero o Falso: En el Pattern 1 (Agent IN Sandbox), el código generado por el LLM hereda todos los permisos del agente, incluyendo acceso a herramientas como web fetch.',
    expected_answer:
      'Verdadero. En el Pattern 1, dado que el agente y el código generado comparten el mismo entorno, el código del LLM hereda todos los permisos del agente. No es posible otorgar privilegios elevados a herramientas específicas más allá del acceso bash.',
    correct_answer: 'true',
    explanation:
      'Este es uno de los riesgos de seguridad clave del Pattern 1: la escalación de permisos. Si el agente tiene acceso a web fetch, el código generado por el LLM también lo tiene.',
    difficulty: 2,
  },

  {
    concept_id: 'react-pattern',
    type: 'fact',
    format: 'open',
    question_text:
      '¿Cuál es el modelo de costos del Pattern 2 (Sandbox as Tool) y por qué es más eficiente que el Pattern 1?',
    expected_answer:
      'El Pattern 2 opera bajo un modelo pay-per-execution: solo se paga cuando se ejecuta código en el sandbox, no por mantener un runtime persistente. Esto es más eficiente que el Pattern 1 donde el sandbox debe estar activo todo el tiempo que el agente está corriendo, incluyendo el tiempo de espera de inferencia del LLM.',
    difficulty: 2,
    related_concept_id: 'tool-use',
  },

  // ─── GUARANTEE (3 questions, difficulty 2) ────────────────────────────

  {
    concept_id: 'tool-use',
    type: 'guarantee',
    format: 'tf',
    question_text:
      'Verdadero o Falso: El Pattern 2 (Sandbox as Tool) garantiza que si el sandbox falla o se destruye, el estado del agente se preserva intacto.',
    expected_answer:
      'Verdadero. En el Pattern 2, el estado del agente vive fuera del sandbox. Si el sandbox falla, se puede crear uno nuevo y continuar la ejecución sin perder el progreso del razonamiento del agente, su contexto o las API keys.',
    correct_answer: 'true',
    explanation:
      'Esta es una de las ventajas clave del desacoplamiento: la separación entre estado del agente y entorno de ejecución proporciona resiliencia ante fallos del sandbox.',
    difficulty: 2,
  },

  {
    concept_id: 'tool-use',
    type: 'guarantee',
    format: 'open',
    question_text:
      '¿Qué garantía de seguridad ofrece el Pattern 2 respecto a las API keys que el Pattern 1 NO puede ofrecer?',
    expected_answer:
      'El Pattern 2 garantiza que las API keys permanecen fuera del sandbox, ya que el agente se ejecuta localmente o en un servidor controlado. En el Pattern 1, las API keys deben residir dentro del sandbox para que el agente haga llamadas de inferencia, lo que crea un vector de ataque si el sandbox es comprometido por prompt injection u otra vulnerabilidad.',
    difficulty: 2,
    related_concept_id: 'react-pattern',
  },

  {
    concept_id: 'tool-use',
    type: 'guarantee',
    format: 'tf',
    question_text:
      'Verdadero o Falso: En el Pattern 1 (Agent IN Sandbox), se garantiza que el intellectual property (código y prompts del agente) está protegido contra exfiltración.',
    expected_answer:
      'Falso. En el Pattern 1, el agente corre dentro del sandbox, lo que significa que el código fuente y los prompts del agente están presentes en el entorno de ejecución. Si el sandbox es comprometido, es mucho más fácil exfiltrar toda la propiedad intelectual del agente.',
    correct_answer: 'false',
    explanation:
      'La exfiltración de IP es un riesgo explícito del Pattern 1 mencionado por Harrison Chase. Al tener el agente dentro del sandbox, cualquier compromiso del entorno expone el código y los prompts.',
    difficulty: 2,
  },

  // ─── COMPARISON (3 questions, difficulty 2) ───────────────────────────

  {
    concept_id: 'react-pattern',
    type: 'comparison',
    format: 'open',
    question_text:
      'Compara cómo se actualizan los cambios en la lógica del agente en Pattern 1 vs Pattern 2. ¿Por qué es esto crítico durante el desarrollo iterativo?',
    expected_answer:
      'En el Pattern 1, cualquier cambio en la lógica del agente requiere reconstruir la imagen del contenedor (container rebuild), lo que ralentiza significativamente la iteración. En el Pattern 2, los cambios en la lógica del agente son instantáneos porque el agente corre localmente, sin necesidad de reconstruir nada. Esto es crítico durante desarrollo iterativo donde se ajustan prompts, herramientas y flujos de razonamiento constantemente.',
    difficulty: 2,
    related_concept_id: 'tool-use',
  },

  {
    concept_id: 'tool-use',
    type: 'comparison',
    format: 'open',
    question_text:
      '¿Cuál es el principal trade-off de rendimiento del Pattern 2 frente al Pattern 1, y cómo se mitiga en la práctica?',
    expected_answer:
      'El principal trade-off es la latencia de red: cada llamada de ejecución al sandbox remoto introduce latencia, que se acumula con muchas ejecuciones pequeñas. En el Pattern 1, la ejecución es local y directa. Se mitiga con sesiones stateful donde variables, archivos y paquetes persisten entre invocaciones, reduciendo la cantidad de round trips necesarios.',
    difficulty: 2,
  },

  {
    concept_id: 'plan-and-execute',
    type: 'comparison',
    format: 'mc',
    question_text:
      '¿Qué ventaja exclusiva del Pattern 2 permite escalar la ejecución de tareas complejas que requieren múltiples entornos simultáneos?',
    expected_answer:
      'La paralelización: el Pattern 2 permite ejecutar tareas en múltiples sandboxes remotos simultáneamente, ya que el agente orquesta desde fuera.',
    options: [
      { label: 'A', text: 'Container caching: reutilizar imágenes pre-construidas' },
      { label: 'B', text: 'Paralelización: ejecutar múltiples sandboxes remotos simultáneamente' },
      { label: 'C', text: 'Hot-swap: intercambiar el runtime sin detener el agente' },
      { label: 'D', text: 'Snapshot restore: restaurar el estado completo del sandbox desde disco' },
    ],
    correct_answer: 'B',
    explanation:
      'En el Pattern 2, dado que el agente es externo al sandbox, puede orquestar la ejecución en paralelo a través de múltiples sandboxes remotos. En el Pattern 1, el agente está atado a un único sandbox.',
    difficulty: 2,
    related_concept_id: 'tool-use',
  },

  // ─── SCENARIO (4 questions, difficulty 2-3) ───────────────────────────

  {
    concept_id: 'tool-use',
    type: 'scenario',
    format: 'open',
    question_text:
      'Estás construyendo un coding agent que necesita instalar pip packages y ejecutar código de usuarios. Las API keys de OpenAI no deben estar expuestas al código del usuario. ¿Qué patrón elegirías y por qué?',
    expected_answer:
      'Pattern 2 (Sandbox as Tool). El agente corre localmente con las API keys protegidas, y envía el código del usuario al sandbox remoto para ejecución. Esto garantiza que las API keys nunca entran al sandbox donde corre código no confiable. Además, si un usuario envía código malicioso que compromete el sandbox, las keys permanecen seguras y el estado del agente no se pierde.',
    difficulty: 2,
    related_concept_id: 'react-pattern',
  },

  {
    concept_id: 'react-pattern',
    type: 'scenario',
    format: 'open',
    question_text:
      'Tu agente necesita ejecutar 50 tests unitarios en paralelo, cada uno en un entorno limpio con diferentes versiones de Python. ¿Qué patrón usarías y cómo lo implementarías?',
    expected_answer:
      'Pattern 2 (Sandbox as Tool). El agente orquesta la ejecución desde fuera, creando 50 sandboxes remotos en paralelo (uno por test/versión). Cada sandbox recibe el código del test y la versión de Python requerida. El agente recolecta los resultados a medida que terminan. Esto sería imposible con Pattern 1, donde el agente está atado a un único sandbox.',
    difficulty: 2,
    related_concept_id: 'plan-and-execute',
  },

  {
    concept_id: 'tool-use',
    type: 'scenario',
    format: 'open',
    question_text:
      'Tu empresa tiene un agente propietario con prompts y lógica de negocio confidenciales. El agente necesita ejecutar código en un sandbox de un proveedor externo (como E2B). ¿Qué patrón minimiza el riesgo de exfiltración de propiedad intelectual y por qué?',
    expected_answer:
      'Pattern 2 (Sandbox as Tool). Al correr el agente localmente en tu infraestructura, los prompts, la lógica de negocio y el código propietario nunca entran al sandbox del proveedor externo. Solo se envían las instrucciones de ejecución. Con Pattern 1, todo el código del agente residiría en el sandbox del proveedor, facilitando la exfiltración si el entorno es comprometido.',
    difficulty: 3,
    related_concept_id: 'react-pattern',
  },

  {
    concept_id: 'plan-and-execute',
    type: 'scenario',
    format: 'open',
    question_text:
      'Estás prototipando un agente de DevOps que necesita acceso directo al filesystem para monitorear logs, modificar configs y reiniciar servicios. La experiencia debe ser idéntica a SSH-ear en una máquina. ¿Cuándo sería Pattern 1 la mejor opción a pesar de sus desventajas?',
    expected_answer:
      'Pattern 1 sería apropiado cuando el agente y el entorno de ejecución están fuertemente acoplados: el agente necesita interacción continua y de baja latencia con el filesystem, los procesos y la red del sandbox. Si el flujo requiere cientos de operaciones pequeñas de filesystem por segundo, la latencia acumulada del Pattern 2 sería prohibitiva. Además, si el proveedor del sandbox maneja la comunicación con su SDK, la complejidad de infraestructura se reduce.',
    difficulty: 3,
    related_concept_id: 'tool-use',
  },

  // ─── LIMITATION (2 questions, difficulty 3) ───────────────────────────

  {
    concept_id: 'tool-use',
    type: 'limitation',
    format: 'open',
    question_text:
      '¿En qué escenarios específicos el Pattern 2 (Sandbox as Tool) se convierte en una mala elección a pesar de ser la recomendación general de Harrison Chase?',
    expected_answer:
      'El Pattern 2 es una mala elección cuando: (1) el agente requiere interacción constante y de alta frecuencia con el filesystem o procesos del sandbox, donde la latencia de red acumulada degrada la experiencia; (2) el flujo de trabajo requiere que el entorno de ejecución y el agente compartan estado de forma continua (por ejemplo, agentes que monitorean procesos en tiempo real); (3) el proveedor del sandbox ofrece un SDK optimizado para Pattern 1 que ya resuelve los problemas de comunicación y seguridad.',
    difficulty: 3,
    related_concept_id: 'react-pattern',
  },

  {
    concept_id: 'react-pattern',
    type: 'limitation',
    format: 'open',
    question_text:
      '¿Qué limitación de seguridad del Pattern 1 NO se resuelve simplemente añadiendo más capas de aislamiento al sandbox (más restricciones de red, permisos reducidos)?',
    expected_answer:
      'La presencia de API keys dentro del sandbox. No importa cuántas restricciones de red o permisos se añadan: si el agente necesita hacer llamadas de inferencia al LLM, las API keys deben existir dentro del sandbox. Un ataque de prompt injection exitoso puede extraer esas keys independientemente de las capas de aislamiento. Además, la exfiltración de IP (código y prompts del agente) persiste porque el código fuente debe estar presente para ejecutarse.',
    difficulty: 3,
    related_concept_id: 'tool-use',
  },

  // ─── ERROR_SPOT (2 questions, difficulty 3) ───────────────────────────

  {
    concept_id: 'tool-use',
    type: 'error_spot',
    format: 'open',
    question_text:
      'Encuentra el error en esta afirmación: "El Pattern 2 (Sandbox as Tool) es siempre más seguro Y más rápido que el Pattern 1, por eso Harrison Chase lo recomienda para todos los casos."',
    expected_answer:
      'Hay dos errores. Primero, el Pattern 2 NO es más rápido: introduce latencia de red en cada llamada de ejecución al sandbox, lo cual puede ser significativo con muchas ejecuciones pequeñas. El Pattern 1 tiene ejecución local directa. Segundo, Harrison Chase NO lo recomienda para TODOS los casos: reconoce que Pattern 1 es apropiado cuando el agente y el entorno están fuertemente acoplados o cuando el SDK del proveedor maneja la comunicación. La recomendación es Pattern 2 para la mayoría de casos, no para todos.',
    difficulty: 3,
  },

  {
    concept_id: 'react-pattern',
    type: 'error_spot',
    format: 'open',
    question_text:
      'Encuentra el error en esta afirmación: "En el Pattern 1 (Agent IN Sandbox), el principal riesgo de seguridad es la latencia de red. Para mitigarlo, se usan sandboxes a nivel de proceso como bubblewrap."',
    expected_answer:
      'Hay múltiples errores. Primero, la latencia de red es un problema del Pattern 2, no del Pattern 1 (en el Pattern 1 la ejecución es local). Los riesgos de seguridad del Pattern 1 son: API keys expuestas dentro del sandbox, exfiltración de IP, y escalación de permisos del código LLM. Segundo, bubblewrap es un sandbox a nivel de proceso que está explícitamente excluido del análisis del artículo; no es una solución para los problemas del Pattern 1, que se refiere a sandboxes con entornos completos (Docker/VMs).',
    difficulty: 3,
    related_concept_id: 'tool-use',
  },
];
