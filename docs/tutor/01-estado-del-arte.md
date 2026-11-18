# Tutor de voz de fin de lección · estado del arte y spec

2026-11-18. Qué hacen los mejores tutores con IA y los productos de preparación de entrevistas (2025 y 2026), qué copiamos, el comportamiento recomendado para el tutor de Jarre y cómo evaluarlo con sus charlas reales. Sigue a `docs/research/2026-11-11-voice-tutor-aaa.md` (eco, una pregunta por turno, fin de turno, entrevista), que no se repite acá.

Regla del documento: cada afirmación externa lleva su URL. Donde la fuente es del propio fabricante, se dice; donde no hubo fuente, no se afirma.

## 0. Resumen

1. El dueño quiere un profesor que explique cuando se lo pide, corrija todo lo que dice mal, sepa la lección entera (las 15 secciones), lo mande a otra sección cuando corresponde y se acuerde de lo que contestó antes. Hoy el tutor está armado como examinador.
2. Los mejores no son socráticos a ciegas: el marco de Google evalúa explícitamente que el tutor "no retenga información de forma improductiva" y que responda a pedidos explícitos de cambiar el enfoque. La pregunta va después de la explicación, no en su lugar.
3. Lo que sí comparten todos: una pregunta por vez, pistas graduadas según el error concreto, feedback de corrección después de la respuesta, y el tutor metido dentro del contenido (ve dónde está el alumno).
4. Memoria: el patrón probado es simple. Al final de cada charla, extraer hechos y errores a una lista; en la próxima, meterlos en el prompt (Duolingo) o recuperarlos cuando el alumno terminó de hablar (Praktika). Nadie publica un modelo de dominio por concepto en voz; la investigación dice que el LLM solo no sirve como modelo del alumno.
5. Inglés: ningún producto serio mezcla "decímelo en inglés" en medio de una explicación. Speak y Duolingo separan la práctica de idioma como actividad propia; la corrección va después de la respuesta y como recast acotado.
6. Spec: tres modos explícitos (Explicar, Practicar, Ensayo en inglés), el alumno los cambia con palabras; un protocolo de corrección que no deja pasar nada; un mapa de las 15 secciones con referencias habladas y un tool para saltar; un registro de lo que contestó, por sección y entre sesiones.
7. Evaluación: 14 casos sacados de sus charlas del 18/11, corridos con la sonda que ya existe (`scripts/probe-voice-tutor.ts`) con plantados nuevos.

## 1. Qué pasó en sus charlas (18/11, lección `3y-health-tecnica-v2`)

Fuente: `~/Desktop/_revisar/jarre-tutor/2026-11-18-charlas.md` (tres sesiones: `a94efc5c`, `d14a09c0`, `ac028b04`). Los números de línea son de ese archivo.

| Lo que pasó | Líneas | Tipo de falla |
|---|---|---|
| Pidió que le explique cinco veces ("me gustaría más que me la expliques", "explícame la técnica en detalle", "empezar desde el principio", "te estoy pidiendo que me lo expliques", "explícame todo este capítulo"). Recibió dos oraciones y otra pregunta cada vez, y en `ac028b04` un "Acá no explicamos, acá practicamos lo que leíste". | 13, 15, 19, 29, 53-54 | Examina en vez de enseñar |
| Pidió "empezar desde el principio" y el tutor arrancó por el hash map; el enunciado de Two Sum llegó recién en el cuarto pedido. | 13-20 | No empieza por donde está perdido |
| Le pidió inglés cinco veces en unos doce minutos, también justo después de explicar y después de "qué pesado con la entrevista". | 12, 20, 28, 40, 56 | Insiste con el inglés |
| "O n log n, porque tenés dos for" recibió "Casi". Es un error, no un casi. | 25-26 | Corrección blanda |
| "Una vez que ya hiciste una pasada, ya sabés dónde están todos los números" (falso: en Two Sum el mapa solo tiene lo ya recorrido) recibió "Es tal cual lo describís". | 39-40 | Error aceptado |
| "La clave es el índice y el valor es el número" sí se corrigió bien ("es al revés"). "Crece exponencialmente" también. | 41-42, 33-34 | Lo que funciona |
| "¿Me lo repetís?" recibió la misma frase palabra por palabra. | 31-32 | Repetir sin simplificar |
| "Ayer lo había visto y me olvidé" (Big-O). Ninguna sesión sabe qué vio ayer en otra sección. | 25 | Sin memoria entre secciones |
| Tres sesiones en 12 minutos; cada una arranca de cero con una pregunta en frío. | 46, 50 | Sin continuidad |

Causas en el código (commit `a67dfa6`, `src/lib/llm/voice-tutor-session.ts`):

- El rol era "quizzing a colleague", con "they do the remembering", "never lecture" y "without giving the answer", y ninguna regla para un pedido de explicación.
- `BILINGUAL_RULE` pedía inglés "for every key idea".
- **La lección no entra entera.** `LESSON_CHAR_BUDGET = 48_000` caracteres (línea 48): la sección en foco va completa y las otras 14 se cortan. Medido sobre `~/Desktop/demaria/50-aprender/entrevistas/2026-11-3y-health-tecnica/leccion-3y-health-tecnica-v2.json` (116.394 caracteres de markdown en 15 secciones) con el mismo algoritmo de `lessonForPrompt`: con foco en Big-O cada otra sección queda en 2.739 caracteres y el tutor ve el 36 % de ellas; con foco en Two Sum, el 38 %. Por eso "solo conoce la sección actual" es casi verdad.
- **La memoria es por sección.** `/api/voice/session/context` se pide con `sectionId` (`src/components/voice/use-voice-session.ts`, alrededor de la línea 767), así que el resumen previo es de esa sección; lo que contestó en Big-O no llega a Two Sum.

**Estado al escribir esto:** en el árbol de trabajo hay un cambio sin commitear en `voice-tutor-session.ts` que ya agrega una `TEACH_RULE` ("this always wins over quizzing", enunciado primero, ejemplo con valores, una pregunta liviana después), endurece las correcciones ("Never move on... while a wrong claim of theirs is still standing") y hace el inglés "earned, rare and stoppable". Este documento lo toma como punto de partida: lo que falta es la lección entera, las referencias entre secciones, la memoria entre secciones y sesiones, los modos explícitos y una evaluación que lo pruebe.

## 2. Qué hacen los mejores

### 2.1 Explicar o preguntar

- **Google (marco pedagógico de LearnLM, versión del 2026-09-21)**, https://services.google.com/fh/files/misc/googlespedagogicalframework.pdf. Cinco principios: aprendizaje activo, carga cognitiva, curiosidad y motivación, adaptarse al alumno, metacognición. Lo relevante para Jarre, citado:
  - El tutor "does not give away answers too quickly" (rúbrica "Guides to answer"), pero en la misma rúbrica de adaptación: "Guides appropriately: The tutor does not withhold information unproductively", y "Explicit requests: The AI tool responds to a learner's stated requests (e.g. to modify the approach or learning plan)". Un "explicame" es un pedido explícito.
  - Trabado no es una sola cosa (nota 5): "confusion (responding with a clarifying question or worked step...), frustration (responding by recalibrating task difficulty or offering a different entry point), or disengagement (suggesting... a break)". En la línea 29 el dueño está frustrado, no confundido.
  - Las señales verbales cuentan: "interpret verbal cues, such as a learner's request to 'go back' or 'explain that again,' to detect understanding or confusion".
  - Para la carga cognitiva: segmentar, y "pre-training to introduce concepts before exploring them thoroughly". Antes de preguntar por el hash map, el enunciado.
  - Construyen para novatos por el "expertise reversal effect"; la ayuda se retira ("fading") a medida que el alumno muestra competencia; pistas "contingent on the learner's specific error".
  - El alumno no es buen juez de cuánto aprende (nota 1), pero la agencia se preserva: "the best kind of personalization involves having the learner drive their own learning experience".
- **Gemini Guided Learning** (Google, 2025-08-06, https://blog.google/outreach-initiatives/education/guided-learning/; 2025-09-23, https://blog.google/products/gemini/guided-learning-google-gemini/): "breaks down problems step-by-step and adapts explanations to your needs"; puede "lay out a study plan for a topic before walking you through each step"; el autor del segundo post describe que lo testean después de explicarle un concepto. Es decir: explicar, después chequear.
- **ChatGPT Study Mode** (OpenAI, lanzado 2025-07-29, https://techcrunch.com/2025/07/29/openai-launches-study-mode-in-chatgpt). La ayuda oficial propone "Quiz me one question at a time and explain anything I miss" (https://help.openai.com/en/articles/11780217-chatgpt-study-mode). El prompt extraído por terceros, no confirmado por OpenAI, pide empezar de lo que el usuario sabe y "never ask more than one question at a time" (https://baoyu.io/blog/chatgpt-study-mode-prompt). Se puede apagar en cualquier momento (TechCrunch).
- **Claude, modo Learning** (Anthropic; en Claude for Education desde abril de 2025 y abierto a todos en agosto de 2025, https://www.engadget.com/ai/anthropic-brings-claudes-learning-mode-to-regular-users-and-devs-170018471/): socrático, guía paso a paso, y se apaga cuando el usuario quiere.
- **Khanmigo** (Khan Academy). Diseño original: no da la respuesta, pregunta por el paso siguiente y da feedback "on the steps students are taking so they know where they go off track" (https://blog.khanacademy.org/how-we-built-ai-tutoring-tools, 2024-03-07). Sal Khan, 2026: la primera versión "did not change student learning as much as many of us hoped"; "The AI could not just sit next to the content", y ahora vive dentro de los ejercicios y pide al alumno que explique cómo llegó (https://blog.khanacademy.org/khanmigos-first-chapter-changed-how-i-think-about-ai-a-note-from-sal-khan/). Reseñas críticas dicen que el loop de preguntas frustra al que necesita un ejemplo resuelto primero (https://aiweekly.co/alerts/khanmigo-ai-tutor-falls-short-of-khan-academy-hype, secundaria).
- **Koji de Brilliant** (lanzado mayo de 2026, https://blog.brilliant.org/a-world-class-tutor-in-every-home/; https://brilliant.org/help/features/how-does-koji-work/): vive dentro de la lección, "can see what you've done so far, to help pinpoint where a misunderstanding lies", dibuja sobre la pantalla y "guides you through the thinking step by step". La voz es de ElevenLabs (https://elevenlabs.io/blog/brilliant-launches-personal-tutor-powered-by-elevenlabs). Sin datos de aprendizaje independientes.
- **La evidencia de que el guardarraíl importa:** Bastani y otros, PNAS 2025 (https://ideas.repec.org/a/nas/journl/v122y2025pe2422633122.html; Wharton, https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education/): con GPT sin restricciones el examen bajó 17 %; el "GPT Tutor", con la solución y los errores comunes en el prompt y pistas incrementales, no dañó el aprendizaje. Kestin y otros, Scientific Reports 2025 (https://www.nature.com/articles/s41598-025-97652-6): un tutor armado sobre los objetivos y problemas exactos del curso superó a la clase activa en Harvard (N = 194), sin test diferido.
- **Y la de que los LLM sobreayudan:** Lee y otros (KAIST), Findings of EMNLP 2026 (https://aclanthology.org/2026.findings-emnlp.810.pdf): en 14.637 respuestas reales a 203 estudiantes, más del 95 % fueron "Explaining" o "Solving". Enmarcan el problema en el "Assistance Dilemma" de Koedinger y Aleven (poca ayuda frena, mucha saltea el esfuerzo).

**Conclusión de 2.1:** la industria resolvió "no regalar la respuesta a un ejercicio". El caso de Jarre es otro: la lección ya la leyó, pidió explicación de un concepto. Ahí todas las fuentes coinciden en explicar (con un paso trabajado o un ejemplo) y recién después chequear con una pregunta aplicada. Lo que no hay que regalar es la respuesta a la pregunta de práctica que el tutor acaba de hacer.

### 2.2 Corregir errores y conceptos equivocados

- Pistas graduadas "contingent on the learner's specific error" y "misconception identification" como dimensión de evaluación (marco de Google, arriba; LearnLM-Tutor, https://arxiv.org/abs/2407.12687).
- El "GPT Tutor" de Bastani tenía en el prompt los errores comunes de cada problema (PNAS, arriba). Jarre ya tiene esto en la entrevista (`misconceptions` por pregunta); el tutor de lección no.
- Feedback correctivo oral en chatbots de práctica: más progreso con secuencias de corrección tipo "prompting" y ubicadas después de la respuesta del alumno (He, Chen, Cukurova, Mavrikis, AIED 2026, https://arxiv.org/abs/2604.05702).
- Hello Interview (https://www.hellointerview.com/live, del fabricante): el informe final pone cada punto de mejora en la línea de tiempo y "each one quotes what you said and shows how to fix it". Citar sus palabras es lo que hace creíble la corrección.
- MathTutorBench (https://arxiv.org/abs/2502.18940): saber resolver no implica enseñar bien. Para Jarre: la lección en el prompt como clave no alcanza; el prompt tiene que decir qué hacer con un error.

### 2.3 Adaptar la dificultad y no insistir

- Google: tasa de éxito cercana al 85 % como zona de máximo aprendizaje (citada en el marco, sección 6.2); subir y bajar según el desempeño; ofrecer opciones de formato ("Do you want to watch a video, read an explanation, or try a practice problem?").
- Duolingo Video Call (https://blog.duolingo.com/ai-and-video-call, 2025-04-22): un chequeo después de cada turno del alumno pregunta si está confundido (entonces Lily reformula) y, después de ver que la gente se iba del tema, "si el alumno quiere llevar la conversación, se abandona el plan". Ese es el antídoto contra el "qué pesado con la entrevista".
- OpenAI Realtime (https://developers.openai.com/cookbook/examples/realtime_prompting_guide): regla de variedad contra frases robóticas, y el modelo "strongly closely follows sample phrases". Las frases de ejemplo en el prompt ("Ahora decímelo en inglés...") se repiten tal cual: es lo que se ve en las líneas 12, 20, 28 y 40.
- Google Live API (https://aistudio.google.com/docs/live-api/best-practices): separar lo que pasa una vez de los loops, y decirle al modelo que el loop sigue lo que el usuario quiera. No repetir lo que dijo el usuario.

### 2.4 Memoria y currículum

- **Duolingo**: al final de la llamada, el transcript vuelve al modelo con la pregunta de qué se aprendió del usuario; eso va a una "List of Facts" que entra en el prompt de la próxima (https://blog.duolingo.com/ai-and-video-call). La primera pregunta se genera aparte, mientras suena el teléfono, porque meter todo en un prompt "could overload the LLM".
- **Praktika** (caso de OpenAI, 2026-01-22, https://openai.com/index/praktika, del fabricante y de OpenAI): agente de lección en vivo, un "Student Progress Agent" en segundo plano que sigue errores recurrentes, y un agente de plan de largo plazo; la memoria se recupera cuando el alumno terminó de hablar, no se precarga. Reportan +24 % de retención del día 1, sin metodología publicada.
- **Speak** (https://www.speak.com/, del fabricante): "After each lesson, Speak uses your mistakes and learning history to generate personalized review and custom practice". La continuidad es repaso armado con errores, no recuerdos de la charla.
- **Google**: modelo del alumno, modelo de dominio ("subjects, units, chapters, concepts, skills, and the edges between them") y modelo pedagógico; en varias sesiones, "demonstrate progress over time, and space repetition" (marco, sección 6.3). También admite que hasta ahora adaptan sobre todo dentro de una sesión (6.5).
- **Investigación**: el LLM solo predice peor el próximo acierto que un knowledge tracing clásico (DKT AUC 0,83 por encima del LLM; https://arxiv.org/abs/2512.23036), y TASA (https://arxiv.org/abs/2511.15163, AAAI 2026 workshop) suma a la memoria de eventos un decaimiento por olvido por concepto. Para el horario de repaso, FSRS define retrievability y stability (tiempo hasta que la probabilidad de recordar cae a 90 %) y calcula el intervalo con la retención deseada (https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm).
- **Currículum dentro del tutor**: Khanmigo y Koji viven adentro del contenido y ven dónde está el alumno (arriba). Guided Learning arma un plan y lo recorre. Ninguna fuente pública describe un tutor de voz que diga "volvé a la sección 2"; es un comportamiento a diseñar, no a copiar.

### 2.5 Preparación de entrevistas

- **Hello Interview Live** (https://www.hellointerview.com/live, fabricante): el entrevistador no enseña durante la entrevista ("didn't jump in when I was quiet", según reseñas que muestra la página); al final, veredicto hire/no hire con confianza, puntaje por competencia y arreglos que citan lo que dijo. No dice si sigue debilidades entre sesiones.
- **interviewing.io** (https://interviewing.io/): AI Interviewer con feedback "at the end"; no publica cómo se arma.
- **Google Interview Warmup**: cerrado en 2026 según fuentes secundarias (https://www.aceround.app/blog/google-interview-warmup-review/); Google apunta a Gemini Live, que "can simulate a real-time, conversational interview, providing instant, structured feedback" (https://grow.google/certificates/interview-warmup/, 2025-12-11).
- **LeetCode y NeetCode**: no hay una función oficial de IA documentada; lo que existe son extensiones de terceros con pistas por niveles (por ejemplo LeetSub, cinco niveles de pista, https://chromewebstore.google.com/detail/leetsub/nepnogplojopggkkoilbepleeppceolg).
- **Final Round AI, Exponent, Pramp**: sin fuente de 2025 o 2026 que describa el mecanismo de feedback más allá de reseñas (https://techpoint.africa/guide/final-round-ai-review/). No se afirma nada.
- Crítica general: los simuladores comerciales dan feedback unidireccional, sin chance de repreguntar (Conversate, https://arxiv.org/html/2410.05570v2).

Jarre ya tomó lo central de esto en la entrevista (feedback escrito al final, 2026-11-16). Lo que falta es el puente: que el informe de la entrevista diga "esto está en la sección 6" y que el tutor de lección lo sepa.

## 3. Qué copiamos, qué adaptamos, qué no

| Comportamiento | Fuente | Decisión | Por qué |
|---|---|---|---|
| Un pedido explícito ("explicame", "desde el principio") cambia el enfoque en el acto | Google, rúbrica "Explicit requests" y "Guides appropriately" | **Adoptar** | Es la queja principal del 18/11 (cinco pedidos). |
| Explicar con un paso trabajado y un ejemplo con valores, después una sola pregunta aplicada | Google ("worked step", "pre-training"), Guided Learning (explica y después testea) | **Adoptar** | Ya está en la `TEACH_RULE` sin commitear; falta medirla. |
| Diagnosticar por qué está trabado: confusión, frustración, desgano | Google, nota 5 | **Adaptar** | Frustración ("qué pesado") pide bajar la exigencia y dar lo pedido, no reformular la pregunta. |
| Una pregunta por turno, al final | Study Mode, Google | **Ya adoptado** (2026-11-11) | |
| Pistas graduadas según el error concreto, y la versión correcta si falla de nuevo o pidió ayuda | Google, Bastani | **Adoptar** | |
| Errores comunes de cada sección en el prompt, como clave de corrección | Bastani (GPT Tutor con "common mistakes") | **Adoptar** | La lección ya tiene `quizzes` y `cards` por concepto; los errores típicos se pueden derivar o escribir una vez. |
| Corrección después de la respuesta, citando sus palabras | AIED 2026, Hello Interview | **Adoptar** | "Casi" ante n log n es exactamente lo que no hay que hacer. |
| Chequeo por turno "¿el alumno quiere llevar la charla?" | Duolingo | **Adaptar** como regla en el prompt, no como segundo modelo | Velocidad: un segundo modelo por turno suma latencia. Ver 4.8. |
| Memoria como lista de hechos extraída al final | Duolingo | **Adoptar** | Ya existe `/api/voice/session/compress` y `learner_concept_memory`; falta que sea por lección y no por sección. |
| Recuperar memoria cuando el alumno termina de hablar | Praktika | **Postergar** | Con 15 secciones la memoria entera de una lección cabe en el prompt; recuperar por turno es para cuando no quepa. |
| Modelo del alumno con knowledge tracing y olvido | TASA, Hooshyar | **Adaptar mínimo**: un estado por sección (no visto, flojo, firme) con fecha, calculado por reglas, no por el LLM | El LLM solo es mal modelo del alumno (arXiv 2512.23036). |
| Repaso espaciado con FSRS | FSRS | **Adaptar**: solo para decidir qué sección resurge al abrir la charla | FSRS completo pide historial de repasos que todavía no hay. |
| Tutor dentro del contenido, que ve dónde está | Khanmigo 2026, Koji | **Adoptar** | El tutor ya vive al final de la lección; falta que pueda señalar y saltar de sección (tool). |
| Socrático estricto, nunca dar la respuesta | Khanmigo 2024 | **Rechazar** como default | El dueño ya leyó; el modo socrático estricto es el que produjo "Acá no explicamos". Queda solo dentro del modo Practicar. |
| Frases de ejemplo en el prompt | OpenAI Realtime | **Rechazar** | El modelo las copia; describir la movida, no la frase. |
| Feedback de idioma mezclado con la explicación | Ninguna fuente lo hace | **Rechazar** | Ver 4.5. |
| Supervisor por turno (segundo modelo) | Duolingo, Praktika | **Postergar** | Medir primero con prompt + nota del runtime; el doc del 2026-11-11 dejó la respuesta parcial como candidata. |

## 4. Spec recomendado del tutor

### 4.1 Contexto: la lección entera, sin pagar de más

- **Mapa de la lección siempre presente**: las 15 secciones numeradas, cada una con su título, de qué trata en una línea, y sus ideas clave (las `cards` del concepto o las primeras oraciones). Es lo que le permite decir "eso es la 13, Rotated Array" sin tener el texto entero.
- **Texto completo**: la sección en foco y las que la charla toque. La lección entera son 116.394 caracteres (unos 29k tokens a 4 caracteres por token). Firebase documenta 128k tokens de contexto por sesión en todos los modelos Live (https://firebase.google.com/docs/ai-logic/live-api/sessions); Vertex muestra un default de 32k en una de sus páginas (https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-live-api). Para `gemini-3.8-live` no hay cifra pública encontrada: se mide.
- **Dos opciones, a medir**:
  1. La lección entera en el system instruction (subir `LESSON_CHAR_BUDGET` a unos 120k). Simple, el tutor sabe todo. Costo: Live relee y factura el instruction en cada turno (precedente propio: avatar-landing, 30,8k tokens por turno en 3.8 y sin caching, `~/Desktop/avatar-landing/docs/research/2026-10-25-gasto-gratis.md`).
  2. "Notas bajo demanda" (el patrón de avatar-landing, que bajó el primer turno de 30,8k a 21,7k tokens, mismo doc, sección 8): mapa + sección en foco en el instruction; cuando el alumno o el tutor nombra otra sección, el runtime le manda su texto completo una vez por conexión como contenido del turno (`sendClientContent`; la referencia de sesiones lo usa varias veces en una sesión abierta, https://aistudio.google.com/docs/live-api/session-management).
  Recomendación: arrancar con la 1 si 3.8 la aguanta sin subir el primer audio; pasar a la 2 si el costo o la latencia lo piden.
- **Charlas de más de 15 minutos**: compresión de contexto (`contextWindowCompression`) o resumen y reconexión, que Jarre ya hace en GoAway (https://aistudio.google.com/docs/live-api/session-management: sin compresión el audio está limitado a 15 minutos).

### 4.2 Modos

Tres modos, una sola sesión. El alumno los cambia hablando; el tutor nunca se niega a cambiar.

| Modo | Cuándo entra | Qué hace el tutor | Qué no hace |
|---|---|---|---|
| **Explicar** | "explicame", "no entiendo", "desde el principio", "¿cuál es el ejercicio?", o dos errores seguidos en la misma idea | Empieza donde está perdido (si pide el principio: qué pide el problema, qué entra y qué sale). Paso a paso, un ejemplo con valores reales, y una sola pregunta liviana sobre ese ejemplo. Si la respuesta muestra que no lo siguió, otra explicación con otro ejemplo. | Inglés, preguntas de entrevista, "¿se entiende?" como única pregunta. |
| **Practicar** (default al abrir) | Al abrir, o cuando el alumno dice "preguntame", "dale, sigamos", o contesta bien dos veces la pregunta liviana | Recuperación con preguntas aplicadas, una por turno, pistas graduadas, dificultad que sube tras dos aciertos y baja tras un error. | Regalar la respuesta a la pregunta que acaba de hacer, salvo que pida ayuda o falle dos veces. |
| **Ensayo en inglés** | Solo si el alumno lo pide ("hagamos en inglés", "como en la entrevista") o acepta la oferta | Le pide decir una idea ya entendida como en la llamada; después de su respuesta: si el contenido cambió al traducir, y hasta dos correcciones "dijiste..., decí...". Una idea, una vuelta, y vuelve. | Ofrecerse más de una vez por sección. Ofrecerse después de "explicame" o de una queja. |

La entrevista simulada (`buildInterviewSession`) sigue siendo otra pestaña: ahí el tutor no enseña.

### 4.3 Explicar o preguntar, turno por turno

| Lo que dijo el alumno | Movida |
|---|---|
| Pide explicación o dice que no entiende | Explicar (modo Explicar). Nunca contestar con una pregunta en lugar de la explicación. |
| Frustración ("qué pesado", "te estoy pidiendo que...") | Una frase que reconoce sin disculpa larga, y darle exactamente lo que pidió. Desde ahí, nada de lo que le molestó por el resto de la sesión. |
| "¿Me lo repetís?" | La misma idea en menos palabras y más simples, o con otro ejemplo. Nunca la misma frase. |
| Contesta bien y completo | Empujar el detalle más interesante (caso borde, tradeoff), sin elogio. |
| Contesta a medias | Decir qué parte está bien y pedir la pieza que falta, nombrada. |
| Error | Protocolo de 4.4. |
| "No sé" en Practicar | Una pista con una pista concreta de la lección; si sigue trabado, explicar. |
| "¿Cómo seguimos?" | Proponer dos caminos con nombre ("seguimos con la versión con mapa de Two Sum o pasamos a Valid Parentheses, la 4") y dejar que elija. |

### 4.4 Protocolo de corrección

1. **Chequear cada afirmación**, no solo la pregunta que el tutor hizo: en una respuesta larga, el error escondido ("ya sabés dónde están todos los números") cuenta igual.
2. **Prioridad**: primero el error de contenido, después lo que falta, después el estilo. Una corrección por turno si son varias, la más grave; las otras se anotan y se retoman.
3. **Forma**: la primera oración dice que no es así y cuál parte, citando sus palabras ("Dijiste n log n por los dos for: dos for anidados son n al cuadrado; n log n aparece cuando ordenás"). "Casi" solo si la respuesta está cerca de verdad, nunca ante un error de categoría.
4. **Después**: si el error vino solo y está razonando, una pista para que lo encuentre; si pidió ayuda, ya falló una vez o el error es de base, la versión correcta con un caso chico y una pregunta aplicada para confirmar.
5. **Nada se deja en pie**: no se cambia de tema ni se explica otra cosa mientras un error suyo siga sin corregir.
6. **Registro**: cada error corregido se guarda con su frase, la sección y si al final lo resolvió (4.7). Un error resuelto que vuelve en otra sesión se trata como conocido: "la otra vez también te salió n log n para dos for; ¿por qué es n al cuadrado?".

### 4.5 Política de inglés

Fuentes: corrección después de la respuesta y acotada (AIED 2026, https://arxiv.org/abs/2604.05702); el alumno que quiere llevar la charla manda (Duolingo, https://blog.duolingo.com/ai-and-video-call); Speak trata la práctica de idioma como su propia actividad con feedback "on what actually matters" (https://www.speak.com/).

- El inglés es un modo (Ensayo en inglés), no un paso obligatorio de cada idea.
- El tutor lo **ofrece** a lo sumo una vez por sección, solo al cerrar una idea que el alumno explicó bien con sus palabras, nunca en el mismo turno de una explicación o una corrección. Si no lo toma, no vuelve a ofrecerlo en esa sección.
- Una queja apaga el inglés por el resto de la sesión, salvo que él lo retome.
- Cuando el alumno habla en inglés por su cuenta (línea 21), sí se corrige: hasta dos recasts "dijiste..., decí...", solo con palabras que dijo. Eso ya funcionó el 18/11 ("they add up to the target").
- Al final de la sesión, si hubo inglés, una línea con la corrección que más se repitió. Las correcciones van al registro para que la entrevista simulada las retome.

### 4.6 Referencias a la lección

- El tutor nombra las secciones por número y nombre corto, siempre igual: "la 3, Two Sum".
- **"Eso lo vemos después"**: si el alumno pregunta algo que es de otra sección, contesta en una o dos oraciones y dice dónde se profundiza ("es la idea de la 15, LRU; ahí la vemos entera").
- **"Volvé a la X"**: si un error muestra que falta una base de otra sección (dos for anidados y Big-O), lo dice y ofrece ir ("esto es de la 2, Big-O; ¿la repasamos un minuto?").
- **Tool `go_to_section(index, reason)`** (Live API, declarado con cuándo llamarlo, https://aistudio.google.com/docs/live-api/best-practices): mueve la UI a esa sección y le dice al runtime que cambió el foco (para la opción 2 de 4.1, manda su texto). Precedente propio: en avatar-landing el tool llamado antes de la primera palabra con `WHEN_IDLE` no deja la respuesta muda (CLAUDE.md de avatar-landing, línea de `perform_action`); vale medirlo acá antes de confiar.
- Pregunta de "¿cómo seguimos?" y cierre: el tutor propone desde el mapa y el registro (lo flojo primero, lo no visto después).

### 4.7 Memoria de lo que contestó

Lo mínimo que sirve, en orden de valor:

1. **Registro por lección, no por sección**: al terminar cada charla (o en GoAway), el compresor que ya existe devuelve, además del resumen, una lista estructurada: `{section, kind: misconception|gap|strength|english, said: "<sus palabras>", resolved: bool, at}`. Patrón Duolingo.
2. **Estado por sección** calculado por reglas sobre ese registro y los quizzes: no visto, flojo (error sin resolver o resuelto hace poco), firme (dos aciertos en sesiones distintas). Con fecha. No lo decide el LLM (arXiv 2512.23036).
3. **En el prompt de cada sesión**: el estado de las 15 secciones en una línea cada una, y los errores sin resolver con sus palabras. A lo sumo unas 20 entradas, las más recientes y no resueltas primero.
4. **Resurgir**: al abrir, si hay una sección flojita vencida (intervalo creciente por éxito, en el espíritu de FSRS), la primera pregunta puede ser de ahí, dicha en voz alta ("ayer en Big-O se te mezcló n log n; arranquemos por ahí un minuto").
5. **Cómo se usa en la charla**: el tutor cita lo que dijo antes solo cuando sirve para la corrección o la conexión de ese turno, nunca como saludo ni lista ("la otra vez dijiste que la clave era el índice; acá pasa lo mismo con el conteo de Top K").

### 4.8 Rápido y robusto

- Nada nuevo en el camino crítico de cada turno: el registro se escribe al final, el estado se calcula al abrir, el mapa es estático por lección.
- Si se agrega un supervisor (Duolingo, Praktika), que sea texto, en paralelo, y que su nota entre en el turno siguiente, no en este.
- Mantener lo medido el 2026-11-11: primer audio p50 de 1,1 s con 3.8 y fin de turno LOW con 1300 ms (`docs/research/2026-11-11-voice-tutor-aaa.md`). Toda opción de 4.1 se acepta solo si no lo empeora.

## 5. Cómo evaluarlo

La sonda existe: `scripts/probe-voice-tutor.ts` abre una sesión Live real con el prompt de la app, el alumno simulado contesta como texto con algo plantado y un juez puntúa la respuesta siguiente. Se suman plantados nuevos, cada uno sacado de una línea real del 18/11 sobre la lección `3y-health-tecnica-v2`.

| # | Plantado (nuevo tipo) | Lo que dice el alumno (de sus charlas) | Pasa si | Falla si |
|---|---|---|---|---|
| 1 | `asks_explain` | "Igual esta sección no la entendí, me gustaría más que me la expliques." (l. 13) | Explica con un ejemplo con valores antes de preguntar | Contesta con una pregunta o dos oraciones y pregunta |
| 2 | `asks_start_over` | "Explícame el enunciado. ¿Cuál es el ejercicio? Empezar desde el principio." (l. 19) | Primera oración: qué entra (array, target) y qué sale (índices) | Arranca por el mapa o el complemento |
| 3 | `asks_whole_chapter` | "Explícame todo este capítulo." (l. 53) | Empieza la primera idea de la sección, con ejemplo | "Acá no explicamos" o cualquier negativa |
| 4 | `frustrated` | "Pero qué pesado con la entrevista. Te estoy pidiendo que me lo expliques." (l. 29) | Reconoce en pocas palabras, explica, y no vuelve a pedir inglés en el resto de la corrida | Pide inglés de nuevo en la sesión |
| 5 | `wrong_confident` | "O n log n sería porque tenés dos for." (l. 25) | Dice que no y por qué (anidados: n²; n log n es ordenar) | "Casi", "cerca", o pasa a otra cosa |
| 6 | `hidden_misconception` | "...una vez que ya hiciste una pasada, ya sabés dónde están todos los números" (l. 39) | Corrige que el mapa solo tiene lo ya recorrido | "Tal cual", o corrige solo otra parte |
| 7 | `swapped_key_value` | "La clave es el índice y el valor es el número." (l. 41) | Dice que es al revés y por qué (se busca por número) | Acepta (control: esto ya pasaba el 18/11) |
| 8 | `wrong_growth` | "Crece exponencialmente." (l. 33) | Distingue cuadrático de exponencial | Acepta |
| 9 | `asks_repeat` | "¿Me lo repetís, por favor?" (l. 31) | Otra formulación más corta o con ejemplo | La misma frase |
| 10 | `english_unprompted` | La respuesta en inglés de la l. 21 | Hasta dos recasts con sus palabras ("they add up to the target") | Ninguna corrección, o inventa palabras que no dijo |
| 11 | `english_pressure` | Contar en toda la corrida cuántas veces el tutor pide inglés sin que el alumno lo pida | A lo sumo una oferta por sección y ninguna después de 1 a 4 | Más de una, o una en el turno de una explicación |
| 12 | `cross_section` | Estando en Two Sum: "¿Y esto se parece a lo del LRU?" | Contesta corto y nombra "la 15, LRU" como lugar para profundizar | No sabe qué es el LRU de la lección, o da la sección entera |
| 13 | `memory_recall` | Segunda sesión, en Two Sum, con un registro previo de Big-O que tiene "n log n por dos for" sin resolver | Lo retoma con sus palabras en algún momento útil de la charla | No lo usa, o lo recita como saludo |
| 14 | `go_back` | "Volvamos a Big-O, que me olvidé." (l. 25, "ayer lo había visto y me olvidé") | Llama `go_to_section(2)` (si existe el tool) y explica desde ahí | Sigue en la sección actual |

Métricas por corrida (además de las de 2026-11-11):

- **Principal**: `addresses_plant` sobre los 14 casos; meta 12 de 14 o más.
- **Correcciones**: casos 5 a 8, meta 4 de 4 en dos corridas. Un "acepta un error" en cualquiera es rojo.
- **Explicar cuando se pide**: casos 1 a 4, meta 4 de 4.
- **Presión de inglés**: caso 11, conteo por corrida; meta ≤ 1 por sección.
- **Velocidad**: primer audio p50 ≤ 1,2 s, p90 ≤ 2 s (línea base 1089 / 1709 ms, 2026-11-11).
- **Palabras por respuesta**: Practicar alrededor de 40; Explicar hasta unas 100.

Cómo correrlo: dos corridas por condición (prompt actual commiteado contra el nuevo), una sesión a la vez o dos como mucho (con tres hubo 1011 por cuota, doc del 2026-11-11). Cada corrida abre sesiones Live pagas de centavos. El juez lee la lección entera, la charla y lo plantado; los casos 12 a 14 necesitan registro previo armado a mano en el fixture. Lo que no mide esta sonda: el micrófono real y la experiencia del dueño, que se valida con una charla suya después.

## 6. Lo que no se encontró

- Speak, Synthesis Tutor, Final Round AI, Exponent, Pramp, LeetCode y NeetCode: ninguna fuente de 2025 o 2026 describe su mecanismo de corrección o de memoria más allá del marketing. Synthesis solo tiene reseñas de terceros (https://www.unite.ai/synthesis-tutor-review).
- Ningún tutor público de voz que referencie secciones de un currículo por nombre o salte entre ellas: es diseño propio.
- El tamaño de contexto de `gemini-3.8-live`: no apareció en las páginas consultadas; se mide.
- Resultados de aprendizaje independientes de Koji, Guided Learning en adultos o Praktika: no hay; lo publicado es del fabricante.
