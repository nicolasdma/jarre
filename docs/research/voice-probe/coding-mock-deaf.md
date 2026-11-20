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

1. **La detecta y la reemplaza.** `MicActivity` (`src/lib/voice/mic-activity.ts`) mide la voz en el mismo PCM que se manda. Con 4 s de voz y 15 s sin ninguna transcripción, el hook (`use-voice-session.ts`, "A session that does not hear") abre un socket nuevo sin handle, le da la conversación hasta ahí y una línea para que el tutor diga que lo perdió un momento y pida repetir. Hasta 3 veces por sesión; después queda el aviso "No te escucho" en pantalla.
2. **No manda texto encima de la voz.** En el simulacro toda nota espera un momento de silencio (`quietToSend`, `src/lib/coding/mock-runtime.ts`).
3. **Lo deja medido.** `client_diag` de la sesión guarda `micPeak`, `micVoiceMs`, `micNoSignalMs` y un evento `deaf_restart` por reemplazo.

## Sin resolver

- Por qué pasa. No hay señal del servidor.
- Detectarla antes de los 15 s: la transcripción de entrada llega tarde aun en una sesión sana (10,9 s dentro de una frase de 12,9 s).
