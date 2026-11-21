# Sesiones de gemini-3.8-live que no escuchan el micrófono

2026-11-20. Origen: la sesión 522c1b71 del dueño en el simulacro de coding (150 s hablando, 1893 trozos de audio enviados, ninguna transcripción de entrada, y a los dos minutos el check-in "could you talk me through what you're writing?").

## Qué es

Una sesión Live que abre, dice su saludo, y después no toma el audio del micrófono: no llega `inputTranscription`, no contesta nada de lo dicho, y sí contesta un turno de texto (`sendClientContent` con `turnComplete`). No se cierra el socket ni llega error. Dura toda la sesión.

## Cuánto pasa

28 sesiones contra la API real, con voz sintetizada (`say`) mandada como audio de micrófono en tiempo real:

| Qué se mandó además del audio | Sesiones | Sordas |
|---|---|---|
| Nada, o una nota antes de hablar, o VAD manual | 20 | 2 |
| Una nota de texto a mitad de la frase (`sendClientContent` sin `turnComplete`, o `sendRealtimeInput` de texto) | 8 | 3 |

Productores: `scripts/probe-coding-mock-audio.ts` (`coding-mock-audio-before*.json`, 9 sesiones, 2 sordas, las dos con nota a mitad de frase), `scripts/probe-coding-mock-turns.ts` (`coding-mock-turns-*.json`, 7 sesiones, 1 sorda, sin notas) y `scripts/probe-live-deaf.ts none,mid,before 4` (12 sesiones: `none` 1 de 4, `mid` 1 de 4, `before` 0 de 4).

Lectura: pasa sin mandar nada (2 de 20), así que la nota no es la causa. Con una nota a mitad de la frase pasó más (3 de 8); con tan pocas sesiones no alcanza para afirmarlo (Fisher, p ≈ 0,09), pero alcanza para no mandarlas ahí.

## Qué hace Jarre

1. **La detecta y la reemplaza.** `MicActivity` (`src/lib/voice/mic-activity.ts`) mide la voz en el mismo PCM que se manda. La regla vigente está en "La regla, corregida" más abajo. El hook (`use-voice-session.ts`, "A session that does not hear") abre un socket nuevo sin handle, le da la conversación hasta ahí y una línea para que el tutor diga que lo perdió un momento y pida repetir. Hasta 3 veces por sesión; después queda el aviso "No te escucho" en pantalla.
2. **No manda texto encima de la voz.** En el simulacro toda nota espera un momento de silencio (`quietToSend`, `src/lib/coding/mock-runtime.ts`).
3. **Lo deja medido.** `client_diag` de la sesión guarda `micPeak`, `micVoiceMs`, `micNoSignalMs` y un evento `deaf_restart` por reemplazo.

## La regla, corregida (2026-11-20, noche)

La primera regla era "4 s de voz y 15 s sin ninguna transcripción, contados desde que empezó a hablar". Reemplazaba sesiones sanas: el dueño lo vio como "Jarre sigue desconectando el micrófono".

- **Lo que pasó.** Las tres sesiones de esa noche de más de un minuto tuvieron reemplazos: `43ac6d19` (uno a los 59,5 s, y lo que venía diciendo llegó transcripto 10 s después del reemplazo), `1b65bd70` (tres en 238 s, con respuestas suyas de 26 y 30 s transcriptas enteras) y `56a3b178` (uno). En cada una el entrevistador lo cortó con "Sorry, I lost you for a moment" y él recargó la página.
- **Por qué.** Una sesión sana de `gemini-3.8-live` no transcribe mientras uno habla: manda la transcripción cuando el servidor cierra el turno, o en tandas de unos 20 s. `scripts/probe-live-long-utterance.ts` (`long-utterance-2026-11-20-before.json` y `-after.json`, dos corridas): 40 s de voz seguida, primer fragmento a los 21,0 y 20,9 s; 48 s de voz con pausas de 1,5 s, primer fragmento a los 51,0 s (3,1 s después de la última palabra) y a los 23,9 s. Con la regla vieja el aviso saltaba a los 15,3 s en las cuatro; con la nueva, en ninguna.
- **La regla nueva.** Se cuenta desde el final de lo que dijo, no desde el principio: 4 s de voz en lo último que dijo, después silencio en el micrófono por la ventana de fin de turno de la sesión más 8 s (10,5 s en el simulacro), y ninguna transcripción. Además: lo que suena pegado a una tecla no cuenta como voz no transcripta (el teclado), un ruido corto se olvida en vez de sumarse, lo dicho mientras el socket se reemplaza no cuenta, y un reemplazo no arranca si ya hay otra reconexión en curso. Tests: `src/lib/voice/__tests__/mic-activity.test.ts`, `mic-watch.test.ts`.
- **Lo que cuesta.** Una sesión sorda de verdad se detecta unos 10 s después de que él se calla, no a los 15 s de empezar. Si habla sin parar a una sesión sorda, se detecta cuando para.

## Qué queda escrito de cada sesión

`voice_sessions.client_diag` (se lee con una consulta por id): `deaf_restart`, `socket_close` con código y motivo, `reconnect_wait`, `reconnected` con el camino, `mic_ended`, `mic_muted`, `mic_unmuted`, `mic_context`, `mic_no_signal`, `mic_restarted`, `page_hidden`, `page_visible`, `tempo`, y los contadores `micPeak`, `micVoiceMs`, `micNoSignalMs`, `micUnheard`, `micLabel`. Una recarga ya no lo pierde: la sesión lo guarda cada 15 s y al irse la página (`src/lib/voice/diag-checkpoint.ts`), y quien la cierra después lo manda (`endReason` "resent (pagehide)"). Las tres sesiones de arriba se cerraron sin nada por eso. En el simulacro hay una línea chica con lo mismo en vivo (`micStatusLine`, `src/lib/voice/mic-watch.ts`).

## Sin resolver

- Por qué pasa. No hay señal del servidor.
- Detectarla mientras habla: la transcripción de entrada llega al cerrar el turno aun en una sesión sana, así que no hay señal antes de que se calle.
