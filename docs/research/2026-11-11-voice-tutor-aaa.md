# Tutor de voz AAA

2026-11-11. Lo que dijo el dueño, qué pasaba de verdad, qué hace la competencia, qué cambiamos y cuánto mejoró, medido.

## Lo que dijo el dueño

> "Me gusta que me pregunte para ver si aprendí el contenido, pero es medio tonto, como que no me escucha, repite lo que dije, no sé."

> "Sí me escucha el audio, solo que es medio pelotudo, en el sentido que parece que ignora lo que digo."

> "Un formato entrevista al final de la lección sería excelente, con distintos niveles y profundidades: un recruiter curioso, uno técnico, uno experto, uno preocupado, uno relajado, etc."

## Qué pasaba de verdad

Las transcripciones de sus sesiones están en `voice_transcripts`. Dos lo muestran entero:

- **6d3d5145** (hoy, lección Brivel, sección RLS, 197 s). En el turno 5 el tutor dijo en voz alta "RAZONAMIENTO INTERNO (CRÍTICO): 1. El estudiante identificó correctamente…" antes de su respuesta. Cada turno arrancaba con "Exacto" o "Claro" y devolvía la respuesta del alumno con otras palabras ("Exacto, valida en cada consulta"). Cerró a los tres minutos, después de cinco preguntas, todas sobre una sola sección y casi todas "el texto dice…".
- **8f84e3d0** (marzo, vectores, 411 s). "INTERNAL THOUGHT: 1. …" dicho en voz alta tres veces. El tutor volvió a preguntar por las operaciones de un espacio vectorial después de que el dueño las había dicho, y el dueño contestó: "La suma y la multiplicación, ya te lo dije, no me estás escuchando, me parece". Cuando dijo "Porque" y pensó, el tutor arrancó a hablar ("Seguí, ¿qué").

Las causas, en el código de ese momento:

1. El prompt (`src/lib/llm/voice-prompts.ts`) pedía "INTERNAL REASONING before EVERY response" que "must be silent". Un modelo de audio nativo no piensa en silencio: lo que escribe, lo dice.
2. El mismo prompt pedía "REVOICING: mirror it back more precisely: 'So what you're saying is…'". Eso es literalmente repetir lo que dijo el alumno.
3. El tutor recibía solo la sección abierta (`sectionContent`), no la lección. No podía preguntar sobre lo demás, y citaba "el texto".
4. Ninguna regla le decía que su respuesta parta de lo que el alumno dijo: el prompt describía modos y escaleras, no qué hacer con el error concreto, el detalle bueno o la parte que falta.
5. El fin de turno era el default de la API (`END_SENSITIVITY_HIGH`, unos 800 ms de silencio): una pausa para pensar le cedía el turno al tutor.
6. Las transcripciones se guardaban un fragmento por fila y con `trim()`, así que la base tenía "con sul ta" y "Ser vice Bra wl". Eso es lo que leen el puntaje de práctica y evaluación y el contexto de una reconexión.

Y uno más que no se veía todavía: `gemini-2.5-flash-native-audio-preview-12-2025` se apaga el 2026-11-17 (ai.google.dev/gemini-api/docs/deprecations). Pasar a 3.8 con el prompt viejo tampoco servía: en la medición, el tutor viejo sobre 3.8 dijo "Session complete" después de la primera respuesta (tabla de abajo).

## Qué hace la competencia

Fuentes de 2025 y 2026. Donde no hubo fuente, no se afirma.

| Quién | Mecanismo concreto | Qué hacemos | Por qué |
|---|---|---|---|
| Google, Live API best practices (aistudio.google.com/docs/live-api/best-practices) | El prompt va en orden persona, reglas de conversación, guardrails. El ejemplo oficial dice "Don't repeat back what the client says back to them" y "Each response you give should be a net new addition to the conversation, not a recap of what the client said". Ancla de idioma: "RESPOND IN {LANG}. YOU MUST RESPOND UNMISTAKABLY IN {LANG}." | **Adoptado** tal cual | Es la queja del dueño, escrita por el dueño del modelo. |
| Google, Live API reference y capabilities (aistudio.google.com/api-reference/live, aistudio.google.com/docs/live-api/capabilities) | `automaticActivityDetection`: `endOfSpeechSensitivity` (default `END_SENSITIVITY_HIGH`), `silenceDurationMs` (default interno de unos 800 ms). 3.8 Live: sin control de thinking, proactive audio siempre prendido, sin affective dialog. `custom_vocabulary` en la transcripción. | **Adoptado** el fin de turno (LOW, 1300 ms y 1700 ms en la entrevista). **Postergado** `custom_vocabulary`. | El fin de turno está medido abajo. El vocabulario solo cambia la transcripción que se muestra, no lo que el modelo oye. |
| ChatGPT Study mode (simonwillison.net/2025/Jul/29/openai-introducing-study-mode; prompt extraído en gist.github.com/simonw/33d5fb67d6b8e1b1e2f6921ab0ccb9fb, no confirmado por OpenAI) | "One question at a time!", también en los quizzes. Guiar sin dar la respuesta. Después de lo difícil, que el alumno lo reformule o lo use. Variar el ritmo. | **Adoptado**: una pregunta por turno, al final. Preguntas aplicadas en vez de "qué dice el texto". | La línea base hacía dos preguntas en un turno y a veces ninguna. |
| OpenAI, guía de prompting Realtime (developers.openai.com/cookbook/examples/realtime_prompting_guide) | Regla de variedad contra la repetición robótica. "The model strongly closely follows sample phrases". | **Adaptado**: prohibido abrir con un veredicto ("Exacto", "Perfecto", "Impecable"), sin frases de ejemplo para copiar. | Con una lista corta de aperturas prohibidas el modelo usaba la que no estaba ("Impecable"); medido en v1 contra v2. |
| Google LearnLM, marco pedagógico (services.google.com/fh/files/misc/googlespedagogicalframework.pdf) y Guided Learning (blog.google/outreach-initiatives/education/guided-learning/, 2025-08-06) | Retrieval practice. Pistas graduadas "contingent on the learner's specific error". Desafíos calibrados y andamiaje que se retira. No dar la respuesta demasiado rápido. | **Adoptado**: cada tipo de respuesta tiene su movida (error concreto, parcial, completa, "no sé", pregunta). Dificultad que sube tras dos aciertos y baja tras un error. | Es la parte de "reacciona a lo que dije". |
| Duolingo Video Call (blog.duolingo.com/ai-and-video-call, 2025; blog.duolingo.com/product-highlights/, 2025-12) | Nivel del alumno en el prompt. La primera pregunta se genera aparte para controlar la dificultad. Un supervisor que susurra "reformulá" a mitad de la llamada. Memoria: al final, "¿qué aprendimos del usuario?" y eso va a la próxima llamada. Push-to-talk para que Lily no interrumpa. | **Adaptado**: la memoria ya existía (`learner-memory`, resumen previo) y ahora entra al prompt nuevo. **Postergado**: supervisor por turno y push-to-talk. | El supervisor es un segundo modelo por turno; primero vale ver si el prompt alcanza. El fin de turno LOW resolvió la interrupción sin pedir un botón. |
| Praktika (openai.com/index/praktika, 2026-01-22) | Varios agentes: lección, supervisor, seguimiento de errores recurrentes. Memoria de largo plazo, consultada cuando el alumno terminó de hablar. +24 % de retención el día 1. | **Postergado** | Mismo argumento que el supervisor de Duolingo. |
| Investigación en feedback correctivo (Sun et al. 2026, journals.sagepub.com/doi/abs/10.1177/13621688261499464; AIED 2026, arxiv.org/abs/2604.05702) | El feedback correctivo oral funciona (g = 0,92 global; recasts 0,70). En chatbots de práctica oral, más progreso con feedback de tipo prompting y ubicado después de la respuesta. | **Adoptado** en la entrevista: feedback después de cada respuesta, nunca interrumpiendo; cada corrección como "dijiste…, decí…" (recast explícito), a lo sumo tres. | Corregir todo abruma; las tres que nota un nativo es lo que cambia la llamada real. |
| Interview Warmup de Google (grow.google/interview-warmup) y Huru (huru.ai) | Pregunta, respuesta, feedback estructurado; la próxima pregunta según la respuesta anterior. | **Adoptado**: ciclo pregunta, respuesta entera, feedback, próxima pregunta o repregunta según la profundidad. | Es el formato que pidió el dueño. |
| Khanmigo (chalkbeat.org/2026/08/25/ai-tutoring-students-khanmigo-khan-academy-engagement-study/) | RCT: acceso casi universal, uso flojo; el rediseño mete a la IA dentro del contenido y hace más difícil saltearse el esfuerzo. | **Adaptado**: la entrevista vive al final de la lección (pestaña Entrevista de la práctica, paso APLICAR), no en un menú aparte. | |
| Speak, Synthesis, Yoodli, Final Round | Sin fuentes de 2025 o 2026 que describan su mecanismo de voz o corrección. | Nada | No se inventa. |

Chrome y el eco: `echoCancellation` acepta `"all"` desde Chrome 141 (groups.google.com/a/chromium.org/g/blink-dev/c/x5nfoaUAUWY), pero no hay fuente que confirme que cancela el audio de WebAudio en la práctica. Las transcripciones del dueño no muestran al tutor oyéndose a sí mismo, y el dueño dice que el audio anda: no se tocó.

### Los cinco mecanismos adoptados

1. **Nada de devolverle al alumno lo que dijo**: cada turno es algo nuevo (Google, Live API best practices).
2. **La primera oración prueba que escuchó**: parte del error concreto, del detalle bueno o de la parte que falta, nombrado; y la pregunta crece de esa respuesta (LearnLM: pistas "contingent on the learner's specific error").
3. **Una sola pregunta por turno, al final, aplicada** (ChatGPT Study mode), con la lección entera como clave de corrección.
4. **Dejarlo terminar**: fin de turno `END_SENSITIVITY_LOW` con 1300 ms (1700 ms en la entrevista), en vez del default que cortaba a mitad de una idea.
5. **Feedback después de la respuesta, específico y corto** en la entrevista: lo que funcionó, lo que no cierra contra la lección y hasta tres correcciones de inglés como "dijiste…, decí…" (investigación de feedback correctivo, Interview Warmup).

## Cómo se mide

`scripts/probe-voice-tutor.ts` abre una sesión Live real con el prompt que arma la app, sobre la lección `interview-brivel-call` leída de la base como la lee la app. El alumno es DeepSeek haciendo de Nicolás: contesta la última pregunta del tutor y cada turno lleva algo plantado que el tutor tiene que tomar:

- `specific_good_point`: un detalle correcto y no obvio que el tutor no mencionó.
- `specific_error`: una afirmación concreta que contradice la lección.
- `partial`: la mitad de la respuesta; falta un elemento que la lección pide.
- `preempts_next`: contesta y además explica el concepto que venía después.
- `dont_know`: "no sé".
- `asks_back`: una pregunta al tutor.

El alumno entra como texto (`sendClientContent`): el dueño confirmó que el audio lo oye bien, el defecto es qué hace el tutor con el contenido. Un juez (DeepSeek, temperatura 0) lee la lección, la charla y lo plantado y puntúa la respuesta siguiente. La métrica principal es `addresses_plant`: la respuesta toma eso puntual. Un turno mudo cuenta 0 aunque el juez diga otra cosa, y el turno que sigue a uno que no terminó en 40 s queda afuera (su respuesta puede ser la del turno anterior). Latencia: del envío al primer audio.

Dos corridas de ocho turnos por condición. Es poco: sirve para ver diferencias grandes, no de cinco puntos.

Para repetirlo (cada corrida abre sesiones Live pagas; centavos):

```
npx tsx scripts/probe-voice-tutor.ts --label <nombre> --model gemini-3.8-live --prompt current --runs 2 --turns 8
npx tsx scripts/probe-voice-tutor.ts --label <nombre> --model gemini-2.5-flash-native-audio-preview-12-2025 --prompt legacy
npx tsx scripts/probe-voice-tutor.ts --label <nombre> --mode interview --persona nathalie --depth 2 --runs 1 \
  --interview-json ~/Desktop/demaria/50-aprender/entrevistas/2026-11-brivel/leccion-brivel.json
npx tsx scripts/probe-voice-tutor.ts --resummarize docs/research/voice-probe/<archivo>.json [--mode interview]
npx tsx scripts/probe-voice-turn-taking.ts --pause 1.5 --reps 2
```

No conviene correr más de dos sesiones a la vez: con tres, una cerró con 1011 por cuota.

## Antes y después

Cada fila es un archivo de `docs/research/voice-probe/`. "Antes" es lo que corría hasta hoy; "solo migrar" es el prompt viejo sobre 3.8; v1 a v3 son las iteraciones del prompt nuevo (v3 es el que quedó, más una línea que pide decir "session complete" en inglés también hablando castellano).

| | Antes: 2.5 + prompt viejo | Solo migrar: 3.8 + prompt viejo | 3.8 + v1 | 3.8 + v2 | **3.8 + v3** |
|---|---|---|---|---|---|
| Archivo | `2026-11-11-before-2.5-legacy` | `…-ablation-3.8-legacy` | `…-after-3.8-current` | `…-after-3.8-current-v2` | `…-after-3.8-current-v3` |
| **Toma lo plantado** (principal) | 0,50 | 0,56 | 0,56 | 0,69 | **0,81** |
| · detalle bueno | 0,50 | 0,75 | 0,25 | 0,75 | 1,00 |
| · error concreto | 0,75 | 0,25 | 1,00 | 0,75 | 0,75 |
| · respuesta parcial | 0 | 0,50 | 0 | 0 | 0 |
| · ya contestó lo que venía | 0 | 0,50 | 0 | 0,50 | 1,00 |
| · "no sé" | 1,00 | 0,50 | 1,00 | 1,00 | 1,00 |
| · pregunta del alumno | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 |
| Le devuelve lo que dijo | 0,21 | 0,13 | 0 | 0 | **0** |
| Abre con un veredicto genérico | 0,43 | 0,44 | 0,50 | 0,25 | **0,13** |
| Pregunta lo ya contestado | 0,14 | 0 | 0 | 0 | 0 |
| Exactamente una pregunta | 0,57 | 0,19 | 1,00 | 0,94 | **1,00** |
| Acepta un error | 0,07 | 0,19 | 0 | 0,06 | 0,06 |
| Error de contenido propio | 0 | 0 | 0 | 0 | 0 |
| Turnos mudos / sin terminar en 40 s (de la sonda) | 2 / 2 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Primer audio p50 / p90 (ms) | 4418 / 6281 | 1128 / 1460 | 966 / 1640 | 1116 / 1519 | **1089 / 1709** |
| Palabras por respuesta | 62 | 28 | 37 | 41 | 37 |
| Dijo "session complete" (turno, por corrida) | 5 y 3 | **1** y 3 | nunca | 8 | nunca en 8 |

Lo que dice la tabla:

- **Solo migrar no alcanzaba.** El prompt viejo sobre 3.8 cerró la sesión después de la primera respuesta en una corrida y de la tercera en la otra: con una sola sección, se queda sin tema enseguida. Y aceptó errores en el 19 % de los turnos.
- **El prompt nuevo saca el eco y ordena las preguntas** desde v1: 0 % de eco y una pregunta por turno. Lo que costó tres vueltas es que la primera oración pruebe que escuchó: v1 abría con "Impecable" (que no estaba en la lista prohibida) y cambiaba de tema; v2 pidió que la primera oración reaccione a lo puntual y que la pregunta crezca de la respuesta; v3 le dio la lección como clave de corrección y que se quede en una idea hasta cubrirla.
- **La respuesta parcial sigue en 0** en todas las condiciones menos una: cuando falta un detalle chico (el `no-store`, la policy del bucket), el tutor sigue por lo que sí dijo. Es lo próximo a atacar (ver "Lo que sigue").
- **El primer audio bajó de 4,4 s a 1,1 s** (p50), sobre todo por el modelo: 2.5 piensa por defecto antes de hablar.
- Los dos "turnos mudos" del antes son de la sonda, no del tutor: dos respuestas de 2.5 de 36 y 37 s de audio no terminaron dentro de los 40 s de espera y su cierre cayó en el turno siguiente. Esos turnos no se puntúan. Lo que sí dicen es el largo: el tutor viejo hablaba hasta 37 s seguidos.

## La pausa a mitad de respuesta

`scripts/probe-voice-turn-taking.ts` manda una respuesta hablada con una pausa en el medio ("Porque el servidor… [pausa] …verifica el postback con la firma antes de acreditar la compra"), con voz sintética (`say`, Isabela, es_AR) y como la manda el navegador: audio PCM de 16 kHz en trozos de 100 ms, en tiempo real. Mira si el tutor arranca a hablar durante la pausa. Sobre `gemini-3.8-live`, dos repeticiones por brazo:

Las dos corridas: `docs/research/voice-probe/turn-taking-gemini-3.8-live-pause1.2.json` y `…-pause1.5.json`.

| Fin de turno | Pausa de 1,2 s: cortó | Pausa de 1,5 s: cortó | Arranca después de la última palabra |
|---|---|---|---|
| Default de la API (lo que mandaba la app) | 2 de 2 | 2 de 2 | (cortó antes) |
| `END_SENSITIVITY_LOW`, 900 ms | 1 de 2 | 1 de 2 | 1,3 s |
| **`END_SENSITIVITY_LOW`, 1300 ms** (tutor) | 0 de 2 | 0 de 2 | 1,7 a 4,0 s |
| **`END_SENSITIVITY_LOW`, 1700 ms** (entrevista) | | 0 de 2 | 2,2 a 2,4 s |

Con el default, el tutor arrancó a hablar en la pausa las cuatro veces, que es lo que le pasó al dueño con "Porque…". Las transcripciones que oyó el modelo fueron la frase entera en todos los brazos.

Por eso la app manda `END_SENSITIVITY_LOW` con 1300 ms en el tutor y 1700 ms en la entrevista (`TURN_TAKING` en `src/lib/voice/live-models.ts`). El costo es que la respuesta arranca más tarde después de la última palabra: de 1,7 a 4,0 s en estas corridas, contra 1,3 s con 900 ms. Con dos repeticiones por brazo es una señal, no una cifra fina.

## La entrevista

Pestaña **Entrevista** de `/resource/<id>/practice`, que también es el paso APLICAR de la lección. El alumno elige quién lo entrevista y la profundidad; el tutor hace de esa persona en inglés, una pregunta por vez, escucha la respuesta entera y después da el feedback ("Feedback:" lo que funcionó, lo que no cierra técnicamente contra la lección, hasta tres correcciones de inglés), y vuelve al personaje con la próxima pregunta. Si el alumno pide el feedback en castellano, el feedback pasa a castellano y el entrevistador sigue en inglés. Cierra con un resumen y "interview complete".

Los personajes son datos: cinco por defecto para cualquier lección (`src/lib/interview/personas.ts`: recruiter curioso, líder técnico, experto exigente, cliente preocupado, founder relajado) y los de la lección en su JSON (`interview`, formato en `docs/lesson-format.md`). Brivel suma a Nathalie (la founder, relajada pero detallista) y a Coni (la asistente que filtra candidatos, técnica y de checklist). Cada personaje cambia el foco de las preguntas, en qué empuja, el tono y cuán técnico es; la profundidad (1 a 3) decide cuánto repregunta y cuántas preguntas hace. Las preguntas salen de los drills (los temas y las respuestas preparadas) y el contenido se juzga contra las secciones.

No hay "antes": el modo no existía. Lo medido es el prompt de la entrevista en su primera versión (v1) contra el que quedó, con la misma sonda en modo `--mode interview`: el alumno contesta en inglés de nivel B2 y cada turno planta algo (dos errores típicos de hispanohablante, un error técnico, un detalle bueno, una respuesta a medias, una pregunta). Una corrida de ocho turnos por personaje y versión, así que cada celda es de una corrida; el promedio de los tres personajes es lo que vale mirar.

| | Nathalie, prof. 2 | | Coni, prof. 2 | | Experto, prof. 3 | | **Promedio** | |
|---|---|---|---|---|---|---|---|---|
| | v1 | final | v1 | final | v1 | final | v1 | **final** |
| Toma lo plantado | 0,88 | 0,75 | 0,63 | 0,63 | 0,50 | 0,88 | 0,67 | **0,75** |
| · corrige el error técnico | 1,00 | 1,00 | 0,50 | 1,00 | 0 | 1,00 | 0,50 | **1,00** |
| · corrige los errores de inglés | 1,00 | 0,67 | 0,33 | 0,67 | 1,00 | 1,00 | 0,78 | 0,78 |
| Deja pasar un error técnico | 0 | 0 | 0 | 0 | 0,25 | 0 | 0,08 | **0** |
| Corrección de inglés equivocada o inventada | 0 | 0,13 | 0,25 | 0 | 0,13 | 0 | 0,13 | **0,04** |
| Abre con elogio genérico | 0,50 | 0,13 | 0,75 | 0,38 | 0,25 | 0,50 | 0,50 | **0,33** |
| Dice acotaciones ("Back in character:") | 0,78 | 0 | 0 | 0 | 0 | 0 | 0,26 | **0** |
| Primer audio p50 (ms) | 923 | 1089 | 939 | 946 | 958 | 901 | | |

Archivos: `docs/research/voice-probe/2026-11-11-interview-{nathalie-d2,coni-d2,expert-d3}.json` (v1) y `…-{nathalie-d2-v3,coni-d2-v2,expert-d3-v2}.json` (final).

Qué cambió de v1 al final, y por qué:

- v1 daba el elogio primero y a veces dejaba pasar una afirmación técnica falsa dicha con seguridad (el experto aceptó "una hora UTC fija alcanza", contra la lección que dice que se corre una hora medio año). El final chequea cada afirmación contra la lección y, si hay una falsa, es lo primero que dice.
- v1 inventó correcciones ("You said 'expiration', say 'expiration'"). El final solo cita palabras que el candidato dijo, y si duda, ninguna.
- v1 decía "Back in character:" o "Morgan here" al volver al personaje. El final cambia de voz sin anunciarlo.
- Con Coni en profundidad 2 la entrevista cerró sola en la sexta respuesta, con el resumen y "interview complete", como pide el prompt (unas siete preguntas); los dos turnos de la sonda que siguieron cuentan como "sin pregunta".
- Una corrida de Nathalie cerró al abrir con 1011 "Resource has been exhausted" (cuota del proyecto, había tres sesiones a la vez) y se descartó.

Lo que sigue flojo: el elogio genérico vuelve en Coni y el experto (0,38 y 0,50), y una respuesta a medias pasa sin que se nombre lo que falta en dos de tres personajes.

## Lo que sigue

1. **La respuesta a medias.** Es lo que peor sale en las dos modalidades. La movida de Duolingo (un supervisor que, por turno, compara la respuesta con la lección y le susurra al modelo "falta X") es la candidata: un modelo de texto barato por turno, con su nota antes de que el tutor hable.
2. **Memoria de la entrevista**: guardar al final las correcciones de inglés recurrentes y abrir la próxima por ahí (Duolingo, Praktika).
3. **`custom_vocabulary`** en la transcripción (Supabase, RLS, postMessage, pg_cron) para que lo que se ve en pantalla esté bien escrito.
4. **El token efímero** (ver "Riesgo anotado").

## Lo que no se midió

- Con micrófono real: el dueño. Las corridas son texto (contenido) y voz sintética (fin de turno).
- El juez es un modelo: puntúa estricto y a veces discutible (por ejemplo, "el centavo sobrante va al creador" contra una lección que dice "por ejemplo, va a la plataforma").
- Los personajes de Brivel en la app: necesitan la columna `resources.interview` (`supabase/migrations/20261111020000_resource_interview.sql`) y volver a cargar la lección. Hasta entonces la pestaña muestra los cinco por defecto.

## Riesgo anotado

`/api/voice/token` le devuelve al navegador la API key de Gemini, no un token efímero (la ruta explica por qué: los efímeros ignoraban el system instruction). Cualquier usuario logueado puede leerla en la red del navegador. No se tocó: la migración a 3.8 no lo necesita.
