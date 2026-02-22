# Content Quality Standard — Jarre Learning System

> Reverse-engineered del contenido de `kz2h-micrograd`, el gold standard del sistema.
> Este documento define **qué es** el contenido, **qué debe tener**, y **cómo producirlo**.
> `TEMPLATE-CONTENT-GENERATION.md` define la infraestructura técnica (archivos, scripts, DB).
> Este documento define la **calidad pedagógica** del texto dentro de esos archivos.

---

## 1. Naturaleza del Texto

### Qué NO es

- **No es una traducción.** Una traducción preserva el original. Nuestro texto lo usa como punto de partida y lo transforma — a veces 10x.
- **No es un resumen.** Un resumen comprime. Nuestro texto expande.
- **No es un script de video.** Un script es lineal y efímero. Nuestro texto es reentrable, consultable, navegable.
- **No es un tutorial.** Un tutorial dice "hacé esto". Nuestro texto dice "entendé por qué esto funciona".
- **No es una referencia.** Una referencia es plana y exhaustiva. Nuestro texto tiene ritmo, tensión, resolución.
- **No es divulgación.** "La inteligencia artificial es como un cerebro" no va.
- **No es paper académico.** "We formalize the notion of automatic differentiation" tampoco.

### Qué SÍ es

**Un instrumento de comprensión activa.**

Es un texto pedagógico de alta densidad que combina:

1. **Exposición formal** — definiciones, demostraciones, notación matemática
2. **Narrativa intuitiva** — analogías, preguntas retóricas, "momentos eureka"
3. **Verificación empírica** — ejemplos numéricos que el lector puede calcular a mano
4. **Código funcional** — implementación real que conecta la teoría con la práctica
5. **Metacognición** — el texto le dice al lector qué debería estar sintiendo/pensando

Propiedad fundamental: **el lector que lo lee completo y con atención NO necesita otra fuente**. Es autocontenido para su alcance.

### Por qué importa la calidad

Este contenido no es solo para lectura pasiva. Se integra en un sistema con:

1. **Inline quizzes** (35 por recurso) que se insertan DENTRO del texto
2. **Reading questions** que evalúan comprensión después de leer
3. **Ejercicios interactivos** que refuerzan los conceptos
4. **Evaluaciones con tutor AI** que usan el contenido como contexto
5. **Voice sessions** donde el tutor pregunta sobre lo leído

**Si el texto es vago, los quizzes serán vagos. Si el texto es profundo, las evaluaciones serán profundas.**

Por eso el contenido debe ser:
- **Auto-contenido:** Cada sección se entiende sin material externo
- **Evaluable:** Las afirmaciones son lo suficientemente específicas para generar preguntas
- **Progresivo:** Cada sección asume SOLO lo que las anteriores enseñaron
- **Rico en detalles verificables:** Números, fórmulas, código — no solo prosa

---

## 2. Tono y Voz

### Qué ES el tono:
- **Conversacional pero preciso.** "Querés saber cuánto cambia `c` si movés `a`" — usa voseo pero la explicación es rigurosa.
- **Respetuoso de la inteligencia del lector.** No simplifica. Agrega contexto.
- **Progresivo.** Empieza simple, sube la complejidad, nunca se disculpa por ser técnico.
- **Honesto sobre las limitaciones.** "Karpathy elige tanh por razones pedagógicas. No la elige por superioridad práctica."

### Qué NO es el tono:
- No es tutorial ("En este tutorial aprenderemos...")
- No es paper académico ("In this work we propose...")
- No es divulgación ("La inteligencia artificial es como un cerebro...")
- No es chatbot ("¡Genial! Ahora veamos...")

### El "vos" implícito:
El texto habla directamente al lector usando voseo argentino natural:
- "Si movés a un poquito..."
- "Querés saber..."
- "Pensá en una fábrica..."

---

## 3. Pipeline de Producción

El contenido se produce en **3 iteraciones** sucesivas. Dentro de la Iteración 2 (la más transformadora), se aplican **6 operaciones** específicas.

### Iteración 1: Traducción / Conversación Cruda

**Input:** Transcript del video / texto del paper / capítulo del libro.
**Output:** Texto en español que preserva el contenido original.

Para videos: producir una "conversación de aprendizaje" que capture las ideas principales, las confusiones naturales de un estudiante avanzado, los momentos eureka, y ejemplos con código. Guardar en `ml_deep/{nombre}-conversacion-completa.md`.

Para papers/libros: traducción párrafo por párrafo, términos técnicos en inglés preservados, código sin traducir. No agregar nada. No quitar nada.

**Características del output:**
- Preserva la voz del estudiante ("PARA!!! QUEEE???")
- Incluye preguntas reales, confusiones, idas y vueltas
- Código Python tal cual del original
- ~400-600 líneas, sin estructura formal

**Resultado:** ~1x del tamaño del original.

### Iteración 2: Enrichment Pedagógico

**Input:** La conversación cruda + fuentes de enriquecimiento (clases en `ml_deep/`, papers, etc.)
**Output:** Contenido resegmentado y enriquecido (~100K+ caracteres total).

**Principio rector:** Cada concepto se expande en 3 dimensiones:
1. **Profundidad:** Agregar el "por qué" detrás del "qué" (formalismos, demostraciones)
2. **Amplitud:** Agregar contexto que el original no cubre (comparaciones, alternativas, historia)
3. **Pedagogía:** Agregar momentos eureka, analogías viscerales, verificaciones numéricas

**Transformaciones observadas (crudo → enriquecido):**

| Crudo | Enriquecido |
|-------|-------------|
| "ML es hacer que una computadora aprenda de datos" | "Esta inversión no es un detalle menor. Es un cambio de paradigma en el sentido kuhniano del término" |
| Ejemplo de spam en 4 líneas | Análisis completo: por qué las reglas son frágiles, cómo los spammers las evaden, por qué 500 reglas compitiendo generan conflictos |
| `c = a * b`, derivada = b | Demostración formal con definición de límite + verificación numérica + intuición geométrica (pendiente de la recta) |
| "Una neurona hace una suma pesada + tanh" | Construcción paso a paso: esqueleto → `__add__` → `__mul__` → `_children` → `_backward`, con explicación de cada dunder method |
| "Los pesos arrancan random" | Tabla comparativa: tanh vs ReLU vs sigmoid con rangos, pros, contras, y cuándo usar cada una |

#### Las 6 operaciones de la Iteración 2

**Operación 1 — Expandir** (la más frecuente)

Cuando el original dice algo en 1 línea que requiere 1 página para entenderse. Ratio típico: 1 línea → 10-20 líneas.

| Operación | Cuándo | Ejemplo |
|-----------|--------|---------|
| **Expandir** | El original asume conocimiento previo | "La chain rule" → explicación formal + intuición + demostración con límites |
| **Explicitar** | El original muestra sin explicar | Código sin comentario → código + explicación línea por línea |
| **Verificar** | Después de cada concepto matemático | "La derivada es b" → cálculo con h=0.001 que lo demuestra |
| **Formalizar** | La intuición necesita anclaje | Analogía de fábrica → definición formal de gradiente con notación ∂ |
| **Dualizar** | Para cada concepto clave | Presentar la misma idea desde dos ángulos: intuitivo Y formal |

**Operación 2 — Insistir con otro ángulo**

Cuando el concepto es tan importante que una sola explicación no basta. Dar la misma información 3 veces:
1. **Narrativo:** "La suma no amplifica nada. Simplemente pasa el valor directo."
2. **Formal:** `∂c/∂a = 1, ∂c/∂b = 1`
3. **Numérico:** "Si muevo `a` en 0.01, `c` se mueve 0.01. Gradiente = 1."

**Operación 3 — Momentos Eureka**

Identificar 1-3 puntos de inflexión conceptual y construirlos:
- **Construir tensión antes.** No revelar la conclusión. Hacer que el lector calcule, observe, se pregunte.
- **Marcar el momento explícitamente.** Quiebre tipográfico. Cambio de ritmo.
- **Validar la reacción esperada.** "Esto parece demasiado limpio para ser coincidencia. Y no lo es."
- **Anclar la comprensión después.** Tabla resumen, formalización, checkpoint.

Los momentos eureka se preservan del original y se amplifican:

> **PARA. QUE. ES. ESTO.**
>
> ¿Cómo se llama esta regla? ¿Por qué cuando muevo `a`, la sensibilidad es exactamente `b`?

**Operación 4 — Analogías Funcionales**

Criterios para una buena analogía:
- **Mapeables:** Cada elemento de la analogía corresponde a un elemento técnico concreto
- **Escalables:** La analogía sigue funcionando cuando el concepto se complejiza
- **Descartables:** El lector puede soltar la analogía una vez que internalizó el concepto
- **Instantáneamente visual:** Si necesita explicación, no sirve

Inventario de analogías en kz2h-micrograd:

| Analogía | Concepto | Mapeo |
|----------|----------|-------|
| Fábrica con perillas | Training loop | Perillas=pesos, inspector=loss, ajuste=SGD |
| Cadena de montaje | Computation graph | Estaciones=operaciones, rastreo=backward pass |
| Dominó | Chain rule | Fichas=nodos, amplificación=derivada local |
| Contabilidad con lápiz | Backward manual → automático | Lápiz=manual, software=_backward() |
| Mini-votante | Neurona | Votos=pesos, comité=capa, decisión=activación |
| Afinar instrumento | Training loop | Nota=forward, desafinación=loss, clavija=gradient |

**Operación 5 — Repetir distribuido**

Cuando un concepto reaparece en un contexto nuevo. La frase "la chain rule es solo multiplicación de derivadas locales" aparece:
- En la sección de derivadas (como descubrimiento)
- En la sección de backpropagation (como mecanismo)
- En la sección de MLP (como fundamento del training loop)

Cada repetición agrega contexto. No es redundancia — es refuerzo distribuido.

**Operación 6 — Explicitar código**

Todo bloque de código de más de 3 líneas necesita explicación en prosa. El código NO se presenta como bloque final — se construye paso a paso:

1. **Esqueleto:** `class Value: def __init__(self, data): self.data = data`
2. **Agregar suma:** Se muestra `__add__`, se explica qué hace Python internamente
3. **Agregar memoria:** Se agrega `_children` y `_op`
4. **Agregar backward:** Se agrega `_backward` como closure

Cada paso tiene su explicación, su test, y su "pero todavía falta...".

#### Resegmentar en 5 secciones

El output de la Iteración 2 se organiza en 5 secciones con:

**Títulos que usen metáforas:**
- "Qué es ML — La Fábrica que Aprende Sola"
- "Value — Un Número con Memoria"
- "La Derivada Parcial — El Momento Eureka"
- No "Sección 3: Backpropagation" sino "Backpropagation y la Chain Rule"

**Progresión narrativa clara:**
- S0: Contexto y motivación (por qué esto importa)
- S1: La abstracción fundamental (el building block)
- S2: El mecanismo clave (la idea que hace todo posible)
- S3: La automatización (cómo se escala)
- S4: La integración (cómo se ensambla todo)

Las secciones se vuelven más largas, más densas en tablas y reglas prácticas, y más conectadas con otros recursos a medida que avanzan. El conocimiento se construye sobre sí mismo.

**Resultado:** ~3-10x del tamaño de la conversación cruda.

### Iteración 3: Cross-linking y Refinamiento

**Input:** Contenido enriquecido.
**Output:** Versión final con conexiones entre conceptos.

Transformaciones:

1. **Links 🔗** a otros recursos del sistema

Formato estandarizado:
```
> 🔗 **Conexión con {recurso}:** {concepto local} es {relación} con {concepto remoto}.
> La diferencia: {en qué se separan}.
```

Tipos de conexión:

| Tipo | Ejemplo |
|------|---------|
| Mismo mecanismo, diferente escala | "El training loop de micrograd es idéntico al de PyTorch" |
| Mismo principio, diferente contexto | "El += de gradientes aquí es el mismo gradient accumulation de building-gpt" |
| Evolución directa | "Micrograd opera en escalares; PyTorch opera en tensores" |
| Contraste pedagógico | "Micrograd usa SGD simple; building-gpt usa AdamW" |

Distribución: 0-1 en secciones iniciales, 2-4 en secciones avanzadas. Máximo 3 por sección — no saturar.

Regla: el forward reference debe ser comprensible sin haber leído el recurso futuro. Enriquece la lectura actual, no crea dependencia.

2. **Reglas prácticas** (13 en micrograd) como takeaways mnemotécnicos
3. **Tablas comparativas entre frameworks** (PyTorch vs TensorFlow vs JAX)
4. **Pregunta de cierre** que apunta al siguiente recurso
5. **Revisión de tono:** ¿es conversacional pero preciso? ¿usa voseo natural?
6. **Revisión de progresión:** ¿cada sección asume solo lo que las anteriores enseñaron?

---

## 4. Lo que la Iteración 2 Agrega (que el crudo NO tiene)

### 4.1 Contexto Histórico

- "Es cálculo, siglo XVII, Newton y Leibniz" (ya estaba en crudo)
- "Cambio de paradigma en el sentido kuhniano" (agregado)
- "Universal Approximation Theorem (Cybenko, 1989)" (agregado)

### 4.2 Rigor Matemático

- Demostraciones formales con límites (la definición de derivada como lim h→0)
- Fórmulas en notación estándar (∂c/∂a, no "cuánto cambia c si muevo a")
- Derivaciones paso a paso de reglas de backward para cada operación

### 4.3 Comparaciones con el Ecosistema Real

- Tabla tanh vs ReLU vs sigmoid (el crudo solo menciona tanh)
- Tabla PyTorch dinámico vs TensorFlow estático vs JAX tracing
- Diferencia entre reverse-mode y forward-mode differentiation
- Referencias a frameworks reales y sus decisiones de diseño

### 4.4 Diagnóstico y Debugging

- "¿Qué pasa si un gradiente es 0?" → neurona muerta, saturación, bug
- "¿Qué pasa si loss sube?" → learning rate muy alto, bug en backward
- Tablas de diagnóstico sistemático

### 4.5 Profundización del Código

- El crudo muestra el código final. El enriquecido lo construye paso a paso.
- Explica dunder methods de Python (`__add__`, `__mul__`, `__rmul__`)
- Explica closures (por qué `_backward` es un closure que captura `self` y `other`)
- Explica la elección de granularidad (tanh atómica vs descompuesta)

---

## 5. Elementos Pedagógicos Obligatorios (los 9)

### A. Apertura Narrativa (hook emocional)

Cada sección abre con 1-2 párrafos que **no son técnicos**. Establecen el contexto emocional o intelectual:

> "Hay un momento en el aprendizaje de backpropagation en el que todo hace clic. No es un momento gradual — es abrupto, casi violento."

> "Hasta ahora hemos construido Value [...] Tenemos las piezas. Ahora vamos a ensamblar la máquina completa."

**Función:** Crear anticipación. El lector sabe que algo importante viene.

### B. Verificación Numérica (el "probalo vos mismo")

Después de cada fórmula o regla, verificación con números concretos:

```
a = 3.01   (moví a un poquito: +0.01)
c = 3.01 × 4 = 12.04
cambio en c = 0.04
0.04 / 0.01 = 4  ← que es exactamente b
```

**Función:** Eliminar la abstracción. El lector ve la regla operar en números reales y puede reproducirlo. Este patrón aparece ~15 veces en kz2h-micrograd.

### C. Código Incremental (build-up, no dump)

El código NO se presenta como un bloque final. Se construye paso a paso, donde cada paso tiene su explicación, su test, y su "pero todavía falta...".

**Función:** El lector entiende cada decisión de diseño, no solo el resultado.

### D. Momentos "PARA. QUE. ES. ESTO."

Los momentos eureka se preservan del original y se amplifican.

**Función:** Validar la sorpresa del lector. Decirle "sí, esto ES sorprendente, y hay una razón profunda".

### E. Analogías Viscerales

No metáforas abstractas. Analogías que apelan a experiencias físicas. La analogía debe ser **instantáneamente visual**. Si necesita explicación, no sirve.

**Función:** Acceso inmediato al concepto sin carga cognitiva formal.

### F. Tablas Comparativas

Las tablas son herramientas de **contraste**, no de datos:

```markdown
| | tanh | ReLU | sigmoid |
|--|------|------|---------|
| Rango | (-1, 1) | [0, ∞) | [0, 1] |
| Pros | Centrada en cero | No satura para x>0 | Output como probabilidad |
| Contras | Vanishing gradients | Neuronas muertas | No centrada en cero |
| Cuándo usar | Pedagógico, LSTM | Default en redes profundas | Salida binaria |
```

**Función:** Forzar al lector a pensar en trade-offs, no en definiciones aisladas.

### G. Reglas Prácticas (mnemotécnicos inline)

Frases cortas, memorizables, en negrita:

> **Regla práctica:** "La complejidad computacional de backward es ~2× la de forward. Un training step completo es ~3× forward."

**Función:** Aforismos técnicos que se recuerdan sin el contexto completo.
**Distribución:** 0 en secciones iniciales, 5-6 en secciones avanzadas.

### H. Cross-links con 🔗

Links a otros recursos del sistema.

**Función:** Tejer la red de conocimiento. El lector ve que los conceptos no son islas.
**Distribución:** 0-1 en secciones iniciales, 2-4 en secciones avanzadas.

### I. Formalismo + Intuición (siempre los dos)

Nunca solo la fórmula. Nunca solo la intuición. Siempre las dos:

1. **Intuición primero:** "En una multiplicación, cada variable actúa como la pendiente de la otra"
2. **Formalismo después:** ∂c/∂a = lim(h→0) [(a+h)b - ab] / h = lim(h→0) bh/h = b
3. **Verificación numérica:** a=3, b=4, muevo a en 0.01, c cambia en 0.04, 0.04/0.01 = 4 = b ✓

**Regla:** La intuición hace que el lector *crea* que es verdad. El formalismo hace que *sepa* que es verdad. La verificación hace que *sienta* que es verdad.

---

## 6. Ritmo y Carga Cognitiva

### Ciclo de 3 beats por concepto

1. **Intuición** (2-3 párrafos) — "Imaginá que..." / "La pregunta es..."
2. **Formalización** (1-2 párrafos + código) — Definición, demostración, implementación
3. **Verificación** (1 párrafo + ejemplo numérico) — "Verifiquemos con números..."

### Descansos cognitivos

- Después de cada bloque denso: una **tabla resumen**
- Después de cada demostración: un **checkpoint interactivo** (pregunta al lector)
- Después de cada sección: un **blockquote de síntesis**

### Señales de sobrecarga (corregir si aparecen)

- Más de 5 párrafos consecutivos sin código, tabla o pregunta
- Más de 2 conceptos nuevos sin verificación numérica intermedia
- Formalización sin intuición previa (o intuición sin formalización posterior)

---

## 7. Anatomía del Contenido Final

### Estructura por Sección (datos reales de kz2h-micrograd)

| Sección | Caracteres | Bloques de código | Tablas | Reglas prácticas | Links 🔗 |
|---------|-----------|-------------------|--------|-----------------|----------|
| S0: Qué es ML | 16,501 | 8 | ~8 | 0 | 0 |
| S1: Value | 18,781 | 21 | ~1 | 0 | 1 |
| S2: Derivada Parcial | 19,840 | 26 | ~21 | 2 | 1 |
| S3: Backpropagation | 24,712 | 28 | ~30 | 6 | 2 |
| S4: MLP | 24,594 | 20 | ~22 | 5 | 4 |

**Progresión clara:** más largas, más densas, más conectadas a medida que avanzan.

### Métricas y Rangos Aceptables

| Métrica | Valor en micrograd | Rango aceptable |
|---------|-------------------|-----------------|
| Secciones por recurso | 5 | 4-6 |
| Caracteres por sección | 16K-25K | 16K-25K |
| Caracteres total | ~104K | 80K-130K |
| Bloques de código por sección | 8-28 | 5-15 |
| Cross-links por sección | 0-4 | 1-3 (0 en S0) |
| Checkpoints por sección | 1-3 | 1-3 |
| Tablas por sección | 1-30 | 1-3 |
| Analogías por recurso | 6 | 4-8 |
| Reglas prácticas total | 13 | 8-15 |
| Ratio expansión vs fuente | ~6x | 3-10x |

---

## 8. Anti-patrones (lo que NUNCA debe pasar)

| Anti-patrón | Por qué es malo | Ejemplo |
|-------------|----------------|---------|
| **Resumen superficial** | Pierde la profundidad que hace al contenido valioso | "Backprop usa la chain rule para calcular gradientes" sin demostrar cómo |
| **Código como bloque final** | El lector no entiende las decisiones de diseño | Mostrar `class Value` completo de 50 líneas sin construirlo |
| **Fórmula sin verificación** | El lector no sabe si la entendió | ∂c/∂a = b sin mostrar a=3, b=4, verificar que da 4 |
| **Analogía que necesita explicación** | Si la analogía es más compleja que el concepto, estorba | "Es como la transformada de Fourier del conocimiento" |
| **Tono tutorial** | Subestima al lector | "¡Ahora que sabemos qué es una derivada, pasemos al siguiente paso!" |
| **Tono paper** | Aliena al lector | "We formalize the notion of automatic differentiation..." |
| **Tono chatbot** | Trivializa el contenido | "¡Genial! Ahora veamos..." |
| **Secciones cortas (<10K chars)** | Insuficiente profundidad | Cubre 5 conceptos en 6000 caracteres |
| **Sin tablas comparativas** | Pierde la oportunidad de enseñar trade-offs | Explica ReLU sin comparar con tanh y sigmoid |
| **Sin momentos eureka** | Pierde el engagement emocional | Presenta derivadas parciales como algo mundano |
| **Afirmación sin demostración** | Pide fe ciega al lector | "la derivada es X" sin mostrar por qué |
| **Tono uniforme** | Fatiga cognitiva | Todo explicación, o todo código, sin variación de ritmo |

---

## 9. Ejemplos Comparativos Anotados

### Ejemplo A: La derivada parcial en la multiplicación

**Crudo (7 líneas, muestra el cálculo, no explica por qué):**

```
a = 3, b = 4, c = a * b = 12

a = 3.01  (moví a un poquito: +0.01)
c = 3.01 * 4 = 12.04
cambio en c = 0.04
0.04 / 0.01 = 4 ← que es exactamente b
```

**Enriquecido (~80 líneas, construye tensión → revela → formaliza → verifica → resume):**

> Tomemos la expresión más simple posible que involucre una multiplicación:
> `a = 3, b = 4, c = a * b = 12`
>
> Ahora hagamos algo que parece inocente: mover `a` un poquito hacia arriba [...]
> `0.04 / 0.01 = 4`. Cuatro. Que es exactamente el valor de `b`.
>
> [misma operación con b → resultado = a]
>
> **PARA. QUE. ES. ESTO.**
>
> [Nombre formal: derivada parcial]
> [Explicación intuitiva: "la multiplicación como amplificador"]
> [Demostración formal con límites]
> [Tabla resumen de reglas]

**Intervenciones aplicadas:**
1. ✅ Narrativización del cálculo ("hagamos algo que parece inocente")
2. ✅ Preservación del eureka ("PARA. QUE. ES. ESTO.")
3. ✅ Formalización post-intuición (definición con límites)
4. ✅ Explicación de la causa ("la multiplicación como amplificador")
5. ✅ Tabla resumen como anclaje

### Ejemplo B: La clase Value

**Crudo (12 líneas):**
```
Karpathy crea un Value que sí recuerda:
a = Value(2)
b = Value(3)
c = a + b  # c vale 5, Y SABE que vino de a + b
¿Para qué? Porque si después querés saber "che, si muevo a
un poquito, ¿cuánto cambia c?", necesitás saber que c
dependía de a.
```

**Enriquecido (~3000 caracteres solo para este concepto):**
- Párrafo sobre "el problema: Python no recuerda" (establece la motivación)
- Metáfora del amnésico matemático
- Código Paso 1: esqueleto con `__init__` y `__repr__`
- Explicación de por qué `__repr__` importa
- Código Paso 2: `__add__` con explicación de dunder methods
- Explicación de qué hace Python internamente con `a + b`
- Código Paso 3: agregar `_children` y `_op` para memoria
- Test que muestra que ahora `c._children` contiene `{a, b}`
- Código Paso 4: `__mul__` y por qué `__rmul__` es necesario
- Explicación del mecanismo de fallback de Python
- Transición: "Pero todavía falta lo más importante: la capacidad de calcular gradientes"

**Ratio de expansión:** ~12 líneas → ~3000 caracteres (25x)

**Intervenciones aplicadas:**
1. ✅ Motivación antes de implementación ("¿por qué necesitamos esto?")
2. ✅ Código incremental (4 pasos, no bloque monolítico)
3. ✅ Triple cobertura: pregunta → código → test → explicación
4. ✅ Transición que crea anticipación para la siguiente sección

### Ejemplo C: El training loop

**Crudo (6 líneas, listado de pasos):**

```
Repetir muchas veces:
  1. FORWARD:  pasás los datos por el modelo → sale una predicción
  2. LOSS:     comparás predicción vs realidad → un número de "qué tan mal"
  3. BACKWARD: backpropagation → cada peso recibe su gradiente
  4. UPDATE:   cada peso se ajusta un poquito en la dirección correcta
  5. ZERO:     borrás los gradientes para la siguiente ronda
```

**Enriquecido (~150 líneas, cada paso es una mini-sección autocontenida):**

Cada paso se presenta con: explicación de QUÉ hace, explicación de POR QUÉ es necesario, código Python real, verificación de que el loss baja, explicación de qué pasa si se omite (anti-patrón), cross-link.

El paso zero_grad() recibe tratamiento especial: por qué es necesario (acumulación de gradientes), qué pasa si lo olvidas (bug real), conexión con gradient accumulation en entrenamiento distribuido.

**Intervenciones aplicadas:**
1. ✅ Expansión de listado → secciones completas por paso
2. ✅ Anti-patrones explícitos ("qué pasa si no hacés esto")
3. ✅ Forward reference a entrenamiento distribuido
4. ✅ Código funcional para cada paso

---

## 10. Checklist de Calidad por Sección

Antes de considerar una sección completa, verificar:

### Estructura
- [ ] Apertura narrativa (1-2 párrafos, no técnica)
- [ ] Título con metáfora o gancho ("Value — Un Número con Memoria")
- [ ] Sub-secciones con headings descriptivos
- [ ] Cierre que conecta con la siguiente sección

### Profundidad
- [ ] Cada concepto tiene: intuición + formalismo + verificación numérica
- [ ] Código construido incrementalmente (no como bloque monolítico)
- [ ] Al menos 1 tabla comparativa por sección (excepto S0)
- [ ] Reglas prácticas en secciones avanzadas (S2+)

### Pedagogía
- [ ] Al menos 1 analogía visceral con mapeo explícito
- [ ] Momentos eureka preservados/amplificados donde corresponde
- [ ] Preguntas retóricas que guían el razonamiento
- [ ] Verificaciones numéricas después de cada fórmula
- [ ] Checkpoints interactivos (1-3 por sección)

### Conexiones
- [ ] Cross-links (🔗) a otros recursos del sistema en S2+
- [ ] Referencias al ecosistema real (PyTorch, TensorFlow, etc.)
- [ ] Contexto histórico donde sea relevante
- [ ] La sección final apunta explícitamente al siguiente recurso

### Volumen
- [ ] Mínimo 16,000 caracteres por sección
- [ ] 5 secciones por recurso
- [ ] Total ~100,000+ caracteres por recurso

### Tono
- [ ] Conversacional pero preciso
- [ ] Voseo argentino natural
- [ ] Progresivo en complejidad, nunca se disculpa por ser técnico
- [ ] Distingue entre lo esencial y lo convencional

---

## 11. Proceso Serializable (Checklist completo)

```
□ ITERACIÓN 1 — Traducción / Conversación cruda
  □ Obtener material fuente (transcript, PDF, capítulo)
  □ Producir conversación de aprendizaje o traducción fiel
  □ Preservar momentos eureka, confusiones, código
  □ Guardar en ml_deep/{nombre}-conversacion-completa.md
  □ Resultado: 400-600 líneas, ~1x del original

□ ITERACIÓN 2 — Enrichment pedagógico
  □ Para cada concepto, expandir en 3 dimensiones:
    □ Profundidad (por qué, formalismos)
    □ Amplitud (alternativas, comparaciones, historia)
    □ Pedagogía (eureka, analogías, verificaciones)
  □ Aplicar las 6 operaciones:
    □ Expandir lo que asume conocimiento previo
    □ Insistir con otro ángulo en conceptos clave
    □ Construir momentos eureka (tensión → revelación → anclaje)
    □ Crear analogías funcionales (mapeables, escalables, descartables)
    □ Repetir distribuido donde el concepto reaparece
    □ Explicitar todo código con prosa + construcción incremental
  □ Resegmentar en 5 secciones con progresión:
    □ S0: Contexto y motivación
    □ S1: Abstracción fundamental
    □ S2: Mecanismo clave
    □ S3: Automatización / escala
    □ S4: Integración / ensamblaje
  □ Resultado: ~100K+ caracteres total

□ ITERACIÓN 3 — Cross-linking y refinamiento
  □ Agregar links 🔗 (0-1 en S0-S1, 2-4 en S3-S4)
  □ Agregar reglas prácticas como takeaways mnemotécnicos
  □ Agregar tablas de ecosistema (frameworks, herramientas reales)
  □ Revisar tono (conversacional-preciso, voseo natural)
  □ Revisar progresión (cada sección asume solo lo anterior)
  □ Agregar pregunta de cierre que apunta al siguiente recurso

□ VERIFICACIÓN FINAL
  □ Total ~100K+ caracteres
  □ 5 secciones de 16K-25K cada una
  □ Checklist de calidad pasa para cada sección (§10)
  □ Se puede leer de corrido sin saltos lógicos
  □ Un ingeniero senior que NO conoce el tema puede seguirlo completo
  □ No hay afirmación matemática sin verificación numérica
  □ Cada bloque de código tiene prosa explicativa
  □ Los 9 elementos pedagógicos están presentes (§5)
```

---

## 12. Relación con TEMPLATE-CONTENT-GENERATION.md

| Aspecto | TEMPLATE | Este documento |
|---------|----------|----------------|
| **Foco** | Pipeline técnico (archivos, scripts, DB) | Calidad del texto dentro de esos archivos |
| **Define** | Qué archivos crear y dónde ponerlos | Qué debe contener el texto y cómo escribirlo |
| **Volumen** | "6,000-12,000 chars por sección" | "16,000-25,000 chars por sección" (el estándar real) |
| **Profundidad** | "Incluye fórmulas y ejemplos" | Define las 3 capas: intuición + formalismo + verificación |
| **Proceso** | 8 pasos de generación de infraestructura | 3 iteraciones de enriquecimiento de contenido |
| **Tono** | No definido | Conversacional-preciso con voseo |

**Usar ambos documentos juntos:**
1. Este documento define la calidad del contenido (Iteraciones 1-3)
2. TEMPLATE-CONTENT-GENERATION.md define la infraestructura (Pasos 0-8)
3. El contenido producido por las 3 iteraciones se convierte en el input del Paso 1 del TEMPLATE

---

## 13. Principio Rector

> **El objetivo no es generar textos correctos.**
> **El objetivo es generar instrumentos de comprensión.**

Un texto correcto dice: "la derivada de a×b respecto a `a` es `b`".

Un instrumento de comprensión:
1. Te hace **preguntarte** por qué podría ser así
2. Te muestra con **números concretos** que es así
3. Te explica **intuitivamente** por qué tiene sentido
4. Te da la **demostración formal** para que no queden dudas
5. Te muestra **el código** que lo implementa
6. Te conecta con **el contexto mayor** (dónde se usa esto en la vida real)
7. Te deja una **pregunta** para que verifiques tu comprensión

Si un texto no hace al menos 5 de estas 7 cosas para cada concepto central, no está listo.
