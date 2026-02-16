# Attention Is All You Need (Vaswani et al., 2017)
## Sesión Pre-Lectura — Preparación Conceptual

**Fecha:** 2026-02-15
**Objetivo:** Construir un mapa mental de los conceptos clave ANTES de leer el paper en inglés.
**Método:** Explicación progresiva con preguntas y respuestas.

---

## Concepto 1: El Problema con las RNNs

Las **Recurrent Neural Networks** (RNNs) dominaban NLP en 2017. Tenían dos problemas graves:

**1. Son inherentemente secuenciales:**

```
Entrada: "The cat sat on the mat"

RNN procesa así:
  The → cat → sat → on → the → mat
   t₁    t₂    t₃    t₄    t₅    t₆

Cada paso DEPENDE del anterior. No puedes calcular t₃ sin t₂.
→ No se puede paralelizar en GPUs.
```

**2. Dependencias de largo alcance se degradan:**

```
"The cat, which was sitting on the old wooden mat
 in the corner of the room near the window, was fat."

  The cat ──────────── 20 tokens después ──────────── was fat
     ↑                                                    ↑
  sujeto                                              predicado

La RNN tiene que "recordar" cat a través de 20 pasos.
En la práctica, el gradiente se desvanece o explota.
```

**LSTM/GRU** mitigan esto parcialmente con compuertas (gates), pero el problema fundamental persiste: el camino entre dos tokens distantes sigue siendo O(n).

> **Pregunta central del paper: ¿Podemos eliminar la recurrencia por completo y conectar CUALQUIER par de tokens directamente?**

---

## Concepto 2: Atención — La Idea Central

La **atención** permite que cada token "mire" a todos los demás tokens **directamente**, sin pasar por intermediarios.

**Intuición:**

```
Frase: "The animal didn't cross the street because it was too tired"

¿A qué se refiere "it"?

Sin atención: it → was → too → tired (solo ve lo que le sigue)
Con atención: it ←──mira──→ animal  (conexión directa, peso alto)
              it ←──mira──→ street  (conexión directa, peso bajo)
```

### Scaled Dot-Product Attention

Cada token genera tres vectores:
- **Q** (Query): "¿qué estoy buscando?"
- **K** (Key): "¿qué ofrezco?"
- **V** (Value): "¿qué información tengo?"

La fórmula:

```
                        Q · Kᵀ
Attention(Q, K, V) = softmax(─────) · V
                         √d_k
```

**Paso a paso:**

```
1. Q · Kᵀ              → puntaje de similitud entre cada par de tokens
2. ÷ √d_k              → escalar para evitar gradientes diminutos en softmax
3. softmax(...)         → convertir puntajes en probabilidades (suman 1)
4. × V                  → promedio ponderado de los valores
```

**¿Por qué dividir por √d_k?** Si d_k = 64, los productos punto tienden a crecer en magnitud con la dimensión. Valores muy grandes empujan softmax a regiones con gradientes casi cero. Dividir por √64 = 8 los estabiliza.

---

## Concepto 3: Multi-Head Attention

Un solo mecanismo de atención captura UN tipo de relación. Pero el lenguaje tiene múltiples relaciones simultáneas:

```
"The cat sat on the mat because it was tired"

Relación sintáctica:  cat → sat (sujeto-verbo)
Relación semántica:   it → cat (correferencia)
Relación posicional:  on → mat (preposición-objeto)
```

**Solución:** Ejecutar **h = 8 funciones de atención en paralelo**, cada una en un subespacio diferente.

```
┌──────────────────────────────────────────────────────┐
│                  Multi-Head Attention                 │
│                                                      │
│   Q,K,V ──┬── Head 1: W₁Q, W₁K, W₁V → Atención ───┐│
│            ├── Head 2: W₂Q, W₂K, W₂V → Atención ──┤│
│            ├── Head 3: W₃Q, W₃K, W₃V → Atención ──┤│
│            ├── ...                                  ││
│            └── Head 8: W₈Q, W₈K, W₈V → Atención ──┘│
│                                                  │   │
│                              Concatenar ─── W_O ──→  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Dimensiones:** Cada head opera en d_k = d_model / h = 512 / 8 = 64 dimensiones. El costo total es similar a una sola atención con dimensión completa.

```
MultiHead(Q, K, V) = Concat(head₁, ..., head_h) · W_O

donde head_i = Attention(Q · W_i^Q, K · W_i^K, V · W_i^V)
```

---

## Concepto 4: La Arquitectura Transformer

```
┌─────────────────────────────────────────────────────────┐
│                    TRANSFORMER                          │
│                                                         │
│   ENCODER (×6)                    DECODER (×6)          │
│  ┌──────────────┐              ┌──────────────────┐     │
│  │ Input Embed  │              │ Output Embed     │     │
│  │    + PE      │              │    + PE          │     │
│  └──────┬───────┘              └──────┬───────────┘     │
│         ▼                             ▼                 │
│  ┌──────────────┐              ┌──────────────────┐     │
│  │ Multi-Head   │              │ Masked Multi-Head│     │
│  │ Self-Attn    │              │ Self-Attn        │     │
│  │ + Add & Norm │              │ + Add & Norm     │     │
│  └──────┬───────┘              └──────┬───────────┘     │
│         │                             ▼                 │
│         │                      ┌──────────────────┐     │
│         │                      │ Multi-Head       │     │
│         └─────────────────────→│ Cross-Attn       │     │
│                                │ (Q=dec, K,V=enc) │     │
│                                │ + Add & Norm     │     │
│                                └──────┬───────────┘     │
│  ┌──────────────┐                     ▼                 │
│  │ Feed-Forward │              ┌──────────────────┐     │
│  │ + Add & Norm │              │ Feed-Forward     │     │
│  └──────┬───────┘              │ + Add & Norm     │     │
│         │                      └──────┬───────────┘     │
│         ▼                             ▼                 │
│     (repetir ×6)                  (repetir ×6)          │
│                                       ▼                 │
│                                ┌──────────────────┐     │
│                                │ Linear + Softmax │     │
│                                └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

**Tres tipos de atención en el modelo:**

| Tipo | Dónde | Q viene de | K, V vienen de |
|------|-------|-----------|----------------|
| Self-attention (encoder) | Encoder | Encoder | Encoder |
| Masked self-attention | Decoder | Decoder | Decoder |
| Cross-attention | Decoder | Decoder | Encoder |

**Masked self-attention** en el decoder impide que el token en posición i vea tokens futuros (i+1, i+2, ...). Se logra poniendo −∞ en las posiciones correspondientes antes de softmax.

---

## Concepto 5: Los Componentes Restantes

### Positional Encoding

La atención no tiene noción de orden. "El gato comió pescado" y "Pescado comió el gato" producirían la misma representación. Se inyecta información posicional con funciones sinusoidales:

```
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

**¿Por qué seno y coseno?** Porque PE(pos+k) se puede expresar como transformación lineal de PE(pos), lo que le permite al modelo aprender desplazamientos relativos.

### Position-wise Feed-Forward Network

Después de cada capa de atención, cada posición pasa por una red de dos capas:

```
FFN(x) = max(0, x · W₁ + b₁) · W₂ + b₂
              ↑
           ReLU
```

Dimensión interna d_ff = 2048, cuatro veces d_model. Es como darle a cada token un "espacio de trabajo" más grande para procesar la información que recogió en la atención.

### Residual Connections + Layer Normalization

Cada sub-capa tiene:

```
output = LayerNorm(x + Sublayer(x))
              ↑         ↑
         normaliza    atención o FFN
              ↑
          x es la conexión residual (atajo)
```

Las conexiones residuales permiten que los gradientes fluyan directamente a través de las 6 capas sin degradarse.

---

## Concepto 6: Dimensiones y Entrenamiento

### Tabla de Hiperparámetros (modelo base)

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| d_model | 512 | Dimensión de embeddings y representaciones |
| d_ff | 2048 | Dimensión interna del FFN (4× d_model) |
| h | 8 | Número de heads de atención |
| d_k = d_v | 64 | Dimensión por head (512/8) |
| N | 6 | Capas en encoder y decoder |
| dropout | 0.1 | Regularización |
| vocab | ~37,000 | Tokens (BPE, vocabulario compartido EN-DE) |
| params | ~65M | Parámetros totales (base) |

### Entrenamiento

- **Hardware:** 8 NVIDIA P100 GPUs
- **Tiempo:** 3.5 días (base), 12 horas por 100K pasos
- **Optimizer:** Adam con β₁=0.9, β₂=0.98, ε=10⁻⁹
- **Learning rate:** Warmup + decay

```
LR = d_model^(-0.5) · min(step^(-0.5), step · warmup_steps^(-1.5))

      LR
       │     /\
       │    /  \
       │   /    \────────────
       │  /                   ────────
       │ /                              ──────
       └──────────────────────────────────────── step
         ↑ warmup           decay →
         4000 steps
```

- **Label smoothing:** ε = 0.1 (distribuir probabilidad a tokens incorrectos, mejora BLEU a costa de perplejidad)

---

## Concepto 7: Resultados y Comparación

### BLEU Scores (traducción automática)

| Modelo | EN-DE | EN-FR | Costo entrenamiento |
|--------|-------|-------|---------------------|
| Transformer (base) | 27.3 | 38.1 | 3.5 días, 8 GPUs |
| Transformer (big) | **28.4** | **41.8** | 3.5 días, 8 GPUs |
| Mejor RNN previo | 26.0 | 40.5 | Semanas |
| Mejor ensemble previo | 26.4 | 41.0 | Semanas × N modelos |

### Complejidad Computacional por Capa

| Tipo de capa | Complejidad por capa | Longitud de camino | Paralelizable |
|-------------|---------------------|--------------------|----|
| Self-Attention | O(n² · d) | O(1) | Sí |
| RNN | O(n · d²) | O(n) | No |
| CNN | O(k · n · d²) | O(log_k(n)) | Sí |

Donde n = longitud de secuencia, d = dimensión del modelo, k = kernel size.

**Observaciones clave:**
- Self-attention es O(1) en longitud de camino: cualquier token "ve" a cualquier otro directamente
- RNNs necesitan O(n) pasos para conectar tokens distantes
- Self-attention es O(n²) en complejidad: costoso para secuencias largas (esto motiva trabajos posteriores como Sparse Attention, Linformer, Flash Attention)
- Para secuencias típicas de NLP (n < 512), n² · d < n · d², porque n < d

### Por Qué Importa

```
Attention Is All You Need (2017)
        │
        ├─→ GPT-1 (2018) ─→ GPT-2 ─→ GPT-3 ─→ GPT-4
        │     (solo decoder)
        ├─→ BERT (2018)
        │     (solo encoder)
        ├─→ T5 (2019)
        │     (encoder-decoder completo)
        ├─→ Claude, LLaMA, Gemini, Mistral...
        │
        └─→ Más allá de texto: Vision Transformer (ViT),
             DALL-E, Whisper, AlphaFold 2...
```

> **Todo modelo de lenguaje moderno es un descendiente directo de este paper.** No es una exageración: el Transformer reemplazó RNNs, CNNs para secuencias, y se expandió a visión, audio, proteínas y más.

---

## Resumen Visual

```
                  Attention Is All You Need
                          │
            ┌─────────────┼──────────────┐
            │             │              │
       Problema       Solución       Impacto
            │             │              │
     RNNs: secuencial  Transformer    SOTA en traducción
     no paralelo       pura atención  Base de TODOS
     dependencias      sin recurrencia los LLMs modernos
     largo alcance         │
                    ┌──────┼──────┐
                    │      │      │
              Self-Attn  Multi   Encoder-
              Q·Kᵀ/√d   Head    Decoder
                    │    h=8     N=6
                    │      │      │
              Positional  FFN   Residual +
              Encoding   d_ff   LayerNorm
              sin/cos    2048
```

---

## Términos Clave para el Paper (Inglés → Español)

| Inglés | Español | Qué es |
|--------|---------|--------|
| Self-attention | Auto-atención | Mecanismo donde cada token atiende a todos los demás |
| Scaled dot-product | Producto punto escalado | Q·Kᵀ/√d_k — el cálculo base de atención |
| Multi-head attention | Atención multi-cabeza | h atenciones paralelas en subespacios distintos |
| Query / Key / Value | Consulta / Clave / Valor | Los tres vectores que genera cada token |
| Positional encoding | Codificación posicional | Señal inyectada para indicar orden de tokens |
| Residual connection | Conexión residual | Atajo que suma la entrada a la salida de una capa |
| Layer normalization | Normalización de capa | Normalizar activaciones para estabilizar entrenamiento |
| Feed-forward network | Red prealimentada | MLP de dos capas aplicado por posición |
| Encoder-decoder | Codificador-decodificador | Arquitectura de dos bloques para seq2seq |
| Label smoothing | Suavizado de etiquetas | Regularización que distribuye probabilidad a clases incorrectas |
| Warmup | Calentamiento | Fase inicial donde el learning rate sube linealmente |
| Masked attention | Atención enmascarada | Atención que bloquea posiciones futuras en el decoder |
| Beam search | Búsqueda por haz | Decodificación que mantiene k candidatos en paralelo |
| BLEU score | Puntuación BLEU | Métrica de calidad de traducción automática |

---

## Preguntas de Comprensión (Auto-evaluación)

1. ¿Por qué las RNNs no se pueden paralelizar eficientemente? ¿Qué consecuencia tiene esto para el entrenamiento?
2. En la fórmula de atención, ¿qué pasa si NO divides por √d_k? ¿Qué efecto tiene en softmax?
3. ¿Por qué usar multi-head attention en vez de una sola atención con dimensión completa? ¿Qué ganas?
4. Explica la diferencia entre self-attention, masked self-attention y cross-attention. ¿Dónde se usa cada una?
5. ¿Cómo resuelve el positional encoding el problema de que la atención es invariante al orden?
6. ¿Por qué la longitud de camino O(1) del Transformer es ventaja sobre O(n) de las RNNs para dependencias largas?
7. ¿Cuál es la debilidad computacional del self-attention y qué trabajos posteriores la atacan?
8. ¿Qué hace el warmup del learning rate y por qué es necesario al inicio del entrenamiento?
9. ¿Por qué el Transformer big logra mejor BLEU con menos tiempo de entrenamiento que los mejores modelos RNN previos?
10. Si el Transformer original es encoder-decoder, ¿por qué GPT usa solo decoder y BERT solo encoder? ¿Qué sacrifica cada uno?
