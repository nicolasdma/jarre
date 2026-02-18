# Investigación Consolidada: Cómo Construir el Mejor Tutor Posible para Jarre

**Fecha:** 2026-02-17
**Contexto:** Análisis exhaustivo del modelo de tutor actual (Socrático puro) vs. mejores prácticas de la investigación en learning science, AI tutoring, y productos del mercado (2024-2026).
**Prerequisitos:** `backlog/spoken-tutor-research.md`, `backlog/oral-assessment-design.md`

---

## El Veredicto Principal

**El Socrático puro es subóptimo.** La investigación es contundente: nunca dar respuestas y solo preguntar frustra al estudiante, especialmente cuando no tiene suficiente conocimiento previo para razonar. El modelo ideal es **híbrido y adaptativo**.

---

## 1. La Mezcla Correcta: No 100% Socrático

### Distribución recomendada de modos de interacción:

| Modo | % | Cuándo |
|------|---|--------|
| **Cuestionamiento Socrático** | 40-50% | El estudiante está en su ZPD, tiene conocimiento para razonar |
| **Instrucción Directa** | 20-30% | Después de 2-3 fallos (escalación AutoTutor), misconceptions que deben corregirse YA |
| **Worked Examples / Modelado** | 15-20% | Concepto nuevo/contraintuitivo, estudiante fuera de ZPD |
| **Metacognición / Reflexión** | 10-15% | Post-resolución, conexiones entre dominios, calibración de confianza |

### Se adapta al mastery level (Expertise Reversal Effect):

| Mastery Level | Socrático | Instrucción | Worked Ex. | Meta |
|---|---|---|---|---|
| 0 (Exposed) | 20% | 40% | 30% | 10% |
| 1 (Understood) | 35% | 30% | 20% | 15% |
| 2 (Applied) | 45% | 20% | 15% | 20% |
| 3 (Criticized) | 55% | 10% | 10% | 25% |
| 4 (Taught) | 60% | 5% | 5% | 30% |

**Insight clave (Expertise Reversal Effect):** Lo que funciona para novatos (instrucción directa) se vuelve contraproducente para expertos, y viceversa. El tutor debe deslizar el dial automáticamente.

### Evidencia:

- **Kirschner, Sweller & Clark (2006):** La guía mínima no funciona para aprendices con poco conocimiento previo. La memoria de trabajo es limitada y las preguntas Socráticas sin scaffolding incrementan la carga cognitiva.
- **Estudio europeo K-12 con tutor Socrático LLM:** Diálogos más ricos pero "menos útil" percibido y sin mejora medible en exámenes.
- **EMNLP 2025:** El cuestionamiento desalineado con la preparación cognitiva del aprendiz genera sobrecarga y obstaculiza el aprendizaje.

---

## 2. El State Machine Pedagógico (Escalación AutoTutor)

El sistema AutoTutor de Graesser (d=0.81, iguala tutor humano) define un patrón de escalamiento que resuelve el problema del Socrático puro:

```
INICIO → Pump (pregunta abierta)
  │
  ├── [Responde correctamente] → Profundizar (más Socrático)
  ├── [Responde parcialmente]  → Hint (pista direccional)
  ├── [Falla 1 vez]            → Prompt (pregunta específica)
  ├── [Falla 2 veces]          → Instrucción directa parcial
  ├── [Falla 3+ veces]         → Worked example completo
  ├── [Misconception detectada] → Corrección directa INMEDIATA
  └── [Demuestra dominio]      → Desafío de transferencia/conexión
```

### Taxonomía completa de movimientos:

| Movimiento | Descripción | Ejemplo (DDIA) |
|-----------|-------------|----------------|
| **Pump** | Pedir elaboración genérica | "Contame más..." / "¿Qué más?" |
| **Positive Pump** | Estimular que continúe | "Bien, seguí con eso..." |
| **Hint** | Nudge indirecto hacia una expectativa | "Pensá en qué pasa cuando falla el nodo líder..." |
| **Prompt** | Fill-in-the-blank específico | "El mecanismo que previene split-brain se llama ___" |
| **Splice/Revoicing** | Reformular lo que dijo el estudiante | "Entonces lo que estás diciendo es que..." |
| **Assertion** | Declarar información directamente (último recurso) | "En realidad, Paxos requiere un quórum mayoritario." |
| **Correction** | Corregir misconception | "Ojo — consenso y consistencia son cosas distintas..." |
| **Summary** | Recapitular | "Entonces, resumiendo lo que discutimos..." |
| **Think-Aloud** | Tutor modela razonamiento | "Si yo veo esto, lo primero que me pregunto es..." |
| **Metacognitive** | Estudiante reflexiona | "Del 1 al 5, ¿cómo lo ves?" (máx 2-3 por sesión) |
| **Short feedback** | 5 niveles: positivo a negativo | "Exacto!" / "No del todo" / "Hmm" |

**Cambio crítico vs. el sistema actual:** El evaluador de Jarre NUNCA corrige misconceptions. Esto es pedagógicamente peligroso — el estudiante puede salir con errores reforzados.

---

## 3. Productive Failure: La Pieza que Falta

Kapur (2008-2024) demuestra que el aprendizaje óptimo tiene **dos fases**:

1. **Fase 1 — Struggle:** El estudiante intenta sin ayuda (Socrático). Típicamente falla, pero activa conocimiento previo y crea "awareness" de los gaps.
2. **Fase 2 — Consolidación:** El tutor revela la respuesta ideal y explica dónde el razonamiento divergió.

**El sistema actual de Jarre solo tiene Fase 1.** Sin consolidación, el struggle se convierte en **Unproductive Failure** (Kapur 2016, cuatro cuadrantes). Se necesita agregar post-evaluación donde:

- Se revele la "expectation" completa (la respuesta ideal)
- Se señalen misconceptions específicas detectadas durante la evaluación
- Se conecte con otros conceptos del currículo del usuario
- Se sugieran recursos para los gaps identificados

### Evidencia:

- **Sinha & Kapur (2021), meta-análisis:** Estudiantes que primero luchan y luego reciben instrucción demuestran significativamente mayor comprensión conceptual y mejor transferencia que los que reciben instrucción primero.
- **Kapur (2016):** Define cuatro cuadrantes — Productive Failure, Productive Success, Unproductive Failure, Unproductive Success. El Socrático puro sin resolución cae en **Unproductive Failure**.

---

## 4. Estado del Arte: Productos y Research (2025-2026)

### Khanmigo (Khan Academy)
- 1.4M usuarios, 380+ distritos
- Socrático puro via prompt engineering (no fine-tuning)
- **8-14x más efectivo** que aprendizaje independiente
- **Problema:** Frustra estudiantes que esperan respuestas directas. Demasiado rígido en no dar información para adultos con contenido técnico.
- **Lección:** El modo Socrático debería ser configurable, no obligatorio.

### Google LearnLM
- Fine-tuned sobre Gemini con datos pedagógicos (pedagogía en los pesos, no solo prompts)
- **Pedagogical Instruction Following (PIF):** El modelo sigue instrucciones pedagógicas a nivel de sistema. Permite especificar "usa método Socrático" o "da explicaciones directas".
- **RCT UK (2025):** Estudiantes con LearnLM fueron **5.5% más probables** de resolver problemas nuevos vs. tutores humanos solos.
- **Lección:** La flexibilidad pedagógica es más valiosa que un enfoque fijo. Adaptar por tipo de evaluación y mastery level.

### Kestin et al. (Harvard, 2025)
- RCT con 194 estudiantes de física
- AI tutor **más que duplicó ganancias de aprendizaje** vs. active learning en clase
- Aprendieron en menos tiempo y se sintieron más motivados
- **Lección:** Un AI tutor bien diseñado puede ser significativamente mejor que instrucción humana para ciertos tipos de aprendizaje.

### Scarlatos et al. (AIED 2025) — DPO para tutores
- Fine-tunearon Llama 3.1 8B con DPO
- Resultado: **iguala calidad pedagógica de GPT-4o**
- El criterio de "preferido": que el estudiante responda correctamente en el siguiente turno + siga principios pedagógicos
- **Lección:** No se necesita el modelo más grande. DeepSeek V3 es una elección sólida.

### SocraticLM (NeurIPS 2024)
- Cambia de paradigma "Question-Answering" a "Thought-Provoking"
- **Supera a GPT-4 por más de 12%** en rendimiento de enseñanza

### Cognitive Offloading (Frontiers in Psychology, 2025)
- Estudiantes con ChatGPT respondieron **48% más problemas** pero sacaron **17% menos** en tests de comprensión conceptual
- Uso regular de IA se asocia con **declive en habilidades cognitivas** y menor retención
- **Estrategia de mitigación:** "Cognitive Mirror" — la IA como novato enseñable que refleja la calidad de la explicación del estudiante. Exactamente el pattern "Teach the Tutor" de Jarre.

### Duolingo Video Call
- Sin prompts en pantalla, solo hablar
- Adaptación en tiempo real
- Memoria entre sesiones
- **Transcripciones post-sesión** para revisión sin interrumpir el flujo
- **Lección:** Separar el momento de hablar del momento de revisar. Memoria entre sesiones es crítica.

---

## 5. Estructura de Sesión Óptima (25 min)

```
┌─────────────────────────────────────────────────────────────┐
│  FASE 1: WARM-UP (3-4 min)                                  │
│  ├── Retrieval de sesión anterior (pump sobre concepto       │
│  │   previo = stealth assessment + testing effect)           │
│  ├── Si falla: mini-review (hint → prompt → assertion)      │
│  └── Transición: conectar concepto previo con el nuevo       │
│                                                              │
│  DECISION POINT: ¿El estudiante retiene lo anterior?        │
│  ├── SI → Continuar con concepto nuevo                       │
│  └── NO → 5 min extra a consolidar, reducir alcance         │
├─────────────────────────────────────────────────────────────┤
│  FASE 2: CORE — Exploración (12-15 min)                     │
│                                                              │
│  2A. Activación con texto (3-4 min)                          │
│  ├── Tutor presenta concepto con referencia al material      │
│  ├── Turno corto: 15-20 seg max                             │
│  └── Primer pump: "¿Qué entendés de esto?"                  │
│       Wait time: 5 seg mínimo                                │
│                                                              │
│  2B. Construcción dialógica (5-7 min)                        │
│  ├── Ciclo AutoTutor: pump → hint → prompt → assertion      │
│  ├── Sin texto, solo discusión                               │
│  ├── Revoicing cuando articula parcialmente                  │
│  ├── PEER: Expandir respuesta, pedir reformulación           │
│  └── Metacognitive check (1x): "Del 1-5, ¿cómo lo ves?"    │
│                                                              │
│  DECISION POINT: ¿Domina el concepto base?                  │
│  ├── SI → 2C (profundización)                                │
│  ├── PARCIAL → Repetir 2B con ángulo diferente              │
│  └── NO → Think-aloud + assertion + reformulación.           │
│           Marcar para re-eval.                                │
│                                                              │
│  2C. Profundización / Trade-offs (3-4 min)                   │
│  ├── "¿Cuándo NO usarías esto?"                             │
│  ├── "¿Qué pasa si cambiás esta variable?"                  │
│  └── Evaluar nivel de maestría (3=crítica, 4=enseñanza)     │
│                                                              │
│  DECISION POINT: ¿Hay tiempo para concepto 2?               │
│  ├── SI + >8 min → Repetir 2A-2C con concepto 2             │
│  └── NO → Fase 3                                            │
├─────────────────────────────────────────────────────────────┤
│  FASE 3: CIERRE (3-4 min)                                    │
│  ├── Summary del tutor (revoicing de lo construido juntos)   │
│  ├── Retrieval final: "Resumime lo que vimos hoy"            │
│  ├── Metacognitive prompt: "¿Qué fue lo más confuso?"        │
│  └── Preview de próxima sesión (priming)                     │
│                                                              │
│  OUTPUT INTERNO (no visible al estudiante):                  │
│  ├── Nivel de maestría actualizado por concepto              │
│  ├── Conceptos que necesitan re-evaluación                   │
│  ├── Tipo de scaffolding que fue necesario                   │
│  └── Métricas: ratio habla, # pumps exitosos, # escalaciones│
└─────────────────────────────────────────────────────────────┘
```

### Números duros de la investigación:

| Parámetro | Valor | Fuente |
|---|---|---|
| Duración de sesión | 20-25 min | Atención sostenida adultos ~30-45 min, reducido por alta carga cognitiva |
| Ratio habla | 70% estudiante / 30% tutor | Investigación STT/TTT; correlación de palabras del estudiante con aprendizaje |
| Conceptos por sesión | 2-3 máximo | Teoría de Carga Cognitiva (Sweller) |
| Respuesta del tutor | Max 30 seg (~75 palabras) | Spoken tutoring systems (Litman): turnos de 10-13 seg |
| Wait time post-pregunta | 3-5 seg mínimo (hasta 15 para reflexión profunda) | Rowe 1986, replicado 2024 |
| Tasa de éxito target | 60-85% | "Goldilocks zone" — Wilson et al. 2019, EDM 2023 |
| Mastery threshold | 85% precisión + 3 éxitos consecutivos | Mastery learning estándar |

### Reglas de transición:

```
WARM-UP → CORE:
  Trigger: Pump exitoso sobre concepto previo O mini-review completado.
  Transición: "Genial. Hoy vamos a ver [concepto], que conecta con
  esto porque..."

CORE 2A → 2B:
  Trigger: Estudiante leyó/escuchó el material base.
  Transición: "Ahora sin mirar, explicame..."

CORE 2B → 2C:
  Trigger: 3 pumps/prompts exitosos consecutivos.
  Transición: "Ok, lo entendés bien. Ahora vamos a complicarlo..."

CORE → CIERRE:
  Trigger: Tiempo >= 20 min O fatiga cognitiva O conceptos completados.
  Transición: "Vamos a cerrar. Resumime lo que vimos hoy."

ESCALACIÓN (cualquier momento):
  Trigger: 3 fallos consecutivos con scaffoldings distintos.
  Acción: Think-aloud → Assertion → Reformulación del estudiante →
  Marcar para re-eval.
```

---

## 6. Memoria y Personalización

### Capas de memoria:

```
┌── WORKING MEMORY (in-context) ──────────────────┐
│  Últimos 3-5 turnos verbatim                     │
│  Resumen rolling de la sesión                    │
│  Estado emocional actual                         │
│  Concepto activo + nivel estimado                │
├── EPISODIC MEMORY (por sesión) ──────────────────┤
│  Session summaries estructurados                 │
│  Misconceptions detectadas (con citas textuales) │
│  Momentos de breakthrough                        │
│  Patrón emocional de la sesión                   │
├── SEMANTIC MEMORY (persistente) ─────────────────┤
│  LearnerProfile completo                         │
│  Grafo concepto-mastery                          │
│  Preferencias calibradas                         │
│  Historial de dificultad adaptativa              │
├── PROCEDURAL MEMORY (del tutor) ─────────────────┤
│  Qué estrategias funcionaron con este usuario    │
│  Qué analogías conectaron                        │
│  Qué tipo de preguntas generan engagement        │
└──────────────────────────────────────────────────┘
```

### LearnerProfile mínimo viable:

```typescript
interface LearnerProfile {
  conceptMastery: Map<ConceptId, {
    level: 0 | 1 | 2 | 3 | 4;
    misconceptions: string[];     // Textuales, detectadas
    strengths: string[];
  }>;
  preferences: {
    preferredExplanationMode: 'analogy' | 'formal' | 'example' | 'mixed';
    vocabularyLevel: 'beginner' | 'intermediate' | 'advanced';
    toleranceForStruggle: 'low' | 'medium' | 'high';
  };
  affectiveHistory: {
    averageFrustrationThreshold: number;
  };
}
```

### Frustración productiva vs. destructiva:

| Señal | Productiva (mantener) | Destructiva (intervenir) |
|---|---|---|
| Intentos | Sigue intentando activamente | Monosílabos o "no sé" |
| Variación | Reformula sus respuestas | Repite el mismo error |
| Duración | < 3-4 turnos sin progreso | > 4-5 turnos sin progreso |
| Acción | Hint mínimo | Scaffolding directo + reducir scope |

### Detección por voz (futuro):

| Señal vocal | Posible estado |
|---|---|
| Pitch descendente + pausas largas | Confusión o desenganche |
| Velocidad reducida | Procesamiento profundo o confusión |
| Pitch ascendente + velocidad alta | Engagement/eureka |
| Monosílabos + tono plano | Aburrimiento o frustración |
| Suspiros + hesitaciones frecuentes | Frustración |
| Auto-corrección ("no, esperá...") | Señal POSITIVA — pensamiento activo |

---

## 7. Prompt Engineering: Framework del System Prompt

### Secciones esenciales (orden importa):

#### 1. IDENTITY & CONSTRAINTS
Role prompting + restricciones absolutas. Repetir "no des respuestas" en múltiples formulaciones. Khanmigo aprendió que una sola mención no es suficiente — el LLM revierte a "helpful assistant" en pocos turnos.

#### 2. VOICE & TONE
Colega senior, no profesor. Máximo 75 palabras por turno. Sin bullets/markdown (es voz). Pausas naturales. Conectores conversacionales.

#### 3. PEDAGOGICAL FRAMEWORK
Escalación AutoTutor codificada explícitamente. Regla de firmeza de Khanmigo: después de 3 intentos sin esfuerzo, preguntar "¿qué parte de las pistas no entendiste?" en vez de dar más pistas.

#### 4. ANTI-SYCOPHANCY
- Nunca acordar con respuestas incorrectas
- Nunca "buena pregunta!" o praise genérico
- Praise específico solo cuando hay mérito real: "Esa conexión entre X e Y es exacta"
- Si el estudiante pushes back incorrectamente, mantener posición con evidencia

#### 5. CONVERSATION MANAGEMENT
Agenda de tópicos, transiciones explícitas ("Bien, ahora pasemos a..."), manejo de interrupciones (ceder el piso siempre).

#### 6. MODE TOGGLE
Teaching mode (scaffolding completo) vs. Evaluation mode (sin hints, registrar nivel). Transición explícita: "Ahora voy a hacerte preguntas sin pistas."

#### 7. DOMAIN CONTEXT (dinámico)
Concepto actual, mastery level, summary de sesión anterior, misconceptions conocidas.

#### 8. INTERNAL REASONING
Instruir al modelo a razonar internamente antes de cada respuesta: ¿Qué reveló el estudiante? ¿En qué nivel de escalación estoy? ¿Cuál es la pregunta óptima? Con Gemini 2.5 Flash, el "thinking" está habilitado nativamente.

### Prevenir que rompa personaje:
- Prohibiciones explícitas con repetición en múltiples secciones
- Regla de firmeza escalada post-N intentos
- Identidad como restricción: "Tu propósito fundamental es guiar, NUNCA resolver"
- Framing negativo + positivo: qué NO hacer Y qué hacer en su lugar

---

## 8. Stealth Assessment: El Pump ES la Evaluación

La investigación de Shute et al. (2023) sobre stealth assessment vía Evidence-Centered Design establece:

1. **Modelo de competencia:** ¿Qué se está midiendo?
2. **Modelo de evidencia:** ¿Qué acciones del estudiante constituyen evidencia?
3. **Modelo de tarea:** ¿Qué tareas elicitan esa evidencia?

**Implicación:** Cada vez que el tutor hace un pump y el estudiante responde (o no), hay un dato de evaluación. No se necesita separar tutoría de evaluación — el ciclo de AutoTutor es simultáneamente enseñanza e instrumento de medición.

Esto mapea directamente a los mastery levels de Jarre:
- Pump exitoso sin hints → Level 1+ (Understood)
- Puede aplicar a escenario nuevo → Level 2 (Applied)
- Puede criticar limitaciones → Level 3 (Criticized)
- Puede enseñar y corregir misconceptions → Level 4 (Taught)

---

## 9. Lo que Jarre Ya Hace Bien (Validado por Investigación)

1. **Error Detection** ("Encontrá el error en esta explicación") — Prácticamente único en el mercado
2. **"¿Cuándo NO usarías esto?"** — Nivel 3 (Criticized) no se evalúa en ningún tutor comercial
3. **Teach-the-Tutor** — Level 4 como "Cognitive Mirror" es un pattern emergente que pocos implementan
4. **Evaluación oral con stealth assessment** — El formato voz fuerza comprensión real (no se puede copiar de ChatGPT)
5. **SM-2 con Bloom-typed questions** — Spaced repetition adaptada por nivel cognitivo
6. **Scaffolding cognitivo explícito** — ACTIVATE → LEARN → APPLY → PRACTICE → EVALUATE es único

---

## 10. Cambios Concretos Recomendados

### Alta Prioridad:

| # | Cambio | Impacto | Complejidad |
|---|--------|---------|-------------|
| 1 | **Fase de consolidación post-evaluación** — revelar respuesta ideal + señalar dónde divergió el razonamiento | Transforma Unproductive → Productive Failure | Media |
| 2 | **Adaptar estilo al mastery level** — más instrucción directa en nivel 0-1, más Socrático en 2-3, adversarial en 4 | Elimina frustración innecesaria en novatos | Media (cambio de prompts) |
| 3 | **State machine de escalación** — pump → hint → prompt → assertion en vez de Socrático rígido | Iguala efectividad de tutor humano (d=0.81) | Media (cambio de prompts) |
| 4 | **Wait time explícito** — 3-5 seg post-pregunta antes de intervenir | Mejora calidad de respuestas del estudiante | Baja (prompt change) |
| 5 | **Separar modo Teaching de Evaluation** — reglas diferentes para cada uno, transición explícita | Evita contaminar medición con enseñanza | Media |

### Media Prioridad:

| # | Cambio | Impacto | Complejidad |
|---|--------|---------|-------------|
| 6 | **Memoria entre sesiones** — misconceptions de sesiones anteriores inyectadas en prompt | Personalización, no repetir trabajo | Media-Alta |
| 7 | **Revoicing** — "Entonces lo que estás diciendo es..." cuando articula parcialmente bien | Mejora construcción dialógica | Baja (prompt) |
| 8 | **Think-Aloud modeling** — tutor demuestra razonamiento como último recurso | Da al estudiante un modelo de cómo pensar | Baja (prompt) |
| 9 | **Estructura de sesión formal** — warm-up / core / cierre con transiciones explícitas | Coherencia y gestión del tiempo | Media |

### Baja Prioridad (Futuro):

| # | Cambio | Impacto | Complejidad |
|---|--------|---------|-------------|
| 10 | **Detección de emoción por prosodia** — Hume AI (48 dimensiones en tiempo real) | Adaptación emocional del tutor | Alta |
| 11 | **Knowledge tracing formal** — BKT para cold start, DKT con datos | Calibración precisa de dificultad | Alta |
| 12 | **LearnerProfile persistente** — preferences, frustration threshold, vocabulary level | Personalización profunda | Media |

---

## Fuentes Principales

### Tutoring Systems
- Bloom (1984) — 2 Sigma Problem
- VanLehn (2011) — Relative Effectiveness of Tutoring Systems (d=0.76 ITS vs d=0.79 human)
- Graesser et al. (2004, 2005) — AutoTutor (d=0.81, 10 experiments, 1000+ participants)
- Litman & Forbes-Riley (2006) — ITSPOKE: spoken dialogue doesn't degrade learning

### Learning Science
- Kirschner, Sweller & Clark (2006) — Why Minimal Guidance Does Not Work
- Kapur (2008-2024) — Productive Failure: struggle + consolidación > instrucción directa primero
- Sinha & Kapur (2021) — Meta-analysis of Productive Failure
- Chi & Wylie (2014) — ICAP Framework: Interactive > Constructive > Active > Passive
- Rowe (1986) — Wait time: 3-5 seg mejora calidad de respuestas (replicado 2024)
- Sweller — Cognitive Load Theory, Transient Information Effect
- Bjork — Desirable Difficulty
- Whitehurst (1988) — PEER dialogic reading

### Modern AI Tutoring (2024-2026)
- Khanmigo — 1.4M usuarios, 7-step prompt engineering
- LearnLM (Google DeepMind) — Pedagogical Instruction Following, 5.5% mejora sobre tutores humanos
- Kestin et al. (Harvard, 2025) — AI tutor 2x+ ganancias vs. active learning
- Scarlatos et al. (AIED 2025) — Llama 8B + DPO iguala GPT-4o en calidad pedagógica
- SocraticLM (NeurIPS 2024) — Supera GPT-4 por 12% en rendimiento de enseñanza
- Cognitive Offloading (Frontiers, 2025) — 48% más problemas pero 17% menos comprensión
- D'Mello & Graesser (2012) — Affect and learning: confusión productiva vs. frustración destructiva

### Stealth Assessment
- Shute et al. (2023) — Stealth assessment via Evidence-Centered Design
- Testing Effect — Retrieval practice durante tutoría mejora retención

### Voice-Specific
- ITSPOKE (Litman, Pittsburgh) — Errores de ASR no degradan ganancias
- Hume AI — 48 dimensiones emocionales en prosodia en tiempo real
- Duolingo Video Call — memoria entre sesiones, transcripciones post-sesión

### Prompt Engineering
- Khan Academy 7-Step Approach to Prompt Engineering for Khanmigo
- MIRROR (2025) — Cognitive Inner Monologue Architecture
- Quiet-STaR — Inner monologue training mejora razonamiento
- LearnLM Prompt Guide — 5 principios pedagógicos en system prompt
