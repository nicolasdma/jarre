# Investigación: Evaluación de Respuestas con LLMs

> Compilado: 2026-02-10
> Papers revisados: ~40 fuentes académicas (2023-2026)
> Propósito: Fundamentar el rediseño del sistema de evaluación de Jarre

---

## 1. Sesgos Documentados en LLM-as-Judge

### 1.1 Sesgo de Agreeableness (Leniencia)
**Paper:** "Beyond Consensus: Mitigating the Agreeableness Bias" (Jain et al., NUS, 2025)
[arXiv:2510.11822](https://arxiv.org/abs/2510.11822)

- 14 LLMs evaluados
- True Positive Rate (confirmar respuestas correctas): **>96%**
- True Negative Rate (detectar respuestas incorrectas): **<25%**
- Los LLMs son excelentes diciendo "sí, está bien" pero pésimos diciendo "no, esto está mal"
- **Mitigación:** Preguntar "¿Qué errores tiene esta respuesta?" en vez de "¿Es correcta?"

### 1.2 Sesgo de Verbosidad
**Paper:** "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (Zheng et al., NeurIPS 2023)
[arXiv:2306.05685](https://arxiv.org/abs/2306.05685)

- Los LLMs prefieren respuestas largas independientemente de la calidad
- GPT-4 es más resistente (8.7% tasa de fallo) vs modelos débiles (91.3%)
- **Mitigación:** Instrucción explícita "No favorezcas respuestas largas"

### 1.3 Sesgo de Posición
**Paper:** "Large Language Models are not Fair Evaluators" (Wang et al., ACL 2024)
[arXiv:2305.17926](https://arxiv.org/abs/2305.17926)

- Swapear el orden de dos respuestas puede hacer que Vicuna-13B parezca ganarle a ChatGPT en **66/80 queries**
- La manipulación de posición sola es suficiente para invertir el ganador percibido
- **Mitigación:** Evaluar en ambos órdenes y promediar; generar razonamiento ANTES del score

### 1.4 Sesgo de Auto-preferencia (Self-Enhancement)
**Paper:** "Self-Preference Bias in LLM-as-a-Judge" (Huang et al., 2024)
[arXiv:2410.21819](https://arxiv.org/abs/2410.21819)

- GPT-4 self-preference bias score: **~0.520** (más fuerte entre 8 modelos)
- Cuando humanos califican a GPT-4 positivamente: recall **94.5%**
- Cuando humanos califican a GPT-4 negativamente: recall **42.5%**
- **Causa raíz:** No es auto-reconocimiento, es preferencia por texto de baja perplejidad
- **Mitigación:** Usar modelo diferente para generación vs evaluación; ensemble multi-modelo

### 1.5 Sesgo de Números Redondos y Escala
**Paper:** "Large Language Models are Inconsistent and Biased Evaluators" (Stureborg et al., 2024)
[arXiv:2405.01724](https://arxiv.org/abs/2405.01724)

- En escala 1-100, los modelos se agrupan en 60, 70, 80, 90 e **ignoran el rango 1-60**
- LLM inter-sample agreement (Krippendorff's α): **0.587** vs humanos: **0.659**
- **Mitigación:** Usar escalas 1-5 o 1-10, nunca 1-100

### 1.6 Sesgo de Anclaje
**Paper:** Stureborg et al. (mismo paper anterior)

- Cuando se generan múltiples scores en un prompt, **scores previos contaminan los siguientes**
- El score medio asignado después de un score alto es significativamente mayor
- **Mitigación:** Evaluar cada dimensión por separado o usar rúbrica explícita con niveles

### 1.7 Taxonomía Completa: 12 Sesgos
**Paper:** "Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge" (Ye et al., 2024)
[arXiv:2410.02736](https://arxiv.org/abs/2410.02736)

| # | Sesgo | Descripción |
|---|-------|-------------|
| 1 | Posición | Favoritismo por posición en el prompt |
| 2 | Verbosidad | Preferencia por respuestas largas |
| 3 | Compassion-fade | Trato diferencial por anonimato del modelo |
| 4 | Bandwagon | Influencia por opiniones mayoritarias |
| 5 | Distracción | Susceptibilidad a info irrelevante |
| 6 | Fallacy-oversight | Pasar por alto errores lógicos en texto bien estructurado |
| 7 | Autoridad | Deferencia a citas, credenciales, lenguaje académico |
| 8 | Sentimiento | Preferencia por tonos emocionales particulares |
| 9 | Diversidad | Variaciones basadas en marcadores de identidad |
| 10 | Chain-of-thought | Diferencias cuando se muestran pasos de razonamiento |
| 11 | Auto-enhancement | Favoritismo hacia outputs del propio modelo |
| 12 | Refinement-aware | Variaciones cuando se revela historial de refinamiento |

**Hallazgo clave:** Para contenido factual/técnico (como Jarre), los sesgos son **menos severos** que para tareas subjetivas.

---

## 2. Rúbricas Multidimensionales vs Puntuación Única

### 2.1 LLM-Rubric (Hashemi et al., Microsoft, ACL 2024)
[arXiv:2501.00274](https://arxiv.org/abs/2501.00274)

**Hallazgo devastador:** Pedir al LLM "calificá la calidad general" es **peor que predecir la media constante del dataset**.

| Método | RMSE | Pearson |
|--------|------|---------|
| Baseline random | 1.43-1.50 | ~0.005 |
| LLM puntuación única (sin calibrar) | 0.90-0.98 | 0.14-0.18 |
| LLM puntuación única (calibrado) | 0.78-0.80 | 0.19-0.22 |
| **LLM-Rubric (8 dimensiones)** | **0.40-0.42** | **0.35-0.40** |

- Incorporar 8 dimensiones mejora la correlación **2x**
- Clave: "El desacuerdo no es ruido sino señal"

### 2.2 Prometheus (Kim et al., ICLR 2024)
[arXiv:2310.08491](https://arxiv.org/abs/2310.08491)

- Modelo 13B entrenado con rúbricas fine-grained: correlación Pearson **0.897** con evaluadores humanos
- A la par con GPT-4 (0.882) y dramáticamente mejor que ChatGPT (0.392)
- **Insight clave:** Las rúbricas customizadas por tarea son lo que desbloquea la calidad, no el tamaño del modelo
- Referencia + rúbrica juntas son esenciales — ninguna por sí sola es suficiente

### 2.3 "Rubric Is All You Need" (ICER 2025)
[arXiv:2503.23989](https://arxiv.org/abs/2503.23989)

- Rúbricas **específicas por pregunta** vs genéricas: Spearman **0.763 vs 0.510**
- Evaluar criterios uno por uno (Pointwise) fue **excesivamente estricto** — mejor dar rúbrica completa de una vez
- Ensemble de 3-4 corridas con majority voting = scoring más robusto

### 2.4 FLASK (Ye et al., KAIST, ICLR 2024 Spotlight)
[arXiv:2307.10928](https://arxiv.org/abs/2307.10928)

- Descompone evaluación en **12 skills**: Logical Thinking, Background Knowledge, Problem Handling, User Alignment
- Alta correlación entre evaluación modelo-humano con esta descomposición
- Para Jarre, las skills más relevantes: Factuality, Logical Correctness, Comprehension, Completeness

### 2.5 Rubric-Conditioned LLM Grading (2025)
[arXiv:2601.08843](https://arxiv.org/abs/2601.08843)

- **El rendimiento degrada al aumentar la granularidad** — más niveles = peor alineación
- Evaluación binaria (correcto/incorrecto) es la más confiable
- "Trust Curve": filtrar predicciones de baja confianza mejora accuracy en el subset restante

---

## 3. Chain-of-Thought y Técnicas de Prompting

### 3.1 CoT Antes del Score
**Paper:** "Applying LLMs and Chain-of-Thought for Automatic Scoring" (Lei et al., 2024)
[ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2666920X24000146)

- CoT + rúbrica: **+13.44% accuracy** en zero-shot, **+3.7%** en few-shot
- Few-shot (0.67 accuracy) significativamente mejor que zero-shot (0.60)
- CoT mejora accuracy Y transparencia/interpretabilidad

### 3.2 Reasoning ANTES del Score vs Score Primero
**Paper:** "LLM as a Scorer: The Impact of Output Order" (Chen et al., 2024)
[arXiv:2406.02863](https://arxiv.org/abs/2406.02863)

- Diferentes órdenes de output producen **distribuciones de scores diferentes**
- **Reason-first genera scores más altos** en promedio (leve inflación)
- Score-first causa que el razonamiento posterior **racionalice** el score en vez de evaluar independientemente
- **Conclusión:** Siempre pedir razonamiento ANTES del score

### 3.3 CoT no Reemplaza Rúbricas
**Paper:** "An Empirical Study of LLM-as-a-Judge Design Choices" (Yamauchi et al., 2025)
[arXiv:2506.13639](https://arxiv.org/abs/2506.13639)

- **CoT ofrece ganancias mínimas cuando ya hay criterios claros de evaluación**
- Proveer **referencia + descripciones de score** es CRUCIAL para confiabilidad
- Omitir cualquiera degrada significativamente la alineación con humanos
- Temperatura no-determinística (>0) mejora alineación vs temperatura=0

### 3.4 G-Eval (Liu et al., EMNLP 2023)
[arXiv:2303.16634](https://arxiv.org/abs/2303.16634)

- Framework pionero: CoT + form-filling para evaluación NLG
- GPT-4 con G-Eval: correlación Spearman **0.514** con humanos en summarización
- Supera a TODOS los métodos previos (BLEU, ROUGE) por amplio margen
- Métricas reference-based (BLEU, ROUGE) tienen **baja correlación** con juicio humano para tareas abiertas

### 3.5 Few-Shot Examples
**Fuente:** Cameron Wolfe (Deep Learning Focus, 2024)

- 1 ejemplo por nivel de score: **+15-20%** accuracy sobre zero-shot
- 2-3 ejemplos por nivel: **+25-30%** accuracy
- **Pero:** Demasiados ejemplos pueden **degradar** performance paradójicamente

### 3.6 Role Prompting
**Paper:** "When 'A Helpful Assistant' Is Not Really Helpful" (Zheng et al., EMNLP 2024 Findings)
[arXiv:2311.10054](https://arxiv.org/abs/2311.10054)

- 162 personas testeadas × 4 familias de LLM × 2,410 preguntas factuales
- Agregar personas en system prompts **NO mejora el rendimiento** en tareas objetivas
- No invertir tokens en rol elaborado — invertir en rúbrica y referencia

### 3.7 Temperatura para Evaluación
- **Recomendado: 0.1** para consistencia con leve variabilidad beneficiosa
- Temperatura 0.5: consistencia cae dramáticamente (~20%)
- Incluso temp=0 no garantiza determinismo (variaciones de hasta 15%)
- **Mejor estrategia:** Múltiples evaluaciones + promediar > una sola evaluación determinística

---

## 4. Two-Step Evaluation (Extract → Score)

### 4.1 AutoSCORE (2025)
[arXiv:2509.21910](https://arxiv.org/abs/2509.21910)

- Dos etapas: (1) Extraer componentes relevantes como JSON, (2) Puntuar
- **Separar extracción de evidencia del scoring** imita el proceso humano
- QWK mejoró de 0.251 a 0.344 (**+37.1%**) con GPT-4o
- **Modelos más chicos se benefician más**: LLaMA-3.1-8B mostró **+74%** mejora
- Rúbricas complejas muestran las mayores ganancias

**Relevancia para Jarre:** DeepSeek V3 no es el modelo más grande — la extracción estructurada le beneficiaría. Pero el campo `reasoning` en nuestro JSON response ya fuerza CoT implícito, logrando la mayoría del beneficio sin duplicar llamadas API.

---

## 5. Feedback Formativo (No Solo Scoring)

### 5.1 Meta-Análisis del Poder del Feedback
**Paper:** "The Power of Feedback Revisited" (Wisniewski, Zierer, Hattie, 2020)
[Frontiers in Psychology](https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/)

- 435 estudios, 994 effect sizes, >61,000 participantes
- Efecto medio general: **d=0.48**
- **Feedback de alta información** (task + proceso + autorregulación): **d=0.99**
- Feedback simple correcto/incorrecto: **d=0.24** — casi inútil

**Cuatro niveles de feedback** (Hattie & Timperley):
1. **Task level** (d=0.46): Correcto/incorrecto, correcciones factuales
2. **Process level**: Estrategias necesarias para dominar el concepto
3. **Self-regulation level**: Monitoreo de estrategias, auto-evaluación
4. **Self level** (menos efectivo): Elogio personal — frecuentemente contraproducente

**Tres perspectivas óptimas:**
- **Feed-up**: ¿A dónde voy? (comparación con objetivo)
- **Feed-back**: ¿Cómo me está yendo? (qué hiciste bien/mal)
- **Feed-forward**: ¿Qué sigue? (cómo cerrar el gap)

### 5.2 LLM vs Tutores Humanos
**Paper:** "LLMs Approach Expert Pedagogical Quality" (Abdulsalam, 2025)
[arXiv:2512.20780](https://arxiv.org/abs/2512.20780)

- LLMs logran calidad pedagógica comparable a tutores humanos en promedio
- **Diferencias críticas:**
  - LLMs subutilizan restating/revoicing (repetir lo que dijo el estudiante)
  - Producen respuestas demasiado largas (150-300 palabras vs 72 del tutor humano)
  - **Excesiva cortesía correlaciona negativamente con calidad percibida**
- Predictores positivos de calidad: restating, pressing for accuracy, diversidad léxica

### 5.3 Debilidad del LLM: Diagnosticar Errores
**Paper:** "Towards Adaptive Feedback with AI" (Sessler et al., 2025)
[arXiv:2502.12842](https://arxiv.org/abs/2502.12842)

- LLMs son mejores en Feed-Up (explicar objetivos) y Feed-Forward (sugerir pasos)
- **Debilidad significativa en Feed-Back**: identificar y explicar contextualmente los errores del estudiante
- **Mitigación:** Prompt debe forzar al LLM a citar la parte específica de la respuesta que contiene el error

### 5.4 Productive Failure
**Paper:** Meta-análisis (Sinha & Kapur, 2021)
[Review of Educational Research](https://journals.sagepub.com/doi/10.3102/00346543211019105)

- 166 comparaciones experimentales, >12,000 participantes
- Estudiantes con PF superan significativamente a los de instrucción-primero: **d=0.36** (hasta d=0.58)
- **Más intentos de solución = mejor performance** en medidas procedimentales, conceptuales y de transferencia
- Funciona porque: activa conocimiento previo, hace conscientes los gaps, genera atención a features críticos

**Implicación:** Cuando un estudiante da una respuesta parcial, NO corregir inmediatamente. Reconocer lo correcto, señalar el gap, dejar que intente de nuevo.

---

## 6. Spaced Repetition con LLMs

### 6.1 LECTOR (Zhao, 2025)
[arXiv:2508.03275](https://arxiv.org/abs/2508.03275)

- Scheduling usando **evaluación de similaridad semántica** con LLM
- Identifica conceptos semánticamente confundibles (ej: "consensus" vs "quorum")
- 90.2% success rate vs 88.4% para SM-2 y baselines
- **Relevancia:** El SM-2 de Jarre podría mejorar identificando conceptos confundibles y programando reviews contrastivos

### 6.2 Retrieval Practice con LLMs
**Paper:** "Enhancing Student Learning with LLM-Generated Retrieval Practice Questions" (2025)
[arXiv:2507.05629](https://arxiv.org/abs/2507.05629)

- Estudiantes con retrieval practice: **89% retention accuracy** vs **73% sin**
- Estudio de 4 semanas en cursos universitarios
- **Validación:** El enfoque de question bank + spaced repetition de Jarre es sólido

---

## 7. Calibración y Anti-Inflación

### 7.1 AutoCalibrate (Liu et al., LREC-COLING 2024)
[arXiv:2309.13308](https://arxiv.org/abs/2309.13308)

- Enfoque multi-etapa: (1) LLM redacta criterios iniciales, (2) selecciona los mejores, (3) refina iterativamente
- Mejora significativa en correlación con evaluación experta

### 7.2 GradeOpt (EDM 2025)
[educationaldatamining.org](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.long-papers.80/index.html)

- LLMs predominantemente dan scores altos e inflan consistentemente respuestas malas
- Solo GPT-4 generó scores bajos apropiados para respuestas genuinamente malas
- **Solución:** Reflector + refiner agents que optimizan guidelines via self-reflection on errors

### 7.3 Técnicas Prácticas Anti-Inflación
1. Incluir **ejemplos explícitos de scores bajos** en few-shot
2. Instrucción: "Sé estricto. Si la respuesta no demuestra [criterio], el score DEBE ser [bajo]"
3. Proveer **respuesta de referencia** para que el LLM tenga ground truth
4. Hacer que score 3 y 4 sean **genuinamente difíciles de lograr** en la rúbrica

---

## 8. Arquitectura de Prompt Óptima (Síntesis)

Basado en toda la investigación, el prompt óptimo para evaluación debería:

```
1. ROL BREVE (opcional, mínimo): "Evaluás respuestas técnicas."
   → Role prompting NO mejora tasks objetivos (Zheng 2024)

2. TASK: Qué se evalúa y por qué.

3. RÚBRICA CON ANCLAS: Para cada nivel (0-2), proveer:
   → Criterios que DEBEN cumplirse
   → Qué DISTINGUE este nivel del adyacente
   → Rúbricas específicas por tipo > genéricas (Spearman 0.76 vs 0.51)

4. REFERENCIA: Respuesta modelo (como guía, no absoluta)
   → Referencia + rúbrica = gold standard (Prometheus: r=0.897)

5. RESPUESTA DEL ESTUDIANTE

6. FORMATO: "Analizá paso a paso → puntuá → feedback"
   → Reasoning ANTES del score (Chen 2024)
   → CoT + rúbrica = +13.44% accuracy (Lei 2024)

7. ANTI-SESGO:
   → "No favorezcas respuestas largas" (verbosity bias)
   → "Si hay errores factuales, identificalos" (agreeableness bias)
   → "Citá la parte específica" (fuerza Feed-Back)
```

**Configuración:**
- Temperatura: 0.1
- Escala: 0-2 por dimensión (3 niveles = óptimo per Rubric-Conditioned 2025)
- 3 dimensiones por tipo de pregunta (evitar >4, degrada calidad)
- Para decisiones de mastery: 2-3 evaluaciones + majority vote

---

## 9. Papers Referenciados (Lista Completa)

### Sesgos en LLM-as-Judge
1. [Judging LLM-as-a-Judge (Zheng et al., NeurIPS 2023)](https://arxiv.org/abs/2306.05685)
2. [Large Language Models are not Fair Evaluators (Wang et al., ACL 2024)](https://arxiv.org/abs/2305.17926)
3. [LLMs are Inconsistent and Biased Evaluators (Stureborg et al., 2024)](https://arxiv.org/abs/2405.01724)
4. [Self-Preference Bias (Huang et al., 2024)](https://arxiv.org/abs/2410.21819)
5. [Justice or Prejudice? 12 Biases (Ye et al., 2024)](https://arxiv.org/abs/2410.02736)
6. [Beyond Consensus: Agreeableness Bias (Jain et al., 2025)](https://arxiv.org/abs/2510.11822)
7. [FairJudge (Yang et al., 2026)](https://arxiv.org/abs/2602.06625)

### Rúbricas y Evaluación Multidimensional
8. [G-Eval (Liu et al., EMNLP 2023)](https://arxiv.org/abs/2303.16634)
9. [LLM-Rubric (Hashemi et al., ACL 2024)](https://arxiv.org/abs/2501.00274)
10. [Prometheus (Kim et al., ICLR 2024)](https://arxiv.org/abs/2310.08491)
11. [Prometheus 2 (Kim et al., 2024)](https://arxiv.org/abs/2405.01535)
12. [FLASK (Ye et al., ICLR 2024 Spotlight)](https://arxiv.org/abs/2307.10928)
13. [Rubric-Conditioned LLM Grading (2025)](https://arxiv.org/abs/2601.08843)
14. [Rubric Is All You Need (ICER 2025)](https://arxiv.org/abs/2503.23989)
15. [RULERS: Evidence-Anchored Scoring (2026)](https://arxiv.org/abs/2601.08654)

### Prompting y Calibración
16. [CoT for Automatic Scoring (Lei et al., 2024)](https://www.sciencedirect.com/science/article/pii/S2666920X24000146)
17. [CoT for Formative Assessment (Cohn et al., AAAI 2024)](https://arxiv.org/abs/2403.14565)
18. [Output Order Effects (Chen et al., 2024)](https://arxiv.org/abs/2406.02863)
19. [Design Choices Impact (Yamauchi et al., 2025)](https://arxiv.org/abs/2506.13639)
20. [AutoCalibrate (Liu et al., LREC-COLING 2024)](https://arxiv.org/abs/2309.13308)
21. [Personas Don't Help (Zheng et al., EMNLP 2024)](https://arxiv.org/abs/2311.10054)
22. [Temperature and Model Size Effects (2025)](https://arxiv.org/abs/2509.19329)

### Evaluación Automatizada
23. [AutoSCORE (2025)](https://arxiv.org/abs/2509.21910)
24. [CritiqueLLM (2023)](https://arxiv.org/abs/2311.18702)
25. [Grade Like a Human (2024)](https://arxiv.org/abs/2405.19694)
26. [Language Models are Few-Shot Graders (2025)](https://arxiv.org/abs/2502.13337)
27. [GradeOpt (EDM 2025)](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.long-papers.80/index.html)

### Feedback Formativo y Educación
28. [Power of Feedback Revisited (Wisniewski et al., 2020)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/)
29. [SEFL: Enhancing Educational Feedback (Zhang et al., 2025)](https://arxiv.org/abs/2502.12927)
30. [LEAP: Self-Regulated Learning (Steinert et al., 2024)](https://arxiv.org/abs/2311.13984)
31. [Evidence-Based Feedback in Classroom (Meyer et al., 2024)](https://www.sciencedirect.com/science/article/pii/S2666920X23000784)
32. [LLM vs Human Tutors (Sessler et al., 2025)](https://arxiv.org/abs/2502.12842)
33. [LLMs Approach Expert Quality (Abdulsalam, 2025)](https://arxiv.org/abs/2512.20780)
34. [Adaptive Scaffolding Theory (Cohn et al., AAAI-26)](https://arxiv.org/abs/2508.01503)
35. [Productive Failure Meta-Analysis (Sinha & Kapur, 2021)](https://journals.sagepub.com/doi/10.3102/00346543211019105)

### Spaced Repetition con LLMs
36. [LECTOR: LLM-Enhanced Spaced Learning (2025)](https://arxiv.org/abs/2508.03275)
37. [LLM-Generated Retrieval Practice (2025)](https://arxiv.org/abs/2507.05629)

### Surveys
38. [A Survey on LLM-as-a-Judge (Gu et al., 2024)](https://arxiv.org/abs/2411.15594)
39. [LLMs-as-Judges Comprehensive Survey (2024)](https://arxiv.org/abs/2412.05579)
40. [CalibraEval (Li et al., ACL 2025)](https://arxiv.org/abs/2410.15393)
