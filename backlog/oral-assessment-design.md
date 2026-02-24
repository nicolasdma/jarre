# Oral Assessment & AI-Resilient Evaluation Design

**Fecha:** 2026-02-16
**Prerequisito:** `backlog/spoken-tutor-research.md` (infraestructura técnica)
**Problema:** Todas las evaluaciones actuales son asíncronas y basadas en texto. Cualquier estudiante puede copiar preguntas a ChatGPT y pegar respuestas. Claude Code puede completar proyectos enteros. El sistema no valida comprensión — valida calidad de texto.

---

## Principio Rector

**Si no es sincrónico y adaptativo, es falsificable.**

La IA no es el enemigo del aprendizaje. Es una herramienta que el estudiante va a usar — como usa Google, Stack Overflow, o un compilador. El sistema debe:
1. **Permitir** uso de IA durante producción (proyectos, código, escritura)
2. **Validar** comprensión de forma infalsificable (oral, sincrónico, adaptativo)
3. **Evaluar** la nueva metacompetencia: juzgar output de IA

> Saber en la era IA = poder dirigir, evaluar, y corregir la producción de IA, y defender tus decisiones en tiempo real.

---

## 1. Redefinición de Mastery Levels

### Modelo Actual (texto-only, falsificable)

| Level | Gate | Vulnerabilidad |
|-------|------|----------------|
| 0→1 | 3 micro-tests O eval ≥60% (texto) | Copiar respuestas de ChatGPT |
| 1→2 | Proyecto completado | Claude Code construye el proyecto |
| 2→3 | Eval ≥80% tradeoff/design (texto) | Copiar respuestas de ChatGPT |
| 3→4 | Manual (no implementado) | No existe mecanismo |

### Modelo Propuesto (oral gates)

| Level | Gate Escrito (producción) | Gate Oral (validación) |
|-------|--------------------------|------------------------|
| 0→1 | 3 micro-tests O eval ≥60% | **Quick-check oral: 3 min** (1 pregunta + 2 follow-ups) |
| 1→2 | Proyecto completado (IA permitida) | **Defensa de proyecto: 10 min** |
| 2→3 | Eval ≥80% tradeoff/design | **Socrático adversarial: 12 min** |
| 3→4 | — | **Enseñanza simulada: 15 min** (alumno-IA adversarial) |

**Regla clave:** El gate escrito es *necesario pero no suficiente*. El gate oral es *obligatorio* para avanzar. La producción escrita demuestra esfuerzo; la evaluación oral demuestra comprensión.

### Impacto en código

```
src/lib/mastery.ts:
  - canAdvanceToLevel1() → agregar check: oral_quick_check_passed
  - canAdvanceToLevel2() → agregar check: project_defense_passed
  - canAdvanceToLevel3() → agregar check: socratic_oral_passed
  - Nuevo: canAdvanceToLevel4() con teach_session_passed

src/types/index.ts:
  - MasteryTriggerType: agregar 'oral_assessment'
  - Nuevo tipo: OralAssessmentResult

src/lib/constants.ts:
  - ORAL_QUICK_CHECK_DURATION_MS = 3 * 60 * 1000
  - ORAL_DEFENSE_DURATION_MS = 10 * 60 * 1000
  - ORAL_SOCRATIC_DURATION_MS = 12 * 60 * 1000
  - ORAL_TEACH_DURATION_MS = 15 * 60 * 1000
  - ORAL_FOLLOW_UP_DEPTH_THRESHOLD = 3  // follow-ups que debe sobrevivir
```

---

## 2. Oral Quick-Check (Level 0→1)

### Objetivo
Validar que el estudiante puede explicar el concepto sin notas, con follow-ups que impiden respuestas memorizadas.

### Estructura (3 minutos)

```
FASE 1 — Pregunta Semilla (30s para responder)
  LLM genera pregunta de tipo 'explanation' para el concepto.
  "Explicame qué es leader-based replication y por qué se usa."

FASE 2 — Follow-up Adaptativo #1 (45s)
  Basado en la respuesta del estudiante:
  - Si fue correcta pero superficial → profundizar:
    "¿Qué pasa con las lecturas durante el replication lag?"
  - Si fue incorrecta → redirect:
    "Dijiste que todos los nodos pueden recibir escrituras.
     ¿Eso no sería multi-leader? ¿Cuál es la diferencia?"
  - Si fue correcta y profunda → edge case:
    "¿Y si el líder muere justo después de confirmar una escritura
     pero antes de replicarla?"

FASE 3 — Follow-up Adaptativo #2 (45s)
  Escala un nivel más:
  - Si sigue siendo correcta → contra-ejemplo o tradeoff:
    "¿Cuándo preferirías leaderless replication sobre esto?"
  - Si flaquea → hint y segunda oportunidad:
    "Pensá en qué pasa con la disponibilidad durante el failover..."
```

### Criterios de Aprobación

No es un score numérico. Es un juicio holístico del LLM sobre 3 señales:

| Señal | Qué evalúa | Indicador de PASS |
|-------|-----------|-------------------|
| **Coherencia** | ¿Las respuestas son consistentes entre sí? | No se contradice a medida que profundizan |
| **Reactividad** | ¿Responde a los follow-ups o repite la respuesta inicial? | Adapta su explicación al ángulo de la pregunta |
| **Profundidad** | ¿Sobrevive 2 niveles de follow-up? | Al menos 1 de 2 follow-ups respondido con sustancia |

```
Resultado: PASS | RETRY_IN_24H | FAIL_RELEER
- PASS: Avanza a Level 1
- RETRY_IN_24H: "Casi. Revisá [concepto específico] y volvé mañana."
- FAIL_RELEER: "Necesitás releer la sección sobre [X]. Volvé después de completarla."
```

### Señales de Speech que el LLM debe considerar

Whisper transcribe audio. El LLM recibe texto + metadata de timing:

- **Latencia de respuesta**: >15 segundos de silencio antes de responder sugiere que está buscando/leyendo
- **Muletillas excesivas** sin contenido ("ehh... como que... es algo de...")
  - Nota: las muletillas normales NO penalizan — son naturales en habla oral
  - Solo se penaliza si después de las muletillas no hay contenido sustantivo
- **Lectura robótica**: cadencia uniforme sin pausas naturales sugiere lectura
  - Esto es heurístico y NO debe ser criterio de rechazo por sí solo
- **Auto-corrección**: "no, esperá, en realidad..." es señal POSITIVA — indica pensamiento activo

### System Prompt para el Evaluador

```
Sos un evaluador oral Socrático para el concepto "{conceptName}".
Definición canónica: "{canonicalDefinition}"

REGLAS:
1. Hacé UNA pregunta inicial de tipo 'explanation'.
2. Escuchá la respuesta del estudiante.
3. Generá un follow-up que DEPENDA de lo que dijo:
   - Si fue correcta pero superficial → profundizá
   - Si fue incorrecta → redirigí sin dar la respuesta
   - Si fue correcta y profunda → atacá un edge case
4. Después del segundo follow-up, emití un VEREDICTO.
5. NUNCA des la respuesta correcta durante la evaluación.
6. NUNCA hagas preguntas que se respondan con sí/no.
7. Hablá en español rioplatense, tono de colega senior (no profesor).

VEREDICTO (JSON):
{
  "result": "pass" | "retry" | "fail",
  "coherence": 0-2,
  "reactivity": 0-2,
  "depth": 0-2,
  "feedback": "string — qué repasar si no pasó",
  "transcript_highlights": ["frases clave del estudiante que justifican el veredicto"]
}
```

---

## 3. Defensa de Proyecto (Level 1→2)

### Objetivo
El proyecto puede haber sido construido con Claude Code, Cursor, o cualquier IA. No importa. Lo que importa es que el estudiante pueda defender cada decisión arquitectónica y diagnosticar problemas en vivo.

### Estructura (10 minutos)

```
FASE 1 — Recorrido Arquitectónico (3 min)
  El estudiante tiene su código abierto.
  LLM: "Describime la arquitectura de tu sistema en 2 minutos.
        ¿Cuáles son los componentes principales y cómo se comunican?"

  El evaluador ya tiene acceso al README/estructura del proyecto
  (subido antes de la defensa). Puede comparar lo que dice con lo que existe.

FASE 2 — Preguntas de Decisión (3 min)
  2-3 preguntas sobre decisiones de diseño:
  "¿Por qué elegiste consistent hashing y no range partitioning?"
  "Veo que usás un WAL. ¿Qué pasa si el WAL se corrompe?"
  "¿Por qué este timeout es 5 segundos y no 500ms?"

  Criterio: El estudiante debe poder justificar con tradeoffs,
  no solo "porque Claude lo puso ahí".

FASE 3 — Debugging en Vivo (4 min)
  El evaluador describe un escenario de falla:
  "Imaginá que tu sistema está corriendo con 3 nodos.
   El líder recibe una escritura, la commitea al WAL,
   envía a 1 de 2 followers, y muere antes de enviar al segundo.
   ¿Qué pasa? ¿Se pierde la escritura?"

  El estudiante debe razonar en voz alta:
  - Identificar el estado de cada componente
  - Trazar el flujo de datos
  - Predecir el comportamiento del sistema
  - Proponer cómo verificar o mitigar

  Variante avanzada: El evaluador inyecta un bug real en el código
  (vía diff mostrado en pantalla) y pide diagnóstico.
```

### Criterios de Aprobación

| Dimensión | 0 - Fail | 1 - Parcial | 2 - Pass |
|-----------|----------|-------------|----------|
| **Ownership** | No puede explicar componentes básicos, dice "no me acuerdo" en >2 preguntas | Explica la arquitectura general pero falla en detalles de implementación | Explica arquitectura Y justifica decisiones con tradeoffs |
| **Debugging** | No puede trazar el flujo de datos del escenario de falla | Identifica el problema pero no puede predecir el comportamiento exacto | Traza el flujo, predice el comportamiento, y propone mitigación |
| **Tradeoffs** | Responde "no sé" o da justificaciones genéricas ("es más rápido") | Identifica un tradeoff pero no lo contextualiza al proyecto | Articula tradeoffs específicos con referencia al dominio del problema |

**Threshold**: Total ≥ 4/6 → PASS

### Pre-requisitos del Estudiante

Antes de la defensa, el estudiante sube:
1. Link al repo (GitHub/local)
2. README con arquitectura (puede ser generado por IA — es el punto)
3. El evaluador tiene 30 segundos para parsear la estructura antes de empezar

### System Prompt para el Evaluador

```
Sos un evaluador de defensa de proyecto. El estudiante construyó un
{projectType} para Phase {phase}.

Estructura del proyecto:
{projectStructure}

README:
{projectReadme}

Conceptos que debe dominar: {conceptList}

REGLAS:
1. Empezá pidiendo un recorrido arquitectónico de 2 minutos.
2. Después hacé 2-3 preguntas sobre decisiones de diseño.
   Elegí las decisiones más IMPORTANTES (no trivialidades).
3. Terminá con un escenario de falla y pedí diagnóstico en voz alta.
4. Si el estudiante dice "no sé", dale UN hint y pedí que lo intente.
   Si sigue sin poder → eso es data para el veredicto.
5. NUNCA le digas la respuesta correcta durante la defensa.
6. Prestá atención a si el estudiante muestra ownership real del código
   vs. repite lo que un LLM le habría explicado.

SEÑALES DE OWNERSHIP REAL:
- Menciona problemas que encontró durante desarrollo
- Sabe dónde está cada cosa en el código
- Puede modificar mentalmente el diseño ante presión
- Usa terminología del dominio con naturalidad

SEÑALES DE OWNERSHIP FALSO:
- Respuestas genéricas que aplican a cualquier proyecto
- No puede decir por qué algo es así (solo que "funciona")
- Describe el sistema en abstracto sin referencia al código
- Las justificaciones suenan a documentación de framework
```

---

## 4. Evaluación Socrática Adversarial (Level 2→3)

### Objetivo
Validar que el estudiante puede criticar, encontrar errores, evaluar tradeoffs, y defender posiciones bajo presión intelectual. Es el nivel "senior engineer" — no basta con saber cómo funciona, hay que saber cuándo falla.

### Estructura (12 minutos)

```
FASE 1 — Afirmación Plausible-Pero-Falsa (3 min)
  El evaluador presenta una afirmación que SUENA correcta pero tiene
  un error sutil. El estudiante debe detectarlo.

  Ejemplo (consensus):
  "Raft garantiza que si un líder commitea una entrada,
   todos los followers la tienen en su log antes del commit."

  Error: El líder commitea cuando una MAYORÍA tiene la entrada,
  no todos. Followers que estaban caídos no la tienen.

  Si el estudiante no detecta el error:
  → Hint: "Pensá en qué pasa si 1 de 5 nodos está caído."
  Si sigue sin detectar:
  → Segundo hint: "¿Cuántos nodos necesitan confirmar para que
     el líder considere una entrada 'committed'?"
  Si falla los 3 intentos → marcado como área débil.

FASE 2 — Tradeoff Bajo Presión (4 min)
  El evaluador plantea un escenario con restricciones contradictorias:

  "Tu cliente necesita consistencia fuerte para un sistema de pagos,
   pero también necesita <100ms de latencia y tolerar 2 datacenters caídos.
   ¿Se puede? Si no, ¿qué sacrificás y por qué?"

  El evaluador desafía cada respuesta:
  - "¿Y si te digo que el competitor lo hace con 50ms?"
  - "¿Cómo justificás eso al CTO que quiere las tres cosas?"
  - "¿No sería más simple usar eventual consistency con compensación?"

  El estudiante debe mantener coherencia o pivotar con justificación.

FASE 3 — Conexión Cross-Concept (3 min)
  El evaluador pide conexiones entre conceptos de diferentes fases:

  "¿Cómo se relaciona partitioning con el serving de un modelo LLM?"
  "Si tuvieras que diseñar un RAG system sobre un cluster Raft,
   ¿dónde pondrías el vector index y por qué?"

  Esto valida transfer — el estudiante no puede haber memorizado esto
  porque la conexión es novel.

FASE 4 — Meta-Reflexión (2 min)
  "¿Qué es lo que más te cuesta de este concepto?"
  "¿Dónde sentís que tu comprensión es más frágil?"

  Calibración metacognitiva. El estudiante que realmente entiende
  sabe exactamente qué NO entiende.
  El estudiante que copió de ChatGPT dice "creo que entiendo todo bien".
```

### Criterios de Aprobación

| Dimensión | 0 | 1 | 2 |
|-----------|---|---|---|
| **Error Detection** | No detecta la afirmación falsa ni con hints | Detecta con 1+ hints | Detecta sin hints y explica por qué |
| **Tradeoff Defense** | Respuestas genéricas, no puede defender bajo presión | Identifica tradeoffs pero no puede articular implicaciones | Defiende posición coherentemente, pivotea con justificación cuando se le presenta evidencia |
| **Cross-Concept** | No puede conectar conceptos de diferentes fases | Conexión superficial ("ambos son sobre distribuir datos") | Conexión con insight específico y original |
| **Metacognición** | "Creo que entiendo todo" o "no sé qué no sé" | Identifica un área vaga | Señala fragilidades específicas con ejemplos |

**Threshold**: Total ≥ 6/8 → PASS, con 0 en Error Detection = auto-FAIL.

---

## 5. Enseñanza Simulada con Alumno-IA Adversarial (Level 3→4)

### Objetivo
El nivel más alto de comprensión es poder enseñar. El LLM simula un estudiante con misconceptions comunes y el evaluado debe corregirlas, usar analogías efectivas, y admitir cuando no sabe.

### Estructura (15 minutos)

```
FASE 1 — Setup (1 min)
  "Voy a ser tu alumno. Estoy aprendiendo sobre {concept}.
   Enseñame como si fuera un developer junior que sabe programar
   pero nunca trabajó con sistemas distribuidos."

FASE 2 — Enseñanza + Interrupciones (10 min)
  El estudiante empieza a enseñar. El alumno-IA interrumpe con:

  Tipo A — Misconception plantada:
  "Ah, entonces consistencia eventual significa que
   eventualmente todos los nodos van a tener los mismos datos, ¿no?
   O sea, siempre terminan consistentes."
  (Misconception: eventual consistency no garantiza convergencia sin
   mecanismos adicionales como anti-entropy o read repair)

  Tipo B — Pregunta genuina difícil:
  "¿Y si dos clientes escriben al mismo nodo al mismo tiempo?
   ¿Quién gana?"

  Tipo C — Analogía incorrecta:
  "Es como un Google Doc, ¿no? Todos editan al mismo tiempo
   y se sincroniza solo."
  (El estudiante debe explicar por qué la analogía es parcialmente
   correcta y dónde se rompe)

  Tipo D — Pedido de ejemplo concreto:
  "No entiendo. ¿Me podés dar un ejemplo real de cuándo
   esto fallaría?"

FASE 3 — Resumen del alumno (2 min)
  El alumno-IA resume lo que "aprendió" — con errores deliberados.
  "Entonces, si entendí bien: Raft tiene un líder que manda
   todas las escrituras a todos los nodos, y si el líder muere,
   el nodo con más datos gana la elección."
  (Errores: no manda a todos — mayoría; no gana el de más datos —
   gana el del log más completo en el término más alto)

  El estudiante debe corregir sin humillar al alumno.

FASE 4 — Evaluación (2 min)
  El evaluador (no el alumno) sale de personaje y pregunta:
  "¿Hubo algún momento donde no estuviste seguro de lo que decías?"
  "¿Qué habrías hecho diferente si tuvieras 30 minutos en vez de 10?"
```

### Criterios de Aprobación

| Dimensión | 0 | 1 | 2 |
|-----------|---|---|---|
| **Corrección de misconceptions** | No detecta o confirma la misconception | Detecta pero no sabe cómo corregir claramente | Detecta, corrige, y previene recurrencia con ejemplo |
| **Adaptación pedagógica** | Habla como si leyera un libro — no adapta al nivel del alumno | Adapta vocabulario pero no verifica comprensión | Adapta, verifica comprensión, ajusta approach si no funciona |
| **Manejo de incertidumbre** | Inventa respuestas cuando no sabe | Dice "no sé" pero no ofrece path de resolución | Dice "no estoy seguro, pero podemos verificar así..." |
| **Detección de errores en resumen** | Acepta el resumen con errores | Detecta algunos errores | Detecta todos los errores significativos y los corrige |

**Threshold**: Total ≥ 6/8 → Level 4 otorgado.

---

## 6. Evaluación de Juicio sobre Output IA (Nueva Competencia)

### Objetivo
Ejercicios (no orales necesariamente) donde se presenta output real de GPT-4/Claude con errores sutiles. El estudiante debe juzgar calidad.

### No es un gate de mastery. Es una competencia transversal que se practica continuamente.

### Formato

```
PROMPT AL ESTUDIANTE:
"Le pedí a Claude que explique cómo funciona Raft consensus.
Esta es su respuesta:

[Output de 300-500 palabras generado por LLM con 2-3 errores sutiles
inyectados deliberadamente]

Tu tarea:
(a) ¿Qué está bien? Señalá las afirmaciones correctas.
(b) ¿Qué está mal? Señalá los errores y explicá por qué son errores.
(c) ¿Qué falta? ¿Qué debería haber incluido pero no lo hizo?
(d) ¿Qué asumió implícitamente que podría no aplicar a tu contexto?"
```

### Tipos de Errores Inyectados

| Tipo | Ejemplo | Dificultad |
|------|---------|------------|
| **Factual sutil** | "Raft requiere consenso unánime" (es mayoría, no unanimidad) | Media |
| **Confusión de conceptos** | Usar "consistency" cuando debería ser "consensus" | Media |
| **Sobregeneralización** | "Esto siempre mejora el rendimiento" (depende del workload) | Alta |
| **Omisión crítica** | Explicar replication sin mencionar replication lag | Alta |
| **Asunción implícita** | Asumir red confiable en un sistema distribuido | Muy Alta |
| **Correcto pero misleading** | Técnicamente cierto pero sugiere conclusión incorrecta | Muy Alta |

### Generación de Outputs con Errores

```
System prompt para generar output con errores:
"Generá una explicación de {concept} que sea 80% correcta pero contenga
exactamente {n} errores de los siguientes tipos: {errorTypes}.
Los errores deben ser SUTILES — no obvios.
No señales dónde están los errores.
El texto debe sonar natural y convincente."
```

### Rúbrica: AI_OUTPUT_REVIEW_RUBRIC

```typescript
const AI_OUTPUT_REVIEW_RUBRIC: Rubric = {
  id: 'ai_output_review',
  dimensions: [
    {
      key: 'detection',
      name: { es: 'Detección', en: 'Detection' },
      levels: [
        { score: 0, es: 'No detecta errores o marca cosas correctas como errores', en: '...' },
        { score: 1, es: 'Detecta algunos errores pero pierde los más sutiles', en: '...' },
        { score: 2, es: 'Detecta todos los errores significativos', en: '...' },
      ],
    },
    {
      key: 'correction',
      name: { es: 'Corrección', en: 'Correction' },
      levels: [
        { score: 0, es: 'No explica por qué son errores', en: '...' },
        { score: 1, es: 'Explica los errores pero la corrección es imprecisa', en: '...' },
        { score: 2, es: 'Corrección precisa con referencia al concepto correcto', en: '...' },
      ],
    },
    {
      key: 'completeness_judgment',
      name: { es: 'Juicio de Completitud', en: 'Completeness Judgment' },
      levels: [
        { score: 0, es: 'No identifica omisiones o asunciones implícitas', en: '...' },
        { score: 1, es: 'Identifica omisiones pero no asunciones', en: '...' },
        { score: 2, es: 'Identifica omisiones Y asunciones implícitas', en: '...' },
      ],
    },
  ],
};
```

### Integración en el Learn Flow

Estos ejercicios aparecen en el step **PRACTICE** (antes de EVALUATE). Se mezclan con las preguntas existentes de scaffolding cognitivo. No son orales, pero son altamente AI-resilient porque:
- Requieren juicio sobre output generado dinámicamente
- No existe una "respuesta correcta" que copiar — el output cambia cada vez
- La evaluación del estudiante es evaluada por un LLM diferente que conoce los errores inyectados

---

## 7. Debugging en Vivo (Variante de Defensa de Proyecto)

### Objetivo
Presentar un sistema funcional con un bug sutil. El estudiante diagnostica en voz alta.

### No es un gate separado — es parte de la Defensa de Proyecto (Fase 3) y del Socrático Adversarial.

### Banco de Bugs por Concepto

Cada concepto tiene 3-5 escenarios de debugging pre-definidos:

```typescript
interface DebuggingScenario {
  conceptId: string;
  title: string;
  setup: string;          // Descripción del sistema funcionando
  symptom: string;        // Lo que el usuario observa
  rootCause: string;      // Bug real (no visible al estudiante)
  hints: string[];        // Hints progresivos si el estudiante se traba
  expectedDiagnosis: string; // Lo que debería llegar a decir
}
```

**Ejemplo para "consensus":**
```
title: "Split-Brain Post-Partition"
setup: "Cluster Raft de 5 nodos. Todo funciona.
        Se produce una network partition: {A,B,C} vs {D,E}."
symptom: "Después de 30 segundos, ambas particiones aceptan escrituras.
         Cuando se restaura la red, hay datos conflictivos."
rootCause: "El grupo {D,E} elige un nuevo líder con un término menor
           que el líder existente en {A,B,C}, pero el bug está en que
           el check de término no se aplica a AppendEntries,
           solo a RequestVote."
hints: [
  "¿Cuántos nodos necesita cada grupo para elegir líder?",
  "¿Puede {D,E} formar quórum? Si no, ¿cómo acepta escrituras?",
  "Pensá en qué validación se corre cuando un follower recibe AppendEntries."
]
```

### Evaluación del Debugging

El LLM evalúa el proceso de pensamiento, no solo la respuesta final:

| Señal | Positiva | Negativa |
|-------|----------|----------|
| **Método** | "Primero verificaría el estado de cada nodo..." | Adivina al azar sin método |
| **Hipótesis** | Genera 2+ hipótesis y las filtra | Salta a una conclusión sin considerar alternativas |
| **Uso de hints** | Incorpora el hint y ajusta hipótesis | Ignora el hint y sigue con su idea original |
| **Narración** | Piensa en voz alta, muestra el razonamiento | Silencio prolongado → respuesta final |

---

## 8. Infraestructura Técnica

### Reutilización del Stack de spoken-tutor-research.md

La evaluación oral usa **exactamente la misma infraestructura** que el tutor hablado:

```
OÍDOS: Whisper local (faster-whisper, large-v3-turbo)
CEREBRO: DeepSeek V3 (con system prompts de evaluación en vez de tutoría)
BOCA: gpt-4o-mini-tts (con instrucciones de prosodia de evaluador)
VAD: @ricky0123/vad-web (detección de voz, barge-in)
```

**Lo que cambia es el system prompt**, no la infra:
- Tutor: pump → hint → prompt → assertion (guía al estudiante a la respuesta)
- Evaluador: pregunta → follow-up → follow-up → veredicto (valida si ya sabe)

### Nuevo Componente: `<OralAssessment />`

```
src/components/oral-assessment/
├── oral-assessment.tsx       // Componente principal
├── oral-rubric-display.tsx   // Muestra resultado post-evaluación
├── oral-timer.tsx            // Countdown visual
├── oral-transcript.tsx       // Transcripción en vivo (debug + registro)
└── use-oral-session.ts       // Hook: VAD + Whisper + LLM + TTS orchestration
```

### API Endpoints

```
POST /api/oral/start
  Input: { conceptId, assessmentType: 'quick_check' | 'defense' | 'socratic' | 'teach' }
  Output: { sessionId, firstQuestion (text + audio URL) }

POST /api/oral/respond
  Input: { sessionId, audioBlob | transcriptText }
  Process: Whisper transcribe → DeepSeek evaluate + generate follow-up
  Output: { followUp (text + audio URL), turnNumber, isLastTurn }

POST /api/oral/verdict
  Input: { sessionId }
  Process: DeepSeek generates final verdict from full transcript
  Output: { result, dimensionScores, feedback, transcriptHighlights }
```

### Tabla: oral_assessments

```sql
CREATE TABLE oral_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  concept_id TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN (
    'quick_check', 'defense', 'socratic', 'teach'
  )),
  result TEXT NOT NULL CHECK (result IN ('pass', 'retry', 'fail')),
  dimension_scores JSONB NOT NULL,
  feedback TEXT,
  transcript JSONB NOT NULL,  -- Array de {role, text, timestamp_ms}
  duration_ms INTEGER NOT NULL,
  llm_model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users only see their own assessments
ALTER TABLE oral_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own oral assessments"
  ON oral_assessments FOR ALL
  USING (auth.uid() = user_id);

-- Index for mastery checks
CREATE INDEX idx_oral_assessments_concept_result
  ON oral_assessments(user_id, concept_id, assessment_type, result);
```

### Tabla: debugging_scenarios

```sql
CREATE TABLE debugging_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id TEXT NOT NULL,
  title TEXT NOT NULL,
  setup TEXT NOT NULL,
  symptom TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  hints JSONB NOT NULL DEFAULT '[]',
  expected_diagnosis TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Fallbacks y Edge Cases

### ¿Qué pasa si Whisper transcribe mal?

**ITSPOKE (Litman, Pittsburgh)** demostró que errores de ASR no degradan ganancias de aprendizaje. Pero para evaluación (no tutoría) necesitamos más cuidado:

1. **Transcript visible**: El estudiante ve la transcripción en tiempo real. Si Whisper transcribe mal, puede corregir por texto antes de que el evaluador responda.
2. **Retry de turno**: Botón "Repetir respuesta" que descarta la última transcripción y vuelve a grabar.
3. **Fallback a texto**: Si el audio falla o el estudiante prefiere, siempre puede tipear. Marcado como `mode: 'text'` — pierde las señales de speech pero mantiene la evaluación adaptativa.

### ¿Qué pasa si el estudiante tiene ansiedad de hablar?

- **Modo texto siempre disponible**: Las preguntas son las mismas, el mecanismo adaptativo es el mismo. Solo se pierden las señales de hesitación/fluidez.
- **Warm-up opcional**: 1 minuto de "hablá de lo que quieras sobre el tema" sin evaluación, para acostumbrarse al formato.
- **Re-tomar sin penalización**: Si el estudiante corta la sesión por ansiedad, puede retomar desde el mismo punto al día siguiente. No cuenta como FAIL.

### ¿Qué pasa si DeepSeek se cae durante la evaluación?

- Los turnos se guardan en `oral_assessments.transcript` después de cada turno.
- Si DeepSeek falla mid-session: se ofrece retry o reschedule.
- Si falló después de turno 2 de 3: el evaluador puede generar veredicto con el transcript parcial (marcado como `partial: true`).

### ¿Cómo prevenir que el estudiante use IA durante el oral?

**No se previene. Se hace innecesario.**

La latencia de copiar a ChatGPT + leer respuesta + formular en voz alta (8-15 segundos) es detectable por el evaluador como señal de timing. Pero más importante: los follow-ups adaptativos hacen que la IA externa sea inútil porque cada pregunta depende de la respuesta anterior del estudiante.

Un estudiante que intenta usar IA en paralelo:
1. Tarda mucho entre pregunta y respuesta (>15s consistentemente)
2. Sus respuestas no fluyen naturalmente de las anteriores
3. Cambia de registro lingüístico entre turnos (de coloquial a formal)
4. No puede elaborar cuando se le pide ("expandí eso que dijiste")

El evaluador detecta estos patrones y los marca en el veredicto. No como "hizo trampa" sino como "las señales de ownership fueron débiles" → RETRY.

---

## 10. Costos Estimados

### Por evaluación oral

| Tipo | Duración | Whisper | DeepSeek | TTS | Total |
|------|----------|---------|----------|-----|-------|
| Quick-check | 3 min | $0 (local) | ~$0.02 | ~$0.02 | **~$0.04** |
| Defensa | 10 min | $0 | ~$0.06 | ~$0.07 | **~$0.13** |
| Socrático | 12 min | $0 | ~$0.08 | ~$0.08 | **~$0.16** |
| Enseñanza | 15 min | $0 | ~$0.10 | ~$0.10 | **~$0.20** |

### Por concepto (full mastery 0→4)

```
Level 0→1: micro-tests (gratis) + quick-check oral ($0.04)    = $0.04
Level 1→2: proyecto (gratis) + defensa oral ($0.13)            = $0.13
Level 2→3: eval texto (~$0.03) + socrático oral ($0.16)        = $0.19
Level 3→4: enseñanza simulada ($0.20)                          = $0.20

Total por concepto 0→4: ~$0.56
Total 108 conceptos × $0.56: ~$60.48
```

Con retries (estimando 30% retry rate):
```
$60.48 × 1.3 = ~$78.62 para el currículo completo
```

Esto es **negligible**. El bottleneck no es costo — es tiempo del estudiante.

---

## 11. Orden de Implementación

### Fase 1: Quick-Check Oral (P0)
**Impacto máximo, complejidad mínima.**
- Solo 3 minutos, 3 turnos de conversación
- Reutiliza 100% de la infra de spoken-tutor
- Agrega el gate más importante: Level 0→1 ya no es falsificable
- Componente: `<OralAssessment type="quick_check" />`
- Migración: `oral_assessments` table
- Modificar: `canAdvanceToLevel1()` → check `oral_quick_check_passed`

### Fase 2: Evaluación de Output IA (P1)
**No requiere infraestructura de voz.**
- Ejercicios de texto: juzgar output de LLM con errores inyectados
- Se integra en el step PRACTICE existente
- Rúbrica: `AI_OUTPUT_REVIEW_RUBRIC`
- Generador: prompt que crea outputs con errores controlados

### Fase 3: Defensa de Proyecto (P1)
**Requiere Fase 1 funcionando.**
- 10 minutos, más turnos, más contexto (proyecto del estudiante)
- Variante del quick-check con prompts diferentes
- Agrega debugging scenarios al banco de datos
- Modifica: `canAdvanceToLevel2()` → check `project_defense_passed`

### Fase 4: Socrático Adversarial (P2)
**El más complejo pedagógicamente.**
- 12 minutos con 4 fases distintas
- Requiere banco de afirmaciones falsas por concepto
- Requiere cross-concept connections pre-definidas
- Modifica: `canAdvanceToLevel3()` → check `socratic_oral_passed`

### Fase 5: Enseñanza Simulada (P2)
**Requiere prompts más sofisticados.**
- El LLM actúa como alumno, no como evaluador — cambio de paradigma
- Requiere banco de misconceptions por concepto (parcialmente existente en EMT)
- Nuevo: `canAdvanceToLevel4()` con `teach_session_passed`

---

## 12. Métricas de Éxito

### ¿Cómo sabemos que funciona?

| Métrica | Baseline (sin oral) | Target (con oral) |
|---------|--------------------|--------------------|
| **Retry rate Level 1** | ~5% (texto es fácil de pasar) | ~25-35% (oral filtra no-comprensión) |
| **Retry rate Level 2** | ~10% | ~30-40% (defensa filtra proyectos copiados) |
| **Correlación oral vs. escrito** | N/A | >0.6 (si alguien pasa escrito pero falla oral, el oral es el ground truth) |
| **Tiempo promedio de respuesta** | N/A | 3-8s (>15s consistente = señal de lookup externo) |
| **Satisfacción** (self-report) | N/A | >7/10 ("sentí que la evaluación fue justa") |
| **Level 3 retention @30 días** | desconocido | >70% (si el oral validó de verdad, la retención debería ser alta) |

### Calibración continua

Cada evaluación oral se guarda con transcript completo. Se puede re-evaluar periódicamente:
- ¿Los veredictos PASS son consistentes? (inter-rater reliability del LLM)
- ¿Los RETRY resultan en PASS eventual? (el gate funciona, no bloquea permanentemente)
- ¿Los estudiantes que pasan oral mantienen su nivel en SM-2 reviews?

---

## Fuentes Adicionales

### Oral Assessment en Educación
- Joughin, G. (2010). A short guide to oral assessment. Leeds Metropolitan University.
- Kehoe, A. et al. (2021). Oral assessments in medical education. Medical Education, 55(3), 295-303.

### AI-Resilient Assessment Design
- Cotton, D.R.E. et al. (2024). Chatting and cheating: Ensuring academic integrity in the era of ChatGPT. Innovations in Education and Teaching International.
- Perkins, M. (2023). Academic integrity considerations of AI Large Language Models in the post-pandemic era. Journal of University Teaching & Learning Practice.

### Spoken Dialogue Systems para Evaluación
- Litman, D.J. & Forbes-Riley, K. (2006). Recognizing student emotions and attitudes on the basis of utterances in spoken tutoring dialogues with both human and computer tutors.
- Ruan, S. et al. (2020). QuizBot: A dialogue-based adaptive learning system for factual knowledge.

---

## Relación con Otros Documentos

- **Infraestructura técnica (VAD, Whisper, TTS):** `backlog/spoken-tutor-research.md`
- **Tutor orchestrator (visual actions, embodied presence):** `plan/2026-02-07/tutor-orchestrator-design.md`
- **Scaffolding cognitivo existente:** `plan/2026-02-10/session-15-scaffolding-cognitivo.md`
- **Rúbricas actuales (texto):** `src/lib/llm/rubrics.ts`
- **Mastery logic actual:** `src/lib/mastery.ts`
- **Learning path evidence:** `plan/2026-02-08/learning-path-design.md`
