# PDF Transpiler: Investigación de Producto Standalone

> **Fecha:** 2026-02-10
> **Contexto:** Jarre ya tiene un pipeline funcional que toma un PDF (DDIA) y genera una experiencia de aprendizaje optimizada. La hipótesis es que esto puede ser un producto standalone.
> **Disclaimer legal:** Este documento es investigación informativa, NO constituye asesoramiento legal.

---

## Índice

1. [Fundamento Académico](#1-fundamento-académico)
2. [Landscape Competitivo](#2-landscape-competitivo)
3. [Propuesta de Valor Diferencial](#3-propuesta-de-valor-diferencial)
4. [Análisis de Mercado](#4-análisis-de-mercado)
5. [Legalidad y Fair Use](#5-legalidad-y-fair-use)
6. [Riesgos y Contraargumentos](#6-riesgos-y-contraargumentos)
7. [MVP Standalone](#7-mvp-standalone)
8. [Conclusión: Go/No-Go](#8-conclusión-gono-go)

---

## 1. Fundamento Académico

### 1.1 Interpolated Testing / Retrieval Practice

El componente central del pipeline: intercalar quizzes (MC/TF) durante la lectura.

#### Szpunar, Khan & Schacter (2013) — PNAS

- **Cita:** Szpunar, K.K., Khan, N.Y., & Schacter, D.L. (2013). Interpolated memory tests reduce mind wandering and improve learning of online lectures. *PNAS*, 110(16), 6313-6317.
- **N:** 80 (2 experimentos)
- **Effect sizes:**
  - Rendimiento segmento 4: **d = 1.03** (testeado vs. no-testeado), **d = 1.06** (testeado vs. re-estudio)
  - Mind wandering: testeados 19% vs. no-testeados 41%
- **Resultados:** Grupo testeado 89-90% en test final vs. re-estudio 76% vs. control 68%
- **Conclusión:** Tests interpolados producen efecto **grande** (d > 1.0) sobre el aprendizaje. Reducen mind wandering y aumentan toma de notas.

#### Adesope, Trevisan & Sundararajan (2017) — Meta-análisis

- **Cita:** Adesope, O.O., et al. (2017). Rethinking the use of tests. *Review of Educational Research*, 87(3), 659-701.
- **Alcance:** 272 effect sizes de 118 artículos (188 experimentos). 77% codificados como alta calidad.
- **Effect sizes:**
  - Practice testing vs. todas las condiciones control: **g = 0.61** [IC 95%: 0.58-0.65]
  - Practice testing vs. re-estudio: **g = 0.51**
  - En contexto de aula: **g = 0.67**
  - Con intervalo de retención 1-6 días: **g = 0.82**
- **Conclusión:** El beneficio del testing **crece con el tiempo** (g = 0.82 para 1-6 días).

#### Rowland (2014) — Meta-análisis

- **Cita:** Rowland, C.A. (2014). The effect of testing versus restudy on retention. *Psychological Bulletin*, 140(6), 1432-1463.
- **Alcance:** 159 effect sizes.
- **Effect size:** Testing vs. restudy: **g = 0.50** [IC 95%: 0.42-0.58]
- **Moderadores:** Efecto mayor con contenidos más complejos y recuperación más exigente.
- **Conclusión:** El testing effect aumenta con la complejidad del material — relevante porque Jarre se enfoca en material técnico denso.

#### Yang, Luo, Vadillo, Yu & Shanks (2021) — Meta-análisis

- **Cita:** Yang, C., et al. (2021). Testing (quizzing) boosts classroom learning. *Psychological Bulletin*, 147(4), 399-435.
- **Alcance:** 573 effect sizes, 222 estudios, **N = 48,478 estudiantes**
- **Effect sizes:**
  - Testing vs. control: **g = 0.499**
  - Testing vs. estrategias de aprendizaje elaborativo: **g = 0.095**
- **Matiz crítico:** El testing es claramente superior a lectura pasiva, pero no dramáticamente superior a otros métodos activos bien implementados.

#### Síntesis de Interpolated Testing

| Meta-análisis | k (estudios) | N total | g/d global |
|---|---|---|---|
| Rowland (2014) | 159 ES | No reportado | **g = 0.50** |
| Adesope et al. (2017) | 188 exp | No reportado | **g = 0.61** |
| Yang et al. (2021) | 222 estudios | **48,478** | **g = 0.50** |
| Szpunar et al. (2013) | 2 exp | 80 | **d = 1.03-1.06** |

**Conclusión convergente:** Testing interpolado produce effect size medio-grande (g = 0.50-0.61) comparado con lectura pasiva, con evidencia de 3 meta-análisis y decenas de miles de participantes.

---

### 1.2 Forward Testing Effect

Los quizzes intermedios mejoran la retención del material POSTERIOR (no solo el testeado).

#### Chan, Meissner & Davis (2018) — Meta-análisis

- **Cita:** Chan, J.C.K., Meissner, C.A., & Davis, S.D. (2018). Retrieval potentiates new learning. *Psychological Bulletin*, 144(11), 1111-1146.
- **Alcance:** Más de 150 experimentos.
- **Effect sizes:**

| Condición | Hedges' g |
|---|---|
| Forward testing effect (global) | **g = 0.44** |
| Material: pasajes de prosa | **g = 0.58** |
| Material: pares asociados | **g = 0.59** |
| Test final: free recall | **g > 0.71** |

- **Conclusión:** Testear material previo potencia el aprendizaje de material nuevo posterior. El g = 0.58 para prosa es directamente aplicable a Jarre. Justifica la arquitectura quiz → lectura → quiz → lectura.

#### Pastötter & Bäuml (2014) — Review

- **Cita:** Pastötter, B., & Bäuml, K.-H.T. (2014). Retrieval practice enhances new learning. *Frontiers in Psychology*, 5, 286.
- **Tipo:** Review teórico (no reporta effect sizes propios).
- **Mecanismos:** Reset de codificación + segregación contextual. Replicado con listas de palabras, textos, narrativas, imágenes, videos, rostros y nombres.

---

### 1.3 Pretesting Effect

Intentar responder ANTES de leer mejora la comprensión, incluso con respuestas incorrectas.

#### Richland, Kornell & Kao (2009)

- **Cita:** Richland, L.E., Kornell, N., & Kao, L.S. (2009). The pretesting effect. *Journal of Experimental Psychology: Applied*, 15(3), 243-257.
- **N:** ~422 participantes (5 experimentos)
- **Effect sizes:** d = 0.45 a **d = 1.10**
- **Resultados:** Items pretesteados (aunque respondidos incorrectamente): 75% en test final vs. 50% para items no pretesteados (+25pp).
- **Conclusión:** Los intentos de recuperación fallidos mejoran significativamente el aprendizaje posterior. Valida el componente de pre-question en el flujo ACTIVATE → LEARN → APPLY → EVALUATE. Justifica no llamar a DeepSeek para evaluar la pre-question (ahorro sin pérdida de eficacia).

---

### 1.4 Desirable Difficulties

#### Bjork & Bjork (2011) — Framework teórico

- **Cita:** Bjork, E.L., & Bjork, R.A. (2011). Making things hard on yourself, but in a good way. In *Psychology and the real world* (pp. 56-64). Worth Publishers.
- **Tipo:** Capítulo de libro / review teórico. No reporta effect sizes propios.
- **Modelo de dos fuerzas:** Storage strength (arraigo en memoria) vs. Retrieval strength (facilidad de acceso). Las condiciones que maximizan retrieval a corto plazo difieren de las que maximizan storage a largo plazo.
- **Dificultades deseables:** Spacing, Interleaving, Testing, Generation, Variación contextual.
- **Dato empírico (interleaving):** Grupo interleaving 63% correcto a 1 semana vs. blocked 20% (+43pp).

**Jarre implementa múltiples dificultades deseables:** Testing (micro-quizzes), Spacing (SM-2), Generation (pre-questions), Variación contextual (MC, TF, respuesta abierta, escenarios).

---

### 1.5 Successive Relearning

La combinación de retrieval practice + spaced repetition produce efectos multiplicativos.

#### Rawson & Dunlosky (2022) — CDPS

- **Cita:** Rawson, K.A., & Dunlosky, J. (2022). Successive relearning: An underexplored but potent technique. *Current Directions in Psychological Science*, 31(4), 362-368.
- **Tipo:** Review/síntesis de más de una docena de estudios.

#### Rawson, Vaughn, Walsh & Dunlosky (2018)

- **Effect sizes:** Successive relearning vs. single-session learning: **d = 1.52 a 4.19**
- **N:** 533 estudiantes, más de 100,000 respuestas.

#### Rawson, Dunlosky & Sciartelli (2013) — Validación en aula

- **Resultados:**
  - Retención a 1 mes: hasta **68%** (5 sesiones) vs. **~11%** (control)
  - Retención a 4 meses: hasta **49%** vs. **~11%** (control)

**Conclusión:** El successive relearning produce los effect sizes más grandes de toda la literatura (d = 1.52 a 4.19). La retención a 4 meses es 4-6x mayor que el estudio libre. Es el componente de mayor impacto del pipeline.

---

### 1.6 Multimedia Learning

#### Mayer (2009) — Principio Multimedia

- **Cita:** Mayer, R.E. (2009). *Multimedia Learning*. Cambridge University Press.
- **Effect size mediano:** **d = 1.67** (texto + gráficos vs. texto solo)
- **Conclusión:** Las personas aprenden significativamente mejor con texto + gráficos. Effect size extraordinariamente grande.

#### Principio de Contigüidad Espacial

- **k = 22 estudios** (todos positivos). **Effect size mediano: d = 1.10**
- **Meta-análisis independiente** (Schroeder & Cenkci, 2018): k = 58, N = 2,426, **g = 0.63** (p < 0.001)
- **Relevancia:** Los PDFs académicos presentan figuras separadas del texto que las referencia. Integrar figuras junto al texto relevante captura g = 0.63 a d = 1.10 solo por redistribuir contenido existente.

#### Noetel et al. (2022) — Meta-meta-análisis

- **Cita:** Noetel, M., et al. (2022). Multimedia Design for Learning. *Review of Educational Research*, 92(3).
- **N = 78,177** participantes en 1,189 estudios, 29 revisiones sistemáticas.
- **Conclusión:** 11 principios de diseño confirmados. Diseño multimedia es **más importante para materiales complejos**.

#### Tabla de Effect Sizes Multimedia (Mayer)

| Principio | d (mediana) | k (estudios) |
|---|---|---|
| Multimedia (texto+gráficos vs. texto) | 1.67 | 5 |
| Contigüidad temporal | 1.22 | 9 |
| Contigüidad espacial | 0.79-1.10 | 22-58 |
| Redundancia | 0.87 | - |
| Coherencia | 0.70 | - |
| Modalidad | 0.65 | 76 |
| Señalización | 0.46-0.52 | - |

---

### 1.7 Segmentation Principle

#### Mayer & Chandler (2001)

- **Cita:** Mayer, R.E. & Chandler, P. (2001). When learning is just a click away. *Journal of Educational Psychology*, 93(2), 390-397.
- **Effect size:** **d = 0.98** (animación segmentada vs. continua)
- **Conclusión:** Efecto **grande**. Mayor cuando el material es complejo, la presentación es rápida, y el estudiante no tiene experiencia previa.

#### Rey et al. (2019) — Meta-análisis

- **Cita:** Rey, G.D., et al. (2019). A Meta-analysis of the Segmenting Effect. *Educational Psychology Review*, 31, 389-419.
- **k = 56 investigaciones**, 88 comparaciones.
- **Hallazgo clave:** Segmentación controlada por el sistema mejora retención Y transferencia. Segmentación controlada por el estudiante solo mejora transferencia.

**Relevancia:** Dividir un capítulo de 30 páginas en secciones conceptuales con micro-tests intercalados es exactamente segmentación controlada por el sistema. El material técnico es donde el efecto es más fuerte.

---

### 1.8 Translation / Procesamiento en L2

#### Amano et al. (2023) — PLOS Biology

- **Cita:** Amano, T., et al. (2023). The manifold costs of being a non-native English speaker in science. *PLOS Biology*, 21(7): e3002184.
- **N = 908** investigadores en ciencias ambientales.
- **Hallazgos:**
  - Lectura de papers: proficiencia moderada necesita **46.6% más tiempo**; baja proficiencia **90.8% más tiempo**
  - Escritura de papers: **51% más tiempo**
  - Tasa de rechazo: **2.5 veces mayor**
  - Un tercio renunció a asistir a conferencias internacionales

#### Escala del Problema

- Más del **90% de publicaciones científicas** están en inglés
- Solo ~18% de la población mundial habla inglés
- ~1,500 millones de personas estudian inglés como L2
- **Estimación:** La mayoría de estudiantes STEM del mundo leen material técnico en un idioma que no es su L1

**Conclusión:** Una traducción fiel al L1 es una **optimización cognitiva fundamental**. Libera working memory para comprensión conceptual en lugar de decodificación lingüística. No se encontraron effect sizes estandarizados (Cohen's d) para L1 vs. L2 en comprensión técnica — es un gap en la literatura.

---

### 1.9 AI Tutoring

#### Bloom (1984) — El Problema de los 2 Sigma

- Tutoring 1-a-1: **d = 2.0-2.3** sobre instrucción convencional (estudios originales)
- **Pero:** Nunca replicado. VanLehn (2011) encontró el effect size real en **d = 0.79**.

#### Meta-análisis de ITS (Pre-LLM)

| Estudio | Effect size | N |
|---|---|---|
| Ma et al. (2014) | ITS vs. instrucción grupal: **g = 0.42** | k=107, N=14,321 |
| Kulik & Fletcher (2016) | ITS mediano: **d = 0.66** | k=50 |
| Steenbergen-Hu & Cooper (2014) | ITS en universidad: **g = 0.32-0.37** | k=39 |

#### Tutores IA con LLMs (2024-2025)

- **Pardos & Bhandari (2024):** ChatGPT produjo ganancias de aprendizaje equivalentes a tutor humano en matemáticas (N = 274). Sin diferencias significativas entre ChatGPT y tutor humano.
- **Kestin et al. (2025, Harvard):** Tutor IA logró **más del doble de ganancias** que clase presencial de aprendizaje activo. N = 194, **d = 0.73-1.3**, z = -5.6, p < 10⁻⁸. Estudiantes con IA aprendieron más en menos tiempo.

#### Resumen AI Tutoring

| Intervención | Effect size (d/g) | Fuente |
|---|---|---|
| Bloom original (tutoring 1-a-1) | 2.0-2.3 | Bloom (1984) |
| Tutoring humana (meta-análisis) | 0.79 | VanLehn (2011) |
| ITS clásicos (pre-LLM) | 0.42-0.66 | Ma (2014), Kulik (2016) |
| ChatGPT vs. tutor humano | Sin diferencia significativa | Pardos (2024) |
| Tutor IA (GPT-4) vs. clase activa | **0.73-1.3** | Kestin et al. (2025) |

**Conclusión:** Los LLMs ya están **en el rango** de la tutoring humana (~0.8). El "2 sigma" fue sobreestimación; el efecto real de tutoring humana es ~0.8, y los LLMs logran 0.7-1.3.

---

### 1.10 Tabla Resumen: Effect Sizes por Componente del Pipeline

| Componente | Técnica | Effect Size | Fuente principal |
|---|---|---|---|
| Micro-quizzes | Interpolated testing | **g = 0.50-0.61** | Adesope (2017), Yang (2021) |
| Quiz → Lectura | Forward testing effect | **g = 0.44-0.58** (prosa) | Chan (2018) |
| Pre-question | Pretesting effect | **d = 0.45-1.10** | Richland (2009) |
| Spacing + Testing | Successive relearning | **d = 1.52-4.19** | Rawson (2018) |
| Figuras + texto | Multimedia learning | **d = 1.67** | Mayer (2009) |
| Figuras junto al texto | Contigüidad espacial | **g = 0.63-d = 1.10** | Schroeder (2018) |
| Segmentación | Segmentation principle | **d = 0.98** | Mayer & Chandler (2001) |
| Traducción L1 | L2 processing cost | 47-91% más tiempo en L2 | Amano (2023) |
| Tutor IA | AI tutoring con LLM | **d = 0.73-1.3** | Kestin (2025) |

---

## 2. Landscape Competitivo

### 2.1 Competidores Analizados

#### Readwise Reader
- **Qué hace:** Lector universal (15+ formatos), highlights con colores, spaced repetition de highlights, Ghostreader (IA) para resúmenes/definiciones/traducciones inline.
- **Qué NO hace:** No segmenta por conceptos, no genera micro-quizzes interpolados, no traduce documentos completos, no tiene pre-questions ni evaluación LLM, no tiene mastery levels.
- **Pricing:** $9.99/mes (anual), $12.99/mes (mensual). Sin tier gratuito permanente.
- **Usuarios:** Miles de usuarios activos.

#### Scholarcy
- **Qué hace:** Resumidor automático de papers, "flashcards" de puntos clave, Robo-Highlighter, extrae tablas y figuras.
- **Qué NO hace:** Solo resume (NO fiel al original), no tiene spaced repetition, no traduce, no genera quizzes con evaluación.
- **Pricing:** Gratis (1 resumen/día). Library: $4.99/mes.
- **Usuarios:** ~600,000.

#### Explainpaper
- **Qué hace:** Subes PDF, seleccionas texto confuso, IA explica en lenguaje simple.
- **Qué NO hace:** Solo explica fragmentos seleccionados manualmente. No procesa documento completo, no genera quizzes, no traduce, es reactivo.
- **Pricing:** Gratis (core). ~$12/mes premium.

#### Elicit
- **Qué hace:** Asistente de investigación sobre 125M+ papers. Búsqueda semántica, extracción de datos, síntesis.
- **Qué NO hace:** Es herramienta de INVESTIGACIÓN, no de APRENDIZAJE. No genera quizzes, no traduce, no tiene spaced repetition.
- **Pricing:** Basic gratis. Plus: $12/mes. Pro: $49/mes.
- **Usuarios:** 2M+ investigadores, ~$18M ARR estimado.

#### Consensus
- **Qué hace:** Motor de búsqueda sobre 200M+ papers peer-reviewed. "Consensus Meter", "Ask Paper".
- **Qué NO hace:** No procesa TU PDF. Es búsqueda/síntesis, no aprendizaje.
- **Pricing:** Freemium. Premium: ~$9/mes.

#### NotebookLM (Google) — COMPETIDOR MÁS CERCANO
- **Qué hace:** Hasta 50 fuentes por notebook. Chat con IA (Gemini), genera Study Guides, FAQs, Flashcards, **Quizzes MC**, Learning Guide, Audio Overviews en 50+ idiomas. Output en 80+ idiomas.
- **Qué NO hace:** Quizzes son post-hoc (NO interpolados durante lectura), no tiene spaced repetition, no segmenta por conceptos, no traduce el documento completo fielmente, no tiene pre-questions, no evaluación LLM abierta, no mastery levels, no extrae figuras para flujo de lectura.
- **Pricing:** Gratis. Business: ~$14-20/usuario/mes.
- **Usuarios:** Millones (estimado, Google no reporta).

#### Shiken
- **Qué hace:** Generación de quizzes con IA desde documentos, creación de cursos, LMS, live quizzes.
- **Qué NO hace:** No extrae texto fielmente de PDFs complejos, no segmenta por conceptos, no traduce, no SM-2.
- **Pricing:** Gratis para learners. Premium: $9.99/mes.

#### Quizlet
- **Qué hace:** Flashcards, quizzes, Q-Chat (tutor IA), Magic Notes (notas→flashcards), PDF summarizer.
- **Qué NO hace:** No extrae contenido fiel, no traduce, no quizzes interpolados durante lectura, no SM-2 personalizado, no mastery levels profundos.
- **Pricing:** Gratis (con anuncios). Plus: $7.99/mes.
- **Usuarios:** 300M+ registrados, 60M MAU. Revenue 2025: ~$139M.

#### Anki
- **Qué hace:** Flashcards con spaced repetition (SM-2/FSRS). Open source, altamente personalizable.
- **Qué NO hace:** No extrae de PDFs, no genera quizzes automáticamente, no traduce, no tiene evaluación LLM, curva de aprendizaje alta.
- **Pricing:** Gratis (desktop, Android). iOS: $24.99 pago único.
- **Usuarios:** Millones, dominante en medicina.

#### Coursera / edX
- **Qué hace:** Cursos estructurados de universidades top.
- **Qué NO hace:** No procesan TU contenido. Solo su catálogo curado.
- **Pricing:** Coursera Plus: $59/mes. edX: cursos audit gratis, certificados $49-99.
- **Usuarios:** Coursera 168M+, edX ~35M.

#### Speechify
- **Qué hace:** Text-to-speech con voces naturales para PDFs.
- **Qué NO hace:** Solo convierte texto a audio. No genera interacción de aprendizaje. Consumo pasivo.
- **Pricing:** Gratis (limitado). Premium: $11.58/mes.
- **Usuarios:** 50M+.

#### Notion AI / Obsidian
- **Qué hacer:** Workspaces de notas con IA integrada.
- **Qué NO hacen:** Herramientas de NOTAS, no de aprendizaje activo. No procesan PDFs para learning.
- **Pricing:** Notion: $10-20/usuario/mes. Obsidian: gratis personal.

#### Competidores Emergentes (2025-2026)

- **Memo AI (memo.cards):** PDF→flashcards+quizzes+mindmaps con spaced repetition. Vista lado-a-lado. **El más peligroso de los emergentes.**
- **RemNote:** Notas+flashcards+PDFs+AI tutor. Spaced repetition como core. Pricing: $10/mes.
- **StudyFetch:** Upload→flashcards+quizzes+notas+podcasts. Spark.E tutor IA. Pricing: $7.99-11.99/mes.

### 2.2 Tabla Comparativa

| Producto | Extracción PDF | Segmentación | Traducción Fiel | Quizzes Interpolados | Spaced Repetition | Eval. LLM | Pricing | Usuarios |
|---|---|---|---|---|---|---|---|---|
| **PDF Transpiler** | ✅ (pymupdf+figuras) | ✅ (por concepto) | ✅ (párrafo a párrafo) | ✅ (MC/TF en puntos óptimos) | ✅ (SM-2) | ✅ (DeepSeek) | TBD | - |
| Readwise Reader | ✅ | ❌ | ❌ (snippets) | ❌ | ✅ (highlights) | ❌ | $9.99/mes | Miles |
| Scholarcy | ✅ (papers) | ❌ | ❌ | ❌ | ❌ | ❌ | $4.99/mes | ~600K |
| NotebookLM | ✅ (50 fuentes) | ❌ | Parcial | ❌ (post-hoc) | ❌ | ❌ (MC cerrado) | Gratis | Millones |
| Quizlet | Parcial | ❌ | ❌ | ❌ (separados) | Básica | ❌ | $7.99/mes | 300M+ |
| Anki | ❌ (manual) | ❌ | ❌ | ❌ | ✅ (SM-2/FSRS) | ❌ | Gratis | Millones |
| Memo AI | ✅ | ❌ | ❌ | ❌ (post-hoc) | ✅ | ❌ | Freemium | N/D |
| RemNote | ✅ (annotations) | ❌ | ❌ | ❌ | ✅ (core) | ❌ | $10/mes | N/D |
| StudyFetch | ✅ | ❌ | ❌ | ❌ | ❌ | Parcial | $7.99/mes | N/D |

---

## 3. Propuesta de Valor Diferencial

### 3.1 El Pipeline Completo (Nadie lo hace)

1. Extraer contenido fiel de PDF (texto + figuras)
2. Segmentar por conceptos
3. Traducir fielmente (no resumir)
4. Inyectar figuras en el flujo
5. Intercalar micro-quizzes (MC/TF) basados en ciencia del aprendizaje
6. Pre-question (pretesting effect)
7. Post-test con evaluación LLM
8. Spaced repetition SM-2
9. Tutor IA contextual
10. Progress tracking + mastery levels

### 3.2 Lo Que NADIE Hace Hoy

| Feature | ¿Quién lo tiene? |
|---|---|
| Traducción fiel (no resumen) | **NADIE** — diferenciador crítico |
| Quizzes interpolados DURANTE la lectura | **NADIE** — todos generan quizzes separados del flujo |
| Pre-questions (pretesting effect) | **NADIE** |
| Post-test con evaluación LLM abierta | Solo StudyFetch (básico) |
| Mastery levels con evaluación profunda | **NADIE** |
| Todo sobre TU contenido arbitrario | **NADIE** |

### 3.3 Dos Mundos Separados Que Nadie Ha Unido

**Mundo A — Herramientas de lectura/investigación de PDFs:**
Readwise, Scholarcy, Explainpaper, Elicit, Consensus, NotebookLM. Buenas para consumir contenido. Cero learning science aplicada.

**Mundo B — Herramientas de estudio/memorización:**
Anki, Quizlet, RemNote, Shiken, StudyFetch, Memo AI. Buenas para flashcards y repetición. No procesan PDFs fielmente, no traducen, no interpolan quizzes.

**PDF Transpiler une los dos mundos.**

### 3.4 Posicionamiento

- **No es un lector de PDFs** (vs. Readwise) — es un *transpilador* de conocimiento
- **No es flashcards** (vs. Quizlet/Anki) — es comprensión profunda validada
- **No es un resumidor** (vs. Scholarcy) — mantiene fidelidad total al original
- **No es un buscador de papers** (vs. Elicit/Consensus) — procesa TU material
- **No es un notebook** (vs. NotebookLM) — es un pipeline sistemático de learning science

### 3.5 ¿Cuál Es el Moat?

El moat NO es una feature individual (todas son replicables). El moat está en la **integración completa** ejecutada con rigor de learning science sobre contenido arbitrario del usuario. Ventaja competitiva temporal:

1. Ser el primero en articular y ejecutar el pipeline completo
2. Calidad de la traducción fiel (anti-resumen + glosarios especializados)
3. Aplicación rigurosa de learning science (interpolated testing con timing basado en ciencia)
4. Enforcement de mastery levels con evaluación profunda por LLM

---

## 4. Análisis de Mercado

### 4.1 TAM (Total Addressable Market)

- **Estudiantes universitarios globales:** 264 millones (UNESCO 2023), tasa de matriculación 43%
- **Profesionales en upskilling/reskilling:** ~500 millones activos. 90% de ejecutivos planean aumentar inversión en L&D
- **Mercado EdTech global:** USD 187-404B en 2025 (según fuente). CAGR ~13-16%
- **Mercado de herramientas de estudio:** ~USD 15B (2025), proyectado $45B (2033)
- **Spaced repetition software:** USD 2.1B (2024), CAGR 19.7%
- **AI personalized flashcards:** USD 1.98B (2024), CAGR 20.25%

**TAM estimado para PDF Transpiler:**
- 10% de 264M estudiantes = 26.4M usuarios potenciales
- A $10/mes promedio = **USD 3.17B TAM anual**
- Incluyendo profesionales: **USD 6.17B TAM combinado**

### 4.2 Willingness to Pay

| Producto | Precio Mensual | Modelo |
|---|---|---|
| Quizlet Plus | $7.99/mes | Freemium |
| Readwise | $7.99/mes | Suscripción |
| Readwise Reader | $12.99/mes | Suscripción |
| Scholarcy | $9.99/mes | Freemium |
| Coursera Plus | $59/mes | Suscripción |
| Anki (iOS) | $24.99 pago único | Compra única |

**Benchmark Quizlet:** Revenue $139M (2025), 60M MAU, ~1M pagos, conversión ~1.7%, ARPU ~$11.58/mes.

**Tasas de conversión freemium en EdTech:** 2.6-8%. Free trials: hasta 22%.

### 4.3 Pain Point Validation

- **96% de estudiantes** releen notas como método principal (el menos efectivo)
- **Retención lectura pasiva:** 10-15% a 1 semana vs. 50-80% con retrieval practice
- **100-150 millones** de estudiantes leen material académico en L2
- EMI (English Medium Instruction) creció 77% fuera de países anglófonos
- Hablantes no nativos necesitan **47-91% más tiempo** para leer papers

### 4.4 Modelo de Negocio Propuesto

| Tier | Precio | Incluye |
|---|---|---|
| **Free** | $0 | 2 PDFs/mes (<50 págs), quizzes básicos, sin traducción |
| **Pro** | $12/mes ($8/mes anual) | Ilimitado + traducción + tutor IA + spaced repetition |
| **Student** | $6/mes | Pro con verificación académica |
| **Team** | $20/usuario/mes | Pro + admin + shared libraries |
| **Enterprise** | Contacto | Universidades, corporaciones, SSO, LMS integration |

### 4.5 Unit Economics

#### Costo de procesar 1 PDF de ~300 páginas (~100K palabras)

| Etapa | Costo |
|---|---|
| Extracción (pymupdf, local) | ~$0 |
| Traducción (DeepSeek V3, 100K palabras) | ~$1.00-1.50 |
| Generación de quizzes (~100 quizzes) | ~$0.12 |
| Segmentación por conceptos | ~$0.05 |
| **Total one-time por PDF** | **~$1.20-1.70** |

**Dato real de Jarre:** DDIA 8 capítulos (~107K palabras) costó ~$1.36 total.

#### Costos recurrentes por usuario activo/mes

| Concepto | Costo/mes |
|---|---|
| Evaluación de respuestas (20 sesiones) | ~$0.16 |
| Tutor IA (20 sesiones) | ~$0.06 |
| Infraestructura | ~$0.50 |
| **Total recurrente** | **~$0.72** |

#### Margen bruto (usuario Pro, 2 PDFs/mes)

| Métrica | Valor |
|---|---|
| Precio Pro | $12/mes |
| Costo por usuario | ~$3.72/mes |
| **Margen bruto** | **~$8.28 (69%)** |

Margen por encima del promedio SaaS con LLM (50-60%), y costos de inferencia cayendo ~10x/año.

#### Sensibilidad al uso

| Perfil | PDFs/mes | Sesiones/mes | Costo | Margen |
|---|---|---|---|---|
| Ligero | 1 | 8 | $1.80 | 85% |
| Normal | 2 | 15 | $3.30 | 73% |
| Heavy | 4 | 25 | $6.60 | 45% |
| Power user | 8+ | 30 | $12.50+ | **Negativo** |

**Mitigación power users:** Rate limiting suave (~5 PDFs grandes/mes en Pro), caching de traducciones para textbooks populares.

### 4.6 Escenarios de Ingresos

| Escenario | MAU | Conversión | Pagos | MRR | ARR |
|---|---|---|---|---|---|
| Seed (Año 1) | 10K | 5% | 500 | $5K | $60K |
| Series A (Año 2) | 100K | 5% | 5,000 | $50K | $600K |
| Growth (Año 3) | 500K | 6% | 30,000 | $300K | $3.6M |
| Scale (Año 4) | 2M | 7% | 140,000 | $1.4M | $16.8M |

---

## 5. Legalidad y Fair Use

### 5.1 Los 4 Factores de Fair Use Aplicados

| Factor | Evaluación | Peso |
|---|---|---|
| 1. Propósito y carácter (educativo, transformativo) | Parcialmente favorable | Alto |
| 2. Naturaleza de la obra (factual/técnica) | Moderadamente favorable | Bajo |
| 3. Cantidad usada (100% del texto) | **Desfavorable** | Alto |
| 4. Efecto en el mercado (sustituto potencial) | Parcialmente desfavorable | Muy alto |

**Conclusión: El caso NO es claramente fair use.** Los factores 3 y 4 son desfavorables.

### 5.2 Precedentes Legales Relevantes

- **Google Books (2015):** Escaneo masivo = fair use. Pero solo mostraba "snippets", no texto completo. **Jarre muestra el texto completo traducido — diferencia fundamental.**
- **HathiTrust (2014):** Digitalización por bibliotecas = fair use. Tampoco mostraba libros completos.
- **Warhol v. Goldsmith (2023) — MUY IMPORTANTE:** Corte Suprema estrechó "uso transformativo". No basta agregar "nuevo significado" — el uso debe tener **propósito sustancialmente diferente**. Un tribunal podría argumentar que Jarre tiene el mismo propósito fundamental que el libro: transmitir contenido al lector.
- **Thomson Reuters v. ROSS (2025):** Primer fallo sobre fair use en IA. Falló contra ROSS por crear sustituto que competía en mercado de licenciamiento.
- **Kadrey v. Meta / Bartz v. Anthropic (2025):** Entrenamiento de LLMs = fair use "transformativo". Pero: mantener biblioteca digital permanente de libros NO lo es. Anthropic pagó hasta $1.5B.
- **Copyright Office AI Report Part 3 (2025):** "Uso comercial de vastas cantidades de obras con copyright para producir contenido competitivo va más allá de los límites del fair use."

### 5.3 La Traducción como Obra Derivada

La traducción es **explícitamente** una "obra derivada" bajo 17 U.S.C. § 101. Solo el titular del copyright tiene derecho de crear traducciones. **No existe excepción estatutaria de "traducción personal" en EE.UU.**

### 5.4 Cómo Lo Manejan los Competidores

| Servicio | Reproduce texto completo? | Crea obras derivadas? | Almacena contenido? | Estrategia |
|---|---|---|---|---|
| Readwise | Sí (format-shift) | No | Sí (per-usuario) | ToS + DMCA |
| Scholarcy | No (resúmenes) | Sí (resúmenes) | No (borra en 30s) | Fair use + borrado |
| NotebookLM | No (resúmenes/QA) | Sí (resúmenes, podcasts) | Sí (Google Cloud) | Google ToS + DMCA |
| Quizlet | No | Sí (flashcards por usuarios) | Sí | DMCA + takedowns |
| **Jarre** | **Sí (traducido completo)** | **Sí (traducción + quizzes)** | **Sí (servidores)** | **???** |

**Jarre sería el ÚNICO que reproduce texto completo Y crea obras derivadas Y almacena en servidores.** Posición de riesgo mayor que cualquier competidor.

### 5.5 Recomendaciones para Mitigar Riesgo

**Por prioridad:**

1. **[CRÍTICO] Minimizar almacenamiento** — Procesar y no retener (modelo Scholarcy, ~30s), o retener encriptado per-usuario con eliminación programática.
2. **[CRÍTICO] ToS robustos** — Declaración de propiedad, indemnización, DMCA, restricciones de redistribución.
3. **[ALTO] Registrar agente DMCA** ante Copyright Office para safe harbor.
4. **[ALTO] Aislamiento estricto** — Ningún usuario accede al contenido de otro.
5. **[MEDIO] Considerar mostrar resúmenes/fragmentos** en vez de texto completo (fortalece fair use, reduce valor del producto).
6. **[MEDIO] Procesamiento client-side** para extracción y presentación; server-side solo para quizzes y evaluación.

### 5.6 Jurisdicción Más Favorable

**La UE** por excepciones de copia privada y TDM codificadas. Países Bajos, Alemania, Estonia ofrecen marcos favorables.

### 5.7 Contexto Práctico

Múltiples productos operan en esta zona gris sin demandas significativas (Readwise, NotebookLM, Scholarcy, Quizlet). Los editoriales no han priorizado perseguir herramientas de estudio personal. Sin embargo, el panorama legal cambia rápidamente con la explosión de IA.

---

## 6. Riesgos y Contraargumentos

### 6.1 Dependencia de LLMs

**Costos actuales (Feb 2026):**
- DeepSeek V3: $0.30/M input, $1.20/M output (el más barato para calidad)
- GPT-4o: ~$2.50/M input, $10/M output
- Gemini Flash: ~$0.075/M input, $0.30/M output
- Costos cayendo ~10x/año

**Latencia:** Procesar un capítulo (~10K palabras) con traducción párrafo-por-párrafo: ~3-5 minutos (asíncrono, aceptable).

**Mitigaciones:** Multi-provider (DeepSeek primario, Gemini Flash fallback), caching agresivo, modelos open-source locales como fallback (Llama, Qwen, Mistral viables para traducción).

### 6.2 PDFs Complejos

**Estado del arte en extracción:**
- pymupdf4llm: rápido, bueno para layouts simples y libros single-column
- Marker: mejor para papers de 2 columnas
- MinerU (OpenDataLab): benchmark líder en OmniDocBench (CVPR 2025)
- Nougat (Meta): especializado en fórmulas académicas

**Estimación:** 60-80% de PDFs académicos tienen al menos un elemento problemático. Para libros técnicos (caso de uso primario), riesgo bajo-medio.

**Estrategia MVP:** pymupdf4llm base + Marker fallback para layouts complejos + Mathpix/Gemini vision para fórmulas.

### 6.3 Calidad de Traducción Técnica

**Estado actual:** GPT-4 rinde a la par de traductores humanos junior en texto general. Para contenido técnico, la precisión cae.

**Errores comunes:**
1. Compresión/resumen involuntario (ya experimentado en Jarre)
2. Inconsistencia terminológica
3. Sobre-traducción de términos que deben quedarse en inglés
4. Pérdida de matices técnicos
5. Pérdida de formato markdown

**Mitigaciones implementadas en Jarre:** Glosario técnico (110 términos), traducción párrafo-por-párrafo, verificación de ratio de longitud, anti-summarization explícito, sliding context. Resultado: DDIA ratio 1.10 (107K EN → 118K ES), no compresión.

### 6.4 "¿Por Qué No Leo el PDF Directamente?"

| Métrica | Lectura pasiva | Con pipeline completo |
|---|---|---|
| Retención a 1 semana | 10-15% | 50-80% |
| Retención promedio | ~29% | ~57% |
| Retención a largo plazo | Baseline | 2-3x mayor |
| Tiempo para mismo resultado | Baseline | 40% menos |

La diferencia no es marginal: es de **2-3x** en retención. Analogía: ¿por qué no corro sin zapatillas deportivas?

### 6.5 Competencia de Incumbentes

| Incumbente | Estado | Amenaza |
|---|---|---|
| Google (NotebookLM) | Quizzes + flashcards + Learning Guide. Gratis. | **ALTA** — hace ~60% del pipeline |
| OpenAI | ChatGPT for Teachers, ChatGPT Edu | MEDIA — enfoque conversacional |
| Anthropic (Claude) | Claude for Education, Learning Mode | MEDIA-BAJA — tutor conversacional |
| Microsoft | Copilot Study Agent, $18/usuario/mes | MEDIA — dentro del ecosistema Office |

**Velocidad de replicación:** Cualquier incumbente podría replicar en 3-6 meses. Pero no es su prioridad, su enfoque es generalista, y la ejecución del pipeline completo es sorprendentemente compleja.

**Ventaja competitiva temporal:** 12-18 meses. La ventaja no es tecnológica sino de **ejecución y especialización**.

### 6.6 Riesgo de Piratería

**Cómo lo manejan otros:** Ningún servicio verifica propiedad del PDF. Todos dependen de DMCA safe harbor + ToS.

**Mitigaciones:** ToS claros, agente DMCA registrado, aislamiento per-usuario, rate limiting, no almacenar PDFs originales.

---

## 7. MVP Standalone

### 7.1 Formato: Web App con PWA

**Recomendación:** Web app (Next.js) con PWA.
- Procesamiento PDF es pesado → web ideal (upload + procesamiento asíncrono)
- Lectura de contenido procesado → PWA (offline, installable)
- Revisión con spaced repetition → funciona en móvil vía PWA
- Un solo codebase para desktop y móvil

### 7.2 Features: MVP vs V2 vs V3

#### MVP (V1) — Validar la hipótesis
- Upload de PDF (drag & drop)
- Extracción de texto + figuras (pymupdf4llm + Marker fallback)
- Segmentación automática por capítulos/secciones
- Traducción fiel EN → ES (con glosario técnico)
- Generación de micro-quizzes interpolados (MC/TF)
- Lector optimizado con quizzes intercalados
- Dashboard básico con PDFs procesados
- **Restricciones:** Solo EN→ES, solo PDFs de texto, procesamiento asíncrono, sin spaced repetition, sin tutor IA, sin mastery levels, límite 3 PDFs gratis

#### V2 — Features deseables
- Spaced repetition SM-2
- Más pares de idiomas
- Tutor IA contextual
- Pre-questions + post-test con evaluación LLM
- Mastery levels por concepto
- Soporte para papers de 2 columnas
- Exportar flashcards a Anki

#### V3 — Visión a futuro
- Soporte para videos/YouTube, páginas web
- App móvil nativa
- Colaboración grupal
- Integración con LMS (Canvas, Moodle)
- API para instituciones
- Generación de audio (podcast estilo NotebookLM)

### 7.3 Stack Tecnológico

| Componente | Tecnología | Razón |
|---|---|---|
| Frontend | Next.js 16 + React 19 | Ya conocido, SSR/SSG, ya usado en Jarre |
| Styling | Tailwind CSS 4 | Ya implementado en Jarre |
| UI | shadcn/ui | Accesible, personalizable |
| Backend | Next.js API Routes + Edge Functions | Un solo deployment |
| Database | Supabase (PostgreSQL) | Auth, RLS, realtime, ya conocido |
| Auth | Supabase Auth | SSO, magic links, OAuth |
| LLM API | DeepSeek V3 (primario) + Gemini Flash (fallback) | Mejor relación calidad/precio |
| PDF Extraction | pymupdf4llm + Marker | Ya implementado en Jarre |
| Payments | Lemon Squeezy (Stripe MoR) | No preocuparse por impuestos globales |
| Hosting | Vercel | Deploy automático, integración Next.js |
| Background Jobs | Inngest o Trigger.dev | Procesamiento asíncrono de PDFs |
| Monitoreo | Sentry + PostHog | Errores + analytics |

**Costos de infraestructura (primeros 1,000 usuarios):** ~$100-150/mes.

### 7.4 Timeline Realista

| Fase | Duración | Entregable |
|---|---|---|
| Semana 1-2 | Arquitectura + setup | Repo, schema, auth, landing |
| Semana 3-4 | Pipeline procesamiento | Upload → extracción → segmentación → cola |
| Semana 5-6 | Traducción + quizzes | Traducción párrafo-por-párrafo + MC/TF |
| Semana 7-8 | Lector optimizado | UI lectura con quizzes + figuras |
| Semana 9-10 | Dashboard + payments | Dashboard, Lemon Squeezy, planes |
| Semana 11-12 | QA + polish | Testing, edge cases, responsive |
| Semana 13 | Beta privada | 20-50 testers |
| Semana 14-16 | Iteración beta | Fixes, métricas |
| Semana 17-18 | Lanzamiento público | ProductHunt, Reddit, Twitter/X |

**Total: ~5-6 meses** (desarrollador solo, ~20-30h/semana). Buffer: +2-4 semanas para PDFs complejos.

**Reutilizable de Jarre:** pymupdf4llm extraction, translate-chapter.py, glosarios (110 términos), seed inline quizzes, LearnFlow + SectionContent, SM-2, schema parcial.

### 7.5 Estrategia Go-to-Market

#### Early Adopters

| Canal | Estrategia |
|---|---|
| Reddit (r/learnprogramming, r/compsci, r/gradschool) | Posts mostrando antes/después |
| Twitter/X (#BuildInPublic) | Thread con pipeline + datos de retención |
| ProductHunt | Lanzamiento preparado (2 meses engagement previo) |
| Hacker News | Show HN con datos científicos + demo |
| Discord | Comunidades de estudio, bootcamps — acceso gratis por feedback |
| Universidades | Piloto gratuito con departamentos |

#### Validar Demanda ANTES de Construir

1. **Landing page + waitlist** (1 semana): Meta: 500+ signups en 2 semanas
2. **Tweet/thread viral**: Comparación PDF original vs. transpilado. Meta: 100+ replies
3. **Reddit post**: Demo con DDIA. Meta: 200+ upvotes
4. **Beta privada** (4 semanas): 20-50 usuarios. Meta: NPS > 40
5. **Pre-venta**: Lifetime deal early bird. Meta: 50+ pre-ventas

---

## 8. Conclusión: Go/No-Go

### Señales Positivas (GO)

1. **TAM masivo:** 264M estudiantes + 500M profesionales. Capturar 0.01% = 76K pagos = $9.1M ARR
2. **Pain point validado:** 96% de estudiantes usan métodos ineficientes. Retención pasiva 10-15% vs. 50-80% con retrieval practice
3. **No hay competidor directo:** Nadie hace el pipeline completo
4. **Unit economics saludables:** 69% margen bruto, mejorando con caída de costos LLM
5. **Willingness to pay demostrada:** Quizlet factura $139M/año con "solo" flashcards
6. **Mercado de spaced repetition creciendo 20% anual**
7. **100-150M estudiantes leen en L2** — traducción fiel es diferenciador enorme
8. **Evidencia científica sólida:** 3 meta-análisis (N > 48K) confirman g = 0.50-0.61 para testing interpolado. Successive relearning d = 1.52-4.19

### Riesgos (Precaución, No Bloqueo)

1. **Google/OpenAI** podrían integrar algo similar (12-18 meses de ventana)
2. **Riesgo legal medio-alto** por traducción como obra derivada — requiere mitigaciones
3. **Power users** con margen negativo sin rate limiting
4. **Calidad de extracción** para layouts complejos (60-80% de PDFs académicos)
5. **Dependencia de APIs** de LLM (precio, disponibilidad)

### Veredicto: **GO**

**Condiciones:**
- Lanzar con límite de PDFs (2/mes free, 5 grandes/mes Pro)
- Implementar caching de traducciones para textbooks populares
- Precio $12/mes ($8 anual, $6 estudiantes) en el sweet spot del mercado
- Monitorear costos por usuario desde día 1
- ToS robustos + agente DMCA desde el inicio
- Minimizar almacenamiento de contenido con copyright
- Diferenciarse agresivamente de "chat con PDF" — esto es un **sistema de aprendizaje**, no un chatbot
- **Validar demanda antes de construir:** landing page + waitlist como primer paso

---

## Fuentes Principales

### Papers y Meta-análisis
- [Szpunar, Khan & Schacter (2013) — PNAS](https://www.pnas.org/doi/10.1073/pnas.1221764110)
- [Adesope et al. (2017) — Review of Educational Research](https://journals.sagepub.com/doi/10.3102/0034654316689306)
- [Rowland (2014) — Psychological Bulletin](https://pubmed.ncbi.nlm.nih.gov/25150680/)
- [Yang et al. (2021) — Psychological Bulletin](https://pubmed.ncbi.nlm.nih.gov/33683913/)
- [Chan, Meissner & Davis (2018) — Psychological Bulletin](https://pubmed.ncbi.nlm.nih.gov/30265011/)
- [Pastötter & Bäuml (2014) — Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00286/full)
- [Richland, Kornell & Kao (2009) — J. Exp. Psych: Applied](https://pubmed.ncbi.nlm.nih.gov/19751074/)
- [Bjork & Bjork (2011) — Psychology and the Real World](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)
- [Rawson & Dunlosky (2022) — Current Directions in Psychological Science](https://journals.sagepub.com/doi/full/10.1177/09637214221100484)
- [Rawson et al. (2018) — J. Exp. Psych: Applied](https://pubmed.ncbi.nlm.nih.gov/29431462/)
- [Mayer (2009) — Multimedia Learning, Cambridge University Press](https://www.cambridge.org/core/books/abs/multimedia-learning/multimedia-principle/1CC3DE892B0431BA48B4C4DCA10D0B8F)
- [Schroeder & Cenkci (2018) — Educational Psychology Review](https://link.springer.com/article/10.1007/s10648-018-9435-9)
- [Noetel et al. (2022) — Review of Educational Research](https://journals.sagepub.com/doi/abs/10.3102/00346543211052329)
- [Rey et al. (2019) — Educational Psychology Review](https://link.springer.com/article/10.1007/s10648-018-9456-4)
- [Amano et al. (2023) — PLOS Biology](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3002184)
- [Pardos & Bhandari (2024) — PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0304013)
- [Kestin et al. (2025) — Scientific Reports (Nature)](https://www.nature.com/articles/s41598-025-97652-6)
- [VanLehn (2011) — Educational Psychologist](https://www.tandfonline.com/doi/abs/10.1080/00461520.2011.611369)
- [Ma et al. (2014) — J. Educational Psychology](https://eric.ed.gov/?id=EJ1049508)

### Legal
- [Authors Guild v. Google (2015)](https://fairuse.stanford.edu/case/authors-guild-v-google-inc/)
- [Andy Warhol v. Goldsmith (2023)](https://en.wikipedia.org/wiki/Andy_Warhol_Foundation_for_the_Visual_Arts,_Inc._v._Goldsmith)
- [Thomson Reuters v. ROSS (2025)](https://www.reedsmith.com/en/perspectives/2025/03/court-ai-fair-use-thomson-reuters-enterprise-gmbh-ross-intelligence)
- [Kadrey v. Meta & Bartz v. Anthropic (2025)](https://www.jw.com/news/insights-kadrey-meta-bartz-anthropic-ai-copyright/)
- [Copyright Office AI Report Part 3 (2025)](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf)
- [DMCA § 512 — Safe Harbors](https://www.copyright.gov/512/)

### Mercado
- [UNESCO — Higher Education Students](https://www.unesco.org/en/articles/record-number-higher-education-students-highlights-global-need-recognition-qualifications)
- [Fortune Business Insights — EdTech Market](https://www.fortunebusinessinsights.com/edtech-market-111377)
- [WEF Future of Jobs Report 2025](https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-jobs-of-the-future-and-the-skills-you-need-to-get-them/)
- [Kahoot Study Habits Snapshot 2024](https://kahoot.com/press/2024/10/29/study-habits-snapshot-2024/)
- [SNS Insider — AI Flashcard Market](https://www.snsinsider.com/reports/ai-generated-personalized-flashcard-market-7684)
- [Growth Market Reports — Spaced Repetition Software](https://growthmarketreports.com/report/spaced-repetition-software-market)
