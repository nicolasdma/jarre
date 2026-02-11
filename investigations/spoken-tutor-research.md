# Spoken Tutor Research — Investigation Consolidada

**Fecha:** 2026-02-10
**Contexto:** Jarre tiene un sistema de read-along (Web Speech API, Space para play/pause, auto-advance por bloques). El usuario reporta mejora dramática en atención y comprensión. Investigamos cómo evolucionar esto hacia un tutor hablado completo.

**4 líneas de investigación paralelas:**
1. Spoken Tutoring Systems (ITS, AutoTutor)
2. TTS + Learning Science (modalidad, prosodia, sincronización)
3. Dialogue Tutoring Moves (Socratic, ICAP, scaffolding)
4. Arquitecturas Técnicas (APIs, costos, latencia)

---

## 1. HALLAZGO CENTRAL: Leer en Voz Alta + Dialogar

### Matiz crítico del Redundancy Principle de Mayer

**Mayer — Redundancy Principle:** Fue descubierto en contexto de **presentaciones multimedia con gráficos/animaciones**:

```
Grupo A: Animación + narración             → aprenden MÁS
Grupo B: Animación + narración + texto      → aprenden MENOS
```

La redundancia perjudica porque los ojos deben mirar la animación Y leer el texto simultáneamente — compiten por el **canal visual**.

**PERO: Jarre no es ese caso.** En Jarre no hay animación compitiendo. Es texto que se lee acompañado de voz. Esto es **Reading-While-Listening (RWL)**, y la investigación dice algo diferente:

- **Rogowsky et al. (2016):** No hay diferencia significativa en comprensión entre leer, escuchar, o leer+escuchar. Las tres condiciones son **equivalentes**.
- **Hui (2024):** Para **texto técnico/complejo** y **aprendices L2**, RWL actúa como scaffold — mantiene el ritmo, previene loops de relectura improductivos.
- **Production Effect (MacLeod 2010):** El texto escuchado/hablado en voz alta se retiene 10-20% mejor en memoria.

### El modelo "grupo de amigos" (Dialogic Reading)

La analogía correcta: un grupo de amigos donde uno lee en voz alta, los otros acompañan la lectura, y al final todos discuten. Esto es exactamente **Dialogic Reading** (Whitehurst 1988):

```
1. Uno lee en voz alta → los demás siguen     (Reading-While-Listening = Active)
2. Terminan la sección → discuten              (Interactive dialogue = Interactive)
```

### Implicación arquitectónica

La voz no debe **solo** leer el texto. Debe leer **y después** dialogar:

- **MANTENER** el read-along — ayuda con pacing, atención, production effect
- **AGREGAR** diálogo después de cada sección — acá es donde está la ganancia real
- La lectura en voz alta es el **vehículo** (mantiene atención y ritmo)
- El diálogo es el **motor** (produce comprensión profunda)

> **Mayer — Modality Principle (donde SÍ aplica):** Cuando hay figuras/diagramas (que Jarre ya tiene de DDIA), la voz debería **comentar** el diagrama en vez de leer texto al lado del diagrama. Gráficos + narración > Gráficos + texto en pantalla.

---

## 2. Efectividad: Números Duros

| Sistema | Effect Size | Fuente |
|---------|------------|--------|
| Tutor humano 1:1 | d = 0.79 | VanLehn 2011 |
| AutoTutor (diálogo hablado) | d = 0.81 (media, rango 0.2-1.5) | Graesser et al. 2005 |
| ITS step-based | d = 0.76 | VanLehn 2011 |
| ITS answer-based | d = 0.31 | VanLehn 2011 |
| Sin tutoría | baseline | — |

**AutoTutor iguala al tutor humano** (d = 0.81 vs 0.79). Y el hallazgo crítico: **no es el avatar lo que produce la mejora — es el contenido del diálogo**. La voz sola carga el peso pedagógico, no se necesita avatar visual.

**ITSPOKE (Litman, Pittsburgh):** Reemplazar diálogo tipeado con diálogo hablado **mejoró** aprendizaje. Los errores de reconocimiento de voz **NO** degradaron las ganancias. Los estudiantes son resilientes a errores de ASR.

**Bloom's 2-Sigma:** Tutoría 1:1 con mastery learning produce mejora de 2 desviaciones estándar. El estudiante tutoreado promedio supera al 98% de los estudiantes en aula.

---

## 3. Taxonomía de Movimientos de Diálogo (AutoTutor)

El tutor escala desde el movimiento menos directivo hasta el más directivo:

| Movimiento | Descripción | Ejemplo (DDIA) |
|-----------|-------------|----------------|
| **Pump** | Pedir elaboración genérica | "Contame más..." / "¿Qué más?" |
| **Hint** | Nudge indirecto hacia una expectativa | "Pensá en qué pasa cuando falla el nodo líder..." |
| **Prompt** | Fill-in-the-blank específico | "El mecanismo que previene split-brain se llama ___" |
| **Splice** | Conectar contribución del estudiante con la respuesta ideal | "Exacto, y eso se conecta con..." |
| **Assertion** | Declarar información directamente (solo si el estudiante no llega) | "En realidad, Paxos requiere un quórum mayoritario." |
| **Correction** | Corregir misconception | "Ojo — consenso y consistencia son cosas distintas..." |
| **Summary** | Recapitular al final | "Entonces, resumiendo lo que discutimos..." |
| **Short feedback** | 5 niveles: positivo a negativo | "Exacto!" / "No del todo" / "Hmm" |

**Patrón de escalación:** pump → hint → prompt → assertion. Se repite para cada "expectativa" que el tutor quiere cubrir.

### Expectation-Misconception Tailored (EMT) Dialogue

Para cada sección de contenido, se pre-definen:
- **Expectations:** 3-7 proposiciones que constituyen una respuesta correcta completa
- **Misconceptions:** Creencias incorrectas comunes
- **Hints/prompts:** Movimientos de diálogo vinculados a cada expectativa
- **Corrections:** Remediación específica para cada misconception

Ejemplo para DDIA Cap 5 (Replicación):

**Expectations:**
1. "La replicación basada en líder envía todas las escrituras a un nodo, que las reenvía a seguidores"
2. "El retraso de replicación puede causar inconsistencia read-after-write"
3. "Monotonic reads garantiza que un usuario nunca ve datos retroceder"

**Misconceptions:**
1. "Consistencia eventual = todas las réplicas siempre consistentes" (confusión con strong consistency)
2. "Más réplicas siempre mejora rendimiento de lectura" (ignora tradeoffs de lag)

---

## 4. Framework ICAP: De Pasivo a Interactivo

**Chi & Wylie, 2014** — Learning outcomes: **Interactive > Constructive > Active > Passive**

| Modo | En nuestro sistema | Ejemplo |
|------|-------------------|---------|
| **Passive** | Escuchar lectura en voz alta | Read-along actual |
| **Active** | Highlighting, copiar notas | Nuestras annotations |
| **Constructive** | Self-explanation, generar output nuevo | "Explicá en tus palabras por qué..." |
| **Interactive** | Diálogo donde ambos contribuyen ideas nuevas | Tutor pregunta → estudiante explica → tutor contra-ejemplo |

**El read-along actual opera en nivel Passive.** Los inline quizzes son Active. Un tutor hablado con diálogo llega a **Interactive** — el nivel más alto.

### Transiciones clave que el tutor debe facilitar:

**P → A:** "¿Cuál es la palabra más importante de ese párrafo?" (fuerza atención selectiva)
**A → C:** "Ahora explicá en tus palabras por qué un write-ahead log es necesario para crash recovery." (fuerza generación)
**C → I:** Después de que el estudiante explica, el tutor introduce contra-ejemplo: "Buena explicación. Pero ¿qué pasa si el log mismo se corrompe antes de flushearse?" (fuerza co-construcción)

---

## 5. Read-Aloud + Comprensión: Lo que dice la ciencia

### Production Effect (MacLeod et al., 2010)
Leer en voz alta mejora **memoria** 10-20% vs lectura silenciosa. El mecanismo es **distinctiveness** — hablar crea un registro de codificación adicional (motor + auditivo). Pero: beneficia más la **memoria** que la **comprensión profunda**.

### Dual Modality: Reading-While-Listening
**Rogowsky et al. (2016):** No hay diferencias significativas en comprensión entre: leer, escuchar, o leer+escuchar simultáneamente. Las tres condiciones producen comprensión equivalente.

**Hui (2024):** Reading-while-listening ayuda particularmente para: (a) lectores con dificultades, (b) texto técnico/complejo, (c) aprendices de L2. El audio actúa como "scaffold" que mantiene el ritmo.

**Implicación:** Agregar audio a la lectura no perjudica, pero tampoco mejora automáticamente. El beneficio debe venir de **lo que se hace con el audio** (diálogo, scaffolding), no del canal en sí.

### Cognitive Load Theory — Transient Information Effect
**Sweller:** La información auditiva es efímera — desaparece después de ser hablada. Para contenido denso en información, esto puede **aumentar** carga cognitiva. El texto debe permanecer visible. La voz debe proporcionar scaffolding **suplementario** mientras el estudiante retiene la capacidad de releer.

---

## 6. Think-Aloud: La Herramienta Más Natural para un Tutor de Voz

**Pressley & Afflerbach (1995):** Los lectores expertos activamente responden al texto mientras lo encuentran — hacen predicciones, inferencias, conexiones, y monitorean su comprensión. Think-aloud hace visibles estos procesos invisibles.

**Chi et al. (1994) — Self-Explanation Effect:** Cuando estudiantes explican cada línea de un texto a sí mismos, logran ganancias de aprendizaje significativamente mayores. Tres mecanismos: constructivo (inferir), integrativo (conectar), corrector de errores (notar conflictos).

**iSTART (McNamara, ASU):** Sistema automatizado que entrena lectores a auto-explicar textos de ciencia. Estrategias: monitoreo de comprensión, inferencias puente, activación de conocimiento previo, parafraseo.

### Prompts de Think-Aloud para el tutor:

- **Monitoreo:** "Calificá tu comprensión de ese párrafo del 1 al 5. ¿Qué parte no quedó clara?"
- **Inferencia puente:** "¿Cómo se conecta esto con lo que leímos sobre replicación?"
- **Conocimiento previo:** "¿Te recuerda a algún sistema con el que hayas trabajado?"
- **Predicción:** "Basándote en lo que leíste, ¿qué problema crees que el autor va a abordar después?"
- **Calibración metacognitiva:** "Dijiste que entendiste bien. ¿Podés explicármelo?" → si la explicación revela gaps: "Interesante — lo calificaste alto, pero parece que la relación entre X e Y todavía no está clara."

---

## 7. Patrón PEER (Whitehurst, 1988)

**P**rompt → **E**valuate → **E**xpand → **R**epeat

1. **Prompt:** Después de un párrafo, el tutor pregunta "¿Cuál es el tradeoff clave acá?"
2. **Evaluate:** El estudiante responde, el tutor evalúa
3. **Expand:** El tutor agrega matiz: "Sí, y notá que esto también afecta la latencia durante rebalancing..."
4. **Repeat:** El tutor reafirma el punto clave antes de pasar a la siguiente sección

---

## 8. Zone of Proximal Development: Scaffolding Dinámico

**Wood, Bruner & Ross (1976):** 6 funciones de scaffolding:
1. Reclutamiento (engagement)
2. Reducción de grados de libertad (simplificar)
3. Mantenimiento de dirección (motivar)
4. Marcar características críticas (lo que el estudiante podría perder)
5. Control de frustración
6. Demostración (modelar)

### Contingent Shift Principle:
- Si el estudiante tiene éxito → reducir soporte (fade)
- Si falla → aumentar soporte (escalate)

### Señales para calibración:

**Alta competencia** (explica correctamente, usa terminología precisa):
- Saltar preguntas básicas → "¿Cuándo NO funcionaría este approach?"
- Reducir scaffolding

**Baja competencia** (duda, respuestas vagas/incorrectas):
- Descomponer en sub-preguntas
- Dar más contexto, usar analogías

**Frustración** (pausas largas, "no sé"):
- Modo demostración: "Vamos a recorrerlo juntos..."
- Reducir complejidad
- Reclutar motivación: "Este es genuinamente uno de los conceptos más difíciles"

---

## 9. LLM-Based Tutoring: Estado del Arte (2023-2026)

### Khanmigo (Khan Academy + OpenAI)
- GPT-4 powered, Socratic by design
- 700K+ usuarios (2024-25)
- "Mastery gains comparable to human tutors" (piloto)
- Problema: LLMs por defecto **dan respuestas** en vez de enseñar. Hay que forzar Socratic.

### Google LearnLM (DeepMind, 2024-2025)
- Modelos fine-tuned con principios de learning science en los pesos
- Estudiantes 5.5% más probables de resolver problemas nuevos vs tutor humano solo
- Evaluadores pedagógicos prefieren LearnLM sobre GPT-4o, Claude 3.5, Gemini 1.5 Pro

### Training LLM Tutors con RL (2025)
- **Wang et al. (2025):** Llama 3.1 8B entrenado con DPO iguala calidad pedagógica de GPT-4o
- **arXiv:2505.15607:** 7B tutor model con online RL alcanza rendimiento de LearnLM
- **EduAlign (2025):** Framework de reward models: Helpfulness, Personalization, Creativity

### Insight Crítico:
> Los LLMs están entrenados para ser **helpful** (dar respuestas), lo cual es **anti-pedagógico**. Un tutor efectivo debe **withhold** la respuesta y guiar al estudiante a construirla. Esto debe forzarse via system prompt o fine-tuning.

---

## 10. Arquitecturas Técnicas: Opciones y Costos

### Comparación de Motores TTS

| Motor | Latencia | Calidad | Timestamps | Prosodia | Costo | Offline |
|-------|---------|---------|------------|----------|-------|---------|
| Web Speech API (actual) | <10ms | 4/10 | char-level | Solo rate/pitch | Gratis | Sí |
| gpt-4o-mini-tts | ~300ms | 9/10 | No | **Full steerability** via instrucciones | $12/1M output tokens | No |
| ElevenLabs | ~200ms streaming | 9/10 | **Char-level** | Style presets, voice cloning | $0.30/1K chars | No |
| Google Cloud TTS | ~300ms | 8/10 | SSML marks | Full SSML | 1M chars/mo gratis | No |
| Kokoro (82M, open source) | ~100ms | 6/10 | No | Limitado | Gratis | **Sí (WebGPU)** |

### gpt-4o-mini-tts: El Breakthrough
Acepta instrucciones en lenguaje natural para controlar prosodia:
> "Lee este contenido técnico en español a un ritmo calmado. Pausá brevemente después de cada concepto nuevo. Enfatizá términos clave."

Esto es el primer TTS comercial que permite steering de prosodia via prompts, no SSML.

### Costos por Hora de Tutoría

| Approach | Costo/Hora | Calidad Voz | Latencia | Complejidad |
|----------|-----------|-------------|----------|-------------|
| OpenAI Realtime (full) | ~$9.72 | 9/10 | <200ms | Baja |
| OpenAI Realtime (mini) | ~$3.11 | 8/10 | <200ms | Baja |
| ElevenLabs Conv. AI | ~$6.00 | 9/10 | <1s | Baja |
| **Cascaded DIY** | **~$0.88** | 7-8/10 | 500ms-1.5s | Alta |
| Google + Whisper | ~$0.84 | 7/10 | 500ms-1.5s | Alta |
| Browser-native + LLM | ~$0.30 | 4/10 | <10ms TTS | Media |

### Tres Paths Viables

**Path A — Enhanced Browser-Native (~$0.30/hr)**
Mantener Web Speech API TTS. Agregar SpeechRecognition para respuestas. Enviar transcripciones a DeepSeek. Limitación: Chrome-only ASR, voz robótica.

**Path B — Cascaded con Whisper Local (~$0.75/hr) ← DECISIÓN TOMADA**
Whisper local (ASR, gratis) + DeepSeek (cerebro) + `gpt-4o-mini-tts` (voz steerable). Mantiene DeepSeek como cerebro, ASR sin costo. Ver sección 14 para detalles.

**Path C — OpenAI Realtime Mini (~$3.11/hr)**
`gpt-4o-mini-realtime-preview` con WebRTC. Turn-taking nativo, semantic VAD, conversación natural. Pero: usa GPT-4o-mini como LLM, no DeepSeek. Upgrade futuro si se necesita latencia <200ms.

---

## 11. Modelo de Tres Modos para Jarre

Basado en toda la investigación, el tutor hablado debe tener **tres modos**, no uno:

### Modo 1: Read-Along (actual)
Hold Space, párrafos leídos en voz alta con auto-advance. Es el baseline pasivo/activo. **Mantener** — ayuda con pacing y production effect para memoria.

### Modo 2: Guided Reading (nuevo)
Después de cada sección/párrafo, el tutor interjeta con un movimiento de diálogo tipo AutoTutor (pump, hint, elaborative interrogation). El estudiante responde via voz o texto. El tutor evalúa y avanza o escala scaffolding. Objetivo: nivel **Interactive** de ICAP.

### Modo 3: Socratic Review (nuevo)
En boundaries de sección, el tutor inicia un mini-diálogo cubriendo las expectativas de la sección. Usa la escalación completa: pump → hint → prompt → assertion → correction → summary. **Acá es donde viven las ganancias de 0.8 sigma.**

### Constraint de diseño crítico (Mayer):
> La voz debe proveer **información complementaria, no redundante**. El tutor nunca debe leer el mismo texto en pantalla. Debe preguntar sobre él, comentarlo, conectarlo con otros conceptos, y desafiar la comprensión del estudiante.

---

## 12. Consideraciones de Speech Rate

- **130-140 wpm** para contenido técnico/definiciones (ritmo base)
- **150-160 wpm** para texto de conexión/transición
- **120 wpm + pausas** para definiciones, fórmulas, conceptos nuevos
- Pausa estratégica de 2 segundos después de puntos clave mejora comprensión 20-30%
- El rate actual (`utterance.rate = 1.04`) es estático — necesita ser adaptativo

---

## 14. Decisión Arquitectónica: Cascaded con Whisper Local

### Por qué Whisper local y no Realtime API

Whisper (OpenAI, open source) es **solo ASR** — convierte voz a texto. No piensa ni habla. Para un tutor completo necesitamos tres piezas:

```
OÍDOS (ASR)    →    CEREBRO (LLM)    →    BOCA (TTS)
Whisper local        DeepSeek V3           gpt-4o-mini-tts
gratis               ~$0.30/hr             ~$0.45/hr
```

vs OpenAI Realtime que es un modelo **end-to-end** (oídos+cerebro+boca integrados):

```
Tu voz ═══► gpt-4o-mini-realtime ═══► Voz del tutor
            (todo integrado, ~$3.11/hr)
```

### Comparación de experiencia

**Con Realtime API:**
```
Vos:   "Pará pará—"
Tutor: [se corta instantáneamente]
Vos:   "—no entendí lo del quórum"
Tutor: [responde en <200ms] "¿Qué parte te genera duda?"
```

**Con Whisper local cascaded:**
```
Vos:   "Pará pará—"
       [VAD detecta voz → corta TTS] ✓ funciona
Vos:   "—no entendí lo del quórum"
       [silencio 600ms → VAD asume que terminaste]
       [Whisper transcribe: ~0.5s]
       [DeepSeek piensa: ~0.8s]
       [TTS genera: ~0.3s first byte]
       ─── 1.5-2 segundos de silencio ───
Tutor: "¿Qué parte te genera duda?"
```

Los 1.5-2 segundos de latencia son aceptables para tutoría técnica — el estudiante está leyendo contenido denso, no chateando. Es como walkie-talkie vs conversación telefónica.

### Razones de la decisión

1. **Whisper ya descargado** — arrancamos con lo que hay
2. **$0.75/hr vs $3.11/hr** — 4x más barato
3. **DeepSeek como cerebro** — reutiliza todo el sistema de evaluación existente
4. **La latencia de 1.5s es tolerable** para tutoría técnica
5. **Upgrade path claro** — la lógica pedagógica (system prompt, EMT expectations, misconceptions) se reutiliza al 100% si migramos a Realtime después

### Stack técnico decidido

```
┌─ OÍDOS ─────────────────────────────────────┐
│ VAD: @ricky0123/vad-web (browser, ONNX)     │
│      Detecta cuándo el usuario habla        │
│      Corta TTS inmediatamente (barge-in)    │
│                                             │
│ ASR: Whisper local (faster-whisper o .cpp)  │
│      API endpoint en localhost              │
│      Modelo: large-v3-turbo (~4x faster)    │
│      Gratis, audio no sale de la máquina    │
└─────────────────────────────────────────────┘
           │ texto transcrito
           ▼
┌─ CEREBRO ───────────────────────────────────┐
│ DeepSeek V3 (LLM actual de Jarre)          │
│                                             │
│ System prompt contiene:                     │
│  - Rol: Tutor Socratic en español           │
│  - Contenido: sección actual de DDIA        │
│  - Expectations: 3-5 por sección            │
│  - Misconceptions: 2-3 comunes              │
│  - Reglas: nunca dar respuesta directa,     │
│    escalar pump→hint→prompt→assertion       │
│  - Contexto: historial de la conversación   │
│                                             │
│ Streaming response (token by token)         │
│ ~$0.30/hora                                 │
└─────────────────────────────────────────────┘
           │ texto streamed
           ▼
┌─ BOCA ──────────────────────────────────────┐
│ gpt-4o-mini-tts (OpenAI, streaming)         │
│                                             │
│ Instrucciones de prosodia:                  │
│  "Voz cálida, español rioplatense,          │
│   pausá en definiciones, tono de tutor      │
│   cercano, enfatizá términos técnicos"      │
│                                             │
│ ~$0.45/hora                                 │
└─────────────────────────────────────────────┘
```

### Flujo de interacción

```
FASE 1 — Read-Along (mantener lo actual)
  Web Speech API lee el párrafo/sección
  El estudiante sigue con los ojos
  → Pacing, atención, production effect

FASE 2 — Pausa + Diálogo (lo nuevo)
  El tutor (gpt-4o-mini-tts) se detiene y pregunta:
    "¿Qué es lo más importante de lo que acabamos de leer?"

  El estudiante puede:
  a) Responder por voz (Whisper transcribe → DeepSeek evalúa)
  b) Interrumpir durante lectura: "che, no entendí eso"
     (VAD detecta → corta TTS → Whisper transcribe → DeepSeek responde)
  c) Responder por texto (fallback, siempre disponible)

  El tutor evalúa y escala:
    pump → hint → prompt → assertion

  → Comprensión profunda, ICAP Interactive

FASE 3 — Resume lectura
  Tutor: "Bien, sigamos." → Vuelve a FASE 1
```

### Sobre la interrupción natural

El usuario debe poder decir "che, no entendí eso" en cualquier momento. Esto requiere:

1. **VAD corriendo constantemente** — detecta que el usuario empezó a hablar
2. **Cortar TTS inmediatamente** — cancel audio playback
3. **Grabar speech del usuario** — hasta que VAD detecta silencio
4. **Whisper transcribe** — voz a texto
5. **DeepSeek responde** — genera respuesta contextual
6. **gpt-4o-mini-tts habla** — reproduce respuesta

La interrupción (pasos 1-2) es instantánea. La respuesta (pasos 3-6) toma ~1.5-2 segundos. Es como hablar con alguien que piensa antes de responder — natural para un contexto educativo.

### Upgrade path a OpenAI Realtime

Si la latencia de 1.5-2s resulta ser un problema en la práctica, migrar a `gpt-4o-mini-realtime-preview` requiere:

- Reemplazar VAD + Whisper + DeepSeek + TTS por una sola conexión WebRTC
- El system prompt (EMT expectations, dialogue moves, reglas pedagógicas) se copia tal cual
- La UI no cambia — el mismo toggle, los mismos modos
- El costo sube de ~$0.75/hr a ~$3.11/hr
- Se pierde DeepSeek como cerebro (usa GPT-4o-mini en su lugar)

---

## 15. Fuentes Clave

### Tutoring Systems
- Bloom (1984) — 2 Sigma Problem
- VanLehn (2011) — Relative Effectiveness of Tutoring Systems (d=0.76 ITS vs d=0.79 human)
- Graesser et al. (2004, 2005) — AutoTutor (d=0.81, 10 experiments, 1000+ participants)
- Litman & Forbes-Riley (2006) — ITSPOKE: spoken dialogue doesn't degrade learning
- Evens et al. — CIRCSIM-Tutor: directed lines of reasoning
- VanLehn et al. — Why2-Atlas: explanation + revision cycle

### Learning Science
- Chi & Wylie (2014) — ICAP Framework: Interactive > Constructive > Active > Passive
- Chi et al. (1994) — Self-Explanation Effect
- Mayer (2001, 2009) — CTML: Modality Principle, Redundancy Principle, Personalization Principle
- Paivio (1971, 1986) — Dual Coding Theory
- Sweller (1988, 2011) — Cognitive Load Theory, Transient Information Effect
- MacLeod et al. (2010) — Production Effect
- Dunlosky et al. (2013) — Effective Learning Techniques
- Whitehurst (1988) — PEER dialogic reading
- Pressley & Afflerbach (1995) — Think-aloud protocols
- McNamara et al. (2004) — iSTART: automated self-explanation training
- Wood, Bruner & Ross (1976) — Scaffolding functions

### Speech + Comprehension
- Rogowsky et al. (2016) — No difference read vs listen vs dual modality
- Hui (2024) — Reading-while-listening helps L2/technical
- Valsecchi et al. (2017) — Synchronized highlighting: mixed results
- Siegle (2024) — Professional voice quality still matters

### Modern LLM Tutoring
- Khan Academy — Khanmigo (700K+ users, GPT-4 Socratic)
- Google DeepMind — LearnLM (5.5% improvement over human tutors alone)
- Wang et al. (2025) — Training LLM tutors with DPO
- arXiv:2505.15607 — RL-trained 7B tutor matches LearnLM

### Technical
- OpenAI Realtime API, gpt-4o-mini-tts, gpt-4o-mini-transcribe
- ElevenLabs Conversational AI 2.0
- Deepgram Nova-3, Aura-2
- Kokoro TTS (82M, open source)
- Google NotebookLM Audio Overviews
