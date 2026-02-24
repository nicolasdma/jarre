# Learning Path Design — La Secuencia Óptima de Jarre

**Date:** 2026-02-08

## Pregunta central

¿Cuál es EL path único, sin opciones, para que un concepto quede grabado?

Componentes disponibles:
- **Resumen** (hand-written, visual, advance organizer)
- **Contenido completo** (texto del libro extraído del PDF)
- **Pre-pregunta** (1 pregunta difícil antes de leer)
- **Post-test** (1-2 preguntas después de leer)
- **Preguntas guía** (reading questions: why, tradeoff, connection, error_detection)
- **Playground** (simulación interactiva hands-on)
- **Evaluación completa** (deep assessment con DeepSeek)
- **SM-2 spaced review** (repetición espaciada días/semanas después)

---

## Evidencia recopilada

### 1. Pre-training / Advance Organizers → RESUMEN VA PRIMERO

**Mayer Pre-training Principle (2009)**
- Dar nombres y características de conceptos ANTES de la lección
- Median effect size: **d = 0.75–0.85**
- Reduce cognitive overload al procesar material complejo
- Source: Cambridge Handbook of Multimedia Learning, Ch. 10

**Ausubel Advance Organizers**
- Effect size en physics learning: **d = 0.72** (actividades), **d = 0.39** (comprensión conceptual)
- Source: ResearchGate meta-analysis

**Implicación:** El resumen hand-written funciona como advance organizer. Va AL INICIO del capítulo.

### 2. Productive Failure → PRE-PREGUNTA ANTES DEL CONTENIDO

**Kapur (2014, 2021) — Meta-análisis de 53 estudios, 166 comparaciones, 12,000+ participantes**
- Explore-first > instruction-first para comprensión conceptual y transfer
- **d = 0.36** (promedio), **d = 0.58** (alta fidelidad al diseño)
- 4 mecanismos: activar conocimiento previo → reconocer déficit → receptividad → explicación resuelve
- Source: Review of Educational Research, Cognitive Science (Wiley)

**Richland, Kornell & Kao (2009)**
- Incluso intentos FALLIDOS de responder mejoran el aprendizaje posterior
- Source: JEP:Applied

**Implicación:** Pre-pregunta difícil ANTES de leer cada sección. El usuario probablemente falla, y eso es bueno.

### 3. Interpolated Testing → POST-TEST DESPUÉS DE CADA CONCEPTO

**Szpunar, McDermott & Roediger (2008)**
- Tests entre secciones: **39% vs 19%** recall (2x mejora)
- Source: JEP:LMC, Washington University

**Szpunar, Khan & Schacter (2013, Harvard)**
- Mind wandering: **19% con tests vs 41% sin tests**
- Final test: **90% vs 68%**
- Source: PNAS

**Roediger & Karpicke (2006)**
- STST (study-test-study-test): **50% más retención**, solo **13% forgetting**
- Source: Psychological Science

**Implicación:** 1-2 preguntas de retrieval practice después de cada sección de contenido.

### 4. Simulation Placement → PLAYGROUND DESPUÉS DEL CONTENIDO

**PhET Research (CU Boulder)**
- Explore-first = comparable factual learning + **mayor transfer + curiosidad + engagement**
- Funciona bien para conceptos donde la exploración es intuitiva (física, etc.)
- Para conceptos abstractos/complejos (distributed systems), explore-first sin base produce frustración no-productiva

**Kapur — Condiciones de Productive Failure**
- Funciona cuando el problema es accesible (el estudiante puede generar representaciones)
- NO funciona cuando el gap de conocimiento es demasiado grande

**Implicación para Jarre:** Los conceptos de DDIA (Raft consensus, LSM-trees) son demasiado complejos para exploración ciega. El playground va DESPUÉS del contenido, como APPLICATION. La pre-pregunta ya cubre el rol de "explore-first" de forma controlada.

### 5. ICAP Framework → ESCALERA DE ENGAGEMENT

**Chi & Wylie (2014)**
- **Interactive > Constructive > Active > Passive**
- Passive = leer sin hacer nada
- Active = subrayar, tomar notas
- Constructive = crear diagramas, auto-explicarse, responder preguntas abiertas
- Interactive = discusión, co-creación
- Source: Educational Psychologist, Vol 49, No 4

**Mapeo a componentes de Jarre:**

| ICAP Mode | Componente Jarre | Nivel engagement |
|-----------|-----------------|------------------|
| Passive | Leer contenido del PDF | Bajo |
| Active | Post-test (reconocimiento/recall) | Medio |
| Constructive | Pre-pregunta (generar respuesta), Preguntas guía (explicar, criticar) | Alto |
| Interactive | Playground (manipular simulación, ver feedback) + Tutor AI | Máximo |

**Implicación:** El path debe ESCALAR de passive → active → constructive → interactive. No empezar por lo más difícil ni quedarse en lo pasivo.

### 6. Merrill's First Principles → EL FRAMEWORK INTEGRADOR

**Merrill (2002)**
- **Task-centered:** todo gira alrededor de un problema real
- **Activation:** activar conocimiento previo
- **Demonstration:** mostrar/modelar
- **Application:** practicar
- **Integration:** transferir a nuevos contextos
- Source: ETR&D, University of Iowa

### 7. Successive Relearning → SM-2 CIERRA EL CICLO

**Rawson & Dunlosky (2022)**
- Test inmediato + reviews espaciados: effect sizes **d = 1.52 a 4.19**
- Source: Current Directions in Psychological Science

**Quantum Country (Matuschak & Nielsen 2019)**
- 112 preguntas embebidas en un essay de quantum computing
- **83% retención a 2 meses** (vs ~33% sin)
- Solo **<50% overhead de tiempo** para meses de retención

---

## LA SECUENCIA DEFINITIVA

```
┌─────────────────────────────────────────────────────────┐
│  CAPÍTULO N (ej: DDIA Chapter 1)                        │
│                                                         │
│  ┌─── STEP 1: ACTIVATE (5 min) ──────────────────────┐  │
│  │  Resumen visual (hand-written advance organizer)   │  │
│  │  → Nombres, estructura, big picture                │  │
│  │  → Mayer pre-training d=0.85                       │  │
│  └────────────────────────────────────────────────────┘  │
│                    ↓                                     │
│  ┌─── STEP 2: LEARN (per concept, 15-20 min c/u) ────┐  │
│  │                                                    │  │
│  │  Para cada concepto (ej: reliability):             │  │
│  │                                                    │  │
│  │  2a. PRE-PREGUNTA (productive failure)             │  │
│  │      → 1 pregunta difícil, el usuario intenta      │  │
│  │      → Probablemente falla → activa conocimiento   │  │
│  │      → Kapur d=0.36-0.58                           │  │
│  │                                                    │  │
│  │  2b. CONTENIDO (texto del libro, renderizado)      │  │
│  │      → PDF extraído, traducido, nativo             │  │
│  │      → El usuario lee "primed" por la pre-pregunta │  │
│  │      → Passive → Active (ICAP)                     │  │
│  │                                                    │  │
│  │  2c. POST-TEST (retrieval practice)                │  │
│  │      → 1-2 preguntas del question_bank             │  │
│  │      → Szpunar: 2x retención, 50% menos wandering │  │
│  │      → Active → Constructive (ICAP)                │  │
│  │                                                    │  │
│  │  [Repetir 2a-2c para cada concepto del capítulo]   │  │
│  └────────────────────────────────────────────────────┘  │
│                    ↓                                     │
│  ┌─── STEP 3: APPLY (20-30 min) ─────────────────────┐  │
│  │  3a. PLAYGROUND (simulación interactiva)           │  │
│  │      → Manipular, experimentar, romper cosas       │  │
│  │      → Interactive (ICAP máximo)                    │  │
│  │      → Merrill: Application principle              │  │
│  │                                                    │  │
│  │  3b. PREGUNTAS GUÍA (constructive reflection)      │  │
│  │      → "¿Por qué X y no Y?"                       │  │
│  │      → "¿Cuándo NO usarías esto?"                  │  │
│  │      → Constructive engagement (ICAP)              │  │
│  └────────────────────────────────────────────────────┘  │
│                    ↓                                     │
│  ┌─── STEP 4: EVALUATE (15 min, opcional) ────────────┐  │
│  │  Evaluación completa con DeepSeek                  │  │
│  │  → Preguntas de transfer, tradeoffs, error detect  │  │
│  │  → Merrill: Integration principle                  │  │
│  │  → Si score >= 60% → mastery level 1               │  │
│  └────────────────────────────────────────────────────┘  │
│                    ↓                                     │
│  ┌─── STEP 5: REVIEW (ongoing, days/weeks) ───────────┐  │
│  │  SM-2 spaced repetition                            │  │
│  │  → Cards de los post-tests vuelven automáticamente │  │
│  │  → Rawson & Dunlosky d=1.52-4.19                   │  │
│  │  → Quantum Country: 83% retention @ 2 months       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Mapeo a Merrill's First Principles

| Merrill Principle | Jarre Step | Componente |
|---|---|---|
| Task-centered | Todo el capítulo gira alrededor de un problema real del dominio | El capítulo mismo |
| Activation | Step 1 (Resumen) + Step 2a (Pre-pregunta) | Advance organizer + productive failure |
| Demonstration | Step 2b (Contenido del libro) | PDF extraído renderizado como web |
| Application | Step 2c (Post-test) + Step 3 (Playground) | Retrieval practice + simulación |
| Integration | Step 4 (Evaluación) + Step 5 (SM-2 Review) | Deep assessment + spaced repetition |

## Mapeo a ICAP (escalada de engagement)

```
Step 1 (Resumen)        → Passive/Active   (leer overview)
Step 2a (Pre-pregunta)  → Constructive     (generar respuesta propia)
Step 2b (Contenido)     → Passive→Active   (leer primed)
Step 2c (Post-test)     → Active           (retrieval)
Step 3a (Playground)    → Interactive      (manipular + feedback)
Step 3b (Preguntas guía)→ Constructive     (reflexionar, criticar)
Step 4 (Evaluación)     → Constructive     (explicar, conectar, defender)
```

## Ejemplo concreto: DDIA Chapter 1

### Step 1: ACTIVATE
Resumen visual (el DDIAChapter1 component existente):
- "Los 3 pilares: Reliability, Scalability, Maintainability"
- Diagrama visual REM
- 3 min de lectura

### Step 2: LEARN — Concepto "Reliability"

**2a. Pre-pregunta:**
> "Diseñas un servicio de pagos bancarios. Un disco duro falla cada 24 horas en promedio.
> ¿Cómo garantizas que ninguna transacción se pierda? Intenta responder antes de leer."

Usuario intenta, probablemente da una respuesta parcial.

**2b. Contenido (extraído de DDIA pp. 6-10, traducido):**
> ## Fiabilidad
> El sistema sigue funcionando correctamente incluso cuando las cosas salen mal...
> ### Faults de Hardware
> Los discos duros tienen un MTTF de 10-50 años...
> ### Faults de Software
> Un bug que causa crash cuando un input particular...
> ### Errores Humanos
> Los operadores son la causa principal de outages...

**2c. Post-test:**
> "¿Cuál es la diferencia entre fault tolerance y fault prevention? Da un ejemplo de cada uno."

### Step 2: LEARN — Concepto "Scalability" (mismo ciclo)
### Step 2: LEARN — Concepto "Maintainability" (mismo ciclo)

### Step 3: APPLY
- **Playground:** Latency Simulator — experimenta con percentiles, tail latency, SLOs
- **Preguntas guía:** "¿Por qué Amazon usa p99.9 en vez de average? ¿Cuándo sería aceptable ignorar tail latency?"

### Step 4: EVALUATE
- Evaluación completa con 3-5 preguntas de transfer y tradeoff

### Step 5: REVIEW
- Las preguntas de 2c entran a SM-2 automáticamente
- Vuelven en 1 día, luego 3, luego 7, etc.

---

## Decisiones de diseño

### ¿Por qué el resumen VA PRIMERO y no al final?
- Mayer pre-training (d=0.85): dar vocabulario y estructura reduce cognitive overload
- Sin el resumen, el contenido completo del libro es overwhelming
- El resumen NO reemplaza el contenido — es el scaffolding

### ¿Por qué la pre-pregunta va ANTES del contenido?
- Kapur productive failure (d=0.36-0.58): intentar y fallar prime el cerebro
- Richland et al. 2009: incluso intentos fallidos mejoran aprendizaje posterior
- Crea "knowledge gap awareness" — el usuario sabe QUÉ no sabe

### ¿Por qué el playground va DESPUÉS y no antes?
- Para conceptos complejos (Raft, LSM-trees), exploración ciega causa frustración improductiva
- La pre-pregunta ya cubre el rol de "explore-first" de forma controlada
- El playground como APPLICATION (Merrill) refuerza comprensión existente
- PhET research muestra que para conceptos simples explore-first funciona, pero Jarre maneja conceptos de alta complejidad

### ¿Por qué las preguntas guía van con el playground?
- Son preguntas de reflexión (why, tradeoff, connection) → Constructive (ICAP)
- Se responden mejor DESPUÉS de haber interactuado con el playground
- Complementan la simulación: el playground muestra QUÉ pasa, las preguntas guía piden POR QUÉ

### ¿Y si un capítulo NO tiene playground?
- Se salta Step 3a, las preguntas guía se muestran solas
- El path sigue siendo: Resumen → [Pre-Q → Content → Post-test]×N → Preguntas guía → Evaluación

### ¿Y si un capítulo NO tiene resumen hand-written?
- Se salta Step 1, o se genera un mini advance organizer automático
- "En esta sección aprenderás sobre: [lista de conceptos con 1 línea c/u]"

---

## Fuentes

### Investigación pedagógica (peer-reviewed)
- Merrill, M.D. (2002). First Principles of Instruction. *ETR&D*
- Kapur, M. (2014). Productive Failure in Learning Math. *Cognitive Science*
- Sinha, T. & Kapur, M. (2021). When Problem Solving Followed by Instruction Works. *Review of Educational Research*, 91(5), 761-798
- Mayer, R.E. (2009). Pre-training Principle. *Cambridge Handbook of Multimedia Learning*, Ch. 10
- Chi, M.T.H. & Wylie, R. (2014). ICAP Framework. *Educational Psychologist*, 49(4)
- Szpunar, K.K., McDermott, K.B. & Roediger, H.L. (2008). Interpolated Testing. *JEP:LMC*
- Szpunar, K.K., Khan, N.Y. & Schacter, D.L. (2013). Mind Wandering + Testing. *PNAS*
- Roediger, H.L. & Karpicke, J.D. (2006). Test-Enhanced Learning. *Psychological Science*
- Richland, L.E., Kornell, N. & Kao, L.S. (2009). Pretesting Effect. *JEP:Applied*
- Rawson, K.A. & Dunlosky, J. (2022). Successive Relearning. *Current Directions in Psychological Science*

### Mnemonic medium
- Matuschak, A. & Nielsen, M. (2019). "How can we develop transformative tools for thought?"

### Simulation research
- PhET Interactive Simulations, CU Boulder (phet.colorado.edu/en/research)
