# Simulacro de entrevista: auditoría, endurecimiento y antes/después

2026-11-11. Contexto: llamada real con Brivel (Nathalie) a las 15:30. El dueño hizo un simulacro con Nathalie nivel 2 y dijo: "El ritmo y lo que pregunta me encantó. Me gustaría que preguntara cosas que por ahí no me espero". La pregunta era si es demasiado blando.

Respuesta corta: sí, era blando. Elogiaba como "spot on" dos mecanismos mal explicados, nunca repreguntaba sobre lo que él decía y no tiraba ninguna pregunta inesperada. Abajo está cómo se midió, qué cambió y qué no se pudo cerrar.

## 1. Cómo se mide

Productor: `scripts/probe-voice-tutor.ts` (modo `interview`, rúbrica v2, commit `b81e77b`).

- **Sesión real**: Gemini Live `gemini-3.8-live` con el system instruction que arma la app (`buildInterviewSession`). Las respuestas del candidato entran como texto (`sendClientContent`), no como audio.
- **Candidato simulado** (DeepSeek, temperatura 0,7) con el plan `hard`, que reproduce lo que hizo el dueño: un nombre mal transcripto y datos faltantes en la presentación, dos errores técnicos sutiles, una respuesta vaga, los hitos sin saber, una respuesta completa (para ver si el coach inventa errores), errores de inglés y un "lo que hay que decir" omitido.
- **Juez** (DeepSeek, temperatura 0) con la lección como clave. La rúbrica no depende del plan: el juez encuentra los errores y los faltantes solo, así la misma rúbrica puntúa una transcripción real (`--score-transcript`).

Métricas por turno: errores técnicos en la respuesta y cuántos corrige el coach (recall), cuántas cosas marca mal (precisión), puntos clave faltantes nombrados, elogio con error o faltante, contenido antes que inglés, término clave mal transcripto y si lo marca, respuesta vaga presionada, tipo de la pregunta siguiente (repregunta sobre lo que dijo, sorpresa fuera de lo preparado, banco preparado). Del cierre: si nombra conceptos errados, lo que no sabía de memoria, errores de inglés y qué practicar.

Límites de la medición: n chico (2 entrevistas por fila como mucho, 8 turnos cada una), un solo juez LLM, texto en lugar de voz. Sirve para ver dirección y fallas concretas, no para decimales.

## 2. Lectura ciega de la llamada del dueño

Transcripción: `docs/research/voice-probe/2026-11-11-owner-mock-nathalie-d2.txt`. Puntaje: `docs/research/voice-probe/2026-11-11-audit-owner-mock.json` (`--score-transcript`).

Lo que el juez encontró, turno por turno, coincide con la lectura manual:

- **Presentación**: "Body of Guardians" por Valley of Guardians, sin "trabajo solo" y sin los 10.000 usuarios. El coach dijo "exactly what I'm looking for" y no marcó el nombre.
- **Paneles**: "role low security". El coach sí lo marcó, pero dijo "spot on".
- **Links**: "every 2 minutes the links are expired", como si un timer los rotara a todos. Cada link vence 120 s después de firmarse. El coach dijo "That's spot on regarding how signed URLs work".
- **Pagos**: "listen in the iframe" y "looking for the same signature" en el navegador. El listener solo chequea `event.origin` y la forma del mensaje; la firma se verifica en el postback del servidor, y el mensaje del navegador nunca desbloquea nada (no lo dijo). El coach solo corrigió el término "postMessage".
- **Hitos**: no los sabía. El coach lo dijo, pero sin nombrar ni uno.
- **Próximos pasos**: "founded" por funded, sin "cada miércoles en staging". El cierre mencionó "funded" como corrección de inglés.
- Ninguna repregunta sobre lo que él dijo: cada turno saltaba a un tema nuevo del guion.

| Llamada del dueño (Nathalie, nivel 2) | valor |
|---|---|
| errores técnicos en sus respuestas | 3 |
| corregidos por el coach (recall) | 0 |
| puntos clave faltantes / nombrados | 17 / 0 |
| elogio con error o faltante | 0,67 |
| términos clave mal transcriptos / marcados | 2 / 1 |
| respuestas vagas presionadas | 0 de 2 |
| repreguntas sobre su respuesta | 0,17 |
| el cierre nombra conceptos errados / qué practicar | 0 / 0 |

## 3. Qué cambió

Commits en `feature/aventura-track`:

- `b81e77b` **Simulacro exigente.** Las preguntas son datos (`interview.questions` en la lección): cada una con sus puntos clave y sus errores típicos, las de memoria (`must_know`, los seis hitos) comparadas ítem por ítem contra su drill canónico (`00-los-6-hitos-de-memoria`), y las sorpresas (`curveball`). Ocho sorpresas por defecto para cualquier lección (precio, mostrar código, uso de IA, salir de Upwork, enfermarse, agencias, NDA y propiedad, llamadas diarias) y doce propias de Brivel (sandbox de Centrobill tarde, reembolsos y contracargos, el 55 % en un reembolso, garantizar cero piratería, 500 paneles de una, el escáner que se equivoca, verificación de edad en Utah sin consejo legal, el precio de $2.700, arrancar sin el hito depositado, instalar una app, enfermarse un miércoles). Se sortean por entrevista: 1, 2 y 4 por nivel, una más con un entrevistador duro. El feedback va en orden fijo: error técnico contra la clave, lo que faltó decir, término clave irreconocible (`key_terms`), una o dos correcciones de inglés. Personas con `toughness`; "Nathalie (exigente)" y un "Cliente escéptico" por defecto.
- `d40c5ce` Primera medición después: el nivel 2 alterna tema y repregunta; fuera "spot on", "perfect", "exactly".
- `df49ab7` **Reporte escrito** al terminar (`/api/interview/report`): puntaje 0 a 3 por pregunta contra la clave, conceptos a corregir, lo que tenía que saber de memoria, términos, errores de inglés y tres drills para practicar, que se abren con un toque.
- Iteración final del prompt (sección 4): un orden de decisión para la próxima pregunta (vaga o errada: repregunta; una sorpresa cada tres preguntas; repregunta sobre lo nuevo; tema nuevo), un chequeo antes de cualquier elogio y nada de etiquetas "Nathalie here".

## 4. Antes y después

Nathalie nivel 2: 2 entrevistas por fila; nivel 3: 1. Archivos en `docs/research/voice-probe/2026-11-11-audit-*.json`. "before" es el prompt de `6a5184e` corrido con la misma rúbrica y el mismo plan.

| métrica | antes d2 | después d2 (`b81e77b`) | después d2 (`d40c5ce`) | antes d3 | exigente d3 (`d40c5ce`) |
|---|---|---|---|---|---|
| errores técnicos corregidos (recall) | 0 de 1 | 2 de 2 | 1 de 3 | 0 de 1 | 1 de 2 |
| precisión (sin inventar errores) | sin datos | 1 | 1 | sin datos | 1 |
| faltantes nombrados | 0,12 | 0,21 | 0,17 | 0,13 | 0,22 |
| elogio con error o faltante | 0,90 | 0,36 | 0,55 | 1,00 | 0,40 |
| contenido antes que inglés | 0,29 | 1,00 | 1,00 | 0,75 | 1,00 |
| vagas presionadas | 0,33 | 0,67 | 0,40 | 0 | 1,00 |
| repregunta sobre su respuesta | 0 | 0,14 | 0,19 | 0 | 0,25 |
| sorpresas por entrevista | 0 | 1 | 1 | 0 | 2 |
| el cierre nombra conceptos errados | 0,5 | 1 | 1 | 0 | 0 |
| el cierre dice qué practicar | 0 | 1 | 1 | 0 | 1 |
| corrección de inglés equivocada | 0 | 0 | 0 | 0 | 0 |
| primer audio p50 (ms) | 948 | 933 | 996 | 1029 | 1037 |
| turnos mudos | 0 | 0 | 0 | 0 | 0 |

Iteración final del prompt (orden de decisión para la próxima pregunta, chequeo antes de elogiar, una sorpresa cada tres preguntas, sin etiquetas "Nathalie here"), mismo plan y misma rúbrica:

| métrica | antes d2 | final d2 (`after4`) | antes d3 | exigente d3 (`after3`) |
|---|---|---|---|---|
| errores técnicos corregidos (recall) | 0 de 1 | 2 de 3 | 0 de 1 | sin errores en la corrida |
| precisión (sin inventar errores) | sin datos | 1 | sin datos | 0 marcados de más |
| faltantes nombrados | 0,12 | 0,29 | 0,13 | 0,10 |
| elogio con error o faltante | 0,90 | 0,36 | 1,00 | 0,25 |
| contenido antes que inglés | 0,29 | 1,00 | 0,75 | 1,00 |
| término clave mal dicho y marcado | 3 de 4 | 1 de 2 | 0 de 1 | 0 de 1 |
| vagas presionadas | 0,33 | 0,75 | 0 | 1,00 |
| repregunta sobre su respuesta | 0 | 0,19 | 0 | 0,38 |
| sorpresas por entrevista | 0 | 1,5 | 0 | 2 |
| el cierre: conceptos / de memoria / inglés / qué practicar | 0,5 / 0,5 / 1 / 0 | 1 / 1 / 1 / 1 | 0 / 0 / 1 / 0 | 0 / 1 / 1 / 1 |
| primer audio p50 (ms) | 948 | 1107 | 1029 | 863 |
| turnos mudos | 0 | 0 | 0 | 0 |

En la exigente d3 aparece lo que el dueño pidió: corta las vagas ("Sorry, be specific: what's the exact expiry time for the signed URLs...", "Sorry, I need you to know the plan by heart. What are weeks four, five, and six specifically?") y tira dos sorpresas (500 paneles de una, el sandbox de Centrobill tarde). Esa corrida dijo "Nathalie here:" antes de preguntar; la regla que lo prohíbe entró después y no está medida. La d3 intermedia (`after3`, sin la cadencia de sorpresas) dio repregunta 0,29 en d2 pero 0,5 sorpresas por entrevista: priorizar la repregunta se comía las sorpresas, por eso la cadencia.

Lectura:

- Lo que se arregló: ya no deja pasar un mecanismo mal explicado sin decir el correcto la mayoría de las veces, el contenido va antes que el inglés, aparecen las sorpresas, el cierre dice qué practicar y la versión exigente presiona las respuestas vagas. Cero errores inventados y cero correcciones de inglés equivocadas en todas las corridas.
- Lo que sigue flojo en la voz: la repregunta sobre lo que el candidato dijo (de 0 a 0,2 en d2 y 0,38 en la exigente, lejos de alternar); los faltantes nombrados (0,3); y el elogio todavía aparece reformulado ("your answer hit all the key points") en un tercio a la mitad de los turnos con faltantes. El modelo de voz sigue mejor la estructura del turno que los chequeos finos. Por eso el reporte escrito existe: es la red que no depende de la voz.
- El reporte escrito sobre la llamada real del dueño (`docs/research/voice-probe/2026-11-11-report-owner-mock.json`, DeepSeek, 10 s): lista los 4 conceptos errados (incluidos "every 2 minutes" y "listen in the iframe ... same signature"), "Body of Guardians" → Valley of Guardians y "founded" → funded, pone los hitos en 0 de 3 con las seis semanas faltantes y elige para practicar `00-los-6-hitos-de-memoria`, `03-links-120-segundos` y `02-pago-iframe-centrobill`. Es lo que el coach en vivo no le dijo.

## 5. El tutor de la lección: el corte y el inglés

Pedido del dueño: "corta de la nada: 'Sesión completada'". No era un tiempo: el prompt le decía al modelo que dijera "session complete" cuando juzgara cubiertas las ideas, y el hook cortaba con eso a los 15 s (o con un "nos vemos" a los 30 s).

Cambio (`966dcee`, `d40c5ce`): la regla vive en `src/lib/voice/session-end.ts`. En el tutor de la lección la frase de cierre solo cuenta justo después de que el alumno acepta terminar o pide parar (o pasados 10 minutos, si lo dijo con palabras que la regla no conoce); una despedida nunca corta. El prompt, al cubrir las ideas, resume y pregunta si sigue o pasa al quiz. Lecciones con drills (inglés): cada idea primero en castellano y después la misma idea en inglés, con una o dos correcciones "you said ..., say ...".

Productor: `npx tsx scripts/probe-voice-tutor.ts --mode learning --bilingual --closing --runs 2 --turns 6`. Después del plan, el alumno dice "Creo que ya vimos bastante, ¿no?" (no es un sí) y después "Sí, pasemos al quiz.".

| tutor de la lección | antes (`6a5184e`) | después (`d40c5ce`) |
|---|---|---|
| dijo la frase de cierre antes del sí | 1 de 2 sesiones | 0 de 2 |
| preguntó en vez de cerrar | 0 de 2 | 2 de 2 |
| cerró después del sí | 0 de 2 | 2 de 2 |
| la app habría cortado antes del sí | 0 de 2 | 0 de 2 |
| turnos que piden decirlo en inglés | 0 | 0,33 |
| respuestas en inglés del alumno | 0 | 4 |
| corrección "you said ..., say ..." tras una respuesta en inglés | sin datos | 0 de 4 |

Archivos: `2026-11-11-learning-end-{before,after,after2}.json`. El "antes" ni siquiera cerraba: decía "session complete" ante "ya vimos bastante" y después contestaba "ya dimos por terminada la sesión". La alternancia castellano → inglés aparece; la corrección de inglés después de la respuesta en inglés todavía no (en esas 4 el inglés simulado casi no tenía errores, así que el dato es débil).

## 6. Todo en una vista

Pedido del dueño: todo integrado en `/learn/interview-brivel-call` (`1874d68`). Cada sección termina con sus drills ("Decilo en inglés", todos los modos ahí mismo); APPLY pasa a ser **Practicar** con todos los drills por grupo y el índice lateral marcando lo practicado; el último paso es **Entrevista**, en la misma vista. `?step=practice&drill=<id>&mode=<modo>` y `?step=interview` abren cada cosa; `/resource/<id>/practice` redirige ahí.

## 7. Lo que no se pudo verificar o quedó abierto

- **Migración pendiente**: `supabase/migrations/20261111030000_lesson_drill_concept.sql` (una columna nullable, `lesson_drills.concept_id`) no se aplicó: el clasificador de permisos frenó `supabase db push`. Hasta aplicarla, los drills no aparecen bajo cada sección: están todos en "De memoria" dentro de Practicar. Para aplicarla: `supabase db push` y `npx tsx scripts/seed-lesson.ts ~/Desktop/_docs/empleo/brivel/leccion-brivel.json`.
- Nada de esto se vio en un navegador con sesión iniciada: tipos, tests, compilación de las rutas y la redirección sí; lo visual lo verifica el dueño.
- Las sondas son texto, no voz: no miden cómo suena ni la transcripción de su acento. El nombre mal transcripto se probó escrito.
- Inconsistencia en la lección (no se tocó): el drill `07-usaste-centrobill` dice "we test it with sandbox purchases in week six" y `30-hito-4` dice semana cuatro.
