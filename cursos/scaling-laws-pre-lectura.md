# Scaling Laws for Neural Language Models (Kaplan et al., 2020)
## Sesion Pre-Lectura — Preparacion Conceptual

**Fecha:** 2026-02-15
**Objetivo:** Construir un mapa mental de las scaling laws ANTES de leer el paper en ingles.
**Metodo:** Explicacion progresiva con ecuaciones, diagramas y contexto historico.

---

## Concepto 1: La Pregunta Central

Entrenar un modelo de lenguaje requiere tres ingredientes:

1. **N** — Numero de parametros (tamano del modelo)
2. **D** — Cantidad de datos (tokens de entrenamiento)
3. **C** — Compute (FLOPs de entrenamiento)

La pregunta del paper es simple pero poderosa:

> **Si tengo un presupuesto fijo de compute, como lo distribuyo entre N y D para minimizar la loss?**

Kaplan et al. descubrieron que la cross-entropy loss sigue **power laws** (leyes de potencia) con respecto a N, D y C. Esto significa que la relacion no es lineal ni logaritmica, sino una curva predecible de la forma:

```
L = a * X^(-b)

donde X es N, D, o C
```

Esto es revolucionario porque convierte el entrenamiento de LLMs de "a ver que sale" en algo **predecible y planificable**.

---

## Concepto 2: Las Tres Ecuaciones Fundamentales

Cuando varías un factor manteniendo los otros dos sin restriccion (suficientemente grandes), la loss sigue estas leyes:

### L(N) — Loss en funcion de parametros

```
L(N) = (N_c / N) ^ alpha_N

alpha_N = 0.076
N_c = 8.8 x 10^13 parametros
```

### L(D) — Loss en funcion de datos

```
L(D) = (D_c / D) ^ alpha_D

alpha_D = 0.095
D_c = 5.4 x 10^13 tokens
```

### L(C) — Loss en funcion de compute

```
L(C) = (C_c / C) ^ alpha_C

alpha_C = 0.050
C_c = 3.1 x 10^8 PF-days
```

**Que significan los exponentes?** Son la "velocidad" a la que mejora la loss al escalar cada recurso. Observa que alpha_D > alpha_N > alpha_C. Esto quiere decir que:

- Escalar datos mejora la loss **mas rapido** por unidad
- Escalar compute directo es lo **menos eficiente**
- Pero C determina cuanto N y D puedes usar, asi que es el recurso maestro

### Tabla de Constantes Clave

| Constante | Valor | Significado |
|-----------|-------|-------------|
| alpha_N | 0.076 | Exponente de escala para parametros |
| alpha_D | 0.095 | Exponente de escala para datos |
| alpha_C | 0.050 | Exponente de escala para compute |
| N_c | 8.8 x 10^13 | Constante de escala para N |
| D_c | 5.4 x 10^13 | Constante de escala para D |
| C_c | 3.1 x 10^8 PF-days | Constante de escala para C |

---

## Concepto 3: Power Laws — Por Que Importan

Una power law tiene una propiedad especial: en escala log-log, se ve como una **linea recta**.

```
Loss (log)
  |
  |\
  | \
  |  \
  |   \
  |    \         ← linea recta en log-log
  |     \           = power law confirmada
  |      \
  |       \
  |        \_____  ← nunca llega a 0
  |               (hay un floor irreducible)
  +───────────────── Parametros N (log)
```

Esto implica tres cosas practicas:

1. **Predecibilidad:** Puedes extrapolar. Si mides la loss con modelos pequenos, puedes predecir la loss de un modelo 100x mas grande.
2. **Retornos decrecientes:** Duplicar N no duplica la mejora. Necesitas ~10x mas parametros para reducir la loss a la mitad.
3. **Sin techo visible:** La loss sigue bajando. No hay un punto donde "ya no mejora" (dentro del rango estudiado).

> **Implicacion practica:** OpenAI uso estas leyes para predecir el rendimiento de GPT-3 antes de entrenarlo. Entrenaron modelos chicos, ajustaron la curva, y extrapolaron.

---

## Concepto 4: La Ecuacion Combinada L(N,D) y Overfitting

Cuando N y D estan ambos limitados, la loss sigue:

```
L(N,D) = [ (N_c/N)^(alpha_N/beta) + (D_c/D)^(alpha_D/beta) ] ^ beta
```

Esta ecuacion captura el **overfitting**: si tu modelo es muy grande (N alto) pero tienes pocos datos (D bajo), la loss no mejora tanto como esperarias.

```
Loss
  |
  |  D = 10^8 tokens
  |  ·····...___________  ← plateau temprano (pocos datos)
  |
  |  D = 10^9 tokens
  |  ·····........______  ← plateau mas tarde
  |
  |  D = 10^10 tokens
  |  ·····..............____  ← sigue mejorando
  |
  |  D = infinito
  |  ·····.................____  ← curva ideal L(N)
  |
  +─────────────────────────── N (parametros)
```

**Regla practica del paper:** Para evitar overfitting significativo, los datos deben crecer proporcionalmente con los parametros:

```
D debe crecer como N^0.74 (aproximadamente)
```

Un modelo de 10B parametros necesita ordenes de magnitud mas datos que uno de 1B para no sobreajustar.

---

## Concepto 5: Compute-Optimal Training — La Recomendacion de Kaplan

Dado un presupuesto fijo de compute C, como lo distribuyes?

La relacion entre compute y parametros optimos es:

```
N_opt ∝ C^0.73
D_opt ∝ C^0.27
```

Esto significa: **escala el modelo mucho mas agresivamente que los datos.**

```
Distribucion del compute segun Kaplan:
═══════════════════════════════════════

Si compute crece 10x:

  Parametros (N):  ████████████████████████  ~5.4x mas
  Datos (D):       ████████                  ~1.9x mas

  El modelo crece MUCHO mas rapido que los datos.
```

### Ejemplo concreto

| Compute (C) | N optimo (Kaplan) | D optimo (Kaplan) |
|-------------|-------------------|-------------------|
| 10^18 FLOPs | ~400M params | ~8B tokens |
| 10^20 FLOPs | ~10B params | ~20B tokens |
| 10^22 FLOPs | ~200B params | ~50B tokens |
| 10^24 FLOPs | ~5T params | ~130B tokens |

Nota como N crece ordenes de magnitud mas rapido que D. Este fue el paradigma dominante de 2020 a 2022.

---

## Concepto 6: Lo Que Importa (y Lo Que No)

### La arquitectura importa MENOS que la escala

Kaplan encontro que la profundidad (layers) vs anchura (d_model) del Transformer tiene efecto minimo en la loss, siempre y cuando N se mantenga constante.

```
Mismo N = 1B parametros:

  12 layers x 4096 d_model  → Loss ≈ 3.10
  24 layers x 2896 d_model  → Loss ≈ 3.08
  48 layers x 2048 d_model  → Loss ≈ 3.09

  Diferencia: < 2%   ← La arquitectura casi no importa
```

### Modelos grandes son mas sample-efficient

Un modelo grande aprende MAS de cada token que uno pequeno:

```
Tokens vistos para alcanzar Loss = 3.0:

  Modelo 100M params:  ████████████████████████  ~50B tokens
  Modelo 1B params:    ████████████              ~8B tokens
  Modelo 10B params:   ██████                    ~2B tokens

  Mas grande = necesita MENOS datos para la misma loss.
```

### Critical Batch Size

Existe un tamano de batch optimo que depende de la loss actual:

```
B_crit(L) = B* / L^(1/alpha_B)
```

- Si B < B_crit → estas desperdiciando compute (pasos muy pequenos)
- Si B > B_crit → estas desperdiciando datos (gradientes redundantes)
- La zona optima esta alrededor de B_crit

---

## Concepto 7: Kaplan vs Chinchilla — La Correccion de 2022

En 2022, Hoffmann et al. (DeepMind) publicaron el paper "Chinchilla" que revisaba las conclusiones de Kaplan. La diferencia es fundamental:

### Tabla Comparativa

| Aspecto | Kaplan (2020) | Chinchilla (2022) |
|---------|---------------|-------------------|
| N_opt escala como | C^0.73 | C^0.50 |
| D_opt escala como | C^0.27 | C^0.50 |
| Filosofia | Modelo grande, pocos tokens | Modelo y datos crecen igual |
| Ratio D/N optimo | ~20 tokens/param | ~20 tokens/param* |
| Ejemplo 70B params | Entrenar con ~30B tokens | Entrenar con ~1.4T tokens |
| Resultado | Modelos undertrained | Modelos compute-optimal |

*Chinchilla encontro que el ratio optimo es ~20 tokens por parametro.

### Por que Kaplan estaba (parcialmente) equivocado?

Kaplan uso un **learning rate schedule fijo** para todos los tamanos de modelo. Chinchilla ajusto el schedule por modelo, lo que cambio dramaticamente los resultados.

```
Segun Kaplan:                    Segun Chinchilla:

  Si tienes C = 10^21 FLOPs:       Si tienes C = 10^21 FLOPs:

  N = 10B params                   N = 1.4B params
  D = 20B tokens                   D = 28B tokens
  → Modelo grande, pocos datos     → Modelo mas chico, muchos datos
```

### Impacto en la industria

La mayoria de los LLMs entre 2020-2022 estaban **undertrained** segun Chinchilla:

```
  GPT-3:    175B params, 300B tokens   → ratio 1.7  (muy undertrained)
  Gopher:   280B params, 300B tokens   → ratio 1.1  (aun peor)
  Chinchilla: 70B params, 1.4T tokens  → ratio 20   (compute-optimal)
  LLaMA:    65B params, 1.4T tokens    → ratio 21.5 (post-Chinchilla)
```

> **Leccion clave:** Chinchilla con 70B params supero a Gopher con 280B params. No porque fuera mas grande, sino porque vio 4.7x mas datos.

---

## Resumen Visual

```
                 Scaling Laws for Neural Language Models
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         Power Laws     Compute-Optimal   Chinchilla
              │            Training        Revision
              │               │               │
        ┌─────┼─────┐    N_opt ∝ C^0.73   N_opt ∝ C^0.50
        │     │     │    (escalar modelo   (escalar ambos
      L(N)  L(D)  L(C)   agresivamente)    por igual)
        │     │     │         │               │
     α=0.076 α=0.095 α=0.050 │         La mayoria de
        │     │     │         │         los LLMs estaban
        └─────┼─────┘    Consecuencia:  undertrained
              │          GPT-3, Gopher
        L(N,D) combinada  pocos tokens
              │
        Predice overfitting
        D debe crecer como N^0.74
```

---

## Terminos Clave (Ingles → Espanol)

| Ingles | Espanol | Que es |
|--------|---------|--------|
| Scaling law | Ley de escala | Relacion matematica entre recursos y rendimiento |
| Power law | Ley de potencia | Funcion de la forma y = a * x^b |
| Cross-entropy loss | Perdida de entropia cruzada | Metrica que mide que tan bien predice el modelo |
| Compute (FLOPs) | Computo (operaciones de punto flotante) | Costo computacional del entrenamiento |
| Parameters | Parametros | Pesos entrenables del modelo (N) |
| Tokens | Tokens | Unidades de texto para entrenamiento (D) |
| Sample efficiency | Eficiencia de muestra | Cuanto aprende el modelo por dato visto |
| Overfitting | Sobreajuste | Modelo memoriza datos en vez de generalizar |
| Compute-optimal | Optimo en computo | Mejor distribucion de N y D dado C fijo |
| Batch size | Tamano de lote | Cantidad de ejemplos por paso de entrenamiento |
| Learning rate schedule | Agenda de tasa de aprendizaje | Como varia el learning rate durante el entrenamiento |
| Undertrained | Sub-entrenado | Modelo que no vio suficientes datos para su tamano |

---

## Preguntas de Comprension (Auto-evaluacion)

1. ¿Que significa que la loss siga una power law con respecto a N? ¿Que forma tiene la curva en escala log-log?
2. ¿Cual de los tres exponentes (alpha_N, alpha_D, alpha_C) indica que los datos son el recurso mas eficiente para mejorar la loss? ¿Por que entonces no solo escalamos datos?
3. ¿Que predice la ecuacion combinada L(N,D) que las ecuaciones individuales no capturan?
4. Segun Kaplan, si tu presupuesto de compute crece 10x, ¿cuanto deberias crecer N y cuanto D?
5. ¿Por que los modelos mas grandes son mas sample-efficient? ¿Que implicacion practica tiene esto?
6. ¿Por que la arquitectura (profundidad vs anchura) importa tan poco comparada con el numero total de parametros?
7. ¿Que error metodologico cometio Kaplan que Chinchilla corrigio? ¿Que efecto tuvo en las conclusiones?
8. GPT-3 tiene 175B parametros y se entreno con 300B tokens. ¿Cuantos tokens deberia haber visto segun Chinchilla? ¿Por que esto importa?
9. ¿Que es el critical batch size y por que depende de la loss actual del modelo?
10. Si alguien te dice "para mejorar el modelo, duplica los parametros", ¿que le responderias usando lo que sabes de scaling laws?
