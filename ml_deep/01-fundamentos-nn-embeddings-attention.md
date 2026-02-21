# Sesión 1: Fundamentos de Neural Networks, Embeddings y Attention

**Fecha:** 2026-02-21
**Formato:** Conversación socrática — ida y vuelta real
**Nivel inicial:** Cero ML, base en sistemas distribuidos y software engineering

---

## Contexto

Nico quiere ser AI/LLM Systems Architect. Tiene base en sistemas distribuidos (DDIA) y software engineering, pero cero ML. Decidimos estudiar juntos, empezando desde cero, sin videos ni papers — concepto por concepto, con validación constante.

### Panorama: ¿Qué estudian los que hacen ML hoy?

**Los que construyen modelos (Research/Training):**
- Matemáticas pesadas: álgebra lineal, cálculo multivariable, probabilidad
- Arquitecturas: Transformers, Mixture of Experts, State Space Models (Mamba)
- Training: pre-training masivo, RLHF, DPO, Constitutional AI
- Infraestructura: CUDA, distributed training, DeepSpeed, FSDP
- Papers semanales (arXiv es su biblia)

**Los que construyen con modelos (Applied ML / AI Engineering) — el camino de Nico:**
- Cómo funcionan los Transformers (no necesitás entrenar uno desde cero)
- Prompting avanzado, function calling, structured outputs
- RAG: embeddings, vector DBs, chunking strategies, reranking
- Agents: ReAct, tool use, planning, memory
- Evaluación: cómo medir si tu sistema funciona
- System design: latencia, costo, routing, fallbacks
- Guardrails: seguridad, validación de outputs

### El futuro

Casi nadie va a entrenar foundation models. Eso lo hacen OpenAI, Anthropic, Google, Meta, DeepSeek — con miles de millones de dólares en GPUs. El futuro para el 99% es **AI Engineering**: construir sistemas inteligentes SOBRE estos modelos. Y ahí es donde hay una escasez brutal de gente que entienda tanto el ML como la ingeniería de software.

### Plan de estudio propuesto

**Semana 1-2: Transformers desde cero**
1. "Attention Is All You Need" — el paper original
2. 3Blue1Brown: Neural Networks — intuición visual
3. Karpathy: "Let's build GPT" — implementación paso a paso

**Semana 3-4: LLMs en práctica**
4. Cómo funciona el training (pre-training → fine-tuning → RLHF)
5. Tokenización (BPE, SentencePiece)
6. Inference (KV cache, sampling, temperature)

**Semana 5-6: Construir con LLMs**
7. RAG end-to-end
8. Agents y tool use
9. Evaluación de sistemas LLM

---

## Lección 1: ¿Qué es una red neuronal?

### La definición real

Olvidate de la palabra "neuronal". Es marketing de los años 50. Lo que realmente es:

**Una red neuronal es una función matemática que aprende patrones ajustando números.**

### Paso 1: Una neurona = una decisión simple

Imaginate que querés decidir si una foto es un gato o no. Una "neurona" hace esto:

```
entrada × peso + sesgo = resultado
```

Ejemplo concreto:

```
tiene_bigotes = 1      (sí)
tiene_orejas_puntiagudas = 1  (sí)
ladra = 0              (no)

peso_bigotes = 0.8
peso_orejas = 0.6
peso_ladra = -0.9
sesgo = -0.5

resultado = (1 × 0.8) + (1 × 0.6) + (0 × -0.9) + (-0.5)
resultado = 0.8 + 0.6 + 0 - 0.5
resultado = 0.9   → "probablemente gato"
```

**Los pesos son la opinión de la neurona** sobre qué tan importante es cada entrada. Un peso alto = "esto importa mucho". Un peso negativo = "esto va en contra".

### Paso 2: ¿De dónde salen los pesos?

**Nadie los programa.** Empiezan como números random y la red los va ajustando viendo miles de ejemplos.

El proceso es:

```
1. Metés un ejemplo (foto de gato)
2. La red da una respuesta (probablemente mal al principio)
3. Comparás con la respuesta correcta → calculás el ERROR
4. Ajustás los pesos un poquito para que el error sea menor
5. Repetí 1,000,000 de veces
```

Ese paso 4 se llama **backpropagation** y es literalmente cálculo diferencial — derivadas. La derivada te dice "si muevo este peso un poquito hacia arriba, ¿el error sube o baja?" Y lo movés en la dirección que lo baja.

### Paso 3: ¿Por qué "red"?

Porque una neurona sola es inútil. Pero si apilás **capas** de neuronas:

```
Entrada → [Capa 1: 128 neuronas] → [Capa 2: 64 neuronas] → [Salida: 1 neurona]
```

Cada capa detecta patrones más abstractos:
- **Capa 1**: bordes, líneas, colores
- **Capa 2**: formas (orejas, ojos)
- **Capa 3**: conceptos ("cara de gato")

Eso es el "deep" de deep learning — **muchas capas apiladas**.

---

## Checkpoint 1: Validación

**Pregunta:** ¿Qué representan los pesos en una red neuronal? ¿Por qué necesitamos muchos ejemplos para entrenar? Si una neurona da un resultado incorrecto, ¿qué se ajusta y cómo sabemos hacia dónde?

### Respuesta de Nico:

> "Representan valores que le da la neurona a una palabra?"

**Corrección:** Los pesos no son específicos a palabras — son la importancia que la neurona le da a cada entrada. Si una entrada tiene peso alto, la neurona "escucha" mucho esa señal. Si tiene peso cercano a cero, la ignora. Si es negativo, va en contra. Pensalo como una perilla de volumen para cada entrada.

> "Necesitamos muchos ejemplos porque se autoajusta, empezas y esta todo super mal, pero lo vas corrigiendo, o se va auto corrigiendo, hasta que se calibra y ya 'entiende' el lenguaje?"

**Correcto.** Empieza todo mal, se va corrigiendo, y con suficientes ejemplos los pesos convergen a valores que funcionan.

> "Si es incorrecto ajusta alguna de las perillas, pero no sabemos hacia donde, vemos si ese ajuste es mejor o peor, si es mejor lo dejamos si es peor lo revertimos? Pero si son 1000000000 perillas, como sabemos cuales afectan positivo o negativo a la larga? ¿Se prueban TODAS las combinaciones posibles?"

**LA PREGUNTA DE ORO.** La intuición de probar combinaciones no escala. GPT-4 tiene ~1.8 trillones de parámetros. Probar combinaciones es imposible.

---

## No probamos. Calculamos.

Imaginate que estás en una montaña con niebla. No ves nada. Querés llegar al punto más bajo del valle (el error mínimo). Tenés dos opciones:

**Opción A (prueba y error):** Saltás a lugares random y ves si es más bajo. No escala.

**Opción B (lo que se hace):** Tocás el piso con el pie y sentís **la inclinación**. Si el piso baja hacia la izquierda, caminás hacia la izquierda. No necesitás ver todo el mapa — solo necesitás saber **la pendiente donde estás parado**.

Eso es lo que hace el cálculo diferencial. La **derivada** te dice exactamente eso: la pendiente.

```
Para CADA perilla, calculás:

  "Si muevo esta perilla un poquito,
   ¿el error sube o baja, y cuánto?"

Eso es la derivada del error respecto a esa perilla.
```

El truco de backpropagation es que podés calcular **todas las derivadas de todas las perillas a la vez** en una sola pasada, gracias a la regla de la cadena del cálculo:

```
Capa 3 → "mi error es X"
Capa 2 → "mi contribución al error de Capa 3 fue Y"
Capa 1 → "mi contribución al error de Capa 2 fue Z"
```

Se propaga **hacia atrás** (back-propagation). Una pasada y tenés la dirección exacta para cada una de los 1.8 trillones de perillas.

### El loop real de training:

```
1. Metés un ejemplo
2. La red calcula un resultado           (forward pass)
3. Comparás con la respuesta correcta    (loss/error)
4. Calculás la pendiente de CADA perilla (backward pass)
5. Movés TODAS las perillas un poquito
   en la dirección que baja el error     (gradient descent)
6. Repetí millones de veces
```

No es prueba y error. Es **cálculo exacto de la dirección correcta**, repetido millones de veces con millones de ejemplos.

### Sobre "la perilla 500 depende de la 723"

Hay dependencias. La solución es que **no buscamos el ajuste perfecto de una vez**. Damos pasitos chiquitos (learning rate). Cada paso es imperfecto, pero en promedio, después de millones de pasos, converge. Es como bajar la montaña en la niebla: cada paso no es óptimo, pero si siempre vas cuesta abajo, eventualmente llegás al valle.

---

## Checkpoint 2: ¿Por qué muchos ejemplos?

**Pregunta:** Si backpropagation te da la dirección exacta para bajar el error... ¿por qué necesitamos millones de ejemplos? ¿No bastaría con uno solo para encontrar los pesos correctos?

### Respuesta de Nico:

> "Y no porque son millones de perillas. Esa sería una de las respuestas, o la otra, son millones de entradas? tipo color, borde, etc, miles de neuronas?"

**Corrección:** La respuesta real es más sutil.

### El problema de un solo ejemplo: OVERFITTING

Si entrenás con UNA sola foto de gato, la red va a aprender **esa foto específica**. Va a poner los pesos perfectos para que esa foto dé "gato". Pero le mostrás otro gato diferente y falla.

Es como si alguien solo vio UN gato en su vida — un gato negro llamado Michi. Después ve un gato naranja y dice "eso no es un gato, los gatos son negros".

Eso se llama **overfitting** — memorizar en vez de entender.

### Muchos ejemplos = generalización

```
Ejemplo 1:   gato negro, de frente     → "gato"
Ejemplo 2:   gato naranja, de costado  → "gato"
Ejemplo 3:   perro blanco, de frente   → "no gato"
Ejemplo 4:   gato gris, durmiendo      → "gato"
Ejemplo 5:   perro negro, de costado   → "no gato"
...
Ejemplo 100,000: ...
```

Con cada ejemplo, los pesos se ajustan un poquito. Los patrones que **solo aplican a una foto** se van cancelando. Los patrones que **aplican a TODOS los gatos** se van reforzando.

Después de miles de ejemplos, la red aprendió:
- Orejas puntiagudas → importante (aparece en todos los gatos)
- Fondo azul → irrelevante (a veces sí, a veces no, se cancela)
- Bigotes → importante
- Que sea de noche → irrelevante

**Los pesos convergen hacia lo que es universalmente cierto, no lo que es accidentalmente cierto en un ejemplo.**

### Resumen hasta acá:

```
Red neuronal = función que aprende ajustando perillas
Perillas     = pesos (importancia de cada entrada)
Training     = mostrarle millones de ejemplos
Backprop     = calcular hacia dónde mover cada perilla
Muchos datos = para que aprenda el patrón real,
               no memorice ejemplos específicos
```

---

## Lección 2: De texto a números

### El problema

Una red neuronal solo entiende números. No sabe qué es "gato" ni "el". Solo sabe multiplicar matrices. ¿Cómo convertís texto en números?

Son dos pasos: **Tokenización** y **Embeddings**.

---

## Paso 1: Tokenización — partir el texto en pedazos

No se trabaja con letras sueltas (muy granular) ni con palabras completas (hay infinitas). Se parte en **tokens** — pedazos intermedios.

```
"Understanding language models"
→ ["Under", "standing", " language", " models"]
```

Cada token tiene un número ID fijo en un diccionario:

```
"Under"     → 8432
"standing"  → 2891
" language" → 4517
" models"   → 7203
```

GPT-4 tiene un diccionario de ~100,000 tokens. Palabras comunes son un solo token. Palabras raras se parten en pedazos.

```
"gato"     → [gato]           (1 token, palabra común)
"backprop" → [back, prop]     (2 tokens)
"Nicolás"  → [Nic, ol, ás]   (3 tokens, nombre raro)
```

### Pregunta de Nico: ¿Qué pasa con errores ortográficos?

> "¿Cuántos tokens tiene 'tiene' vs 'tinee'? ¿O 'vaca' vs 'baca'?"

```
"tiene"  → [tiene]           (1 token, palabra común)
"tinee"  → [tin, ee]         (2 tokens, no existe en el diccionario)
```

El tokenizador no sabe español ni gramática. Solo sabe qué pedazos de texto aparecieron mucho en los datos de entrenamiento. "tiene" apareció millones de veces → tiene su propio token. "tinee" nunca apareció → lo parte en pedazos que sí conoce.

**Impacto en significado:**

```
"tiene"  → 1 token  → 1 embedding  → el modelo SABE qué significa
"tinee"  → 2 tokens → 2 embeddings → "tin" + "ee"
```

"tin" y "ee" tienen sus propios significados que no tienen nada que ver con "tiene". El modelo recibe basura semántica. **Por eso los LLMs a veces se confunden con typos** — literalmente reciben una secuencia de tokens diferente.

**"vaca" vs "baca":**

Si "baca" apareció muchas veces en textos donde la gente se equivocó, el modelo **aprendió** que en ciertos contextos "baca" = "vaca". No porque entienda ortografía, sino porque vio el patrón millones de veces.

**El punto clave:** El tokenizador es **ciego**. No entiende nada. Solo parte texto en pedazos conocidos. Toda la "inteligencia" viene después.

Por eso los LLMs:
- Manejan bien typos comunes (los vieron en el training)
- Fallan con typos raros (tokens sin sentido)
- Son malísimos contando letras ("¿cuántas R tiene strawberry?") — porque **nunca ven letras**, ven tokens

### Pregunta de Nico: ¿Si leyó muchas veces "baca", por qué no escribe "baca"?

Pura estadística. En los datos de entrenamiento:

```
"vaca" → apareció 10,000,000 de veces
"baca" → apareció 50,000 veces (errores ortográficos)
```

Cuando el modelo genera texto, en cada paso elige el **token más probable dado el contexto**. Y "vaca" gana por aplastamiento.

El modelo **sí aprendió que "baca" existe y que a veces la gente la usa**. Por eso si vos le escribís "la baca come pasto", te entiende perfecto. Pero cuando él genera texto, elige la versión que vio más.

**Esto explica algo importante:** Los LLMs escriben **mejor que el promedio de internet** porque el texto bien escrito es más consistente estadísticamente. Los errores ortográficos son ruidosos — cada persona se equivoca diferente. Pero la forma correcta es siempre la misma.

```
Formas incorrectas:  baca, bakka, vaka, bka...  (dispersas)
Forma correcta:      vaca                        (concentrada)
```

**Y también explica las alucinaciones:** El modelo no elige lo **verdadero**. Elige lo **probable**. Si un dato falso apareció mucho en internet, el modelo lo va a repetir con total confianza. No distingue verdad de popularidad.

---

## Paso 2: Embeddings — darle significado a cada número

El ID `8432` no significa nada. Es arbitrario. El modelo necesita algo más rico.

Un **embedding** es un vector — una lista de números que representa el *significado* de un token.

### La analogía: explicarle a un alien

¿Cómo le explicarías a un alien qué es un "perro"? No podés decirle la palabra "perro" porque no habla español. Entonces lo describís con características:

```
tamaño:        0.4  (mediano)
es_mascota:    0.9  (casi siempre)
tiene_patas:   1.0  (sí)
vuela:         0.0  (no)
es_peligroso:  0.3  (a veces)
```

Esos 5 números **son** un embedding. Una descripción numérica que captura el significado.

"Gato":
```
tamaño:        0.2  (chico)
es_mascota:    0.8  (casi siempre)
tiene_patas:   1.0  (sí)
vuela:         0.0  (no)
es_peligroso:  0.1  (rara vez)
```

Números parecidos → significado parecido.

"Avión":
```
tamaño:        0.9  (grande)
es_mascota:    0.0  (no)
tiene_patas:   0.0  (no)
vuela:         1.0  (sí)
es_peligroso:  0.4  (algo)
```

Números muy diferentes → significado muy diferente.

### La diferencia clave con la realidad

En el ejemplo usamos 5 dimensiones nombradas ("tamaño", "vuela"). En la realidad, un embedding tiene **768 o más dimensiones** y **nadie las nombró**. La red las aprendió sola.

### ¿Cómo se aprenden los embeddings?

Empiezan como números random — igual que los pesos. Se ajustan con backpropagation.

```
Inicio:
  "rey"  → [0.52, -0.11, 0.87, ...]   (random, sin sentido)
  "reina"→ [0.34, 0.76, -0.23, ...]   (random, sin sentido)

Después de ver millones de textos:
  "rey"  → [0.21, 0.83, 0.12, ...]
  "reina"→ [0.23, 0.79, 0.11, ...]    (¡se acercaron!)
```

¿Por qué se acercaron? Porque **aparecen en contextos similares**:

```
"el rey gobernó el reino"
"la reina gobernó el reino"
```

El modelo necesita predecir la siguiente palabra. Si "rey" y "reina" siempre van seguidos de las mismas palabras, sus embeddings **se ven forzados a parecerse** para que la predicción funcione.

Resultado famoso:
```
rey - hombre + mujer ≈ reina
París - Francia + Italia ≈ Roma
```

Esto no fue programado. **Emergió** de ver millones de textos.

### Concretamente, es una tabla

```
Token ID  →  Vector
0         →  [0.12, 0.54, -0.33, ...]    (768 números)
1         →  [0.87, -0.21, 0.45, ...]
2         →  [0.33, 0.09, 0.71, ...]
...
99,999    →  [0.56, 0.44, -0.12, ...]
```

100,000 tokens × 768 dimensiones = **76.8 millones de perillas** solo para los embeddings. Y eso es una fracción mínima del modelo total.

### El flujo completo:

```
"El gato duerme"
     ↓
[Tokenizar]
     ↓
[512, 8847, 23091]          ← IDs arbitrarios
     ↓
[Embedding lookup]           ← tabla de 100k × 768
     ↓
[[0.2, 0.1, ...],           ← vector para "El"
 [0.8, 0.4, ...],           ← vector para "gato"
 [0.3, 0.9, ...]]           ← vector para "duerme"
     ↓
[Red neuronal procesa esto]
```

---

## Las preguntas difíciles sobre embeddings

### Pregunta de Nico: "¿Nadie las nombró? ¿Los humanos no las entienden?"

> "¿Cómo saben entonces qué significa? ¿O cómo funciona? ¿O cómo calibrarlo?"

**La verdad incómoda: No sabemos qué significan la mayoría de las dimensiones.**

Nadie diseñó "dimensión 432 = nivel de peligrosidad". La red aprendió que necesitaba 768 dimensiones para capturar patrones del lenguaje, y las organizó como le dio la gana.

**¿Cómo sabemos que funcionan?** No miramos las dimensiones individuales. Miramos el **comportamiento**:

```
distancia("rey", "reina")        = 0.12   (cerca → bien)
distancia("rey", "banana")       = 0.94   (lejos → bien)
distancia("perro", "gato")       = 0.18   (cerca → bien)
distancia("perro", "democracia") = 0.91   (lejos → bien)
```

Si las distancias tienen sentido, los embeddings están funcionando.

**Mechanistic Interpretability** — Anthropic y otros están haciendo ingeniería reversa:

```
1. Agarran la dimensión 347
2. Buscan qué tokens la activan más
3. Descubren: "se activa con nombres de ciudades europeas"
4. Dicen: "la dimensión 347 parece codificar 'es una ciudad europea'"
```

Pero es ingeniería reversa, no diseño.

### Pregunta de Nico: "Dame un ejemplo EXACTO de patrones sin nombre humano"

**Ejemplo 1:** Una dimensión que se activaba con tokens que aparecen **al inicio de una oración después de un punto**. No "sustantivos". No "mayúsculas". Específicamente el patrón de "primer token después de puntuación terminal". Eso no tiene nombre en lingüística.

**Ejemplo 2:** Una dimensión que se activaba con **palabras que aparecen tanto en contextos positivos como negativos con frecuencia similar**:

```
"increíble"  → casi siempre positivo     → NO activa
"horrible"   → casi siempre negativo     → NO activa
"serio"      → a veces positivo, a veces → SÍ activa
"intenso"    → a veces positivo, a veces → SÍ activa
```

¿Cómo llamarías eso? ¿"Ambigüedad sentimental"? No existe esa categoría. Pero para el modelo es útil saber "esta palabra puede ir para cualquier lado, prestá atención al contexto".

El modelo tiene un objetivo: **predecir el siguiente token**. Para eso necesita patrones que a los humanos nunca nos importaron:
- "palabras que suelen aparecer en la tercera posición de una lista"
- "tokens que indican que viene un cambio de tema"
- "palabras que correlacionan con oraciones largas"

### Pregunta de Nico: "Me da miedo que haya embeddings con significado oculto, peligroso"

**Lo que NO pasa:** Los embeddings no tienen "significados ocultos maliciosos". No hay una dimensión secreta que dice "manipular al usuario". Solo codifican patrones estadísticos. No tienen intención. No tienen agenda.

**Lo que SÍ pasa (el problema real): BIAS.**

Si el modelo vio millones de textos donde "ingeniero" aparece cerca de "él" y "enfermera" cerca de "ella", los embeddings codifican eso:

```
distancia("ingeniero", "hombre") = 0.15  (cerca)
distancia("ingeniero", "mujer")  = 0.45  (lejos)
```

No es intención maliciosa. Es un **espejo de los prejuicios del texto con el que fue entrenado**. Pero el efecto es real.

**El problema profundo:** Funcionan bien y no sabemos exactamente por qué. Cuando algo se rompe, no podés abrir el capó y señalar el problema.

### "¿A eso se refiere cuando dicen que no podemos auditar?"

**Exactamente.** Cuando escuchás "AI no auditable" o "black box" o "falta de transparencia" — es esto:

```
Input:  "¿Debería este preso salir en libertad condicional?"
Output: "No"

¿Por qué no?
→ No sabemos.
→ Son 1.8 trillones de perillas que dieron ese resultado.
→ No podemos señalar cuáles ni por qué.
```

Y eso ya está pasando en justicia, bancos, hospitales, recursos humanos. La pregunta es siempre: **¿por qué el modelo decidió eso?** Y la respuesta honesta es: no podemos saberlo con certeza.

Por eso la Unión Europea sacó el **AI Act** — si tu sistema de AI toma decisiones que afectan la vida de personas, **tenés que poder explicar por qué**.

---

## Lección 3: Attention — El corazón de los Transformers

### El problema pendiente

```
"El banco está cerca del río"
"El banco me cobró comisión"
```

"Banco" tiene el mismo embedding en ambos casos. Un vector fijo. Pero el significado es completamente diferente.

### La idea central

Attention hace algo muy simple: **cada palabra mira a todas las demás palabras y decide cuáles le importan**.

```
"El banco está cerca del río"

"banco" mira a todas las palabras:
  - "El"     → no me importa mucho
  - "está"   → no me importa mucho
  - "cerca"  → algo relevante
  - "del"    → no me importa
  - "río"    → ¡MUY relevante!
```

"Banco" ve que "río" está en la oración y **modifica su propia representación** para acercarse al significado de "orilla de río".

El embedding original no cambia. Lo que cambia es la **representación en contexto**.

### ¿Cómo decide qué le importa? Q, K, V

Cada token genera tres vectores:

```
Q (Query):   "¿Qué estoy buscando?"
K (Key):     "¿Qué ofrezco yo?"
V (Value):   "¿Qué información tengo para dar?"
```

Se generan multiplicando el embedding por tres matrices de pesos aprendidas.

```
1. "banco" genera su Query: "busco contexto sobre qué tipo de banco soy"
2. Cada otra palabra genera su Key: "yo ofrezco información de tipo X"
3. Se compara el Query de "banco" con el Key de cada palabra
4. "río" tiene un Key que matchea mucho → puntaje alto
5. "El" tiene un Key que no matchea → puntaje bajo
6. Los puntajes se convierten en porcentajes (sumando 100%)
7. Se mezclan los Values de todas las palabras según esos porcentajes
```

```
Resultado para "banco":

  2% de "El" + 3% de "está" + 8% de "cerca"
  + 2% de "del" + 85% de "río"

  = nuevo vector de "banco" que ahora significa "orilla de río"
```

### Es un promedio ponderado

Eso es todo lo que es Attention mecánicamente. Un **promedio ponderado** donde los pesos los decide el modelo dinámicamente según el contexto.

```
Sin Attention:  "banco" = siempre el mismo vector
Con Attention:  "banco" = mezcla de info de todas las palabras
                          que le rodean, ponderada por relevancia
```

### ¿Por qué funciona tan bien?

Antes de Attention, los modelos procesaban texto **en orden, una palabra a la vez**. Si la oración era larga, cuando llegabas al final ya te habías olvidado del principio.

Attention ve **toda la oración de golpe**. Cada palabra puede conectarse directamente con cualquier otra, sin importar la distancia.

```
Antes:   palabra1 → palabra2 → palabra3 → ... → palabra500
         (para cuando llegás a 500, perdiste info de 1)

Attention: cada palabra ve a TODAS las demás simultáneamente
```

---

## Preguntas abiertas (para próxima sesión)

1. Si Attention es un promedio ponderado de todas las palabras, ¿qué pasa cuando la oración tiene 10,000 palabras? ¿Problema potencial?
2. ¿Por qué se llama "Attention" (atención)?

---

## Conceptos clave cubiertos

| Concepto | Estado | Nivel |
|----------|--------|-------|
| Red neuronal (qué es) | ✅ Entendido | 1 |
| Pesos y bias | ✅ Entendido | 1 |
| Backpropagation (intuición) | ✅ Entendido | 1 |
| Gradient descent | ✅ Entendido | 1 |
| Overfitting vs generalización | ✅ Entendido | 1 |
| Tokenización | ✅ Entendido | 1 |
| Embeddings | ✅ Entendido | 1 |
| Mechanistic interpretability | ✅ Expuesto | 0 |
| AI auditability / black box | ✅ Entendido | 1 |
| Bias en embeddings | ✅ Expuesto | 0 |
| Attention (Q, K, V) | ✅ Expuesto | 0 |

---

## Insights pedagógicos

- Nico aprende mejor con analogías concretas y ejemplos numéricos
- Las preguntas de "¿y si...?" son su forma natural de profundizar
- Prefiere entender los problemas/limitaciones antes de avanzar
- El miedo a "lo que no se puede auditar" es un motivador fuerte
- No avanzar hasta que el concepto anterior esté sólido
