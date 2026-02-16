import type { ReadingQuestion } from '@/app/learn/[resourceId]/reading-questions';

export const agentSandboxPatternsQuestions: ReadingQuestion[] = [
  {
    type: 'why',
    question:
      '¿Por qué Harrison Chase recomienda que el agente NO viva dentro del sandbox (Pattern 2 sobre Pattern 1)? Si tener acceso directo al filesystem es más simple, ¿qué riesgos arquitectónicos justifican la indirección de una API?',
    concept: 'Agent outside sandbox',
    hint: 'Piensa en qué pasa con las API keys del agente si el sandbox ejecuta código arbitrario generado por el LLM. ¿Quién controla el perímetro de seguridad?',
  },
  {
    type: 'why',
    question:
      '¿Por qué la necesidad de rebuild del container cada vez que se actualiza el agente es un problema fundamental del Pattern 1 (Agent IN Sandbox), y no solo una molestia operativa? ¿Qué implica para la velocidad de iteración y el deployment en producción?',
    concept: 'Rebuild cost in Pattern 1',
    hint: 'Piensa en el ciclo de desarrollo: si cada cambio al agente requiere reconstruir la imagen del sandbox, ¿cómo afecta esto cuando tienes múltiples agentes o actualizaciones frecuentes del modelo?',
  },
  {
    type: 'tradeoff',
    question:
      'Pattern 1 (Agent IN Sandbox) tiene acceso directo al filesystem sin latencia de red. Pattern 2 (Sandbox as Tool) introduce latencia en cada operación de archivo. ¿En qué tipo de tareas esta latencia es aceptable y en cuáles podría ser un dealbreaker? ¿Cómo cambia el análisis si el agente necesita hacer cientos de operaciones de I/O secuenciales?',
    concept: 'Latencia de red vs acceso directo',
    hint: 'Considera la diferencia entre un agente que ejecuta un script de una sola vez vs uno que interactivamente edita archivos, ejecuta tests, lee errores, y repite. ¿Cuántos round-trips implica cada patrón?',
  },
  {
    type: 'tradeoff',
    question:
      'Pattern 2 permite paralelizar sandboxes fácilmente (un agente, múltiples containers). Pero esto introduce el problema de sincronización de estado entre sandboxes. ¿Cuándo la paralelización compensa la complejidad adicional, y cuándo es mejor un solo sandbox secuencial?',
    concept: 'Paralelización de sandboxes',
    hint: 'Piensa en tareas independientes (ejecutar tests en paralelo) vs tareas con dependencias (editar archivo A, luego archivo B que depende de A). ¿Qué pasa con el estado compartido?',
  },
  {
    type: 'connection',
    question:
      '¿Cómo se relaciona el Pattern 2 (Sandbox as Tool) con el patrón ReAct (Reason + Act)? Si el agente razona externamente y llama al sandbox como una tool más, ¿en qué se parece esto al loop observe-think-act de ReAct, y qué ventaja da para la trazabilidad del razonamiento del agente?',
    concept: 'Sandbox as Tool y ReAct pattern',
    hint: 'En ReAct, el agente alterna entre razonamiento y acción. Si el sandbox es una tool, cada invocación es una acción observable. ¿Qué pasa con la observabilidad si el agente vive DENTRO del sandbox y actúa directamente?',
  },
  {
    type: 'design_decision',
    question:
      'Estás diseñando un coding agent que necesita: (1) ejecutar código Python arbitrario, (2) instalar dependencias con pip, (3) acceder a una API externa con credenciales del usuario. ¿Qué patrón elegirías y cómo mitigarías sus desventajas? Justifica considerando seguridad, latencia y operabilidad.',
    concept: 'Elección de patrón para coding agent',
    hint: 'Las credenciales del usuario son el punto crítico. ¿Dónde viven las API keys? ¿Qué pasa si el código Python generado por el LLM intenta leer variables de entorno o hacer requests a endpoints maliciosos?',
  },
  {
    type: 'error_detection',
    question:
      '"El Pattern 1 (Agent IN Sandbox) es más seguro porque el agente está contenido dentro de un container aislado, lo cual previene que código malicioso acceda al sistema host." ¿Qué error fundamental tiene este razonamiento sobre el modelo de amenaza?',
    concept: 'Modelo de amenaza en Pattern 1',
    hint: 'El container aísla del host, sí. Pero el agente tiene API keys dentro del container. ¿De quién te estás protegiendo realmente: del agente accediendo al host, o del código generado accediendo a los secretos del agente?',
  },
];
