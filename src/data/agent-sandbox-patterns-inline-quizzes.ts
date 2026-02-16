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

export const agentSandboxPatternsQuizzes: InlineQuiz[] = [
  // ─────────────────────────────────────────────────────────
  // SECCIÓN 1: Por qué los agentes necesitan sandboxes
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Por qué los agentes necesitan sandboxes',
    positionAfterHeading: 'Introducción: isolation y security',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cuál es el propósito principal de ejecutar un agente dentro de un sandbox?',
    options: [
      { label: 'A', text: 'Acelerar la inferencia del modelo de lenguaje' },
      {
        label: 'B',
        text: 'Aislar la ejecución del agente para evitar acceso no autorizado a credenciales, archivos y recursos de red del host',
      },
      {
        label: 'C',
        text: 'Reducir el costo de las llamadas a la API del LLM',
      },
      {
        label: 'D',
        text: 'Permitir que el agente use múltiples modelos de lenguaje simultáneamente',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El sandbox crea un límite de aislamiento (boundary) que impide que el agente acceda al sistema host. Esto es crítico porque los agentes ejecutan código generado por un LLM, que puede ser impredecible. Sin sandbox, un agente podría leer credenciales, modificar archivos del sistema o hacer requests de red no autorizados. La velocidad de inferencia y el costo son preocupaciones ortogonales al sandboxing.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Por qué los agentes necesitan sandboxes',
    positionAfterHeading: 'Introducción: isolation y security',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Un sandbox para agentes solo es necesario cuando el agente ejecuta código Python; si el agente solo hace llamadas a APIs externas, no se necesita aislamiento.',
    correctAnswer: 'Falso',
    explanation:
      'El aislamiento no se limita a la ejecución de código. Un agente puede necesitar acceder a archivos, instalar paquetes, o interactuar con recursos de red. Además, incluso sin ejecutar código arbitrario, un agente sometido a prompt injection podría intentar exfiltrar datos a través de llamadas a APIs. El sandbox protege contra múltiples vectores de ataque, no solo contra ejecución de código.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Por qué los agentes necesitan sandboxes',
    positionAfterHeading: 'Introducción: isolation y security',
    sortOrder: 3,
    format: 'mc',
    questionText:
      '¿Cuáles de los siguientes recursos protege un sandbox del acceso no autorizado por parte del agente?',
    options: [
      { label: 'A', text: 'Credenciales y API keys del host' },
      { label: 'B', text: 'Sistema de archivos del host' },
      { label: 'C', text: 'Recursos de red internos' },
      {
        label: 'D',
        text: 'Todos los anteriores',
      },
    ],
    correctAnswer: 'D',
    explanation:
      'Un sandbox bien configurado protege los tres recursos simultáneamente. Las credenciales deben estar fuera del alcance del agente para evitar exfiltración. El sistema de archivos del host debe ser inaccesible para prevenir lectura o modificación de datos sensibles. Y el acceso a la red debe estar controlado para evitar que el agente haga conexiones laterales no autorizadas dentro de la infraestructura.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 2: Pattern 1 — Agent IN Sandbox
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Pattern 1: Agent IN Sandbox',
    positionAfterHeading: 'Arquitectura del patrón',
    sortOrder: 4,
    format: 'mc',
    questionText:
      'En el patrón "Agent IN Sandbox", ¿cómo se comunica la aplicación externa con el agente?',
    options: [
      {
        label: 'A',
        text: 'Mediante llamadas a funciones locales dentro del mismo proceso',
      },
      {
        label: 'B',
        text: 'A través de un endpoint HTTP o WebSocket expuesto por el contenedor',
      },
      {
        label: 'C',
        text: 'Mediante escritura directa en memoria compartida entre host y contenedor',
      },
      {
        label: 'D',
        text: 'El agente lee mensajes de un archivo compartido en un volumen montado',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'En el patrón Agent IN Sandbox, el framework del agente corre dentro de un contenedor Docker o VM y expone un endpoint API (HTTP o WebSocket). La aplicación externa cruza el límite del sandbox para enviar mensajes y recibir respuestas a través de este endpoint. Esto implica infraestructura adicional: manejo de sesiones, reconexión, y error handling sobre la capa de red.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Pattern 1: Agent IN Sandbox',
    positionAfterHeading: 'Arquitectura del patrón',
    sortOrder: 5,
    format: 'tf',
    questionText:
      'En el patrón "Agent IN Sandbox", las API keys necesarias para llamar al LLM residen fuera del sandbox, en el servidor del usuario.',
    correctAnswer: 'Falso',
    explanation:
      'Este es precisamente uno de los riesgos principales del Pattern 1. Como el agente corre dentro del sandbox y necesita hacer llamadas de inferencia al LLM, las API keys deben vivir dentro del sandbox. Esto crea un vector de ataque: si el sandbox es comprometido (por ejemplo, vía prompt injection), las credenciales pueden ser exfiltradas. En contraste, el Pattern 2 mantiene las API keys fuera del sandbox.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Pattern 1: Agent IN Sandbox',
    positionAfterHeading: 'Trade-offs y riesgos de seguridad',
    sortOrder: 6,
    format: 'mc',
    questionText:
      '¿Cuál es el riesgo de seguridad más crítico del patrón "Agent IN Sandbox" según Harrison Chase?',
    options: [
      {
        label: 'A',
        text: 'La latencia de red entre el agente y el LLM',
      },
      {
        label: 'B',
        text: 'Que un ataque de prompt injection pueda exfiltrar las credenciales que viven dentro del sandbox',
      },
      {
        label: 'C',
        text: 'Que el contenedor consuma demasiados recursos de CPU',
      },
      {
        label: 'D',
        text: 'Que el agente no pueda acceder a internet para descargar paquetes',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El riesgo central es la combinación de prompt injection + credential exfiltration. Dado que las API keys deben estar dentro del sandbox para que el agente haga inferencia, un atacante que logre inyectar instrucciones maliciosas en el prompt podría hacer que el agente extraiga esas credenciales. Además, el código del agente y los prompts del sistema también quedan expuestos dentro del sandbox, lo que crea un riesgo adicional de robo de propiedad intelectual.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Pattern 1: Agent IN Sandbox',
    positionAfterHeading: 'Trade-offs y riesgos de seguridad',
    sortOrder: 7,
    format: 'mc2',
    questionText:
      '¿Cuáles de los siguientes son trade-offs reales del patrón "Agent IN Sandbox"? (Selecciona todos los correctos)',
    options: [
      {
        label: 'A',
        text: 'Se requiere rebuild de la imagen del contenedor cada vez que se actualiza el código del agente',
      },
      {
        label: 'B',
        text: 'El código generado por el LLM hereda todos los permisos del agente, sin posibilidad de permisos granulares por herramienta',
      },
      {
        label: 'C',
        text: 'Es imposible usar WebSockets para comunicación bidireccional',
      },
      {
        label: 'D',
        text: 'Existe overhead de startup porque el sandbox debe ser resumido antes de que el agente esté activo',
      },
    ],
    correctAnswer: 'A,B,D',
    explanation:
      'A es correcto: cada cambio en la lógica del agente requiere un rebuild del contenedor, lo que genera fricción en el desarrollo. B es correcto: privilege escalation — todo el código generado por el LLM corre con los mismos permisos que el agente, y no se pueden otorgar permisos selectivos (por ejemplo, restringir web search pero permitir bash). C es falso: WebSockets sí se pueden usar y de hecho es una de las formas de comunicación mencionadas. D es correcto: el sandbox debe estar activo antes de poder interactuar con el agente.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 3: Pattern 2 — Sandbox as Tool
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Pattern 2: Sandbox as Tool',
    positionAfterHeading: 'Arquitectura del patrón',
    sortOrder: 8,
    format: 'mc',
    questionText:
      'En el patrón "Sandbox as Tool", ¿dónde se ejecuta el agente y dónde se ejecuta el código generado?',
    options: [
      {
        label: 'A',
        text: 'Ambos se ejecutan dentro del mismo sandbox remoto',
      },
      {
        label: 'B',
        text: 'El agente corre localmente (o en tu servidor) y el código generado se ejecuta en un sandbox remoto vía API',
      },
      {
        label: 'C',
        text: 'El código se ejecuta localmente y el agente corre en el sandbox remoto',
      },
      {
        label: 'D',
        text: 'Ambos se ejecutan en el host local sin aislamiento',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'Esta es la arquitectura fundamental del Pattern 2: separación entre razonamiento y ejecución. El agente planifica y razona localmente, genera código, y cuando necesita ejecutarlo, hace una llamada API a un proveedor de sandbox remoto (E2B, Modal, Daytona, Runloop). Los resultados regresan al agente, que continúa su razonamiento. Esto permite mantener las API keys y el estado del agente fuera del entorno de ejecución.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Pattern 2: Sandbox as Tool',
    positionAfterHeading: 'Arquitectura del patrón',
    sortOrder: 9,
    format: 'tf',
    questionText:
      'En el patrón "Sandbox as Tool", un fallo del sandbox remoto compromete el estado del agente (historial de conversación, cadena de razonamiento).',
    correctAnswer: 'Falso',
    explanation:
      'Una de las ventajas clave del Pattern 2 es que los fallos del sandbox no comprometen el estado del agente. Como el estado del agente (historial de conversación, cadenas de razonamiento) vive separado del entorno de ejecución, un crash o timeout del sandbox remoto no afecta al agente. Este puede simplemente reintentar la ejecución, usar otro sandbox, o reportar el error y continuar. Esto es separación de concerns en acción.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Pattern 2: Sandbox as Tool',
    positionAfterHeading: 'Beneficios y paralelización',
    sortOrder: 10,
    format: 'mc',
    questionText:
      '¿Qué ventaja de costo y eficiencia ofrece el patrón "Sandbox as Tool" respecto al Pattern 1?',
    options: [
      {
        label: 'A',
        text: 'Elimina completamente la necesidad de un LLM para generar código',
      },
      {
        label: 'B',
        text: 'Permite ejecutar múltiples sandboxes en paralelo y usar un modelo pay-per-execution en vez de un runtime persistente',
      },
      {
        label: 'C',
        text: 'Reduce la latencia de red a cero mediante caching local',
      },
      {
        label: 'D',
        text: 'Obliga a usar un solo proveedor de sandbox, lo que reduce costos por volumen',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El Pattern 2 permite ejecutar múltiples sandboxes remotos en paralelo, lo cual es ideal para tareas que pueden ser divididas. Además, el modelo de pago por ejecución (pay-per-execution) es más eficiente que mantener un runtime persistente activo. También permite optimizar hardware: la máquina de inferencia puede ser diferente de la máquina de ejecución de código, lo que significa que puedes usar GPUs para inferencia y CPUs baratas para ejecución.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Pattern 2: Sandbox as Tool',
    positionAfterHeading: 'Latencia y sesiones stateful',
    sortOrder: 11,
    format: 'mc',
    questionText:
      '¿Cuál es el principal trade-off del patrón "Sandbox as Tool" y cómo se mitiga?',
    options: [
      {
        label: 'A',
        text: 'La falta de aislamiento, que se mitiga con firewalls de red',
      },
      {
        label: 'B',
        text: 'La latencia de red en ejecuciones frecuentes, que se mitiga con sesiones stateful que persisten variables, archivos y paquetes instalados entre invocaciones',
      },
      {
        label: 'C',
        text: 'La imposibilidad de ejecutar código Python, que se mitiga usando Node.js',
      },
      {
        label: 'D',
        text: 'El alto costo fijo, que se mitiga con contratos anuales con proveedores cloud',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'La latencia de red es el downside principal del Pattern 2. Cada vez que el agente necesita ejecutar código, debe cruzar un boundary de red hacia el sandbox remoto. Si el agente hace muchas ejecuciones pequeñas y frecuentes, el overhead acumulado es significativo. La mitigación clave son las sesiones stateful: el proveedor del sandbox mantiene el estado (variables, archivos, paquetes) entre llamadas, reduciendo los round-trips necesarios y evitando reinstalar dependencias repetidamente.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Pattern 2: Sandbox as Tool',
    positionAfterHeading: 'Latencia y sesiones stateful',
    sortOrder: 12,
    format: 'mc2',
    questionText:
      '¿Cuáles de los siguientes son beneficios reales del patrón "Sandbox as Tool"? (Selecciona todos los correctos)',
    options: [
      {
        label: 'A',
        text: 'Las API keys se mantienen fuera del sandbox, eliminando el riesgo de exfiltración desde el entorno de ejecución',
      },
      {
        label: 'B',
        text: 'Actualizaciones al código del agente son instantáneas, sin necesidad de rebuild de contenedores',
      },
      {
        label: 'C',
        text: 'Es backend-agnostic: compatible con E2B, Modal, Daytona, Runloop y otros proveedores',
      },
      {
        label: 'D',
        text: 'Elimina completamente la necesidad de manejo de errores en la comunicación con el sandbox',
      },
    ],
    correctAnswer: 'A,B,C',
    explanation:
      'A, B y C son beneficios reales y explícitos del Pattern 2. A: las credenciales permanecen en el entorno local del agente, no dentro del sandbox de ejecución. B: como el agente corre localmente, actualizar su lógica no requiere reconstruir ninguna imagen. C: la arquitectura de "sandbox como herramienta" es agnóstica al proveedor backend. D es falso: la comunicación de red siempre requiere manejo de errores (timeouts, fallos de conexión, respuestas malformadas); el Pattern 2 no elimina esta necesidad, aunque sí aísla los fallos del sandbox del estado del agente.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 4: Criterios de selección
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Criterios de selección',
    positionAfterHeading: 'Cuándo usar cada patrón',
    sortOrder: 13,
    format: 'mc',
    questionText:
      '¿En cuál de los siguientes escenarios es más apropiado usar el patrón "Agent IN Sandbox"?',
    options: [
      {
        label: 'A',
        text: 'Cuando necesitas iterar rápidamente sobre la lógica del agente sin downtime',
      },
      {
        label: 'B',
        text: 'Cuando el agente y el entorno de ejecución están fuertemente acoplados y necesitas que producción refleje el entorno de desarrollo local',
      },
      {
        label: 'C',
        text: 'Cuando las API keys no deben estar accesibles desde el entorno de ejecución bajo ninguna circunstancia',
      },
      {
        label: 'D',
        text: 'Cuando necesitas ejecutar docenas de sandboxes en paralelo para procesamiento batch',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El Pattern 1 es apropiado cuando existe un acoplamiento fuerte entre el agente y su entorno de ejecución, y cuando deseas que producción sea un espejo del desarrollo local. A favorece Pattern 2 (iteración rápida sin rebuild). C favorece Pattern 2 (keys fuera del sandbox). D favorece Pattern 2 (paralelización de sandboxes remotos). El trade-off es claro: Pattern 1 sacrifica seguridad y flexibilidad a cambio de simplicidad en el acoplamiento agente-entorno.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Criterios de selección',
    positionAfterHeading: 'Cuándo usar cada patrón',
    sortOrder: 14,
    format: 'tf',
    questionText:
      'Si tu principal preocupación es la seguridad de credenciales y la separación de concerns entre estado del agente y entorno de ejecución, el Pattern 1 (Agent IN Sandbox) es la mejor elección.',
    correctAnswer: 'Falso',
    explanation:
      'Es exactamente al revés. Si la seguridad de credenciales es tu prioridad, el Pattern 2 es superior porque las API keys nunca entran al sandbox. Si valoras la separación de concerns (estado del agente vs entorno de ejecución), el Pattern 2 también gana: el historial de conversación, las cadenas de razonamiento y el estado persistente del agente viven separados del entorno efímero de ejecución. El Pattern 1 mezcla ambos en el mismo contenedor.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Criterios de selección',
    positionAfterHeading: 'Cuándo usar cada patrón',
    sortOrder: 15,
    format: 'mc',
    questionText:
      'Un equipo necesita: (1) actualizar la lógica del agente varias veces al día, (2) mantener API keys seguras, y (3) escalar horizontalmente con múltiples ejecuciones paralelas. ¿Qué patrón deben elegir?',
    options: [
      {
        label: 'A',
        text: 'Pattern 1: Agent IN Sandbox, porque permite acceso directo al filesystem',
      },
      {
        label: 'B',
        text: 'Pattern 2: Sandbox as Tool, porque cumple los tres requisitos simultáneamente',
      },
      {
        label: 'C',
        text: 'Ninguno de los dos; se necesita un tercer patrón híbrido',
      },
      {
        label: 'D',
        text: 'Pattern 1 con API keys rotadas manualmente cada hora',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El Pattern 2 cumple los tres requisitos: (1) actualizaciones instantáneas sin rebuild de contenedores, (2) API keys fuera del sandbox, y (3) ejecución de múltiples sandboxes en paralelo con modelo pay-per-execution. El Pattern 1 falla en los tres: requiere rebuild para actualizar, pone las keys dentro del sandbox, y escalar significa levantar múltiples contenedores pesados con el agente completo. D es una solución parcial e insostenible que no aborda la raíz del problema.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },

  // ─────────────────────────────────────────────────────────
  // SECCIÓN 5: Implementación
  // ─────────────────────────────────────────────────────────
  {
    sectionTitle: 'Implementación',
    positionAfterHeading: 'Code examples con deepagents',
    sortOrder: 16,
    format: 'mc',
    questionText:
      'En el ejemplo de implementación del Pattern 2 con Daytona, ¿cuál es el flujo de ejecución correcto?',
    options: [
      {
        label: 'A',
        text: 'Sandbox ejecuta → agente recibe resultado → LLM genera código → agente planifica',
      },
      {
        label: 'B',
        text: 'Agente planifica localmente → LLM genera código → llama API de Daytona → sandbox ejecuta → resultado regresa al agente → agente continúa razonando',
      },
      {
        label: 'C',
        text: 'LLM genera código → código se ejecuta localmente → resultado se envía al sandbox para validación',
      },
      {
        label: 'D',
        text: 'Sandbox genera código automáticamente → agente lo revisa → LLM lo aprueba',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'El flujo del Pattern 2 es secuencial y claro: el agente planifica localmente, el LLM genera código, el agente envía ese código al sandbox remoto vía la API del proveedor (Daytona en este caso), el sandbox ejecuta el código y devuelve los resultados, y el agente continúa su razonamiento local con esos resultados. Este flujo mantiene la separación entre razonamiento (local) y ejecución (remota).',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Implementación',
    positionAfterHeading: 'Code examples con deepagents',
    sortOrder: 17,
    format: 'tf',
    questionText:
      'En el ejemplo de código, la función sandbox.stop() es opcional y solo sirve para liberar memoria local.',
    correctAnswer: 'Falso',
    explanation:
      'sandbox.stop() detiene el sandbox remoto, lo cual es importante tanto para liberar recursos en el proveedor como para evitar costos innecesarios en un modelo pay-per-execution. Olvidar llamar stop() puede resultar en sandboxes huérfanos que siguen consumiendo recursos y generando costos. Es una práctica esencial de cleanup, no un paso opcional.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Implementación',
    positionAfterHeading: 'Separación de concerns en la práctica',
    sortOrder: 18,
    format: 'mc2',
    questionText:
      '¿Cuáles de los siguientes componentes forman parte del "estado del agente" que en el Pattern 2 se mantiene separado del sandbox? (Selecciona todos los correctos)',
    options: [
      { label: 'A', text: 'Historial de conversación con el usuario' },
      { label: 'B', text: 'Cadenas de razonamiento (reasoning chains)' },
      {
        label: 'C',
        text: 'Paquetes Python instalados en el entorno de ejecución',
      },
      { label: 'D', text: 'System prompt y configuración del agente' },
    ],
    correctAnswer: 'A,B,D',
    explanation:
      'A, B y D son estado del agente que vive localmente en el Pattern 2. El historial de conversación y las cadenas de razonamiento son el "cerebro" del agente. El system prompt y la configuración definen su comportamiento. C es estado del sandbox (entorno de ejecución), no del agente. Esta separación es la que permite que un crash del sandbox no afecte al agente, y que el agente pueda cambiar de backend de ejecución sin perder su contexto.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
  {
    sectionTitle: 'Implementación',
    positionAfterHeading: 'Separación de concerns en la práctica',
    sortOrder: 19,
    format: 'mc',
    questionText:
      '¿Qué significa que el Pattern 2 sea "backend-agnostic" en términos prácticos de implementación?',
    options: [
      {
        label: 'A',
        text: 'Que no necesita ningún backend y ejecuta todo en el navegador',
      },
      {
        label: 'B',
        text: 'Que el agente puede intercambiar el proveedor de sandbox (E2B, Modal, Daytona, Runloop) sin cambiar la lógica del agente',
      },
      {
        label: 'C',
        text: 'Que funciona sin conexión a internet',
      },
      {
        label: 'D',
        text: 'Que el LLM no necesita ser de ningún proveedor específico',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'Backend-agnostic en este contexto significa que la interfaz entre el agente y el sandbox está abstraída de tal forma que puedes cambiar el proveedor de ejecución (E2B, Modal, Daytona, Runloop) sin modificar la lógica del agente. El SDK del proveedor maneja los detalles de comunicación de forma transparente. Esto es posible porque el sandbox es "solo una herramienta" con una interfaz bien definida: enviar código, recibir resultado.',
    academicReference: 'Chase, LangChain Blog, Feb 2026',
  },
];
