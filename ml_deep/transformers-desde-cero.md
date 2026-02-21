# Transformers — Desde Cero

> Conversación completa de estudio. Sin resúmenes, sin editar. Todas las idas y vueltas, dudas, y explicaciones paso a paso.
> Fecha: 2026-02-21

---

## Contexto

El objetivo es aprender transformers de forma acelerada. No hay 6 meses — esto es ya. Estudiamos juntos, pregunta por pregunta.

---

## ¿Qué problema resuelven los Transformers?

Antes de transformers, los modelos de lenguaje usaban **RNNs/LSTMs** — procesaban texto **palabra por palabra, en secuencia**. Esto tenía dos problemas graves:

1. **Cuello de botella secuencial** — No puedes paralelizar. Palabra 50 tiene que esperar a que se procesen las 49 anteriores.
2. **Memoria de corto alcance** — Para cuando llegas a la palabra 200, la palabra 1 ya se diluyó. LSTMs mejoraron esto, pero no lo resolvieron.

El paper "Attention Is All You Need" (2017, Google) dijo: **eliminemos la recurrencia por completo**. Usemos solo atención.

---

## La intuición de Attention

Imagina que lees esta oración:

> "El gato se subió al árbol porque **tenía** miedo del perro"

¿A qué se refiere "tenía"? A "el gato". Tu cerebro no procesó la oración en orden — **saltó hacia atrás** y conectó "tenía" con "gato".

Eso es atención: **cada palabra puede mirar a todas las demás palabras** y decidir cuáles son relevantes para ella.

---

## Los tres vectores: Query, Key, Value

Para cada palabra, creamos **tres vectores**:

- **Query (Q)**: "¿Qué estoy buscando?"
- **Key (K)**: "¿Qué ofrezco?"
- **Value (V)**: "¿Qué información cargo?"

El mecanismo:
1. La Query de "tenía" se compara con las Keys de **todas** las palabras
2. Se calcula un score de similitud (dot product)
3. Se pasa por softmax → pesos de atención (suman 1)
4. Se hace promedio ponderado de los Values

Resultado: cada palabra obtiene una representación que **ya incorpora contexto** de las palabras relevantes.

La fórmula famosa:

```
Attention(Q, K, V) = softmax(QK^T / √d_k) · V
```

El `√d_k` es solo para estabilidad numérica — sin él, los dot products crecen demasiado y el softmax se satura.

---

## Checkpoint 1 — Primera ronda de preguntas

**Pregunta:** ¿Te queda claro por qué Q, K, V son tres proyecciones distintas de la misma palabra? ¿Puedes intuir qué pasa si el score de atención entre dos palabras es alto vs bajo?

**Respuesta del estudiante:** "Si el vector es alto las palabras están relacionadas, si es bajo se ignoran? Es 3 proyecciones distintas de la misma palabra, hacia afuera (buscando), hacia adentro (que tengo para dar), mi valor (mi contexto)? algo así"

**Feedback:** Lo del score es correcto — alto = "te presto atención", bajo = "te ignoro" (después del softmax, los bajos se vuelven casi cero).

Y la intuición de Q/K/V es muy buena. Solo un matiz:

**Key y Value no son lo mismo.** La descripción de Key ("qué tengo para dar") y Value ("mi contexto") están muy cerca, pero la distinción es más sutil:

- **Key** = mi **etiqueta**. Sirve para que otros me encuentren.
- **Value** = mi **contenido**. Lo que realmente entrego cuando me seleccionan.

Analogía: piensa en un diccionario.
- La **Query** es la palabra que buscas
- La **Key** es la entrada del diccionario (la palabra que matchea)
- El **Value** es la definición

El Key te ayuda a **encontrar**, el Value es lo que **obtienes**. Están separados porque a veces quieres que la búsqueda funcione por un criterio, pero la información que necesitas es otra.

---

## Multi-Head Attention (primera explicación)

Un solo mecanismo de atención captura **un tipo** de relación. Pero las palabras se relacionan de muchas formas:

> "El gato negro se subió al árbol alto"

- "subió" necesita atender a "gato" (¿quién subió?)
- "subió" necesita atender a "árbol" (¿a dónde?)
- "alto" necesita atender a "árbol" (¿qué es alto?)

**Solución:** correr atención **múltiples veces en paralelo**, cada una con sus propias matrices Q, K, V. Cada "cabeza" aprende a detectar un tipo distinto de relación.

En el paper original: **8 cabezas**. Si el modelo tiene dimensión 512, cada cabeza trabaja con 512/8 = 64 dimensiones. Al final, concatenas las 8 salidas y las proyectas de vuelta a 512.

**Pregunta del estudiante:** "No entendí esto de las 8 cabezas y 512/8 = 64"

---

## Embeddings — ¿De dónde sale el vector?

**Pregunta del estudiante:** "¿Cómo que la palabra 'gato' es un vector de 512 números? ¿De dónde sale ese embedding? Estás dando cosas por obvias, eso está MUY mal, tienes que ir PUNTO POR PUNTO"

### Paso 1: El modelo no entiende texto

Una computadora solo entiende números. Si le das "gato", no sabe qué hacer. Necesitas convertir texto a números.

### Paso 2: La forma más tonta — un índice

Imagina que tienes un vocabulario de 5 palabras:

```
el   → 0
gato → 1
come → 2
un   → 3
pez  → 4
```

Ahora "el gato come un pez" se convierte en `[0, 1, 2, 3, 4]`.

Problema: esto le dice al modelo que "gato" (1) está **entre** "el" (0) y "come" (2). Como si fueran puntos en una línea. Pero eso no tiene sentido — "gato" no está "entre" nada. Son categorías, no magnitudes.

**Pregunta del estudiante:** "¿Qué te referís con que son categorías?"

**Respuesta:** Las palabras no tienen un **orden numérico natural**. Los números sí lo tienen: 1 < 2 < 3. Tiene sentido decir que 2 está entre 1 y 3. Pero las palabras no funcionan así. Si asignas gato → 1, come → 2, perro → 3, eso **no significa** que "come" está entre "gato" y "perro" de alguna forma. No puedes sumar palabras ni decir que una es "mayor" que otra. Son etiquetas arbitrarias, como colores de camisetas o nombres de países. Por eso asignar un solo número por palabra es engañoso: le metes al modelo una relación de orden que **no existe**.

### Paso 3: One-hot encoding — un poco mejor

En vez de un número, usas un vector donde solo una posición es 1:

```
el   → [1, 0, 0, 0, 0]
gato → [0, 1, 0, 0, 0]
come → [0, 0, 1, 0, 0]
pez  → [0, 0, 0, 0, 1]
```

Ahora no hay orden falso. Pero hay otro problema: **todas las palabras están igual de lejos entre sí.** "gato" está tan lejos de "perro" como de "democracia". No captura ninguna relación de significado.

Y peor: si tu vocabulario tiene 50,000 palabras, cada vector tiene 50,000 posiciones. Es gigante y desperdiciado (casi todo es ceros).

### Paso 4: Embeddings — la solución real

La idea: ¿y si en vez de vectores gigantes de ceros, usamos vectores **pequeños y densos** donde cada número significa algo?

Un embedding es una tabla enorme que el modelo **aprende durante el entrenamiento**:

```
el   → [0.12, -0.33, 0.85, ..., 0.41]   ← 512 números
gato → [0.23, -0.45, 0.91, ..., 0.67]   ← 512 números
pez  → [0.21, -0.42, 0.88, ..., 0.63]   ← 512 números
```

Esos números **no los diseña nadie**. El modelo los ajusta mientras entrena. Lo que termina pasando es que palabras con significado parecido terminan con vectores parecidos:

- "gato" y "perro" quedan **cerca** en ese espacio de 512 dimensiones
- "gato" y "democracia" quedan **lejos**

Es literalmente una tabla de lookup: palabra → vector. Nada más. Se llama **embedding matrix** y tiene tamaño `vocabulario × dimensión` (en el paper: 50,000 × 512).

### Resumen del flujo:

```
texto "gato"
  → tokenización → índice 1
  → embedding matrix[1] → [0.23, -0.45, 0.91, ..., 0.67]
```

Eso es de donde sale el vector. Es una tabla que se aprende.

---

## ¿Cómo sabe el embedding hacer las asociaciones?

**Pregunta del estudiante:** "OK entiendo, pero ese vector que se forma, ¿cómo sabe hacer las asociaciones?"

**Respuesta:** Al principio no sabe nada. Los vectores empiezan siendo números aleatorios.

### Cómo aprende

Imagina que el modelo está entrenando. Su tarea es predecir la siguiente palabra:

```
"el gato come ___"
```

Al principio, los embeddings son random. "gato" y "perro" están en posiciones aleatorias. El modelo predice basura y se equivoca mucho.

Cuando se equivoca, pasa esto:

1. Se calcula el **error** (qué tan lejos estuvo de la respuesta correcta)
2. Ese error se propaga hacia atrás (**backpropagation** — lo que se vio en micrograd)
3. Se ajustan **todos** los parámetros del modelo, **incluyendo los vectores de la embedding matrix**

Esto pasa millones de veces, con millones de oraciones.

### ¿Por qué "gato" y "perro" terminan cerca?

Porque aparecen en **contextos similares**:

```
"el gato come pescado"
"el perro come carne"
"el gato duerme en el sofá"
"el perro duerme en la cama"
```

El modelo necesita que "gato" y "perro" produzcan predicciones parecidas (ambos comen, duermen, son mascotas). La forma más eficiente de lograr eso es que sus vectores sean parecidos.

Si los vectores fueran muy distintos, el modelo tendría que aprender reglas separadas para cada uno. Pero ponerlos cerca le permite **generalizar**: lo que aprende de "gato" le sirve para "perro".

**Nadie le dice al modelo que gato y perro son similares.** El modelo **descubre** que ponerlos cerca reduce su error al predecir texto. Las asociaciones son un **efecto emergente** del entrenamiento, no algo diseñado.

---

## ¿Cómo se define el espacio de 512 dimensiones?

**Pregunta del estudiante:** "¿Y cómo se define ese espacio de 512 dimensiones?"

**Respuesta:** No se define. Se **elige** el número 512 y ya. Es una decisión de diseño humana.

Alguien dijo "usemos vectores de 512 números" de la misma forma que alguien decide "esta imagen será de 1920x1080 píxeles". Podrían haber sido 256 o 1024. El paper de Transformers eligió 512.

¿Qué cambia?

- **Más dimensiones** (ej. 1024) → el modelo puede capturar relaciones más finas entre palabras, pero cuesta más memoria y cómputo
- **Menos dimensiones** (ej. 64) → más barato pero pierde matices

No hay significado asignado a cada dimensión. No es que la dimensión 37 signifique "es animal" y la 200 signifique "es verbo". Las dimensiones no tienen nombre. El modelo durante el entrenamiento las usa como le convenga para reducir su error.

---

## ¿Qué es un efecto emergente?

**Pregunta del estudiante:** "Además, ¿qué es efecto emergente?"

**Respuesta:** Es algo que **nadie programó explícitamente** pero que aparece como consecuencia de otra cosa.

Ejemplo fuera de AI: nadie le dice a cada hormiga cómo construir el hormiguero. Cada hormiga sigue reglas simples (cargar tierra, seguir feromonas). El hormiguero complejo **emerge** de esas reglas simples.

En el caso de los embeddings: nadie le dijo al modelo "gato y perro son similares". La regla simple es "predecí la siguiente palabra y minimizá tu error". La similitud entre gato y perro **emerge** de esa regla simple aplicada millones de veces.

---

## ¿Cuántas dimensiones tienen los modelos reales?

**Pregunta del estudiante:** "¿Cuántas dimensiones tiene ChatGPT 4, o en realidad Opus 4.6?"

No hay datos confirmados de ninguno de los dos. Ni OpenAI ni Anthropic han publicado la arquitectura exacta de sus modelos actuales.

Lo que sí es público:

- **GPT-2** (2019): 768 dimensiones (modelo pequeño) y 1600 (modelo grande)
- **GPT-3** (2020): 12,288 dimensiones
- **LLaMA 2 70B** (Meta, 2023): 8,192 dimensiones

GPT-4, GPT-4o, Claude Opus — no hay papers con esos detalles. Son modelos cerrados. La tendencia: modelos más grandes usan más dimensiones. Rango estimado de 8,000 a 16,000+, pero es especulación.

**Pregunta del estudiante:** "¿Y modelos abiertos? ¿Cuál es el más grande que se conoce públicamente?"

| Modelo | Dimensiones | Parámetros |
|--------|------------|------------|
| LLaMA 3.1 405B (Meta) | 16,384 | 405 mil millones |
| Falcon 180B | 14,848 | 180 mil millones |
| DeepSeek V3 | 7,168 | 671 mil millones |

DeepSeek V3 tiene más parámetros que LLaMA 405B pero menos dimensiones porque usa **Mixture of Experts (MoE)**: tiene muchos parámetros pero solo activa una fracción en cada predicción.

El más grande en dimensiones públicas: **LLaMA 3.1 405B con 16,384**.

---

## De vuelta a la arquitectura: Positional Encoding

Tenemos un problema. Estas dos oraciones:

```
"el gato come el pez"
"el pez come el gato"
```

Cada palabra se convierte en su embedding. Pero los embeddings son los mismos en ambas oraciones — "gato" siempre da el mismo vector, sin importar dónde esté.

El modelo no sabe **en qué posición** está cada palabra. Para él, las dos oraciones son el mismo conjunto de vectores. Pero significan cosas completamente distintas.

**Solución:** a cada embedding le **sumamos** un vector de posición.

```
embedding de "gato" + vector de posición 2 → embedding final
embedding de "gato" + vector de posición 5 → embedding final (distinto)
```

Ahora la misma palabra en posición distinta produce un vector distinto. El modelo puede distinguir el orden.

¿De dónde salen los vectores de posición? En el paper original usaron funciones matemáticas (senos y cosenos) que generan un patrón único para cada posición. No se aprenden, se calculan. Hoy en día la mayoría de modelos los **aprenden** durante el entrenamiento, igual que los embeddings.

Lo importante: después de este paso, cada palabra tiene un vector que codifica **qué palabra es + dónde está**.

---

## ¿Qué es una proyección?

Es una **multiplicación por una matriz de pesos**. Nada más.

```
Q = vector_palabra × matriz_Wq
K = vector_palabra × matriz_Wk
V = vector_palabra × matriz_Wv
```

Cada matriz (Wq, Wk, Wv) se **aprende** durante el entrenamiento. Son parámetros del modelo, igual que los embeddings.

Es como pasar la misma información por tres filtros distintos. El mismo vector de "gato" produce tres versiones distintas de sí mismo, cada una optimizada para su rol.

---

## El mecanismo de atención — paso a paso con ejemplo

Tomemos la oración: `"el gato come pez"`

Cada palabra ya tiene su Q, K, V. Vamos a ver qué pasa desde la perspectiva de **una sola palabra**: "come".

**Paso 1: Comparar la Query de "come" contra todas las Keys**

```
score("come" → "el")   = Q_come · K_el   = 0.2
score("come" → "gato") = Q_come · K_gato = 4.1
score("come" → "come") = Q_come · K_come = 1.5
score("come" → "pez")  = Q_come · K_pez  = 3.8
```

El `·` es un **dot product** — multiplicas los vectores elemento por elemento y sumas. Si apuntan en dirección parecida, el número es alto. Si no, es bajo.

**Paso 2: Dividir por √d para estabilizar**

```
score / √64 = [0.025, 0.5125, 0.1875, 0.475]
```

Sin esto, los números crecen mucho y el siguiente paso se rompe.

**Paso 3: Softmax — convertir scores en pesos que suman 1**

**Pregunta del estudiante:** "No entendí esa transformación"

### Softmax explicado desde cero

#### El problema

Tenemos estos scores:

```
"el"   → 0.025
"gato" → 0.5125
"come" → 0.1875
"pez"  → 0.475
```

Son números sueltos. Necesitamos convertirlos en algo que diga **"qué porcentaje de atención le doy a cada palabra"**. Como repartir 100% de tu atención.

#### Intento 1: ¿Por qué no dividir entre la suma?

```
suma = 0.025 + 0.5125 + 0.1875 + 0.475 = 1.2

"el"   → 0.025  / 1.2 = 0.02  (2%)
"gato" → 0.5125 / 1.2 = 0.43  (43%)
```

Parece que funciona. Pero hay un problema: los scores pueden ser negativos. Imaginá otros scores:

```
"el"   → -3
"gato" →  5
"come" → -1
"pez"  →  2
```

```
suma = -3 + 5 + -1 + 2 = 3
"el" → -3 / 3 = -1.0  ← ¿atención negativa? No tiene sentido.
```

No podés prestar "-100% de atención" a una palabra. Necesitamos que todos los valores sean positivos.

#### Solución: primero hacé todo positivo con e^x

`e` es un número fijo (2.718...). Cuando elevás `e` a cualquier cosa:

- `e^(-3)` = 0.05 → positivo
- `e^(5)` = 148.4 → positivo
- `e^(-1)` = 0.37 → positivo
- `e^(0)` = 1 → positivo

**Siempre da positivo.** No importa qué tan negativo sea el score original.

Y además tiene otra propiedad útil: **agranda las diferencias**. El que tenía score más alto se vuelve mucho más grande que el resto. Es como un "el ganador se lleva más".

#### Ahora sí dividís entre la suma

```
scores originales: [-3, 5, -1, 2]

paso 1 — e^x:
  e^(-3) = 0.05
  e^(5)  = 148.4
  e^(-1) = 0.37
  e^(2)  = 7.39

paso 2 — dividir entre suma:
  suma = 0.05 + 148.4 + 0.37 + 7.39 = 156.21

  "el"   → 0.05  / 156.21 = 0.0003  (0.03%)
  "gato" → 148.4 / 156.21 = 0.9500  (95%)
  "come" → 0.37  / 156.21 = 0.0024  (0.24%)
  "pez"  → 7.39  / 156.21 = 0.0473  (4.73%)
```

Resultado: todo positivo, suma 1, y "gato" se lleva casi toda la atención porque tenía el score más alto.

#### Softmax es solo eso

```
softmax = e^(score) / suma de todos los e^(scores)
```

Nada más. Convierte cualquier lista de números en porcentajes positivos que suman 1.

---

## Paso 4: Mezclar los Values

Cada palabra tiene un vector Value (su "contenido para entregar"). Ahora los mezclamos usando esos pesos:

```
salida = 0.04 × V_el + 0.42 × V_gato + 0.12 × V_come + 0.42 × V_pez
```

Esto es un **promedio ponderado**. Igual que calcular tu nota final en la universidad: si el examen vale 60% y las tareas 40%, no pesan igual.

"come" le da peso 42% a lo que "gato" tiene para decir, 42% a "pez", y casi ignora a "el". El resultado es un nuevo vector que mezcla la información de las palabras más relevantes.

Después de esto, "come" ya no es un vector aislado. Ahora **sabe** quién come y qué come.

---

## Esto se repite para CADA palabra, en paralelo

"gato" hace lo mismo con su Query. Quizá descubre que necesita atender a "come" y a "el".
"pez" hace lo mismo. Todas las palabras al mismo tiempo. No hay secuencia. Por eso los transformers son rápidos.

---

## Multi-Head Attention (explicación detallada)

### ¿Qué es "dimensión 512"?

Cada palabra se representa como un **vector de números**. En el paper original, ese vector tiene 512 números. Eso es la "dimensión del modelo".

### La idea

En vez de hacer atención una vez con 512 dimensiones, haces esto:

1. **Partes** el vector de 512 en **8 pedazos** de 64
2. Cada pedazo corre su propia atención **independiente**
3. Cada pedazo aprende a buscar cosas distintas

Visualmente:

```
"gato" = [0.23, -0.45, 0.91, ... 0.67]
          |________|________|... |____|
          cabeza 1  cabeza 2 ... cabeza 8
          (64 nums) (64 nums)    (64 nums)
```

Cabeza 1 quizá aprende relaciones **gramaticales** (sujeto-verbo).
Cabeza 3 quizá aprende relaciones **semánticas** (gato-animal).
No les dices qué buscar — lo aprenden solas durante el entrenamiento.

### ¿Y al final?

Cada cabeza produce su propia salida de 64 números. Luego:

1. **Concatenas** las 8 salidas: 8 × 64 = 512 de vuelta
2. Pasas por una capa lineal para mezclarlas

```
[salida_cab1 | salida_cab2 | ... | salida_cab8] → capa lineal → 512
```

Volviste a un vector de 512, pero ahora **enriquecido** con 8 perspectivas distintas de atención.

---

## Después de la atención: Feed-Forward

Cada palabra pasa por una **red neuronal pequeña** (dos capas). Esta red procesa la información que la atención recopiló, pero trabaja en **cada palabra por separado** — no mezcla palabras entre sí.

¿Para qué sirve? La atención dice "come se relaciona con gato y pez". El feed-forward **interpreta** esa combinación: "ah, esto es una acción de alimentarse".

---

## Residual connections: la red de seguridad

Después de cada sub-capa (atención y feed-forward), se **suma la entrada original a la salida**:

```
resultado = entrada_original + salida_de_la_capa
```

¿Por qué? Si la capa de atención aprende algo malo, y solo usás su salida, perdiste la información original. Pero si **sumás**, en el peor caso la capa aporta ceros y te queda lo que ya tenías. Es un seguro contra perder información.

---

## El bloque completo

```
entrada (vector por palabra)
  → atención multi-head
  → sumar entrada original (residual)
  → normalizar (LayerNorm)
  → feed-forward
  → sumar entrada original (residual)
  → normalizar (LayerNorm)
salida (vector por palabra, más rico)
```

Este bloque se apila **6 veces**. La salida del bloque 1 entra al bloque 2, y así. Cada capa refina un poco más la representación.

---

## El final: predecir la siguiente palabra

Después de los 6 bloques, cada palabra tiene un vector super enriquecido. Para predecir la siguiente palabra:

1. Tomás el vector de la **última posición** de la secuencia
2. Lo multiplicás por una matriz que produce un score por cada palabra del vocabulario
3. Softmax (¡el mismo que ya conocés!) → probabilidades
4. La palabra con mayor probabilidad es la predicción

```
"el gato come" → vector de "come" procesado por 6 bloques
  → 50,000 scores (uno por palabra del vocabulario)
  → softmax
  → "pez" tiene probabilidad 0.15, "pescado" tiene 0.12, ...
```

---

## Resumen: Eso es un transformer

Todo el paper de "Attention Is All You Need" es esto:

1. Texto → embeddings + posición
2. Atención: cada palabra mira a todas las demás (Q, K, V)
3. Feed-forward: procesar la información recopilada
4. Repetir 6 veces
5. Predecir la siguiente palabra
