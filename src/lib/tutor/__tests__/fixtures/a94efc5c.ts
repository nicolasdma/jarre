/**
 * The owner's session a94efc5c (2026-11-18, 3y-health-tecnica-v2, section 3 Two Sum),
 * from ~/Desktop/_revisar/jarre-tutor/2026-11-18-charlas.md, and the digest a
 * correct extraction gives for it (written by hand from the transcript, the
 * recorded answer the tests use instead of calling DeepSeek).
 */
import type { DigestOutput } from "../../evidence";

export const A94_TRANSCRIPT: { seq: number; role: "user" | "model"; text: string; timestamp: string }[] = [
  {
    "seq": 1,
    "role": "model",
    "text": "Si te dan el array y el target, antes de tirar código, ¿qué preguntas clave le hacés al entrevistador para definir el alcance del problema?",
    "timestamp": "2026-11-18T20:58:41.000Z"
  },
  {
    "seq": 2,
    "role": "user",
    "text": "yet",
    "timestamp": "2026-11-18T20:58:43.000Z"
  },
  {
    "seq": 3,
    "role": "model",
    "text": "¿qué tres o cuatro preguntas le harías al entrevistador para aclarar los requerimientos antes de empezar a tirar código?",
    "timestamp": "2026-11-18T20:58:50.000Z"
  },
  {
    "seq": 4,
    "role": "user",
    "text": "Le preguntaría si los datos si el resultado puede ser negativo, si los números se repiten o si están ordenados.",
    "timestamp": "2026-11-18T20:59:03.000Z"
  },
  {
    "seq": 5,
    "role": "model",
    "text": "Esas tres preguntas son clave para descartar casos borde. Pensando en el rendimiento, ¿qué información necesitarías sobre el tamaño del array para saber si una fuerza bruta es viable o no?",
    "timestamp": "2026-11-18T20:59:13.000Z"
  },
  {
    "seq": 6,
    "role": "user",
    "text": "A ver qué tanto crece, o sea, si es N infinito o o sea, más de 1 millón de datos o menos de 10.000.",
    "timestamp": "2026-11-18T20:59:24.000Z"
  },
  {
    "seq": 7,
    "role": "model",
    "text": "Exacto, con cien mil elementos, una solución cuadrática tardaría demasiado. Ahora decímelo en inglés, como se lo dirías al cliente o entrevistador.",
    "timestamp": "2026-11-18T20:59:33.000Z"
  },
  {
    "seq": 8,
    "role": "user",
    "text": "Eh, no, no sé. Igual esta sección no la entendí, me gustaría más que me la expliques.",
    "timestamp": "2026-11-18T20:59:40.000Z"
  },
  {
    "seq": 9,
    "role": "model",
    "text": "Claro, cuando el array tiene muchos elementos, como cien mil, una fuerza bruta que compara cada par tardaría demasiado tiempo. Para optimizar, usamos un mapa para guardar lo que ya vimos y encontrar el complemento al instante. ¿Qué pasaría si intentaras buscar el complemento antes de guardar el número actual en el mapa?",
    "timestamp": "2026-11-18T20:59:59.000Z"
  },
  {
    "seq": 10,
    "role": "user",
    "text": "estarías mirando un número desactualizado, entonces nunca lo encontrarías. Igualmente no entiendo la técnica, explícame la técnica en detalle.",
    "timestamp": "2026-11-18T21:00:12.000Z"
  },
  {
    "seq": 11,
    "role": "model",
    "text": "La idea es guardar cada número y su índice en un mapa mientras recorres el array. Para cada número, calculas cuánto te falta para llegar al target o sea, el complemento y te fijas en el mapa si ya lo vimos. Si está, ya tenés la respuesta; si no, guardas este número y su índice y seguis. ¿Por qué chequeamos el mapa antes de insertar el número actual?",
    "timestamp": "2026-11-18T21:00:24.000Z"
  },
  {
    "seq": 12,
    "role": "user",
    "text": "Pero para, pero, ¿qué es el complemento? O sea, ¿cuál es el target?",
    "timestamp": "2026-11-18T21:00:29.000Z"
  },
  {
    "seq": 13,
    "role": "model",
    "text": "El target es el número final que querés alcanzar al sumar dos valores. Por ejemplo, si el target es nueve y estás en el número dos, tu complemento es siete, o sea, lo que le falta al dos para llegar a nueve.",
    "timestamp": "2026-11-18T21:00:41.000Z"
  },
  {
    "seq": 14,
    "role": "user",
    "text": "Aunque eso sí lo entiendo, pero explícame el enunciado. ¿Cuál es el ejercicio? Empezar desde el principio.",
    "timestamp": "2026-11-18T21:00:50.000Z"
  },
  {
    "seq": 15,
    "role": "model",
    "text": "El ejercicio consiste en que te dan una lista de números y un valor objetivo. Tenés que encontrar cuáles dos números suman ese objetivo y devolver sus posiciones o índices en el array. Ahora, decímelo en inglés.",
    "timestamp": "2026-11-18T21:01:02.000Z"
  },
  {
    "seq": 16,
    "role": "user",
    "text": "Aha, entendido. The objective is to find a number. No, you have an objective number and you need to find which two numbers in an array if you sum them you find that objective number. So you need to find the numbers and the position in the array. ¿Correcto?",
    "timestamp": "2026-11-18T21:01:27.000Z"
  },
  {
    "seq": 17,
    "role": "model",
    "text": "Correcto. En inglés, para sonar más natural, en vez de decir \"find that objective number\", podés decir \"they add up to the target\". ¿Querés que pasemos a ver cómo se implementa con el mapa?",
    "timestamp": "2026-11-18T21:01:39.000Z"
  },
  {
    "seq": 18,
    "role": "user",
    "text": "No, no, seguimos pensando. O sea, yo lo que quiero hacer es comprenderlo, vamos de a poco. Entonces, ya tengo muy claro el objetivo. Ahora, en fuerza bruta, ¿cómo lo haríamos? Si lo hacemos en fuerza bruta, si el array es muy corto, ¿qué hacemos? Comparamos cada número con el siguiente sumando y viendo el resultado a ver si es el target o no hasta encontrar el objetivo. Eso sería fuerza bruta, ¿no es cierto?",
    "timestamp": "2026-11-18T21:02:04.000Z"
  },
  {
    "seq": 19,
    "role": "model",
    "text": "Exacto, comparás cada número con los demás para ver cuáles suman el target. En términos de complejidad de tiempo, ¿cómo describirías ese proceso de usar bucles anidados?",
    "timestamp": "2026-11-18T21:02:15.000Z"
  },
  {
    "seq": 20,
    "role": "user",
    "text": "Ayer lo había visto y me olvidé. Era algo como No, no, me olvidé, che. O uno, no, o n log n sería porque tenés dos for.",
    "timestamp": "2026-11-18T21:02:34.000Z"
  },
  {
    "seq": 21,
    "role": "model",
    "text": "Casi. Como tenés un bucle adentro de otro, comparando cada elemento con todos los demás, la complejidad de tiempo es cuadrática. ¿Cómo se escribe eso en notación Big O?",
    "timestamp": "2026-11-18T21:02:40.000Z"
  },
  {
    "seq": 22,
    "role": "user",
    "text": "o o n al cuadrado",
    "timestamp": "2026-11-18T21:02:44.000Z"
  },
  {
    "seq": 23,
    "role": "model",
    "text": "Correcto, O of n squared. ¿Cómo expresarías esa idea en inglés para usarla en una entrevista?",
    "timestamp": "2026-11-18T21:02:49.000Z"
  },
  {
    "seq": 24,
    "role": "user",
    "text": "Pero qué pesado con la entrevista. Te estoy pidiendo que me lo expliques.",
    "timestamp": "2026-11-18T21:02:57.000Z"
  },
  {
    "seq": 25,
    "role": "model",
    "text": "Perdón, tenés razón, me enfoqué demasiado en eso. La complejidad cuadrática significa que si duplicas el tamaño del array, el tiempo que tarda el algoritmo se multiplica por cuatro. ¿Se entiende ese impacto en el rendimiento?",
    "timestamp": "2026-11-18T21:03:10.000Z"
  },
  {
    "seq": 26,
    "role": "user",
    "text": "¿Me lo repetís, por favor?",
    "timestamp": "2026-11-18T21:03:14.000Z"
  },
  {
    "seq": 27,
    "role": "model",
    "text": "La complejidad cuadrática significa que si duplicas el tamaño del array, el tiempo que tarda el algoritmo se multiplica por cuatro. ¿Se entiende ese impacto en el rendimiento?",
    "timestamp": "2026-11-18T21:03:24.000Z"
  },
  {
    "seq": 28,
    "role": "user",
    "text": "Sí, o sea, crece el tiempo crece exponencialmente a medida que crece el array, ¿no es cierto? No es lineal.",
    "timestamp": "2026-11-18T21:03:34.000Z"
  },
  {
    "seq": 29,
    "role": "model",
    "text": "No es exponencial, sino cuadrático. Crece según el cuadrado del tamaño del array, no exponencialmente. ¿Ves la diferencia entre ambos crecimientos?",
    "timestamp": "2026-11-18T21:03:43.000Z"
  },
  {
    "seq": 30,
    "role": "user",
    "text": "Sí, pero ¿por qué es cuadrático?",
    "timestamp": "2026-11-18T21:03:47.000Z"
  },
  {
    "seq": 31,
    "role": "model",
    "text": "Es cuadrático porque para cada elemento del array recorres todo el array de nuevo para buscar su pareja. Esa repetición de búsquedas genera ese crecimiento al cuadrado.",
    "timestamp": "2026-11-18T21:03:57.000Z"
  },
  {
    "seq": 32,
    "role": "user",
    "text": "A, claro, claro, claro, puedes correr número por número por cada número, entonces si se duplica el array, tenés cuatro veces. Bueno, sí, yo entendí más o menos. ¿Cómo seguimos?",
    "timestamp": "2026-11-18T21:04:12.000Z"
  },
  {
    "seq": 33,
    "role": "model",
    "text": "Para optimizar, usamos un mapa que guarda cada número y su índice. Así, mientras recorres, calculas el complemento y te fijas si ya lo viste. ¿Cómo explicarías este trade-off entre memoria y velocidad?",
    "timestamp": "2026-11-18T21:04:24.000Z"
  },
  {
    "seq": 34,
    "role": "user",
    "text": "O sea, entonces para optimizar en vez de ver cada número, o sea, si vos ya pasaste por ese número, le guardas el índice, entonces bueno, en este índice está este número. Eh, eso es lo que hace el trade-off es que tenés que guardarlo en algún lado, o sea, tenés que ocupar memoria, pero te movés más rápido, ¿por qué? Porque no tenés que revisar todos los números con todos los números, sino que una vez que ya hiciste una pasada, ya sabes a dónde están todos los números, ¿o qué?",
    "timestamp": "2026-11-18T21:04:58.000Z"
  },
  {
    "seq": 35,
    "role": "model",
    "text": "Es tal cual lo describís: usás más memoria para guardar los elementos y sus índices, pero a cambio lográs buscar el complemento en tiempo constante, sin necesidad de recorrer todo el array de nuevo por cada número. Ahora, decímelo en inglés.",
    "timestamp": "2026-11-18T21:05:12.000Z"
  },
  {
    "seq": 36,
    "role": "user",
    "text": "No, no, pero para eh bueno, lo que guardás son los índices, o sea, con un map un map básicamente es clave valor. La clave es el índice y el valor es el número. ¿No es cierto? Eh, ¿así sería? Y y pero y ¿cómo los encontrás después? ¿Cómo sabés que el ese índice está ese valor?",
    "timestamp": "2026-11-18T21:05:33.000Z"
  },
  {
    "seq": 37,
    "role": "model",
    "text": "En realidad, es al revés: la clave es el número y el valor es su índice. Así, para buscar el complemento, usás el número que te falta y el mapa te devuelve el índice correspondiente si ya lo recorriste. ¿Se entiende la lógica de esa búsqueda?",
    "timestamp": "2026-11-18T21:05:47.000Z"
  }
];

export const A94_DIGEST: DigestOutput = {
  items: [
    { kind: 'tutor_question', section: 3, verdict: 'correct', resolved: null, statement: '¿Qué preguntas le hacés al entrevistador para definir el alcance antes de codear?', quote: 'si el resultado puede ser negativo, si los números se repiten o si están ordenados', seq: 4 },
    { kind: 'tutor_question', section: 3, verdict: 'correct', resolved: null, statement: '¿Qué necesitás saber del tamaño del array para decidir si la fuerza bruta es viable?', quote: 'más de 1 millón de datos o menos de 10.000', seq: 6 },
    { kind: 'asked_help', section: 3, verdict: null, resolved: null, statement: 'Pidió que le expliquen la técnica de Two Sum, empezando por el enunciado.', quote: 'Igual esta sección no la entendí, me gustaría más que me la expliques.', seq: 8 },
    { kind: 'tutor_question', section: 3, verdict: 'partial', resolved: null, statement: '¿Por qué se chequea el complemento en el mapa antes de insertar el número actual?', quote: 'estarías mirando un número desactualizado, entonces nunca lo encontrarías', seq: 10 },
    { kind: 'explained', section: 3, verdict: 'correct', resolved: null, statement: 'Dijo el enunciado de Two Sum: dos números del array que suman el objetivo, y sus posiciones.', quote: 'you have an objective number and you need to find which two numbers in an array if you sum them you find that objective number', seq: 16 },
    { kind: 'english', section: 3, verdict: null, resolved: null, statement: 'Dijo "find that objective number"; mejor "they add up to the target".', quote: null, seq: 17 },
    { kind: 'preference', section: null, verdict: null, resolved: null, statement: 'Quiere entender de a poco, paso a paso, antes de avanzar.', quote: 'yo lo que quiero hacer es comprenderlo, vamos de a poco', seq: 18 },
    { kind: 'explained', section: 3, verdict: 'partial', resolved: null, statement: 'Describió la fuerza bruta: comparar cada número con los demás buscando el target.', quote: 'Comparamos cada número con el siguiente sumando y viendo el resultado a ver si es el target o no', seq: 18 },
    { kind: 'gap', section: 2, verdict: 'unknown', resolved: null, statement: 'No recordaba la complejidad de dos for anidados.', quote: 'Ayer lo había visto y me olvidé', seq: 20 },
    { kind: 'misconception', section: 2, verdict: 'wrong', resolved: true, statement: 'Dos for anidados son O(n²), no O(n log n); n log n es lo que cuesta ordenar.', quote: 'o n log n sería porque tenés dos for', seq: 20 },
    { kind: 'preference', section: null, verdict: null, resolved: null, statement: 'No pedirle inglés ni hablar de la entrevista mientras pide que le expliquen.', quote: 'Pero qué pesado con la entrevista. Te estoy pidiendo que me lo expliques.', seq: 24 },
    { kind: 'misconception', section: 2, verdict: 'wrong', resolved: true, statement: 'El crecimiento de dos for anidados es cuadrático, no exponencial.', quote: 'crece el tiempo crece exponencialmente a medida que crece el array', seq: 28 },
    { kind: 'misconception', section: 3, verdict: 'wrong', resolved: false, statement: 'Después de una pasada el mapa no tiene todos los números: solo los ya recorridos, por eso se busca el complemento antes de insertar.', quote: 'una vez que ya hiciste una pasada, ya sabes a dónde están todos los números', seq: 34 },
    { kind: 'explained', section: 3, verdict: 'correct', resolved: null, statement: 'Explicó el trade-off: más memoria a cambio de no recorrer todo por cada número.', quote: 'tenés que ocupar memoria, pero te movés más rápido', seq: 34 },
    { kind: 'misconception', section: 3, verdict: 'wrong', resolved: false, statement: 'En el mapa la clave es el número y el valor su índice, no al revés: se busca por el número que falta.', quote: 'La clave es el índice y el valor es el número', seq: 36 },
  ],
};
