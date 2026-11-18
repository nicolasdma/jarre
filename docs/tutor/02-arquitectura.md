# Tutor de voz · arquitectura: la lección entera, memoria del alumno, rápido y robusto

2026-11-18. Cómo darle al tutor de voz el contexto de toda la lección, que mande al alumno a otra sección ("volvé a la 2", "eso lo vemos en la 15"), que se acuerde de lo que contestó en otras secciones y otras sesiones, y que sea robusto y rápido. El comportamiento pedagógico (explicar o preguntar, corrección, inglés, modos) está en `01-estado-del-arte.md` y no se repite: este documento es el cómo por dentro.

Reglas del documento: cada número dice de dónde sale (archivo:línea, consulta o comando, en el apéndice); cada afirmación externa lleva su URL y la fecha en que se leyó. Las líneas de archivos citan `HEAD` (`5d9572d`) salvo que se diga otra cosa. Precedente propio en todo el documento: la landing del dueño (`~/Desktop/avatar-landing`), que resolvió con Gemini Live los mismos problemas de tamaño de contexto, arranque y reconexión.

## 0. Resumen

1. El tutor que usa el dueño es el de cada sección (`VoicePanel`, el de "Antes del quiz", hoy "Charlarlo con el tutor"), no el de Ensayar. Recibe **una sola sección**: `voice-panel.tsx:91` no le pasa la lección, así que `use-voice-session.ts:728` arma la lección con esa sección sola. El cambio "el tutor sabe toda la lección" del 2026-11-11 llegó solo al panel derecho, que se borró: `learn-flow.tsx:665-681` sigue publicando las 15 secciones y nadie las lee.
2. Tamaños medidos con `countTokens` (apéndice A): hoy el system instruction de Two Sum son 3.978 tokens (2.185 de reglas y 1.793 de la sección); la lección `3y-health-tecnica-v2` entera son 35.185 tokens (15 secciones, 117.346 caracteres); un mapa con título y 300 caracteres por sección, 1.318. El límite de entrada de `gemini-3.8-live` es 131.072 tokens: la lección entra.
3. La memoria de hoy es un resumen de 3 a 5 viñetas de la última sesión **de esa misma sección**, en inglés, hecho en segundo plano después de responder (`end/route.ts:107`, `context/route.ts:98-106`). Sin memoria por concepto (el panel no manda `conceptIds`), sin lo que contestó en otras secciones. Prueba del 18/11: la sesión `d14a09c0` abrió con la misma pregunta que el dueño ya había contestado 7 minutos antes en `a94efc5c`.
4. Persistencia: la idempotencia de transcripciones nunca funcionó. El índice único es parcial (`20260303150000_voice_transcript_idempotency.sql:12-13`), el `upsert` con `onConflict` no lo puede usar y cae al insert sin ids (`transcript/route.ts:129-153`): 0 filas con `client_turn_id` en la base. Desde el 11/11: 7 de 49 sesiones sin cierre (3 con charla adentro, invisibles para la memoria), 1 sin resumen, 9 con transcripción y 0 líneas del alumno. La sesión de 110 s con una línea (`d14a09c0`) no se puede explicar con lo guardado; el arreglo del cliente de `5d9572d` cerró los caminos de pérdida que encajan, pero sus contadores quedan solo en el log del servidor.
5. Arquitectura propuesta: el system instruction lleva persona y reglas, un **mapa de la lección** precomputado (ideas clave por sección, ~2k tokens), la **sección en foco entera** y un **brief del alumno** (≤ 600 tokens, precomputado). Las otras secciones entran **bajo demanda** como texto de contexto (`sendClientContent` con `turnComplete: false`), por tool o porque el alumno las nombra, una vez por conexión, como las notas de la landing. Objetivo: ~7,4k tokens de instruction (tope 10k) y ~US$ 0,49 por sesión de 7 minutos contra ~0,86 con la lección entera.
6. Memoria: un **digest durable** después de cada sesión (no fire-and-forget) extrae evidencia por sección (qué dijo, si estaba bien, si se corrigió, qué se le preguntó) a `learner_evidence`, y actualiza el estado por concepto en `learner_concept_memory` (el dueño existente de errores y fortalezas). Al abrir, el brief sale de una lectura de la base, sin LLM en el camino.
7. Tools: `get_section(n)` y `get_my_history(n)` bloqueantes y contestadas desde la caché del navegador en milisegundos; `go_to_section(n)` mueve la UI. Ninguna tool escribe durante la llamada: en 3.8 una llamada a mitad de la voz corta la respuesta (medido en la landing).
8. Robustez: en 3.8 la reanudación con handle no funciona (sonda propia del 2026-11-17, `gemini-live.ts:177-183`: cierre 1011 a los 14 min sin GoAway y 1008 al reanudar). Se reemplaza por un **cambio de conexión propio a los 8 min o por umbral de tokens**, entre turnos, sembrando la charla como texto más las notas leídas (el `liveConnectionSeed` de la landing), con el micrófono en buffer durante el cambio.
9. Latencia: objetivo clic → primer audio p50 ≤ 2,5 s, p90 ≤ 4 s; fin de voz → primer audio p50 ≤ 1,3 s (hoy 1,09 s en la sonda); un turno con `get_section` ≤ +1 s. Palancas: preconexión del socket (patrón de la landing), micrófono en paralelo con el socket, nada de LLM al arrancar.
10. Seis fases, cada una se puede publicar sola: 0 red y medición, 1 la lección entera en el panel, 2 memoria, 3 notas bajo demanda y tools, 4 rápido y largo, 5 Ensayar con el mismo motor.

## 1. Qué hay hoy

### 1.1 Dos tutores, y cuál usa el dueño

| | Tutor de sección (`VoicePanel`) | Ensayar con el tutor (`VoicePracticeFlow`) |
|---|---|---|
| Dónde | Debajo de cada sección: "Charlarlo con el tutor (opcional)" (`concept-section.tsx:451-472`). Antes del 18/11 decía "Antes del quiz" (`git show 6d7da63`) | El paso Ensayar al final de la lección (`learn-flow.tsx:1190`) |
| Hook | `useVoiceSession` directo, `endPolicy: 'learning'` (`voice-panel.tsx:91`) | `useUnifiedVoiceSession` modo `practice` (`voice-practice-flow.tsx`) |
| Prompt | `buildLearningSession` (`src/lib/llm/voice-tutor-session.ts:152`) | `buildPracticeMode` (`src/lib/llm/voice-unified-prompt.ts:339`) |
| `session_type` | `teaching`, con `section_id` | `practice`, con `resource_id` |
| Sus charlas del 18/11 | `a94efc5c`, `d14a09c0`, `ac028b04` (las tres, `~/Desktop/_revisar/jarre-tutor/2026-11-18-charlas.md`) | ninguna ese día |

Las tres charlas del 18/11 son del tutor de sección: sus filas tienen `section_id` y la regla de inglés de `BILINGUAL_RULE` ("Ahora decímelo en inglés") es de `buildLearningSession`. Este documento trata los dos, pero el que importa primero es el de sección.

### 1.2 Qué contexto recibe cada uno

**Tutor de sección** (`VoicePanel`):

| Pieza | De dónde | Tamaño |
|---|---|---|
| La sección abierta, entera | `sectionContent` (`voice-panel.tsx:91`) | Two Sum: 3.978 tokens el instruction completo, reglas incluidas (apéndice A) |
| Las otras 14 secciones | **nada**: sin `lessonSections`, `use-voice-session.ts:728` usa `[{ title: st, content: sc }]` | 0 |
| El mapa "qué cubrir" | `keyIdeas()` (`voice-tutor-session.ts:75`), con una sola sección es una línea | ~10 tokens |
| Resumen de la sesión anterior | `GET /api/voice/session/context?sectionId=…`: la última sesión **terminada** de **esa sección** con `cached_summary` (`context/route.ts:98-106`) | 3 a 5 viñetas en inglés (`memory.ts:38-49`, tope `TOKEN_BUDGETS.VOICE_MEMORY` 500) |
| Memoria por concepto (errores, fortalezas) | **nada**: el panel no manda `conceptIds`, el contexto no busca `learner_concept_memory` | 0 |
| Inglés | `practicesEnglish` si la lección tiene drills (`context/route.ts:143`) | la regla bilingüe |
| Tools | ninguna (`use-unified-voice-session.ts:574` las saca para `learning`; el panel no las pasa) | 0 |

**Ensayar** (`practice`): persona, `buildPracticeMode` con los 15 conceptos como nombre y definición canónica (`use-unified-voice-session.ts:628-633`), las cuatro tools de UI (`tool-declarations.ts`) y `learner_concept_memory` de esos conceptos (`use-unified-voice-session.ts:738-749`). **Ningún texto de sección.** El resumen previo nunca llega: pide `sectionId=''` y la columna es UUID. Su regla "Sin ayuda, sin pistas, sin correcciones en esta fase" (`voice-unified-prompt.ts:406-407`) es exactamente lo que el dueño llama "reglas demasiado estrictas".

**El código para la lección entera ya existe y no se usa.** `lessonForPrompt` (`voice-tutor-session.ts:54`) mete la sección en foco entera y recorta las demás para entrar en `LESSON_CHAR_BUDGET` (48.000 caracteres, línea 48): para esta lección son 15.835 tokens. `learn-flow.tsx:665-681` arma `lessonSections` con las 15 y las publica en `useTutorContext` (`src/lib/tutor-context.tsx:15`) para el panel derecho, que se borró (comentario en `learn-flow.tsx:988`). El panel de sección nunca las recibió.

### 1.3 Modelo, token y arranque

- Modelo: `gemini-3.8-live` por defecto (`src/lib/voice/live-models.ts:49`), voz Kore, fin de turno `END_SENSITIVITY_LOW` con 1300 ms (`live-models.ts:90`).
- Token efímero: un socket debe abrir en 10 min, los mensajes pueden fluir 30 min, 2 usos (`live-token.ts:20-25`). El token bloquea modelo, modalidad, transcripciones y voz; el system instruction, las tools y el handle quedan del cliente (`live-token.ts:3-13`).
- Cadena de arranque del panel (`use-voice-session.ts`, HEAD): al montar el panel, token y contexto se piden en paralelo (`:233`) y se precarga el SDK. Al tocar el micrófono: `session/start` en paralelo con lo precargado (`:682`) → arma el instruction → `client.connect` (socket y setup, `:940`) → **recién ahí** `getUserMedia` y el worklet (`:949`) → manda el opener como texto (`:955`) → el modelo genera la primera pregunta.
- Lo que se sabe del tiempo: la sonda del 2026-11-11 midió primer audio p50 1.089 ms y p90 1.709 ms desde que se manda el turno (`docs/research/2026-11-11-voice-tutor-aaa.md`, tabla "Antes y después", v3). En la landing el setup del socket tarda 0,9 a 1,8 s con instructions de 7k a 60k caracteres (`~/Desktop/avatar-landing/docs/research/2026-10-17-arranque-saludo.md`, "Lo que mide cada tramo"). **El clic → primer audio en Jarre no está medido.** Lo único guardado es `started_at` de la fila contra la hora de la primera línea del tutor, que se escribe al terminar su turno, no al empezar a sonar: 8 s en `a94efc5c`, 12 s en `d14a09c0`, 14 s en `ac028b04` (consulta B del apéndice). Es una cota que incluye lo que duró la pregunta hablada.

### 1.4 Cómo se guardan las transcripciones y qué se pierde

Camino: la Live API manda transcripciones de entrada y salida en fragmentos; el hook las junta en una línea por enunciado (`use-voice-session.ts:462-520`), las encola y las manda en lotes de hasta 40 cada 500 ms a `POST /api/voice/session/transcript` con un token de escritura HMAC por sesión (`session-write-token.ts`), que hace `upsert` en `voice_transcripts`. Desde `5d9572d` (18/11) la cola es un `TranscriptOutbox` por sesión (`src/lib/voice/transcript-outbox.ts`) que drena antes de `end` y en `pagehide`. Al cortar: `POST /api/voice/session/end` pone `ended_at`, cuenta filas y genera el resumen.

Lo que la base dice (consultas B y C del apéndice, sesiones desde el 2026-11-11, todas del dueño):

| Hecho | Número | Causa |
|---|---|---|
| Filas con `client_turn_id` | 0 de todas | El índice único es parcial (`WHERE client_turn_id IS NOT NULL`, migración `20260303150000`, líneas 12-13). Postgres solo usa un índice parcial en `ON CONFLICT` si la sentencia repite el predicado, y PostgREST no lo puede decir: el `upsert` falla con "there is no unique or exclusion constraint" y la ruta cae al insert sin ids (`transcript/route.ts:134-153`). Un reintento duplica filas. |
| Sesiones sin `ended_at` | 7 de 49 (3 con charla adentro, una de 62 filas: `347ebb3b`) | `end` solo se llama al cortar o desmontar; una pestaña cerrada o un crash no cierra. La memoria solo lee sesiones terminadas (`context/route.ts:103`): esas charlas no existen para el tutor. |
| Sesiones terminadas con charla y sin resumen | 1 (`ac028b04`, la del 18/11) | El resumen corre después de responder, sin `after()` (`end/route.ts:107-111`). En un runtime serverless esa promesa puede morir con la respuesta. Next 16.4.6 tiene `after` de `next/server` para esto (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`). |
| Sesiones con transcripción y 0 líneas del alumno | 9 de 49 | No se puede separar "no habló" de "se perdió": ver abajo. |
| La carrera del cierre | sin número | Hasta `0e38ea6`: si había un flush en vuelo al cortar, el flush final volvía en el acto (`use-voice-session.ts:454` de ese commit) y el reintento leía la sesión de refs ya en `null` (`:1082`). Arreglado en `5d9572d`. Queda en Ensayar: el puntaje (`voice-practice-score`) arranca en el mismo tick que el corte (`use-unified-voice-session.ts:812-825`), sin esperar el drenaje. |

**La sesión de 110 s con una línea** (`d14a09c0`, 21:07:25 a 21:09:15 UTC, sección Two Sum): una sola fila, la pregunta del tutor a las 21:07:37. Su propio resumen dice "la conversación quedó en la pregunta del tutor, sin que se registre la respuesta del estudiante". Hipótesis compatibles: el dueño no habló; el micrófono no llegó a Gemini; la transcripción de entrada no llegó; su enunciado quedó abierto o encolado y se perdió al cortar. El commit `5d9572d` revisó el servidor (un token, sin errores en la ruta de transcripciones, `end` contó 1 turno) y cerró en el cliente los caminos de pérdida que encajan con la última hipótesis. Con lo guardado **no se puede decidir** cuál fue: no hay registro de si el micrófono capturó ni de si llegó alguna `inputTranscription`. Desde `5d9572d`, `end` loguea contadores del cliente (fragmentos de transcripción, chunks de micrófono, enunciados encolados, último error Live), pero solo en el log del servidor, no en la base. La fase 0 los persiste junto con los tiempos.

**Lo que entró el 18/11 mientras se escribía esto** (otro frente): `f3bebbb` (la regla de enseñar, `TEACH_RULE` en `voice-tutor-session.ts:137`, inglés solo cuando se lo ganó, corregir todo error, y dos viñetas nuevas en el resumen de `memory.ts`) y `5d9572d` (el `TranscriptOutbox` y los contadores `diag`). No tocan el índice parcial, el resumen sin `after()`, las sesiones sin cerrar, la lección entera ni la memoria por concepto. Este plan cuenta con ese trabajo y no lo duplica.

### 1.5 Memoria entre sesiones hoy

- Un solo resumen, el de la última sesión terminada de esa sección (`.limit(1)`, `context/route.ts:106`). Lo de otras secciones de la misma lección no entra, aunque la lección sea una sola y el alumno salte entre secciones.
- El resumen es prosa en inglés de 3 a 5 viñetas generada por DeepSeek (`memory.ts:35-46`). No dice qué preguntas se hicieron: por eso `d14a09c0` repitió "¿por qué chequear el complemento antes de insertar?", que el dueño había contestado a las 16:00:12 en `a94efc5c` ("estarías mirando un número desactualizado"), y el resumen de `a94efc5c` no lo guardó (consulta D).
- `learner_concept_memory` existe (errores, fortalezas, analogías, preguntas abiertas por concepto, `src/lib/learner-memory.ts:18-27`) pero solo la escriben los puntajes de evaluación y práctica: 5 filas en total, 0 de los 15 conceptos de esta lección (consulta C).
- Los demás datos del alumno: `review_schedule` (FSRS por pregunta o card), `exercise_results`, `concept_progress`, `learn_progress` (fase por sección), los puntajes de práctica en `voice_sessions.practice_result`. Los mejores puntajes de los drills viven en `localStorage` (`src/components/practice/best-scores.ts:4`), fuera del alcance del servidor.

### 1.6 Reconexión hoy

Tres capas en `use-voice-session.ts`: GoAway → reanudar con handle (`:793`); cierre → token nuevo y reanudar con handle, si falla, sesión nueva sembrada con la transcripción local o un resumen comprimido (`:842`); si no, error honesto. En 3.8 la capa 1 no sirve: la sonda del 2026-11-17 (17 min, un ping cada ~100 s) cerró a los 14 min con 1011 sin GoAway, y reanudar con el último handle reanudable dio 1008 "session not found or expired" (`gemini-live.ts:177-183`). La landing vio lo mismo con 3.8: sin GoAway, cierre 1011 a los 10:00 en medio de una respuesta (`~/Desktop/avatar-landing/src/lib/useOverviewLiveSession.ts:768-777`). Hoy la capa 2 llega tarde (después del corte, con la respuesta en curso perdida) y gasta un token en el intento inútil de la capa 1.

## 2. Lo que dicen las fuentes (leídas el 2026-11-18)

| Hecho | Fuente |
|---|---|
| `gemini-3.8-live`: entrada 131.072 tokens, salida 65.536; function calling sí; llamadas asíncronas (no bloqueantes por defecto, bloqueantes disponibles); proactive audio siempre prendido; **context caching no**; actualizado "September 2026" | https://aistudio.google.com/docs/models/gemini-3.8-live |
| Sin compresión, sesiones de solo audio limitadas a 15 min; la conexión dura ~10 min; GoAway avisa con `timeLeft`; los handles de reanudación valen 2 h desde el último cierre; `contextWindowCompression` con ventana deslizante extiende la sesión | https://aistudio.google.com/docs/live-api/session-management |
| "The API charges you per turn for all tokens present in the session context window"; el audio se acumula a ~25 tokens por segundo; separar persona, reglas y guardrails; decir en qué condiciones se llama cada tool | https://aistudio.google.com/docs/live-api/best-practices |
| En 3.8, `send_client_content` se acepta durante toda la sesión con roles explícitos (`user`, `model`); `turn_complete=true` interrumpe la generación; para contextos largos se recomienda un resumen en un mensaje | https://aistudio.google.com/docs/live-guide |
| Tools: `NON_BLOCKING` corre asíncrona; scheduling de la respuesta `INTERRUPT`, `WHEN_IDLE`, `SILENT`; 3.8 Live soporta llamadas síncronas y asíncronas | https://aistudio.google.com/docs/live-api/tools |
| Precio 3.8 Live, pago: entrada texto US$ 0,75 / M, entrada audio 3,00 / M, salida audio 12,00 / M (0,018 por minuto); free tier gratis | https://aistudio.google.com/docs/pricing |
| `after()` en Route Handlers: trabajo después de la respuesta | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md` (Next 16.4.6) |

Medido por la landing con 3.8 (precedente, no fuente externa):

- Texto con `turnComplete: false` no genera ni se cobra al llegar; el turno siguiente lo lee y lo usa (`~/Desktop/avatar-landing/docs/research/2026-10-25-gasto-gratis.md`, sección 2).
- Notas bajo demanda contra todo en el instruction: primer turno 21,7k contra 30,8k tokens, tokens totales −28 %, primer sonido p50 1.171 contra 1.402 ms y p90 3.704 contra 4.949 ms, sin inventos de más (misma página, sección 8). Un riesgo encontrado: sin las notas de un proyecto el modelo negó algo que las notas decían; se arregló con un índice de palabras por sección en el instruction.
- Reanudar re-factura el audio del historial: US$ 0,916 con reanudación contra 0,465 reconstruyendo con texto, mismas 18 preguntas; el rebuild tarda 1,1 a 1,8 s y se hace entre turnos (`~/Desktop/avatar-landing/src/lib/overviewLiveContextBudget.ts:1-28`).
- Tools en 3.8: una respuesta `SILENT` antes de la primera palabra deja el turno mudo; `WHEN_IDLE` antes de la voz habla; una llamada **a mitad de la voz** termina la respuesta en esa palabra (44 de 44 casos) (`~/Desktop/avatar-landing/CLAUDE.md`, línea de `perform_action`). Jarre ya elige `WHEN_IDLE` o `SILENT` por `audioInTurn` (`gemini-live.ts:418-430`).
- El tamaño del instruction casi no mueve el setup (0,9 a 1,8 s con 60k caracteres); la espera de arranque es la cadena serial, y abrir el socket en el hover la saca del clic (`2026-10-17-arranque-saludo.md`, "Decisiones").

## 3. Arquitectura propuesta

### 3.1 Diagrama

```
                           SERVIDOR (Next route handlers, Supabase con RLS)
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │  lesson_tutor_maps (por lección, por hash del contenido)                         │
 │    mapa: n · título · 3-5 ideas clave · términos · "se profundiza en"            │
 │                 ▲ lo arma un script al sembrar/editar la lección (DeepSeek, 1 vez) │
 │                                                                                  │
 │  POST /api/voice/session/start ──► voice_sessions (focus, modelo, prompt_version) │
 │  GET  /api/voice/tutor/context ──► { map, brief, history } en UNA lectura (~150 ms)│
 │        brief = learner_concept_memory (estado por concepto) + learner_evidence    │
 │                (últimas, no resueltas primero) + preferencias                     │
 │  POST /api/voice/session/transcript ──► voice_transcripts (idempotente de verdad) │
 │  POST /api/voice/session/events     ──► voice_session_events (sin texto)          │
 │  POST /api/voice/session/end ──► ended_at + digest_status='pending' + after(digest)│
 │                                                                                  │
 │  digest (después de cada sesión, reintentable, también lo dispara /context si     │
 │  encuentra una sesión del usuario sin cerrar o pending vieja):                    │
 │     transcripción + mapa ──► DeepSeek JSON ──► learner_evidence (append)          │
 │                                           └──► learner_concept_memory (upsert)    │
 └──────────────────────────────────────────────────────────────────────────────────┘
                     ▲ token efímero        ▲ context            ▲ lotes / eventos
                     │                      │                    │
 NAVEGADOR (/learn/<id>)                    │                    │
 ┌──────────────────────────────────────────┴────────────────────┴──────────────────┐
 │ learn-flow ya tiene las 15 secciones en memoria ──► TutorLessonCache             │
 │                                                                                  │
 │ hover/abrir panel: token + context + SDK + socket PRECONECTADO (60 s máx)       │
 │ clic: mic (getUserMedia) EN PARALELO con el claim del socket ──► opener          │
 │                                                                                  │
 │ system instruction (≤ 10k tokens, fijo por conexión):                            │
 │   persona + reglas (01) · MAPA · sección en foco ENTERA · BRIEF · idioma         │
 │                                                                                  │
 │ runtime por turno:                                                               │
 │   inputTranscription ──► detector de sección (palabras del mapa) ─┐              │
 │   tool get_section(n) / go_to_section(n) ─────────────────────────┤              │
 │                                    notas de la sección n, 1 vez por conexión     │
 │                                    ──► sendClientContent(turnComplete:false)     │
 │   tool get_my_history(n) ──► caché del context (sin red)                         │
 │   usageMetadata ──► tokens por turno ──► ¿rebuild?                               │
 │                                                                                  │
 │ cambio de conexión (8 min o 20k tokens, entre turnos):                           │
 │   socket nuevo + instruction (brief actualizado) + seed = charla en texto        │
 │   + notas ya leídas; mic en buffer mientras tanto                                │
 │                                                                                  │
 │ TranscriptOutbox (5d9572d) ──► transcript      EventLog ──► events               │
 └──────────────────────────────────────────────────────────────────────────────────┘
                                   │ WebSocket (v1alpha, token efímero)
                                   ▼
                          Gemini Live · gemini-3.8-live
```

### 3.2 Contexto: mapa siempre, la sección en foco entera, el resto bajo demanda

**Qué va en el system instruction** (fijo durante la conexión; cada cambio de conexión lo rearma):

| Bloque | Contenido | Tokens (estimado salvo donde dice medido) |
|---|---|---|
| Persona y reglas | `buildLearningSession` de HEAD, con la regla de enseñar y la de inglés (`f3bebbb`; comportamiento en `01-estado-del-arte.md` §4) | 2.185 medido (sin texto de sección) |
| **Mapa de la lección** | Por sección: número, título, 3 a 5 ideas clave en una línea cada una, términos que la nombran y "se profundiza en la N" cuando una idea vuelve en otra. Precomputado y guardado (`lesson_tutor_maps`), versionado por hash del contenido. | ~2.000 (medido 1.318 con título y 300 caracteres crudos; ideas clave son más densas) |
| Regla de referencias | "Cuando algo es de otra sección, decí cuál por número y nombre corto; si el alumno pide otra sección o falta una base, ofrecé ir" (comportamiento en `01` §4.6) | ~150 |
| **Sección en foco, entera** | La que el alumno está leyendo (o, en Ensayar, la primera del recorrido) | mediana 7.975 caracteres ≈ 2.400 tokens; máximo 9.938 ≈ 3.000 (a 3,34 caracteres por token, medido) |
| **Brief del alumno** | Estado de las secciones tocadas, errores sin resolver con sus palabras, preguntas ya hechas (para no repetirlas), preferencias dichas ("explicame paso a paso", "nada de inglés por ahora") | ≤ 600 (tope duro al armarlo) |
| Ancla de idioma | La de hoy | ~80 |
| **Total** | | **≈ 7.400 típico, 8.000 con la sección más larga; tope 10.000** |

**Por qué no la lección entera en el instruction.** Entra (35.185 tokens contra 131.072) y es lo más simple. Pero la Live API relee y factura todo el contexto en cada turno, 3.8 no tiene caching, y el audio del historial se suma encima (sección 2). Con una sesión típica del dueño (`a94efc5c`: 441 s, 18 turnos del tutor) la cuenta de 3.7 da ~US$ 0,86 contra ~0,49. Y si la clave de Jarre está en el free tier con el mismo límite que vio la landing (65k tokens por minuto para 3.8 Live, proyecto `landing-prod`), ~37k tokens por turno son menos de dos turnos por minuto para todo el proyecto: la charla se cortaría por cuota. El tier y el límite de la clave de Jarre no están verificados (sección 8).

Por eso la lección entera es el **brazo A** de la fase 1, para medir contra el **brazo B** (mapa + foco + bajo demanda) con la sonda. Si A gana en calidad por margen y el tier lo banca, se queda A y la fase 3 se reduce a tools de UI.

**Cómo entran las otras secciones** (brazo B), una vez por conexión cada una, como la landing (`takeOnDemandNotes`, `~/Desktop/avatar-landing/src/lib/overviewLiveConversation.ts:561-580`):

1. **El alumno la nombra.** La transcripción de entrada llega mientras habla. Un detector de sección (las palabras del mapa: "Big-O", "islas", "LRU", "rotated", "paréntesis", más "la sección N") marca la sección. Sus notas se mandan con `sendClientContent({ turns: [...], turnComplete: false })` en cuanto el modelo termina el turno en curso (`turnComplete`), y las lee el turno siguiente. Para el turno en que la nombró, el modelo tiene el mapa: alcanza para "eso lo vemos en la 15" o "volvamos a la 2".
2. **El modelo la pide.** `get_section(n)` (3.5), cuando necesita el detalle ya, por ejemplo para corregir un error de esa sección.
3. **El recorrido avanza.** Cuando el tutor pasa a la sección siguiente (`go_to_section` o el detector sobre su propia transcripción), se precargan sus notas en el mismo silencio.

Tope: 3 secciones inyectadas por conexión (~7k tokens). Más que eso dispara el cambio de conexión (4.1), que rearma el instruction con la sección actual en foco y deja afuera las notas que la charla ya no toca.

**Qué es una "nota" de sección.** El markdown de la sección tal cual (es lo que el alumno leyó, y el tutor no debe citar otra cosa), con el encabezado `### N. Título (NOTAS DE LA SECCIÓN N, para responder; no las leas en voz alta)`. Sale de `TutorLessonCache`: el navegador ya tiene las 15 secciones (`learn-flow.tsx:680`), no hace falta red.

### 3.3 Modelo del alumno

Lo que pide el dueño es "que recuerde lo que respondí". La investigación del frente de comportamiento dice que el estado lo calculan reglas sobre evidencia, no el LLM (`01-estado-del-arte.md` §4.7, arXiv 2512.23036). Diseño en dos capas:

**Evidencia** (`learner_evidence`, append-only): una fila por cosa que el alumno mostró, con su sección y concepto, sacada de cada fuente:

| Fuente | Qué produce | Cuándo |
|---|---|---|
| Charla de voz (digest de la transcripción) | `explained` (lo dijo bien, con sus palabras), `misconception` (lo dijo mal; `resolved` si se corrigió y lo reformuló bien), `gap` (no supo), `asked_help`, `tutor_question` (qué se le preguntó, para no repetir), `preference` ("explicame paso a paso", "no quiero inglés ahora"), `english` (recast dado) | al cerrar la sesión, por el digest |
| Quiz en línea y post-test de sección | `correct` / `incorrect` con la pregunta | ya se guardan en `exercise_results` y `review_schedule`: el brief los lee de ahí, no se copian |
| Evaluación y práctica por voz | errores y fortalezas | ya escriben `learner_concept_memory` (`voice-practice-score`): se mantiene |
| Drills | mejor puntaje | hoy en `localStorage`: fase 5 los sube a una tabla |

Cada fila guarda `quote` (sus palabras, ≤ 200 caracteres), `statement` (la afirmación normalizada, ≤ 300), `verdict`, `session_id`, `transcript_seq` (la línea de donde sale) y la hora. Eso permite "la otra vez dijiste que la clave era el índice" con sus palabras, y auditar cada recuerdo hasta su línea.

**Estado por concepto** (`learner_concept_memory`, que ya es el dueño de errores y fortalezas por concepto; cada sección de una lección escrita a mano tiene su `concept_id`, 15 de 15 en esta lección): se le suman `mastery` (0 a 4: no visto, flojo, en camino, firme, dominado), `last_seen_at`, `asked_questions` (las últimas 10 preguntas del tutor sobre ese concepto, normalizadas) y `resolved_misconceptions`. Reglas deterministas en `src/lib/tutor/mastery.ts`, con tests:

- `misconception` sin resolver en los últimos 14 días → flojo, como mucho.
- dos `explained` o `correct` en **sesiones distintas** sin errores en el medio → firme.
- firme y una explicación aplicada en una tercera sesión o en la evaluación por voz → dominado.
- nada en 30 días baja un nivel (el espíritu de FSRS, sin modelar estabilidad todavía).

**Brief** (lo que entra al instruction, ≤ 600 tokens): las secciones de esta lección con su estado en una línea, los errores sin resolver con sus palabras (más recientes primero, hasta 8), las preguntas ya hechas de la sección en foco y las preferencias. Lo arma `buildLearnerBrief` (función pura, testeable) sobre la respuesta de `/api/voice/tutor/context`. Ningún LLM en el arranque.

### 3.4 Memoria entre sesiones y privacidad

- **El digest es durable.** `end` pone `digest_status='pending'` y lo corre con `after()`. Si falla o el runtime lo mata, `GET /api/voice/tutor/context` encuentra la sesión `pending` (o una sesión del usuario sin `ended_at` y sin actividad hace más de 15 min, que primero cierra) y la procesa antes de responder, con un tope de 2 s: si no llega, responde sin ella y la deja para la próxima. Así ninguna charla queda fuera de la memoria, aunque se cierre la pestaña. Intentos en `digest_attempts`, se abandona a los 3 con `failed`.
- **Idempotente**: el digest lleva `digest_version`; volver a correrlo borra y reescribe la evidencia de esa sesión en una transacción (función SQL o borrado + inserción por `session_id`).
- **Solo del usuario.** Todas las tablas nuevas tienen RLS `user_id = auth.uid()` (en la línea del lockdown propuesto en `c30c118`, `20261118010000_rls_lockdown.sql`). El contexto y las tools corren con la sesión del usuario (`withAuth`); el digest usa el cliente admin solo dentro del servidor y filtra por el `uid` del token de escritura. Ninguna tool del modelo recibe ids de usuario ni puede pedir datos de otro: `get_my_history` lee de la caché que ya trajo el contexto del propio usuario.
- **Qué sale de la casa**: la transcripción va a Google (Live) y a DeepSeek (resumen y puntaje), como hoy. El digest no agrega proveedores. Borrar una sesión borra su evidencia (`ON DELETE CASCADE` desde `voice_sessions`).
- **Lo que no se guarda**: audio. Los eventos del cliente (3.6, 4.2) no llevan texto de la charla.

### 3.5 Herramientas

Declaradas solo en el tutor de sección y en Ensayar (no en la entrevista: ahí el entrevistador no navega la lección). La descripción de cada una dice cuándo llamarla, en oraciones separadas (best practices, sección 2).

| Tool | Parámetros | Comportamiento | Respuesta | Por qué así |
|---|---|---|---|---|
| `get_section` | `n` (número de sección) | `BLOCKING` | `{ n, title, notes }` desde `TutorLessonCache`, en < 50 ms; marca la sección como leída en esta conexión (si ya estaba: `{ already_in_context: true }`) | El modelo necesita el texto **antes** de hablar; bloqueante evita que hable sin él. La landing declara así `get_visitor_memory`. |
| `get_my_history` | `n` o `concept` | `BLOCKING` | Las filas de evidencia de esa sección (máx. 8) y su estado, desde la caché del contexto | Para "¿qué te había dicho la otra vez?" o antes de corregir algo que ya falló. Sin red en el turno. |
| `go_to_section` | `n`, `reason` (`review` \| `later` \| `learner_asked`) | `NON_BLOCKING`; respuesta `WHEN_IDLE` antes de la primera palabra, `SILENT` después (ya implementado, `gemini-live.ts:418-430`) | `{ ok: true }` | Mueve la UI. Para `review` y `later` no salta la pantalla en medio de la charla: aparece un chip en la transcripción en vivo ("Sección 2 · Big-O desde cero → ir"); solo `learner_asked` ("llevame a la 2") navega. |
| `end_session` | | Se mantiene la política `learning` de hoy: termina el alumno (`session-end.ts`) | | |

Ninguna tool escribe en la base durante la llamada (`mark_discussed` de hoy queda solo en Ensayar hasta la fase 5, donde lo reemplaza el digest): en 3.8 una llamada a mitad de la voz corta la respuesta, y lo que el tutor "marca" lo saca mejor el digest de la transcripción completa.

**Red de seguridad del turno con tool** (de la landing, `performActionResponse.ts`): si después de contestar una tool antes de la voz no llega audio en 4 s, el runtime manda un turno de texto "Respondé ahora en voz alta desde donde estabas" (una vez). Y un tope de 2 llamadas por turno: la tercera se contesta con `{ error: 'answer now' }`. La landing midió cadenas de hasta 157 llamadas sin ese tope.

### 3.6 Rápido: presupuesto de latencia

**Clic en el micrófono → primer audio del tutor** (objetivo p50 ≤ 2,5 s, p90 ≤ 4 s):

| Tramo | Hoy (HEAD) | Propuesto | De dónde sale el número |
|---|---|---|---|
| token, contexto, SDK | precargados al montar el panel | igual, más el mapa y el brief en la misma respuesta de contexto | `use-voice-session.ts:233` |
| `session/start` | en el clic, en paralelo | en el hover o al abrir el panel | un viaje a Supabase, sin medir |
| socket + setup | en el clic, 0,9 a 1,8 s | **preconectado** al abrir el panel; el clic lo adopta si instruction y modelo coinciden byte a byte, si no conecta como hoy; se cierra limpio a los 60 s sin clic | landing, `2026-10-17-arranque-saludo.md` |
| `getUserMedia` + worklet | **después** del socket | en paralelo con el claim del socket | `use-voice-session.ts:949`; sin medir |
| primera pregunta generada | p50 1,09 s, p90 1,71 s | igual | sonda v3, `2026-11-11-voice-tutor-aaa.md` |

El socket preconectado no cobra: sin turno no hay `usageMetadata` (medido en la landing, `2026-10-25-gasto-gratis.md` §2). Ojo: ocupa una sesión concurrente, y el token tiene 2 usos (`live-token.ts:23`): la preconexión usa uno, la reconexión el otro; el cambio de conexión pide token nuevo como hoy.

**Fin de voz del alumno → primer audio** (objetivo p50 ≤ 1,3 s, p90 ≤ 2,5 s): hoy 1,09 / 1,71 s en la sonda (con texto como entrada; con voz se suma el fin de turno de 1,3 s, que es a propósito). Un turno con `get_section` puede sumar hasta 1 s; la landing midió +280 ms de mediana para un `show` antes de la voz (3.046 contra 2.765 ms). El tamaño del instruction (10k contra 38k) mueve poco el primer audio (landing: −230 ms p50 y −1,2 s p90 con notas bajo demanda).

**Qué se instrumenta** (eventos al cliente y a `voice_session_events`, sin texto): `mic_click`, `token_ready`, `socket_open`, `setup_complete`, `mic_capturing`, `opener_sent`, `first_audio`, y por turno `input_transcription_first`, `turn_complete`, `first_audio_after_user`, `tool_call {name, before_voice}`, `usage {prompt_tokens, audio_tokens}`, `socket_close {code, reason}`, `swap {reason, ms}`. Con eso la sesión `d14a09c0` se hubiera explicado en una consulta.

### 3.7 Costo por sesión

Fórmula (precios de 3.8 Live pago, sección 2): por turno se relee instruction + historial de texto a US$ 0,75 / M y el historial de audio a 3,00 / M; la salida de audio cuesta 0,018 por minuto. Supuestos de una sesión típica del dueño: `a94efc5c`, 441 s, 18 turnos del tutor (consulta B); el audio de toda la charla queda en el contexto a 25 tokens/s ("retains conversational history as raw audio tokens", best practices), así que al final son ~11k tokens y en promedio ~5,5k; el tutor habla unos 3 minutos. Son **estimaciones**: el número real sale de `usageMetadata` desde la fase 0.

| Brazo | Instruction | Texto releído (18 turnos) | Audio releído | Salida | Total |
|---|---:|---:|---:|---:|---:|
| Hoy (una sección) | 4,0k | 72k → 0,054 | 99k → 0,30 | 0,054 | **≈ US$ 0,41** |
| A: lección entera | 37,4k | 673k → 0,50 | 0,30 | 0,054 | **≈ US$ 0,86** |
| B: mapa + foco + 1 sección inyectada | 7,4k + 2,4k | 176k → 0,13 | 0,30 | 0,054 | **≈ US$ 0,49** |

Lo que más pesa no es la lección: es el **audio del historial**. Por eso el cambio de conexión por umbral (4.1) vale también en charlas cortas: reemplazar 11k tokens de audio por la transcripción en texto (los 6.287 caracteres de `a94efc5c` son ~1,9k tokens) baja ese término a la cuarta parte desde el cambio. La landing midió la mitad del costo total con el rebuild de texto (sección 2).

Topes que ya existen y siguen: sesiones y segundos de voz por día por usuario (`src/lib/api/rate-limit.ts:17-81`).

## 4. Robustez

### 4.1 Cambio de conexión antes del límite, sin perder memoria

Cuándo (lo primero que pase): **8 min** de edad de la conexión (la landing: 3.8 cerró a los 10:00 sin GoAway; ocho dejan dos para el turno en vuelo, `useOverviewLiveSession.ts:768-777`); `promptTokenCount` de `usageMetadata` ≥ **20k**; 3 secciones inyectadas; GoAway. Nunca en medio de una respuesta: se hace en el `turnComplete` del tutor. Gemini manda el audio más rápido que tiempo real, así que en ese momento todavía suena la pregunta: el cambio (1,1 a 1,8 s en la landing) queda debajo de la voz.

Cómo:

1. Token nuevo (ya se pide uno por reconexión).
2. Instruction rearmado: mismo mapa, la sección en foco **actual** (la que la charla toca ahora), brief con la evidencia de esta sesión hasta acá sumada en el cliente (las líneas que el detector marcó) y una línea "Esta charla sigue de una conexión anterior: no saludes ni la resumas".
3. Seed: la charla de esta sesión como turnos de texto con roles (`sendClientContent`, 3.8 acepta `user` y `model` en toda la sesión) más las notas ya leídas, con `turnComplete: false`. Es el `liveConnectionSeed` de la landing (`overviewLiveConversation.ts:633-645`). Tope del seed: 16k caracteres de charla, los turnos más nuevos primero (landing, `OVERVIEW_LIVE_SEED_HISTORY_MAX_CHARS`); lo más viejo ya está en el brief.
4. El micrófono no se corta: mientras el socket nuevo no terminó el setup, el PCM se guarda en un buffer (hasta 5 s) y se manda al abrir. Si el alumno empezó a hablar, el modelo lo oye completo.
5. El socket viejo se cierra después de que el nuevo terminó el setup (nunca dos generando a la vez).

Ante un cierre inesperado (1011, red): el mismo camino, sin reanudar con handle en 3.8 (la capa 1 queda solo para 2.5 si se vuelve a usar, por `live-models.ts`). Si el turno del alumno quedó sin respuesta, el seed termina en su pregunta y se manda con `turnComplete: true` para que la conteste.

`contextWindowCompression` no se usa: en 3.8 el setup lo acepta pero no evitó el cierre a los 14 min (`gemini-live.ts:177-183`), y su ventana deslizante borra el principio de la charla, que es justo lo que el alumno quiere que el tutor recuerde (`overviewLiveContextBudget.ts:13-17`).

### 4.2 Garantías de persistencia

Lo que se garantiza y cómo:

| Garantía | Mecanismo |
|---|---|
| Cada enunciado llega una vez | `client_turn_id` = `${sessionId}-${seq}` con índice único **no parcial** (migración 5.1); `upsert ... ignoreDuplicates`. Los reintentos dejan de duplicar. |
| Nada se pierde al cortar o cerrar la pestaña | `TranscriptOutbox` (`5d9572d`): drena antes de `end`, `pagehide` con `keepalive`. Además (nuevo): la cola pendiente se copia a `localStorage` por sesión con su token de escritura (vale 8 h, `session-write-token.ts:3`), y la próxima carga de `/learn` la reenvía. |
| El puntaje y el digest leen la charla completa | `end` y el digest esperan: el cliente manda en `end` cuántos enunciados produjo (`diag.utterances`); si la base tiene menos, el digest espera hasta 3 s y reintenta, y lo deja `pending` si sigue faltando. En Ensayar, el puntaje arranca después de que `disconnect` resuelve el drenaje, no en el mismo tick. |
| Toda sesión se cierra | `end` al cortar; si no llega, el contexto de la próxima sesión del usuario cierra las abiertas sin actividad hace 15 min (`last_activity_at`, que actualiza cada lote de transcripción). |
| Toda sesión con charla entra en la memoria | `digest_status` con reintentos (3.4). |
| Se puede explicar una sesión rara | `voice_session_events` (3.6) y `diag` en `end`. |

### 4.3 Modos de falla

| Falla | Qué ve el alumno | Qué hace el sistema |
|---|---|---|
| Token o `session/start` fallan | "No pude conectar. Reintentar" en el panel | Error honesto, sin sesión colgada; evento `start_failed` |
| Socket cierra a mitad de una respuesta (1011) | Un corte de 1 a 2 s y el tutor retoma la pregunta | Cambio de conexión de 4.1 con la pregunta pendiente al final del seed |
| Cuota (1011 "exceeded your current quota") | "El tutor está saturado, en un minuto vuelve" | Espera 60 s una vez y reintenta (patrón de la landing, `quotaWait.ts`); no entra en loop; evento con el texto del cierre |
| El modelo llama una tool y no habla | Silencio | A los 4 s, turno de texto que pide la voz (3.5) |
| `get_section` con un número que no existe | Nada | `{ error: 'no such section', sections: 15 }`; el modelo usa el mapa |
| El detector inyecta una sección equivocada | Nada | Cuesta ~2,4k tokens por turno hasta el próximo cambio; el tope de 3 lo acota |
| Digest falla | Nada en la charla; la próxima sesión no la recuerda todavía | `pending` y reintento al pedir contexto; `failed` a los 3 intentos, visible en un reporte |
| El brief dice algo falso (el digest malinterpretó) | El tutor le atribuye algo que no dijo | Cada recuerdo cita `quote` y `transcript_seq`; el tutor lo dice como pregunta ("la otra vez me dijiste X, ¿sigue así?"), no como hecho; eval específico (sección 7) |
| Tab cerrada a mitad | Nada | Cola en `localStorage`, reenvío en la próxima carga; cierre por inactividad |
| Micrófono sin permiso o sin audio | "No te escucho: revisá el micrófono" | `mic_capturing` nunca llega o el nivel queda en 0 por 10 s → aviso (los eventos de 3.6 lo detectan) |

## 5. Cambios de datos (propuesta de migración, no aplicada)

Archivo propuesto: `supabase/migrations/20261119010000_tutor_memory.sql`. Se aplica después de revisar el lockdown de RLS pendiente (`20261118010000_rls_lockdown.sql`, también sin aplicar).

```sql
-- 5.1 Transcripts: idempotency that actually works.
-- The partial unique index cannot back PostgREST's ON CONFLICT (session_id, client_turn_id).
-- A plain unique index allows the legacy NULL rows (NULLs are distinct) and backs the upsert.
DROP INDEX IF EXISTS idx_voice_transcripts_session_turn_id;  -- created in 20260303150000
CREATE UNIQUE INDEX voice_transcripts_session_turn_uniq
  ON voice_transcripts (session_id, client_turn_id);
ALTER TABLE voice_transcripts
  ADD COLUMN IF NOT EXISTS connection_seq smallint;      -- which socket of the session said it

-- 5.2 Sessions: what was asked of the tutor, and the durable digest.
ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS focus_section_id uuid REFERENCES resource_sections(id),
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS usage jsonb,                  -- summed usageMetadata, cost estimate
  ADD COLUMN IF NOT EXISTS digest_status text NOT NULL DEFAULT 'none'
    CHECK (digest_status IN ('none','pending','running','done','failed')),
  ADD COLUMN IF NOT EXISTS digest_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS digest_version smallint;
CREATE INDEX IF NOT EXISTS voice_sessions_user_digest
  ON voice_sessions (user_id, digest_status) WHERE digest_status IN ('pending','running');
CREATE INDEX IF NOT EXISTS voice_sessions_user_open
  ON voice_sessions (user_id) WHERE ended_at IS NULL;

-- 5.3 Client events, no conversation text.
CREATE TABLE voice_session_events (
  id bigserial PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seq integer NOT NULL,
  at timestamptz NOT NULL,
  kind text NOT NULL,          -- mic_click, setup_complete, first_audio, tool_call, socket_close, swap...
  data jsonb,                  -- numbers and codes only
  UNIQUE (session_id, seq)
);
ALTER TABLE voice_session_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_events ON voice_session_events FOR SELECT USING (user_id = auth.uid());
-- writes go through the route with the session write token (admin client), like transcripts

-- 5.4 Evidence: what the learner showed, line by line.
CREATE TABLE learner_evidence (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id text NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  section_id uuid REFERENCES resource_sections(id) ON DELETE SET NULL,
  concept_id text REFERENCES concepts(id) ON DELETE SET NULL,
  session_id uuid REFERENCES voice_sessions(id) ON DELETE CASCADE,
  transcript_seq integer,
  source text NOT NULL CHECK (source IN ('voice','quiz','exercise','drill','eval')),
  kind text NOT NULL CHECK (kind IN ('explained','misconception','gap','asked_help',
                                     'tutor_question','preference','english')),
  verdict text CHECK (verdict IN ('correct','partial','wrong','unknown')),
  resolved boolean,
  statement text NOT NULL CHECK (char_length(statement) <= 300),
  quote text CHECK (char_length(quote) <= 200),
  at timestamptz NOT NULL,
  digest_version smallint
);
CREATE INDEX learner_evidence_user_resource ON learner_evidence (user_id, resource_id, at DESC);
CREATE INDEX learner_evidence_user_concept ON learner_evidence (user_id, concept_id, at DESC);
ALTER TABLE learner_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_evidence ON learner_evidence FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5.5 Concept state: the existing owner of misconceptions/strengths gets the derived state.
ALTER TABLE learner_concept_memory
  ADD COLUMN IF NOT EXISTS mastery smallint CHECK (mastery BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS asked_questions jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS resolved_misconceptions text[] NOT NULL DEFAULT '{}';

-- 5.6 Lesson map for the tutor (content, public read like resource_sections).
CREATE TABLE lesson_tutor_maps (
  resource_id text PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
  content_hash text NOT NULL,          -- hash of the sections' markdown it was built from
  map jsonb NOT NULL,                  -- [{ n, section_id, title, ideas[], terms[], deepened_in[] }]
  built_at timestamptz NOT NULL DEFAULT now(),
  built_with text                      -- model and prompt version
);
ALTER TABLE lesson_tutor_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_maps ON lesson_tutor_maps FOR SELECT USING (true);

-- 5.7 (phase 5) Drill results, off localStorage.
-- CREATE TABLE drill_results (user_id, resource_id, drill_slug, mode, score, at, ...)
```

El índice viejo es `idx_voice_transcripts_session_turn_id` (`20260303150000_voice_transcript_idempotency.sql:11-13`). Las filas viejas con `client_turn_id` nulo quedan como están.

## 6. Plan por fases

Cada fase termina en algo que el dueño prueba en `/learn/3y-health-tecnica-v2` y en un número antes y después. El encargo de cada fase lleva la frase: *si tu medición contradice este plan, el plan es la hipótesis y gana tu medición.*

**Fase 0 · Red y medición** (sin cambio visible para el alumno)
- Migración 5.1 (índice único no parcial) y 5.3 (eventos); la ruta de eventos con el token de escritura.
- `after()` para el resumen de hoy en `end/route.ts`; cierre de sesiones abiertas por inactividad.
- Leer `usageMetadata` en `gemini-live.ts` y mandarlo como evento; los eventos de 3.6.
- Sobre el `TranscriptOutbox` de `5d9572d`, sumar la copia en `localStorage` y persistir los contadores `diag` en `voice_session_events`.
- Línea base con la sonda (sección 7) sobre `3y-health-tecnica-v2`, sección Two Sum, con el prompt de HEAD (ya con las reglas de `f3bebbb`).
- Listo cuando: una sesión cerrada con la pestaña aparece entera en la base; 0 duplicados con reintentos forzados; una consulta explica cualquier sesión de una línea.

**Fase 1 · La lección entera en el tutor de sección**
- `VoicePanel` recibe `lessonTitle` y `lessonSections` desde `learn-flow` (ya los tiene) y `conceptIds` de la lección.
- Brazo A: `lessonForPrompt` con presupuesto de 120k caracteres (la lección entera). Brazo B: mapa simple (título y primeras oraciones, sin precomputar) + foco entero. Elegir con la sonda.
- Regla de referencias de `01` §4.6 en el prompt.
- Listo cuando: en Two Sum, "no entiendo Big-O" recibe "eso es la 2, Big-O" con el contenido correcto; "¿y cómo se hace LRU?" recibe "lo vemos en la 15" y una línea.

**Fase 2 · Memoria del alumno**
- Migraciones 5.2, 5.4 y 5.5. Digest JSON (DeepSeek, mismo presupuesto que el resumen) con esquema Zod; reglas de `mastery.ts`; `buildLearnerBrief`.
- `/api/voice/tutor/context` devuelve mapa, brief e historial en una lectura.
- Reemplaza el resumen de prosa en el prompt (el resumen queda para la UI, si se usa).
- Listo cuando: la repetición de `d14a09c0` no pasa (eval de memoria, sección 7); el tutor nombra un error de otra sesión con sus palabras.

**Fase 3 · Notas bajo demanda y tools** (solo si la fase 1 eligió B, o si A no entra en el tier)
- Migración 5.6 y el script que construye el mapa al sembrar la lección (`scripts/seed-lesson.ts`).
- Detector de sección, inyección con `turnComplete: false`, tope de 3 por conexión.
- `get_section`, `get_my_history`, `go_to_section` con el chip en la transcripción en vivo; red de seguridad de 4 s y tope de 2 llamadas por turno.
- Listo cuando: los plantados de la sección 7 pasan igual que con A y los tokens por turno bajan.

**Fase 4 · Rápido y largo**
- Preconexión del socket al abrir el panel; micrófono en paralelo.
- Cambio de conexión propio (4.1) con seed y buffer del micrófono; fuera la capa 1 en 3.8.
- Listo cuando: clic → primer audio p50 ≤ 2,5 s medido con eventos en 10 sesiones; una charla de 20 min sin corte audible y con memoria de lo del minuto 2 en el minuto 18.

**Fase 5 · Un solo motor**
- Ensayar usa el mismo motor que el tutor de sección con foco "lección entera" (el recorrido arranca por lo flojo del brief); se va `buildPracticeMode` y su "sin ayuda, sin pistas". `mark_discussed` lo reemplaza el digest.
- `drill_results` y lectura de quizzes en el brief.

## 7. Plan de tests y eval

**Sin red** (vitest, como `src/lib/voice/__tests__/`):

| Test | Qué guarda |
|---|---|
| `lesson-map.test.ts` | El mapa de `3y-health-tecnica-v2` (fixture) entra en 2.500 tokens estimados; cada sección tiene número, título e ideas; los términos de una sección no se repiten como término de otra sin `deepened_in`. |
| `instruction-budget.test.ts` | Instruction armado ≤ 10k tokens estimados (típico 7,4k) con la sección más larga en foco y el brief al tope. |
| `section-detector.test.ts` | "no entiendo Big-O" → 2; "lo de las islas" → 6; "la sección cinco" → 5; "o de n" sin más → nada (no confundir notación con la sección). Frases sacadas de las charlas del 18/11. |
| `learner-brief.test.ts` | Orden (sin resolver primero), tope de 600, preguntas ya hechas de la sección en foco presentes, nada de otro usuario (el builder recibe solo filas del usuario). |
| `mastery.test.ts` | Las reglas de 3.3, con fechas. |
| `connection-seed.test.ts` | Seed = charla en turnos con roles + notas leídas; tope de 16k caracteres por el lado más viejo; la pregunta sin respuesta queda al final. |
| `transcript-outbox.test.ts` (existe) | Más: reenvío desde `localStorage` en la próxima carga; el mismo `client_turn_id` dos veces no duplica (con un fake de la ruta). |
| `tool-handler.test.ts` | `get_section` fuera de rango; segunda llamada a la misma sección → `already_in_context`; tercera llamada del turno → `answer now`. |
| `digest-schema.test.ts` | El JSON del digest sobre la transcripción de `a94efc5c` (fixture, sin red: respuesta grabada) produce la evidencia esperada: el error "clave = índice" resuelto, la pregunta del complemento hecha y contestada. |

**Con Gemini real** (a mano, la sonda que ya existe: `scripts/probe-voice-tutor.ts`; costo de centavos por corrida; no más de dos sesiones a la vez). Plantados nuevos, en la línea de los de `01` §5:

| Plantado | Qué tiene que pasar | Métrica |
|---|---|---|
| `refers_earlier_section` | En Two Sum: "no me acuerdo qué era O de n al cuadrado" | Nombra la 2 y explica bien |
| `refers_later_section` | En Two Sum: "¿y LRU cómo se hace?" | "Lo vemos en la 15" y a lo sumo dos oraciones |
| `wrong_fact_other_section` | Afirmación falsa sobre la 7 (Merge Intervals) | La corrige con el contenido de la 7 (brazo B: requiere inyección o tool) |
| `cross_session_repeat` | Brief con "ya contestó por qué chequear antes de insertar" | No hace esa pregunta (la falla de `d14a09c0`) |
| `cross_session_misconception` | Brief con "dijo n log n para dos for" | Lo retoma con sus palabras, como pregunta |
| `false_memory_guard` | Brief vacío; el alumno dice "ya te lo expliqué la otra vez" | No inventa lo que dijo |
| `asks_go_to` | "llevame a la sección 2" | `go_to_section(2, learner_asked)` y sigue hablando |

Métricas por brazo (A, B, y HEAD como base): `addresses_plant`, `section_pointer_correct`, `repeat_question_rate`, `invented_memory`, primer audio p50 y p90, tokens por turno (`usageMetadata`), costo por sesión, turnos mudos. Reemplazo de las charlas reales: las tres del 18/11 como fixtures (los turnos del alumno como texto, `--replay`), como hace la landing con `replay_session_runtime.mjs`.

**Navegador con Gemini simulado** (Playwright, el `e2e/` que está naciendo): cambio de conexión forzado a los 20 s (`?tutorSwapAfterMs=`) sin perder enunciados ni la pregunta pendiente; pestaña cerrada a mitad y recarga que reenvía; la sesión aparece cerrada y con digest.

**Aceptación del dueño** (el artefacto es el juez): en `/learn/3y-health-tecnica-v2`, sección Two Sum, abrir el tutor y decir "no entiendo lo de n al cuadrado" → el tutor dice que es la 2 y lo explica; al día siguiente, en la misma sección, no le pregunta lo que ya contestó y retoma lo que le salió mal con sus palabras.

## 8. Lo que no se sabe y decisiones del dueño

- **El tier y el límite de la clave de Gemini de Jarre** (free o pago; tokens por minuto de `gemini-3.8-live`). Decide si el brazo A es viable. Se ve gratis en AI Studio → Rate limits del proyecto.
- **Por qué `d14a09c0` guardó una línea.** Inverificable con lo guardado; la fase 0 lo hace verificable.
- **Cuántos tokens por turno lee de verdad el tutor.** Jarre no lee `usageMetadata` hoy; los costos de 3.7 son estimaciones con la fórmula de las docs.
- **Si el audio del alumno queda en el contexto** igual que el del modelo. Las docs dicen "conversational history as raw audio tokens" sin separar; `usageMetadata` lo va a mostrar.
- **Decisión del dueño, una sola:** si el tutor puede navegar la pantalla por su cuenta (`go_to_section` con `review`) o solo ofrecer el chip. El plan propone el chip; navegar solo cuando él lo pide.

## Apéndice: cómo repetir las mediciones

Todas de solo lectura, con `.env.local` de Jarre. Ninguna gasta: `countTokens` es gratis y las consultas son a la base propia.

**A. Tokens** (`gemini-3.8-live` no acepta `countTokens`; se usa el tokenizador de `gemini-3.8-flash`, de la misma familia):

```ts
// npx tsx --env-file=.env.local <archivo>.ts  (envuelto en async main)
const one = buildLearningSession({ language: 'es', lesson: { title: s[2].title, sections: [s[2]] }, focusSectionIndex: 0, bilingual: true });
await ai.models.countTokens({ model: 'gemini-3.8-flash', contents: [{ role: 'user', parts: [{ text: one.instruction }] }] });
```

Resultado del 2026-11-18. Las primeras filas se midieron sobre `0e38ea6` (antes de `f3bebbb`); las de HEAD `5d9572d` van al final:

| Texto | Caracteres | Tokens | Caracteres por token |
|---|---:|---:|---:|
| `0e38ea6`: instruction, solo Two Sum | 12.432 | 3.319 | 3,75 |
| `0e38ea6`: `lessonForPrompt` con la lección entera (presupuesto 48k) | 56.170 | 15.835 | 3,55 |
| Las 15 secciones crudas | 117.346 | 35.185 | 3,34 |
| Mapa: título + 300 caracteres por sección | 5.233 | 1.318 | 3,97 |

| HEAD: instruction de hoy, solo Two Sum | 15.334 | 3.978 | 3,85 |
| HEAD: solo reglas (sección vacía, con la bilingüe) | 9.390 | 2.185 | 4,30 |
| HEAD: reglas + las 15 secciones crudas (brazo A) | 126.736 | 37.369 | 3,39 |

Secciones: mínimo 5.510, mediana 7.975, máximo 9.938 caracteres.

**B. Sesiones y transcripciones**

```sql
select s.id, s.session_type, s.section_id, s.started_at, s.ended_at, s.duration_seconds,
       count(t.id) as rows, count(t.id) filter (where t.role = 'user') as user_rows,
       count(t.client_turn_id) as with_turn_id, s.cached_summary is not null as has_summary
from voice_sessions s left join voice_transcripts t on t.session_id = s.id
where s.started_at >= '2026-11-11'
group by s.id order by s.started_at;
```

**C. Memoria por concepto de la lección**

```sql
select count(*) from learner_concept_memory m
join resource_sections rs on rs.concept_id = m.concept_id
where rs.resource_id = '3y-health-tecnica-v2';   -- 0 el 2026-11-18
```

**D. Los resúmenes de las tres charlas del 18/11**

```sql
select id, cached_summary from voice_sessions where started_at >= '2026-11-18T20:50';
```
