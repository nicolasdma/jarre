# Micrograd — Conversación completa de aprendizaje

> Fecha: 2026-02-21
> Contexto: Primera sesión de estudio acelerado ML/DL. Sin filtros, con todas las idas y vueltas.
> Objetivo futuro: Reinterpretar como teaching chapter serializable.

---

## Inicio: ¿Qué es ML?

**Pregunta:** ¿Qué es un ML?

### Respuesta:

**ML es hacer que una computadora aprenda de datos en vez de programarla explícitamente.**

Programación tradicional:
```
reglas + datos → respuesta
```

Machine Learning:
```
datos + respuestas → reglas (el modelo las "descubre")
```

### Ejemplo concreto

Querés clasificar emails como spam o no-spam.

**Sin ML:** Escribís 500 reglas a mano: "si contiene 'viagra' → spam", "si tiene 3+ links → spam"...

**Con ML:** Le das 10,000 emails ya etiquetados (spam / no-spam). El modelo encuentra los patrones solo.

### Los 3 ingredientes

1. **Datos** — ejemplos del mundo real
2. **Modelo** — una función matemática con parámetros ajustables (pesos)
3. **Entrenamiento** — ajustar esos pesos para minimizar el error

El "aprendizaje" es literalmente esto: **ajustar números (pesos) hasta que las predicciones se acerquen a la realidad.**

### ¿Cómo "aprende"?

1. El modelo hace una predicción
2. Se compara con la respuesta correcta → **loss** (qué tan equivocado está)
3. Se calcula **cómo mover cada peso** para reducir el error → **gradientes**
4. Se ajustan los pesos un poquito en esa dirección
5. Repetir miles de veces

Esto es exactamente lo que vas a ver en el video de **micrograd** de Karpathy — él construye este proceso desde cero en Python.

---

## ¿Qué es Micrograd? — Overview

**Pregunta:** Explicame qué voy a ver, qué es lo que hace.

### Respuesta:

Micrograd es un **motor de autograd** (diferenciación automática) en ~100 líneas de Python. Karpathy lo construye desde cero para que entiendas qué hace PyTorch por debajo.

### La idea central

Querés entrenar un neural network. Para eso necesitás:

1. Hacer una predicción (forward pass)
2. Medir qué tan mal le fue (loss)
3. **Calcular cómo ajustar cada peso para mejorar** ← esto es lo difícil

El paso 3 requiere **derivadas**. Micrograd las calcula automáticamente.

### Lo que Karpathy construye, en orden:

**1. La clase `Value`** — un número que recuerda su historia

```python
a = Value(2.0)
b = Value(3.0)
c = a * b  # c = 6.0, pero c SABE que vino de a * b
```

Cada `Value` guarda: su dato, sus "padres", y qué operación lo creó. Esto forma un **grafo** (DAG — directed acyclic graph).

**2. Backpropagation** — recorrer el grafo hacia atrás

Desde el resultado final, se calcula el **gradiente** de cada nodo: "si muevo este valor un poquito, ¿cuánto cambia el resultado final?"

Esto usa la **chain rule** del cálculo:
```
si c = a * b, entonces:
  dc/da = b
  dc/db = a
```

Se propaga hacia atrás por todo el grafo automáticamente.

**3. Neuronas, capas y MLP**

Con el autograd funcionando, construye:
- **Neuron**: toma inputs, los multiplica por pesos, suma, aplica activación (tanh)
- **Layer**: un grupo de neuronas
- **MLP** (Multi-Layer Perceptron): capas conectadas entre sí

**4. Training loop**

```
repetir 20 veces:
    predicción = model(datos)
    loss = qué tan mal le fue
    loss.backward()          ← calcula todos los gradientes
    para cada peso:
        peso -= learning_rate * peso.gradiente   ← ajusta
```

Y el loss baja. El modelo "aprende".

### El insight clave

**Todo deep learning — GPT, DALL-E, todo — es esto mismo pero más grande.** Más neuronas, más capas, más datos, operaciones más sofisticadas. Pero el mecanismo es idéntico: forward pass → loss → backward pass → ajustar pesos.

PyTorch es básicamente micrograd con soporte para GPUs y miles de operaciones optimizadas.

---

## Explicame como a un niño

**Pregunta:** Explicamelo mejor, más en detalle, como a un niño.

---

### Imaginá una fábrica

Tenés una fábrica con perillas. Cada perilla controla algo (temperatura, velocidad, presión). Al final de la fábrica sale un producto, y un inspector le pone una nota: **qué tan malo salió** (el "loss").

Tu trabajo: **girar las perillas para que el producto salga cada vez mejor**.

El problema es que tenés 1000 perillas. No podés probar una por una. Necesitás que alguien te diga: "esta perilla girala para la derecha, esta otra para la izquierda, esta casi no la toques".

**Micrograd es ese alguien.** Te dice exactamente cuánto y para dónde girar cada perilla.

---

### Parte 1: Un número con memoria — la clase `Value`

Normalmente en Python, si hacés:

```python
a = 2
b = 3
c = a + b  # c = 5
```

`c` sabe que vale 5, pero **no sabe de dónde vino**. No sabe que es la suma de `a` y `b`.

Karpathy crea un `Value` que sí recuerda:

```python
a = Value(2)
b = Value(3)
c = a + b  # c vale 5, Y SABE que vino de a + b
```

¿Para qué? Porque si después querés saber "che, si muevo `a` un poquito, ¿cuánto cambia `c`?", necesitás saber que `c` dependía de `a`.

Esto forma un **árbol genealógico de operaciones**:

```
a(2) ──┐
       ├── + ── c(5) ──┐
b(3) ──┘                ├── * ── e(20)
              d(4) ─────┘
```

Cada número sabe quiénes son sus padres y qué operación lo creó.

---

### Parte 2: La pregunta mágica — "¿cuánto me afectás?"

Esto se llama **gradiente** y es LA idea central de todo.

Imaginá que `e` es tu resultado final. Querés saber:

> "Si muevo `a` un poquitito... ¿cuánto cambia `e`?"

Si cambia mucho → `a` es muy influyente, hay que ajustarlo con cuidado.
Si casi no cambia → `a` importa poco.

Esto es una **derivada**. Pero no la calculás a mano — micrograd la calcula sola recorriendo el árbol hacia atrás.

---

### Parte 3: La chain rule — el truco que hace todo posible

Supongamos:

```
a = 2
b = a * 3    → b = 6
c = b + 1    → c = 7
d = c * 2    → d = 14
```

Querés saber: si muevo `a`, ¿cuánto cambia `d`?

La chain rule dice: **multiplicá los efectos paso a paso**.

- Si `a` sube 1 → `b` sube 3 (porque `b = a * 3`)
- Si `b` sube 1 → `c` sube 1 (porque `c = b + 1`)
- Si `c` sube 1 → `d` sube 2 (porque `d = c * 2`)

Efecto total: **3 × 1 × 2 = 6**

Si movés `a` un poquito (0.01), `d` cambia 0.06. Eso es el gradiente de `a`.

**Backpropagation** es hacer esto automáticamente para TODOS los números del grafo, empezando desde el final hacia atrás.

---

### Parte 4: La neurona — una mini decisión

Una neurona hace algo muy simple:

```
inputs:  x1, x2, x3  (los datos)
pesos:   w1, w2, w3  (las "perillas")
bias:    b            (otra perilla)

resultado = x1*w1 + x2*w2 + x3*w3 + b
salida = tanh(resultado)   ← lo aplasta entre -1 y 1
```

Es una suma pesada. Los pesos deciden **cuánto importa cada input**. El bias es un ajuste general. El `tanh` lo comprime para que no se vaya a infinito.

**Los pesos arrancan random.** La neurona empieza sin saber nada.

---

### Parte 5: Capas y MLP — muchas neuronas juntas

Con el autograd funcionando, construye:
- **Layer**: varias neuronas mirando los mismos inputs, cada una con sus propios pesos
- **MLP** (Multi-Layer Perceptron): capas conectadas en cadena

La primera capa detecta patrones simples. La segunda combina esos patrones. La tercera da la respuesta final.

---

### Parte 6: El training loop — aprender de verdad

Acá se junta todo:

```
Repetir muchas veces:
  1. FORWARD:  pasás los datos por el modelo → sale una predicción
  2. LOSS:     comparás predicción vs realidad → un número de "qué tan mal"
  3. BACKWARD: backpropagation → cada peso recibe su gradiente
                ("yo te estoy haciendo perder, moveme para acá")
  4. UPDATE:   cada peso se ajusta un poquito en la dirección correcta
  5. ZERO:     borrás los gradientes para la siguiente ronda
```

Después de 20 repeticiones, el loss baja de 4.0 a 0.01. **El modelo aprendió.**

---

## MOMENTO EUREKA: La derivada parcial en la multiplicación

**Reacción:** "PARA!!! QUEEE??? que es esto? Como se llama esa regla?? Esto es una locura"

Sobre este ejemplo:

```
a = 3, b = 4, c = a * b = 12

a = 3.01  (moví a un poquito: +0.01)
c = 3.01 * 4 = 12.04
cambio en c = 0.04
0.04 / 0.01 = 4 ← que es exactamente b

b = 4.01  (moví b un poquito: +0.01)
c = 3 * 4.01 = 12.03
cambio en c = 0.03
0.03 / 0.01 = 3 ← que es exactamente a
```

### Se llama **derivada parcial**

Y la idea es vieja — es cálculo, siglo XVII, Newton y Leibniz.

### ¿Por qué pasa eso?

```
c = a * b
```

Si `b = 4`, entonces en realidad tenés:

```
c = a * 4
```

Eso es una recta. Si `a` sube 1, `c` sube 4. Siempre. Es lineal.

```
a = 1  →  c = 4
a = 2  →  c = 8
a = 3  →  c = 12
a = 4  →  c = 16
```

La pendiente es **4**. Que es `b`.

Ahora al revés. Si `a = 3`, tenés:

```
c = 3 * b
```

Otra recta. Si `b` sube 1, `c` sube 3. La pendiente es **3**. Que es `a`.

### No es coincidencia. Es la naturaleza de la multiplicación.

En `a * b`, cada variable actúa como **la pendiente de la otra**.

- `a` te dice cuánto "amplifica" a `b`
- `b` te dice cuánto "amplifica" a `a`

### ¿Y con la suma?

```
c = a + b
```

Si muevo `a` en 1, `c` se mueve en 1. Siempre. No importa cuánto valga `b`.
Si muevo `b` en 1, `c` se mueve en 1. Siempre.

Las derivadas parciales son **1 y 1**. Tiene sentido, ¿no? La suma no amplifica nada, solo pasa el valor directo.

### ¿Por qué esto es tan poderoso?

Porque con solo estas reglas simples — la de la suma y la de la multiplicación — podés calcular el efecto de CUALQUIER perilla en un sistema de millones de operaciones. Solo vas encadenando regla por regla hacia atrás.

Eso es todo lo que hace backpropagation. No hay magia. Son estas dos reglas (más algunas más para tanh, potencias, etc.) aplicadas miles de veces.

---

## MOMENTO EUREKA 2: "¿Backpropagation es solo ESO?"

**Reacción:** "ME ESTAS JODIENDO QUE ES ESO como ajustan las perillas? backpropagation lo escuche miles de veces, es solo eso?"

### Sí. Es solo eso.

Backpropagation = aplicar la regla de la multiplicación y la suma hacia atrás por el grafo.

---

## Ejercicio: Calculá los gradientes

### El grafo:

```
x = 2
w = -3
b = 1

xw = x * w        → ?
z  = xw + b       → ?
```

### Paso 1: Forward pass (valores)

**Respuesta del estudiante:**
- `xw = -6` ✅
- `z = -5` ✅

### Paso 2: Gradientes hacia atrás

**Pregunta:** `z = xw + b` — Si muevo `xw` un poquito, ¿cuánto cambia `z`?

**Respuesta del estudiante:** "¿Cambia b? No sé."

### Explicación con números:

```
xw = -6,  b = 1
z = -6 + 1 = -5
```

Ahora mové `xw` un poquito:

```
xw = -5.99  (le sumé 0.01)
z = -5.99 + 1 = -4.99
```

¿Cuánto cambió `z`? Pasó de -5 a -4.99 → cambió **0.01**

¿Cuánto moví `xw`? **0.01**

0.01 / 0.01 = **1**

Es una suma. Si le sumo algo a `xw`, `z` sube exactamente lo mismo. La suma no amplifica, solo pasa el valor directo.

Lo mismo con `b`:

```
b = 1.01
z = -6 + 1.01 = -4.99
```

Cambió **0.01** también. Gradiente = **1**.

**Regla: en una suma, los dos gradientes son siempre 1.**

### Siguiente paso pendiente:

```
xw = x * w
x = 2,  w = -3
```

Si muevo `x` un poquito, ¿cuánto cambia `xw`? (Ejercicio pendiente — el estudiante decidió no calcular en este momento.)

---

## El training step — para qué sirven los gradientes

Una neurona hace esto:

```
entrada: x = 2
peso:    w = -3    ← PERILLA (se puede ajustar)
bias:    b = 1     ← PERILLA (se puede ajustar)

z = x * w + b = -5
salida = tanh(z) = -0.9999
```

Después del backpropagation, cada perilla tiene su gradiente. Y el **training step** es absurdamente simple:

```
w = w - 0.01 * gradiente_de_w
b = b - 0.01 * gradiente_de_b
```

Movés cada perilla un poquito en la dirección que **reduce el error**. El 0.01 es el "learning rate" — qué tan agresivo sos al ajustar.

Repetís esto 20 veces y el modelo aprendió.

---

## MLP — Multi-Layer Perceptron

### Una neurona sola es limitada

Imaginá que querés predecir si una persona va a comprar un producto. Tenés 3 datos: edad, sueldo, horas en redes sociales.

Una neurona hace UNA suma pesada y da UN número. Es como tomar UNA decisión mirando todo junto. Muy tosco.

### La solución: capas

```
INPUTS          CAPA 1           CAPA 2         SALIDA
(los datos)    (4 neuronas)    (4 neuronas)   (1 neurona)

edad ─────────→ [n1] ──┐
              → [n2] ──┤
sueldo ───────→ [n3] ──┼──────→ [n5] ──┐
              → [n4] ──┤      → [n6] ──┤
horas ────────→        ┘      → [n7] ──┼────→ [n9] ──→ predicción
                              → [n8] ──┘
```

Cada neurona de la capa 1 recibe **los 3 inputs** pero con **pesos distintos**. Entonces cada una detecta un patrón diferente:

- n1 capaz aprende: "edad alta + sueldo alto → algo"
- n2 capaz aprende: "muchas horas en redes → algo"
- n3 capaz aprende otra combinación
- n4 otra

**Nadie le dice qué buscar.** Los pesos arrancan random y el entrenamiento los ajusta.

La capa 2 recibe **las salidas de la capa 1** y combina esos patrones en patrones más complejos.

La neurona final toma todo eso y da la predicción.

### ¿Cuántas perillas tiene esto?

**Capa 1:** 4 neuronas, cada una con 3 pesos + 1 bias = 4 × 4 = **16 perillas**

**Capa 2:** 4 neuronas, cada una con 4 inputs (de la capa anterior) + 1 bias = 4 × 5 = **20 perillas**

**Salida:** 1 neurona con 4 inputs + 1 bias = **5 perillas**

Total: **41 perillas**

GPT-4 tiene ~1,800,000,000,000 (1.8 trillones). Mismo mecanismo. Más perillas.

### El entrenamiento — cómo aprende

```
1. DATOS:     tenés 100 ejemplos con la respuesta correcta

2. FORWARD:   pasás un ejemplo por todas las capas → sale una predicción

3. LOSS:      comparás predicción vs realidad
              loss = (predicción - realidad)²
              (si predijo 0.8 y era 1.0 → loss = 0.04)

4. BACKWARD:  backpropagation recorre TODO el grafo hacia atrás
              las 41 perillas reciben su gradiente

5. UPDATE:    cada perilla se mueve un poquito
              peso = peso - 0.01 * gradiente

6. REPETIR:   con todos los ejemplos, muchas veces
```

Después de 20 pasadas por los datos, el loss baja de algo como 4.0 a 0.002. Las 41 perillas encontraron valores que hacen buenas predicciones.

**El modelo aprendió.** No porque alguien le programó reglas, sino porque ajustó perillas para minimizar el error.

### Lo profundo de esto

Las capas intermedias se llaman **hidden layers** (capas ocultas) porque nadie sabe exactamente qué aprendió cada neurona. Solo sabés que en conjunto, reducen el loss.

En redes más grandes (como GPT), las capas ocultas aprenden cosas como gramática, lógica, conceptos abstractos — pero nadie las programó. **Emergieron** del ajuste de perillas.

---

## Resumen: Micrograd completo

Todo lo que construye Karpathy:

**Value** (número con memoria) → **gradientes** (derivadas parciales) → **backpropagation** (chain rule hacia atrás) → **neuronas** (suma pesada + tanh) → **capas** → **MLP** → **training loop** (forward → loss → backward → update → repetir)

> En una oración: Micrograd construye un sistema donde cada operación matemática recuerda su historia, para que al final puedas preguntarle a cada peso "¿estás ayudando o estorbando?" y ajustarlo automáticamente.
