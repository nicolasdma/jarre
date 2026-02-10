# Investigacion: Cerrar la Brecha entre Actividades de Aprendizaje y Evaluacion Sumativa

> Compilado: 2026-02-10
> Papers y fuentes revisados: ~60 fuentes academicas
> Proposito: Fundamentar el rediseno del flujo de evaluacion progresiva de Jarre

---

## Tabla de Contenidos

1. [El Problema Diagnosticado](#1-el-problema-diagnosticado)
2. [Alineamiento Constructivo (Biggs)](#2-alineamiento-constructivo-biggs)
3. [Taxonomia de Bloom Aplicada a Evaluacion Progresiva](#3-taxonomia-de-bloom-aplicada-a-evaluacion-progresiva)
4. [Efecto del Testing: Reconocimiento vs Produccion](#4-efecto-del-testing-reconocimiento-vs-produccion)
5. [Transfer-Appropriate Processing](#5-transfer-appropriate-processing)
6. [Marco ICAP y Auto-explicacion (Chi & Wylie)](#6-marco-icap-y-auto-explicacion-chi--wylie)
7. [Interrogacion Elaborativa](#7-interrogacion-elaborativa)
8. [Dificultades Deseables (Bjork)](#8-dificultades-deseables-bjork)
9. [Evaluacion de Dos Niveles (Two-Tier)](#9-evaluacion-de-dos-niveles-two-tier)
10. [Efecto del Testing con Materiales Complejos](#10-efecto-del-testing-con-materiales-complejos)
11. [Reaprendizaje Sucesivo (Rawson & Dunlosky)](#11-reaprendizaje-sucesivo-rawson--dunlosky)
12. [Interleaving y Spacing en Evaluacion](#12-interleaving-y-spacing-en-evaluacion)
13. [Assessment Progresivo: Low-Stakes a High-Stakes](#13-assessment-progresivo-low-stakes-a-high-stakes)
14. [Formativo como Predictor de Sumativo](#14-formativo-como-predictor-de-sumativo)
15. [Playground/Coding y Comprension Conceptual](#15-playgroundcoding-y-comprension-conceptual)
16. [Ratio Optimo: Reconocimiento vs Produccion](#16-ratio-optimo-reconocimiento-vs-produccion)
17. [Efecto Wash-Out](#17-efecto-wash-out)
18. [Sintesis: Diagnostico del Gap en Jarre](#18-sintesis-diagnostico-del-gap-en-jarre)
19. [Rediseno Propuesto: Escalera de Evaluacion Progresiva](#19-rediseno-propuesto-escalera-de-evaluacion-progresiva)
20. [Implementacion Tecnica](#20-implementacion-tecnica)
21. [Bibliografia Completa](#21-bibliografia-completa)

---

## 1. El Problema Diagnosticado

### Flujo Actual de Jarre

```
ACTIVATE -> LEARN -> APPLY -> REVIEW -> EVALUATE
(previo)   (leer+  (play-  (inline  (preguntas
            MC/TF)  ground)  + open)  free-form
                                      con LLM)
```

### Donde se Rompe

El usuario completa exitosamente los pasos 1-4:
- Lee capitulos traducidos de DDIA (~10K palabras por capitulo)
- Responde quizzes MC/TF inline (22 quizzes, grading client-side)
- Usa playgrounds interactivos (latency-simulator, storage-engine)
- Responde preguntas abiertas en REVIEW evaluadas por DeepSeek

Pero **fracasa** en el paso 5 (EVALUATE), que exige:
- Explicar conceptos con sus propias palabras
- Analizar trade-offs
- Detectar errores en explicaciones
- Conectar conceptos entre si
- Argumentar cuando NO usar una tecnologia

### Hipotesis del Gap

**Las actividades formativas no entrenan las mismas habilidades cognitivas que la evaluacion sumativa exige.** El sistema actual crea una ilusion de competencia:

| Actividad Formativa | Nivel Bloom | Tipo Cognitivo |
|---------------------|-------------|----------------|
| Leer capitulo | 1 - Recordar | Pasivo |
| Quiz MC inline | 2 - Comprender | Reconocimiento |
| Quiz TF inline | 1 - Recordar | Reconocimiento |
| Playground | 3 - Aplicar | Procedimental |
| Pregunta abierta (Review) | 2-3 | Produccion (pero sin scaffolding) |

| Evaluacion Sumativa | Nivel Bloom | Tipo Cognitivo |
|---------------------|-------------|----------------|
| Explicar concepto | 4 - Analizar | Produccion generativa |
| Trade-off analysis | 5 - Evaluar | Produccion critica |
| Error detection | 4 - Analizar | Produccion + juicio |
| Conexion entre conceptos | 5 - Evaluar | Produccion sintetica |
| Cuando NO usar algo | 6 - Crear | Produccion argumentativa |

**Hay un salto de 2-3 niveles de Bloom entre lo formativo y lo sumativo.**

---

## 2. Alineamiento Constructivo (Biggs)

### La Teoria

John Biggs (1996) establecio que un sistema de aprendizaje efectivo requiere **tres elementos alineados**:

1. **Resultados de Aprendizaje Deseados (ILOs)**: Lo que el estudiante debe poder hacer
2. **Actividades de Aprendizaje**: Lo que el estudiante realmente hace
3. **Tareas de Evaluacion**: Como se mide si lo logro

> "Constructively aligned teaching is more likely to be effective than unaligned teaching because there is maximum consistency throughout the system. All components address the same agenda and support each other."
> -- Biggs, 2003

### El Principio Clave

La evaluacion debe requerir **el mismo verbo cognitivo** que el resultado de aprendizaje deseado. Si quieres que el estudiante pueda "evaluar trade-offs", las actividades de aprendizaje deben incluir evaluacion de trade-offs, y la evaluacion debe pedirlo explicitamente.

### Diagnostico en Jarre

| ILO Deseado | Actividad Actual | Evaluacion | Alineado? |
|-------------|------------------|------------|-----------|
| Explicar replicacion | Leer sobre replicacion | "Explica replicacion" | NO - leer != explicar |
| Evaluar trade-offs | Quiz MC sobre trade-offs | "Analiza trade-off" | NO - reconocer != evaluar |
| Detectar errores | Nada | "Encuentra el error" | NO - nunca se practica |
| Conectar conceptos | Leer secuencialmente | "Como se relaciona X con Y?" | NO - secuencial != relacional |

**Conclusion**: Jarre tiene un problema severo de desalineamiento constructivo. Las actividades formativas operan a niveles cognitivos 1-3 pero la evaluacion sumativa exige niveles 4-6.

### Fuentes
- [Constructive Alignment (John Biggs)](https://www.johnbiggs.com.au/academic/constructive-alignment/)
- [Constructive Alignment - Queen Mary Academy](https://www.qmul.ac.uk/queenmaryacademy/educators/resources/curriculum-design/constructive-alignment/)
- [Using Constructive Alignment to Foster Teaching Learning (ERIC)](https://files.eric.ed.gov/fulltext/EJ1215464.pdf)

---

## 3. Taxonomia de Bloom Aplicada a Evaluacion Progresiva

### Los 6 Niveles y Verbos Clave

| Nivel | Verbo | Ejemplo en Jarre | Tipo de Pregunta |
|-------|-------|-------------------|------------------|
| 1. Recordar | Listar, definir, nombrar | "Que es leader election?" | TF, MC basica |
| 2. Comprender | Explicar, clasificar, resumir | "Explica por que se usa un WAL" | MC con justificacion |
| 3. Aplicar | Usar, implementar, demostrar | "Dado este escenario, que protocolo usarias?" | Escenario + respuesta |
| 4. Analizar | Comparar, contrastar, diferenciar | "Compara single-leader vs multi-leader" | Produccion estructurada |
| 5. Evaluar | Juzgar, argumentar, defender | "Cuando NO usarias Raft?" | Produccion argumentativa |
| 6. Crear | Disenar, proponer, construir | "Disena un sistema que tolere X" | Produccion generativa |

### Principio de Progresion

> "Before you can understand a concept, you must remember it. To apply a concept you must first understand it. In order to evaluate a process, you must have analyzed it."
> -- Anderson & Krathwohl, 2001

La investigacion confirma que los estudiantes evaluados en niveles superiores de Bloom desarrollan mejores habilidades de pensamiento critico que los evaluados solo en niveles basicos.

### Implicacion para Jarre

Las micro-evaluaciones deben **escalar sistematicamente** a traves de los niveles. No se puede saltar de nivel 1-2 (MC/TF) a nivel 5-6 (trade-off analysis) sin pasar por 3-4 (aplicacion y analisis).

### Fuentes
- [Bloom's Taxonomy (Simply Psychology)](https://www.simplypsychology.org/blooms-taxonomy.html)
- [Bloom's Taxonomy (University of Waterloo)](https://uwaterloo.ca/centre-for-teaching-excellence/catalogs/tip-sheets/blooms-taxonomy)
- [Bloom's Taxonomy Question Stems (Top Hat)](https://tophat.com/blog/blooms-taxonomy-question-stems/)

---

## 4. Efecto del Testing: Reconocimiento vs Produccion

### Hallazgo Fundamental (Roediger & Karpicke, 2006)

Dos experimentos donde estudiantes leyeron textos y luego:
- **Grupo A**: Re-estudiaron el material
- **Grupo B**: Hicieron tests de recuerdo libre (free recall)

Resultados:
- A los **5 minutos**: Re-estudio > Testing (el estudio repetido parecia mejor)
- A los **2 dias**: Testing > Re-estudio
- A la **1 semana**: Testing >> Re-estudio (diferencia sustancial)

> "Taking a memory test not only assesses what one knows, but also enhances later retention."
> -- Roediger & Karpicke, 2006

### Tamanos de Efecto por Formato

La investigacion muestra beneficios diferenciados por formato:

| Formato | Effect Size (d) |
|---------|----------------|
| Reconocimiento (MC) | 0.36 |
| Recuerdo con pista (cued recall) | 0.72 |
| Recuerdo libre (free recall) | 0.81 |

**El recuerdo libre produce mas del doble de beneficio que la seleccion multiple.**

### Matiz Importante

Smith & Karpicke (2014) encontraron que cuando se controla por exito de recuperacion, las diferencias entre formatos se reducen. Lo critico no es solo el formato sino que la recuperacion sea exitosa. Una pregunta MC bien disenada puede producir beneficios similares a free recall **si requiere procesamiento profundo**.

### Meta-analisis Relevantes

| Meta-analisis | N | Effect Size |
|---------------|---|-------------|
| Adesope et al. (2017) | multiple | g=0.61 general, g=0.70 MC |
| Rowland (2014) | multiple | g=0.50 general, g=0.73 con feedback |
| Yang et al. (2021) | 48K | g=0.499 en aula |

### Fuentes
- [Test-Enhanced Learning (Roediger & Karpicke, 2006)](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x)
- [The Power of Testing Memory (Roediger & Karpicke, 2006)](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf)
- [Both MC and Short-Answer Quizzes Enhance Later Exam Performance (APA)](https://www.apa.org/pubs/journals/features/xap-0000004.pdf)
- [Retrieval-Based Learning (Karpicke, 2012)](https://journals.sagepub.com/doi/abs/10.1177/0963721412443552)
- [Test-Enhanced Learning in Science (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4477741/)

---

## 5. Transfer-Appropriate Processing

### La Teoria

> "Memory performance is best when the processes engaged in during encoding match those engaged in during retrieval."
> -- Morris, Bransford & Franks, 1977

### Hallazgo Critico para Jarre

**Los efectos de la practica de recuperacion son mayores cuando el formato de practica coincide con el formato del test final.** Si hay mismatch, el efecto se puede **reducir a la mitad**.

| Practica | Test Final | Resultado |
|----------|-----------|-----------|
| MC -> MC | Match | Efecto completo |
| MC -> Free recall | Mismatch | Efecto ~50% |
| Free recall -> Free recall | Match | Efecto maximo |
| Free recall -> MC | Mismatch parcial | Efecto ~75% |

### Implicacion Directa

Si la evaluacion final de Jarre es free-form (produccion), pero toda la practica formativa es MC/TF (reconocimiento), estamos en el peor escenario posible: **mismatch total entre encoding y retrieval**.

El usuario practica reconocer respuestas correctas, pero se le pide producir explicaciones. Son procesos cognitivos diferentes.

### Fuentes
- [Transfer-Appropriate Processing (Andy Matuschak Notes)](https://notes.andymatuschak.org/Transfer-appropriate_processing)
- [Transfer-Appropriate Processing in the Testing Effect (ResearchGate)](https://www.researchgate.net/publication/267743770_Transfer-appropriate_processing_in_the_testing_effect)

---

## 6. Marco ICAP y Auto-explicacion (Chi & Wylie)

### ICAP: Cuatro Modos de Engagement

Chi & Wylie (2014) proponen que el engagement cognitivo se clasifica en cuatro modos, con aprendizaje creciente:

| Modo | Comportamiento Observable | Ejemplo en Jarre | Aprendizaje |
|------|---------------------------|-------------------|-------------|
| **Pasivo (P)** | Recibir informacion sin actuar | Leer capitulo | Minimo |
| **Activo (A)** | Manipular material sin generar | Subrayar, reler, copiar notas | Bajo-Medio |
| **Constructivo (C)** | Generar output que va MAS ALLA del material | Auto-explicacion, resumir con palabras propias | Alto |
| **Interactivo (I)** | Co-construir conocimiento con otro agente | Debate, ensenanza reciproca | Maximo |

**Hipotesis ICAP: I > C > A > P**

### Auto-explicacion: El Puente Clave

Chi et al. (1994) demostraron que estudiantes que se auto-explican mientras leen aprenden significativamente mas:

> "Students who learned more appeared to study the examples by explaining them to themselves... generating explanations after reading each sentence."

Los prompts de auto-explicacion mas efectivos:
1. **Prompts de justificacion**: "Por que funciona este paso?" -> Genera razonamiento explicito
2. **Prompts de revision de modelo mental**: "Que cambia en tu comprension?" -> Facilita revision de conocimiento previo
3. **Prompts step-focused**: "Que hace este paso?" -> Mantiene engagement sostenido

### El Mecanismo

Hay dos explicaciones de por que funciona:
1. **Hipotesis del contenido**: Auto-explicarse genera contenido adicional no presente en el material
2. **Hipotesis del proceso**: El *proceso* de generar es mas importante que el contenido generado

Ambas probablemente contribuyen, pero la segunda tiene mas soporte empirico.

### Mapeo al Flujo de Jarre

| Paso Actual | Modo ICAP | Nivel |
|-------------|-----------|-------|
| Leer capitulo | Pasivo | P |
| Quiz MC | Activo (seleccionar) | A |
| Quiz TF | Activo (seleccionar) | A |
| Playground | Activo/Constructivo | A-C |
| Review open-ended | Constructivo | C |
| Evaluate free-form | Constructivo | C |

**El salto de A -> C ocurre de golpe entre Review y Evaluate.** Se necesitan actividades Constructivas intermedias.

### Fuentes
- [The ICAP Framework (Chi & Wylie, 2014)](https://education.asu.edu/sites/g/files/litvpz656/files/lcl/chiwylie2014icap_2.pdf)
- [Eliciting Self-Explanations Improves Understanding (Chi, 1994)](https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog1803_3)
- [Self-Explanation Training (VanLehn)](https://www.lrdc.pitt.edu/nokes/documents/hausmann,_nokes,_vanlehn,_&_gershman,_2009.pdf)
- [Instruction Based on Self-Explanation (Chi)](https://education.asu.edu/sites/g/files/litvpz656/files/lcl/instruction_based_on_self_explanation.pdf)

---

## 7. Interrogacion Elaborativa

### Que Es

Es una tecnica donde el estudiante se pregunta a si mismo "por que?" o "como?" sobre la informacion que esta aprendiendo, forzando conexiones con conocimiento previo.

### Efectividad

> "Participants who used elaborative interrogation recalled **twice as much information** as those who relied solely on reading or simple review."

Sin embargo, Dunlosky et al. (2013) la calificaron como de "utilidad moderada" porque:
- Funciona bien con hechos y conceptos causales
- Es menos efectiva con procedimientos complejos
- No ha sido evaluada suficientemente en contextos educativos reales

### Aplicacion en Jarre

La interrogacion elaborativa es ideal como **paso intermedio** entre leer (pasivo) y explicar (constructivo):

- **Despues de cada seccion**: "Por que se necesita un log de escritura adelantada (WAL)? Que pasaria sin el?"
- **Relacionando conceptos**: "Como se conecta la replicacion con la consistencia?"
- **Contraejemplos**: "En que escenario el consensus NO seria la solucion correcta?"

### Fuentes
- [Elaborative Interrogation (Dunlosky et al., 2013)](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266)
- [Elaborative Interrogation Deep Learning (MornBlog)](https://mornblog.com/elaborative-interrogation-deep/)

---

## 8. Dificultades Deseables (Bjork)

### El Concepto

Robert Bjork (1994) introdujo el termino "desirable difficulties": condiciones que parecen dificultar el aprendizaje a corto plazo pero mejoran la retencion y transferencia a largo plazo.

Cuatro dificultades deseables principales:

| Dificultad | Descripcion | Effect en Jarre |
|-----------|-------------|-----------------|
| **Spacing** | Distribuir practica en el tiempo | SM-2 ya implementado |
| **Interleaving** | Mezclar temas en vez de bloques | NO implementado |
| **Testing** | Practicar recuperacion | Parcialmente (MC/TF) |
| **Generation** | Producir en vez de reconocer | NO implementado |

### Efecto de Generacion

> "If a student generates a solution or answer as opposed to being presented with one, retrieval is strengthened."
> -- Bjork

El efecto de generacion es central para cerrar el gap: **los estudiantes que generan respuestas retienen mas que los que seleccionan respuestas**.

### La Regla del 85%

Investigacion reciente (Wilson et al., 2019, Nature Communications) establece que la dificultad optima para el aprendizaje es ~85% de exito. Esto significa:

- Si los quizzes MC tienen >90% de acierto -> son demasiado faciles
- Si las evaluaciones free-form tienen <50% de acierto -> son demasiado dificiles
- El sweet spot es ~85% de exito en cada nivel

### Fuentes
- [Making Things Hard on Yourself (Bjork & Bjork)](https://www.researchgate.net/publication/284097727_Making_things_hard_on_yourself_but_in_a_good_way_Creating_desirable_difficulties_to_enhance_learning)
- [The Eighty Five Percent Rule (Nature Communications)](https://www.nature.com/articles/s41467-019-12552-4)
- [Bjork Learning and Forgetting Lab](https://bjorklab.psych.ucla.edu/research/)

---

## 9. Evaluacion de Dos Niveles (Two-Tier)

### El Concepto

Las preguntas de dos niveles (Two-Tier MC) combinan reconocimiento y produccion en una misma pregunta:

- **Tier 1**: Pregunta MC tradicional (reconocimiento)
- **Tier 2**: "Explica por que elegiste esa respuesta" (produccion/justificacion)

### Por Que Funciona

> "Two-tier MC questions have a first tier pertaining to knowledge or comprehension and a second tier that facilitates testing of higher-order thinking—asking a lower-order question and then asking students to provide a reason, which requires higher-order thinking."

Beneficios documentados:
1. **Reduce adivinanza**: No basta con adivinar la respuesta correcta
2. **Revela misconceptions**: El Tier 2 muestra SI el estudiante entiende o solo acerto
3. **Scaffolding natural**: El Tier 1 activa el conocimiento, el Tier 2 lo elabora
4. **Transicion gradual**: De reconocimiento puro a produccion guiada

### Investigacion sobre Justificacion

> "Incorporating answer justification—a process where learners explain their chosen response—can enhance the educational value of MC questions by encouraging elaborative retrieval and metacognitive monitoring."

El efecto es doble:
- Mejora el aprendizaje del estudiante (generacion)
- Mejora la evaluacion (revela comprension real vs suerte)

### Fuentes
- [Two-Tier Science Assessment (SpringerOpen)](https://apse-journal.springeropen.com/articles/10.1186/s41029-015-0005-x)
- [The Justification Effect on Two-Tier MC Exams](https://www2.seas.gwu.edu/~simha/research/jmcq.pdf)
- [Answer Justification in MC Testing (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12023925/)

---

## 10. Efecto del Testing con Materiales Complejos

### El Debate

Van Gog & Sweller (2015) argumentaron que el efecto del testing **desaparece** con materiales de alta complejidad (alto element interactivity). Su logica: materiales complejos sobrecargan la memoria de trabajo durante la recuperacion.

Sin embargo, multiples investigadores han refutado esta posicion:

> "Van Gog and Sweller (2015) claim that there is no testing effect—no benefit of practicing retrieval—for complex materials, but this claim has been shown to be incorrect on several grounds."
> -- Karpicke & Aue, 2015

### Hallazgo Critico

Lo que SI se ha establecido:

> "Explicit testing on low-level terminology that resulted in a clear testing effect did NOT lead to an increase in conceptual learning on higher-level items."

**Esto es exactamente el problema de Jarre**: testear terminologia (MC/TF) no produce aprendizaje conceptual profundo. El testing funciona con materiales complejos, PERO el tipo de testing debe coincidir con el nivel de comprension deseado.

### Implicacion

- MC sobre definiciones -> mejora recuerdo de definiciones
- MC sobre definiciones -> NO mejora capacidad de analizar trade-offs
- Preguntas de analisis -> mejoran capacidad de analizar
- Preguntas de evaluacion -> mejoran capacidad de evaluar

### Fuentes
- [Testing Effect Decreases with Complexity (Springer)](https://link.springer.com/article/10.1007/s10648-015-9310-x)
- [Testing Effect Alive and Well with Complex Materials (Springer)](https://link.springer.com/article/10.1007/s10648-015-9309-3)
- [Testing Effect on High-Level Cognitive Skills (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8711821/)

---

## 11. Reaprendizaje Sucesivo (Rawson & Dunlosky)

### El Protocolo

Successive relearning combina las dos tecnicas mas potentes: **retrieval practice + spacing**.

1. Practicar hasta responder correctamente (criterio de dominio)
2. Esperar un intervalo
3. Practicar de nuevo hasta responder correctamente
4. Repetir 2-3 veces

### Resultados

> "The advantage of successive relearning over single-session learning was **substantial, ds = 1.52 to 4.19**."
> -- Rawson & Dunlosky, 2022

Retencion a largo plazo:
- **1 mes**: hasta 68% retencion (vs 11% sin relearning)
- **4 meses**: hasta 49% retencion (vs ~0% sin relearning)

### Relearning Override Effect

Un hallazgo fascinante: el reaprendizaje sucesivo **anula** los efectos de condiciones iniciales suboptimas. Si el aprendizaje inicial fue pobre, el reaprendizaje lo compensa.

> "The effects of initial lag on retention were sizable prior to relearning but attenuated after relearning."

### Implicacion para Jarre

El sistema SM-2 actual de Jarre ya implementa spacing. Lo que falta es el componente de **criterio de dominio**: no basta con ver la pregunta, hay que responderla correctamente antes de avanzar. Y hay que hacerlo **multiple veces** en sesiones separadas.

**Recomendacion**: 3 sesiones de relearning son suficientes para beneficios maximos.

### Fuentes
- [Successive Relearning: An Underexplored but Potent Technique (Rawson & Dunlosky, 2022)](https://journals.sagepub.com/doi/full/10.1177/09637214221100484)
- [Push Beyond One and Done (RetrievalPractice.org)](https://www.retrievalpractice.org/strategies/2018/successive-relearning)
- [Practice Tests, Spaced Practice, and Successive Relearning (APA)](https://www.apa.org/pubs/journals/features/stl-0000024.pdf)

---

## 12. Interleaving y Spacing en Evaluacion

### Interleaving: Mezclar Temas

En vez de practicar un tema y luego otro (blocked practice), la practica interleaved mezcla temas:

- **Blocked**: AAA BBB CCC
- **Interleaved**: ABC ABC ABC

### Resultados Recientes

Estudio en fisica universitaria (2024): estudiantes con problemas interleaved mostraron mejoras del **50% en un test y 125% en otro** comparado con practica convencional.

### Related-Interleaving (2024)

Investigacion de MIS Quarterly propone "related-interleaving": poblar sesiones interleaved con temas **relacionados** (no aleatorios) para reducir carga cognitiva. Resultados:

- Related-interleaving > non-interleaving
- Related-interleaving > unrelated-interleaving
- Beneficios especialmente fuertes para estudiantes mas debiles

### Implicacion para Jarre

El review actual de Jarre es **blocked por seccion**: todas las preguntas de una seccion juntas. Deberia ser **related-interleaved**: mezclar preguntas de secciones relacionadas (ej: replicacion + consistencia + particionamiento).

### Fuentes
- [Interleaved Practice Enhances Memory (Nature)](https://www.nature.com/articles/s41539-021-00110-x)
- [Interleaved Design for E-Learning (MIS Quarterly)](https://misq.umn.edu/misq/article/48/4/1363/2325/Interleaved-Design-for-E-Learning-Theory-Design)
- [Spaced and Interleaved Practice (MIT OpenLearning)](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/spaced-and-interleaved-practice)

---

## 13. Assessment Progresivo: Low-Stakes a High-Stakes

### El Principio de Scaffolding

> "Using low-stakes assessments to build the skills and knowledge needed to succeed in more complex and challenging parts of the course is called 'scaffolding' instruction."

La investigacion muestra que:
1. Evaluaciones frecuentes y de bajo riesgo son **mas efectivas** para retencion a largo plazo que evaluaciones infrecuentes y de alto riesgo
2. Low-stakes pueden estructurarse para **preparar** directamente para high-stakes
3. Las rubricas pueden usarse como scaffold que se "desvanece" gradualmente

### Fading de Scaffolds

El concepto de "fading" es critico: gradualmente se **remueve** el apoyo a medida que el estudiante demuestra dominio.

Ejemplo aplicado:
1. **Nivel 1**: MC con 4 opciones (maximo scaffold)
2. **Nivel 2**: MC con justificacion escrita (scaffold parcial)
3. **Nivel 3**: Pregunta abierta con hints/pistas (scaffold minimo)
4. **Nivel 4**: Pregunta abierta sin apoyo (sin scaffold)
5. **Nivel 5**: Escenario complejo + argumentacion (evaluacion sumativa)

### Fuentes
- [Low and High-Stakes Assessments (UCSB)](https://otl.ucsb.edu/resources/assessing-learning/low-high-stakes-assessments)
- [Frequent Low-Stakes Assignments (Carnegie Mellon)](https://www.cmu.edu/teaching/online/assessinglearning/remoteassessment/studentlearning/lowstakes.html)
- [Concrete Strategies for Low-Stakes Practice (Carnegie Mellon)](https://www.cmu.edu/teaching/online/designteach/strategies/lowstakespractice.html)

---

## 14. Formativo como Predictor de Sumativo

### Correlacion Documentada

- Las evaluaciones formativas de respuesta construida (constructed-response) correlacionan significativamente con el desempeno en evaluacion sumativa
- Evaluaciones formativas de libro abierto son altamente predictivas de logros en evaluaciones sumativas tanto abiertas como cerradas
- **Caveat**: La correlacion no implica causalidad; estudiantes de mejor rendimiento tienden a completar mas evaluaciones formativas

### Hallazgo Clave

Las evaluaciones formativas que **mejor predicen** el rendimiento sumativo son las que **coinciden en formato y nivel cognitivo** con la evaluacion sumativa. Esto refuerza el principio de transfer-appropriate processing.

### Fuentes
- [Correlation Between Formative and Summative Assessment (ResearchGate)](https://www.researchgate.net/publication/378966739_Correlation_Between_Student_Performances_on_Case-Based_Constructed-Response_Formative_Assessment_and_Summative_Assessment)
- [Formative Assessment Predicts Summative (PubMed)](https://pubmed.ncbi.nlm.nih.gov/16729243/)
- [Evaluating Students' Learning with Formative Assessment (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11590208/)

---

## 15. Playground/Coding y Comprension Conceptual

### Hallazgo Preocupante

> "Misalignment between the learning of theory and the learning of practice is a reason for unsatisfactory learning outcomes... the complex interaction between concepts and practice explains why conceptual learning is not an automatic outcome of lab work."

### Transfer Limitado

La investigacion en ciencias de la computacion muestra:
- Resolver Parsons Problems (reordenar codigo) **NO transfiere** a escribir codigo para la misma pregunta
- Practicar programacion produce correlaciones positivas con procesamiento de informacion y razonamiento, pero **la transferencia no es automatica**
- La comprension conceptual requiere **reflexion explicita** sobre la practica, no solo la practica misma

### Faded Parsons Problems

Una solucion investigada: "Faded Parsons Problems" donde las lineas de codigo proporcionadas son **parcial o completamente incompletas**, forzando al estudiante a generar en vez de solo reordenar.

### Implicacion para Jarre

El playground actual (latency-simulator, storage-engine) es valioso como experiencia **procedimental**, pero necesita acompanarse de **preguntas de reflexion** para producir comprension conceptual:

- "Que observaste al cambiar la latencia de red de 10ms a 200ms?"
- "Por que el throughput cayo cuando anadiste un tercer nodo?"
- "Que trade-off ilustra este comportamiento?"

Sin estas preguntas de reflexion, el playground produce conocimiento procedimental pero NO conceptual.

### Fuentes
- [Analysis of Students' Learning of Programming (Taylor & Francis)](https://www.tandfonline.com/doi/full/10.1080/03043797.2018.1544609)
- [Cognitive Benefits of Learning to Code (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8458729/)
- [Faded Parsons Problems (ACE Lab Berkeley)](https://acelab.berkeley.edu/wp-content/papercite-data/pdf/parsons-chi2021.pdf)

---

## 16. Ratio Optimo: Reconocimiento vs Produccion

### No Hay un Ratio Universal

La investigacion **no prescribe un porcentaje exacto** (ej: "60% MC, 40% free-form"). En cambio, establece principios:

1. **Early learning**: Mayor proporcion de reconocimiento (MC) para construir base
2. **Intermediate learning**: Mezcla de reconocimiento y produccion
3. **Advanced learning/assessment**: Mayor proporcion de produccion

### Principios Derivados de la Investigacion

Basado en la sintesis de fuentes:

| Fase | Reconocimiento (MC/TF) | Produccion (short-answer, essay) | Justificacion |
|------|------------------------|----------------------------------|---------------|
| Exposicion inicial | 80% | 20% | Construir vocabulario y reconocimiento |
| Comprension | 50% | 50% | Two-tier: MC + justificacion |
| Aplicacion | 30% | 70% | Escenarios requieren produccion |
| Analisis/Evaluacion | 10% | 90% | Solo produccion mide comprension profunda |
| Evaluacion sumativa | 0% | 100% | Produccion libre sin scaffolds |

### La Regla Practica

Si el assessment sumativo es 100% produccion, al menos el **50% de la practica formativa** deberia involucrar algun tipo de produccion (even if scaffolded). Actualmente en Jarre es ~15% (solo las preguntas abiertas de Review).

### Fuentes
- [MC Testing in Education (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S2211368118301426)
- [MC Questions for Higher Order Thinking (University of Saskatchewan)](https://teaching.usask.ca/articles/2025-02-28-multichoice-questions-higher-order-thinking.php)

---

## 17. Efecto Wash-Out

### Definicion

El efecto wash-out ocurre cuando ganancias iniciales de aprendizaje se disipan en evaluaciones posteriores (delayed tests).

### Hallazgo Relevante

> "The testing effect decreases as the complexity of learning materials increases... the effect may even disappear when the complexity of learning material is very high."

Esto sugiere que con materiales complejos como DDIA:
- El beneficio de quizzes MC simples puede **disiparse** en evaluaciones posteriores
- Se necesita **retrieval practice con materiales del mismo nivel de complejidad** que la evaluacion final
- El spacing (SM-2) es la principal defensa contra el wash-out

### Mitigacion

El reaprendizaje sucesivo (seccion 11) es la defensa mas potente contra el wash-out: ds = 1.52-4.19 incluso despues de 4 meses.

### Fuentes
- [Testing Effect Decreases with Complexity (Springer)](https://link.springer.com/article/10.1007/s10648-015-9310-x)
- [Successive Relearning (Rawson & Dunlosky, 2022)](https://journals.sagepub.com/doi/full/10.1177/09637214221100484)

---

## 18. Sintesis: Diagnostico del Gap en Jarre

### Los 5 Problemas Raiz

| # | Problema | Base Teorica | Severidad |
|---|----------|--------------|-----------|
| 1 | **Desalineamiento constructivo**: Actividades de nivel 1-3, evaluacion de nivel 4-6 | Biggs (1996) | CRITICA |
| 2 | **Transfer-Appropriate Processing violado**: Practica MC, evaluacion free-form | Morris et al. (1977) | CRITICA |
| 3 | **Predominio ICAP Pasivo/Activo**: La mayoria de actividades son P o A, la evaluacion exige C | Chi & Wylie (2014) | ALTA |
| 4 | **Sin efecto de generacion**: Casi toda la practica es reconocimiento, no produccion | Bjork (1994) | ALTA |
| 5 | **Sin interleaving**: Review organizado en bloques por seccion | Bjork & Bjork (2011) | MEDIA |

### Cadena Causal del Fracaso

```
Leer (Pasivo)
    |
    v
MC/TF (Activo-Reconocimiento, Bloom 1-2)
    |
    v
Playground (Activo-Procedimental, Bloom 3, sin reflexion)
    |
    v
Review Open-ended (Constructivo, pero sin scaffolding, Bloom 2-3)
    |
    v
  [ABISMO COGNITIVO]
    |
    v
Evaluate: "Analiza trade-offs de Raft vs Paxos" (Bloom 5-6)
    |
    v
FRACASO: No se ha practicado analisis, evaluacion ni produccion argumentativa
```

---

## 19. Rediseno Propuesto: Escalera de Evaluacion Progresiva

### Principio Rector

Cada paso del flujo debe estar **exactamente un nivel de Bloom** por encima del anterior. Nunca saltar mas de un nivel.

### La Escalera de 7 Peldanos

```
PASO 1: ACTIVATE (Recordar - Bloom 1)
  - Pre-preguntas de activacion
  - "Que sabes sobre replicacion?"
  - Sin evaluacion, solo priming

PASO 2: LEARN + MC/TF Inline (Comprender - Bloom 2)
  - Lectura del capitulo
  - Quizzes MC/TF despues de cada sub-seccion
  - NUEVO: MC two-tier (MC + "por que elegiste eso?")
  - Target: 85% acierto

PASO 3: AUTO-EXPLICACION (Comprender/Aplicar - Bloom 2-3)
  - NUEVO: Despues de cada seccion, prompt de auto-explicacion
  - "Explica en 2-3 oraciones como funciona leader election"
  - Evaluacion: Solo longitud minima + auto-evaluacion (sin LLM)
  - Basado en: Chi & Wylie ICAP, modo Constructivo

PASO 4: APPLY + REFLEXION (Aplicar - Bloom 3)
  - Playground existente
  - NUEVO: Preguntas de reflexion post-playground
  - "Que observaste? Que trade-off ilustra?"
  - Evaluacion ligera: LLM verifica coherencia, no correccion total

PASO 5: ANALISIS GUIADO (Analizar - Bloom 4)
  - NUEVO: Preguntas de comparacion y contraste
  - "Compara single-leader vs multi-leader replication"
  - Scaffold: Tabla de comparacion con categorias pre-definidas
  - Evaluacion: LLM evalua completitud y precision
  - Interleaved: Mezcla preguntas de secciones diferentes

PASO 6: EVALUACION CON SCAFFOLDING (Evaluar - Bloom 5)
  - NUEVO: Preguntas de trade-off y error detection CON pistas
  - "Aqui hay una explicacion de Raft. Tiene un error. Pista: mira el paso 3."
  - Preguntas de "cuando NO usar X" con contexto
  - Evaluacion: LLM con rubrica multi-dimensional
  - Feedback formativo completo (feed-up, feed-back, feed-forward)

PASO 7: EVALUATE SIN SCAFFOLD (Evaluar/Crear - Bloom 5-6)
  - Evaluacion sumativa actual
  - SIN pistas, SIN scaffolding
  - El estudiante ya ha practicado cada tipo de pregunta en los pasos anteriores
```

### Diferencias Clave vs Flujo Actual

| Aspecto | Actual | Propuesto |
|---------|--------|-----------|
| Pasos | 5 | 7 |
| Niveles Bloom cubiertos | 1-2, luego 5-6 | 1, 2, 2-3, 3, 4, 5, 5-6 |
| % Produccion formativa | ~15% | ~60% |
| Auto-explicacion | Solo textarea opcional | Prompts estructurados cada seccion |
| Interleaving | No | Si, en pasos 5+ |
| Scaffolding de evaluacion | No | Si, en paso 6 |
| Reflexion post-playground | No | Si |
| Two-tier MC | No | Si |

### Regla del 85% Aplicada

| Paso | Target de Exito | Si <70% | Si >95% |
|------|----------------|---------|---------|
| MC/TF Inline | 85% | Repetir seccion | OK, avanzar |
| Auto-explicacion | 85% longitud | Prompt mas especifico | OK |
| Analisis Guiado | 85% criterios | Ofrecer hints | OK |
| Evaluacion con Scaffold | 75% | Repetir sin scaffold | OK |
| Evaluate Final | 60% para nivel 1 | Loop back a Analisis Guiado | Nivel 1+ alcanzado |

---

## 20. Implementacion Tecnica

### Prioridad 1: MC Two-Tier (Esfuerzo Bajo, Impacto Alto)

**Que**: Anadir un campo `justification_required: boolean` a `inline_quizzes`. Si es true, despues de responder MC, aparece un textarea: "Por que elegiste esa respuesta?"

**Por que**: Transforma reconocimiento (Activo) en produccion guiada (Constructivo). Es la intervencion con mejor ratio esfuerzo/impacto basada en la investigacion two-tier.

**Como**:
- Agregar columna `justification_required BOOLEAN DEFAULT FALSE` a `inline_quizzes`
- Modificar `InlineQuiz` component: despues de seleccionar, mostrar textarea si justification_required
- Grading: client-side para el MC, longitud minima para justificacion (sin LLM)
- Gradualmente, activar para ~50% de los quizzes inline

### Prioridad 2: Auto-explicacion Post-Seccion (Esfuerzo Medio, Impacto Alto)

**Que**: Despues de completar cada seccion en el paso LEARN, prompt de auto-explicacion antes de avanzar.

**Por que**: ICAP muestra que actividades Constructivas (generar output propio) producen significativamente mejor aprendizaje que Activas (manipular material existente). Chi (1994) demostro que auto-explicacion mejora comprension.

**Como**:
- Nuevo componente `SelfExplanationPrompt` (ya existe `SelfExplanation` -- evolucionarlo)
- Prompt especifico por concepto: "Explica [concepto] en tus propias palabras"
- Validacion: longitud minima (50 chars), sin LLM
- Persistir en `sectionState` del `LearnProgress`

### Prioridad 3: Reflexion Post-Playground (Esfuerzo Bajo, Impacto Medio)

**Que**: Pantalla de reflexion despues del playground con 2-3 preguntas guiadas.

**Por que**: La practica de coding sin reflexion produce conocimiento procedimental pero no conceptual. La reflexion explicita fuerza transfer.

**Como**:
- Nuevo sub-paso dentro de APPLY: playground -> reflexion
- 2-3 preguntas pre-definidas por playground
- Textarea libre, sin LLM
- Persistir respuestas

### Prioridad 4: Analisis Guiado Interleaved (Esfuerzo Alto, Impacto Alto)

**Que**: Nuevo paso entre APPLY y REVIEW con preguntas de nivel Bloom 4 (analisis), interleaved entre secciones.

**Por que**: Es el "peldano faltante" mas critico. Sin el, hay un salto de Bloom 3 (aplicar) a Bloom 5 (evaluar).

**Como**:
- Nuevo tipo de pregunta en `question_bank`: `type: 'analysis'`
- Preguntas de comparacion, contraste, clasificacion
- Presentacion interleaved (mezclar conceptos de secciones diferentes)
- Evaluacion por LLM con rubrica de "completitud" y "precision"
- Scaffold: Tabla de comparacion con categorias sugeridas

### Prioridad 5: Evaluacion con Scaffolding (Esfuerzo Alto, Impacto Alto)

**Que**: Nuevo paso que usa las mismas preguntas de la evaluacion sumativa pero con pistas y scaffolds.

**Por que**: Transfer-appropriate processing: la practica debe coincidir con la evaluacion final en formato y nivel cognitivo. El scaffolding se desvanece progresivamente.

**Como**:
- Agregar campo `hint: TEXT` a preguntas del `question_bank` tipo trade-off/error_detection
- En el paso scaffolded: mostrar pregunta + hint
- En evaluacion final: misma pregunta sin hint
- Feedback LLM completo (feed-up, feed-back, feed-forward)
- Tracking: si el estudiante necesito hint, NO contar como dominio completo

### Prioridad 6: Interleaving en Review (Esfuerzo Bajo, Impacto Medio)

**Que**: Cambiar el orden de presentacion en el paso REVIEW de blocked-by-section a related-interleaved.

**Por que**: La practica interleaved produce 50-125% mejoras sobre blocked practice.

**Como**:
- En `ReviewStep`, en vez de iterar `sections.map(...)`, crear array shuffled de todas las preguntas agrupando conceptos relacionados
- Usar `concept_id` + `resource_concepts.is_prerequisite` para identificar conceptos relacionados
- Presentar en pares: pregunta de concepto A, luego pregunta de concepto relacionado B

---

## 21. Bibliografia Completa

### Alineamiento Constructivo
1. [Constructive Alignment (John Biggs)](https://www.johnbiggs.com.au/academic/constructive-alignment/)
2. [Using Constructive Alignment to Foster Teaching Learning (ERIC)](https://files.eric.ed.gov/fulltext/EJ1215464.pdf)
3. [Reclaiming Constructive Alignment (Taylor & Francis)](https://www.tandfonline.com/doi/full/10.1080/21568235.2020.1816197)

### Taxonomia de Bloom
4. [Bloom's Taxonomy (Simply Psychology)](https://www.simplypsychology.org/blooms-taxonomy.html)
5. [Bloom's Taxonomy (University of Waterloo)](https://uwaterloo.ca/centre-for-teaching-excellence/catalogs/tip-sheets/blooms-taxonomy)
6. [Bloom's Taxonomy Question Stems (Top Hat)](https://tophat.com/blog/blooms-taxonomy-question-stems/)

### Efecto del Testing
7. [Test-Enhanced Learning (Roediger & Karpicke, 2006)](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x)
8. [The Power of Testing Memory (Roediger & Karpicke, 2006)](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf)
9. [Retrieval-Based Learning (Karpicke, 2012)](https://journals.sagepub.com/doi/abs/10.1177/0963721412443552)
10. [Both MC and Short-Answer Quizzes (APA)](https://www.apa.org/pubs/journals/features/xap-0000004.pdf)
11. [Test-Enhanced Learning in Science (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4477741/)
12. [Active Retrieval Promotes Meaningful Learning (Karpicke)](https://learninglab.psych.purdue.edu/downloads/2012/2012_Karpicke_CDPS.pdf)

### Transfer-Appropriate Processing
13. [Transfer-Appropriate Processing (Andy Matuschak Notes)](https://notes.andymatuschak.org/Transfer-appropriate_processing)
14. [Transfer-Appropriate Processing in the Testing Effect (ResearchGate)](https://www.researchgate.net/publication/267743770_Transfer-appropriate_processing_in_the_testing_effect)

### ICAP y Auto-explicacion
15. [The ICAP Framework (Chi & Wylie, 2014)](https://education.asu.edu/sites/g/files/litvpz656/files/lcl/chiwylie2014icap_2.pdf)
16. [Eliciting Self-Explanations (Chi, 1994)](https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog1803_3)
17. [Self-Explanation Prompts Design (VanLehn)](https://www.lrdc.pitt.edu/nokes/documents/hausmann,_nokes,_vanlehn,_&_gershman,_2009.pdf)
18. [Instruction Based on Self-Explanation (Chi)](https://education.asu.edu/sites/g/files/litvpz656/files/lcl/instruction_based_on_self_explanation.pdf)
19. [Questioning ICAP Central Assumptions (Nature)](https://www.nature.com/articles/s41539-023-00197-4)

### Interrogacion Elaborativa
20. [Improving Students' Learning (Dunlosky et al., 2013)](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266)

### Dificultades Deseables
21. [Making Things Hard on Yourself (Bjork & Bjork)](https://www.researchgate.net/publication/284097727_Making_things_hard_on_yourself_but_in_a_good_way_Creating_desirable_difficulties_to_enhance_learning)
22. [The 85% Rule (Nature Communications)](https://www.nature.com/articles/s41467-019-12552-4)
23. [Bjork Learning and Forgetting Lab](https://bjorklab.psych.ucla.edu/research/)

### Evaluacion Two-Tier
24. [Two-Tier Science Assessment (SpringerOpen)](https://apse-journal.springeropen.com/articles/10.1186/s41029-015-0005-x)
25. [Justification Effect on Two-Tier MC Exams](https://www2.seas.gwu.edu/~simha/research/jmcq.pdf)
26. [Answer Justification in MC Testing (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12023925/)

### Testing con Materiales Complejos
27. [Testing Effect Decreases with Complexity (Springer)](https://link.springer.com/article/10.1007/s10648-015-9310-x)
28. [Testing Effect Alive with Complex Materials (Springer)](https://link.springer.com/article/10.1007/s10648-015-9309-3)
29. [Testing on High-Level Cognitive Skills (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8711821/)

### Reaprendizaje Sucesivo
30. [Successive Relearning (Rawson & Dunlosky, 2022)](https://journals.sagepub.com/doi/full/10.1177/09637214221100484)
31. [Successive Relearning Improves Exam Performance](https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.3699)
32. [Push Beyond One and Done (RetrievalPractice.org)](https://www.retrievalpractice.org/strategies/2018/successive-relearning)

### Interleaving y Spacing
33. [Interleaved Practice Enhances Memory (Nature)](https://www.nature.com/articles/s41539-021-00110-x)
34. [Interleaved Design for E-Learning (MIS Quarterly)](https://misq.umn.edu/misq/article/48/4/1363/2325/Interleaved-Design-for-E-Learning-Theory-Design)
35. [Spaced and Interleaved Practice (MIT)](https://openlearning.mit.edu/mit-faculty/research-based-learning-findings/spaced-and-interleaved-practice)
36. [Spaced Retrieval Practice in STEM (Springer)](https://link.springer.com/article/10.1186/s40594-024-00468-5)

### Assessment Progresivo
37. [Low and High-Stakes Assessments (UCSB)](https://otl.ucsb.edu/resources/assessing-learning/low-high-stakes-assessments)
38. [Frequent Low-Stakes Assignments (Carnegie Mellon)](https://www.cmu.edu/teaching/online/assessinglearning/remoteassessment/studentlearning/lowstakes.html)
39. [Scaffolding Questions for Higher-Order Thinking (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S1557308722001159)

### Formativo -> Sumativo
40. [Formative-Summative Correlation (ResearchGate)](https://www.researchgate.net/publication/378966739_Correlation_Between_Student_Performances_on_Case-Based_Constructed-Response_Formative_Assessment_and_Summative_Assessment)
41. [Evaluating Students' Learning (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11590208/)

### Coding y Comprension Conceptual
42. [Students' Learning of Programming (Taylor & Francis)](https://www.tandfonline.com/doi/full/10.1080/03043797.2018.1544609)
43. [Cognitive Benefits of Learning to Code (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8458729/)
44. [Faded Parsons Problems (ACE Lab Berkeley)](https://acelab.berkeley.edu/wp-content/papercite-data/pdf/parsons-chi2021.pdf)

### Feedback y Productive Failure
45. [Power of Feedback Revisited (Wisniewski et al., 2020)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/)
46. [Productive Failure Meta-Analysis (Sinha & Kapur, 2021)](https://journals.sagepub.com/doi/10.3102/00346543211019105)

### Scaffolding Adaptativo
47. [Adaptive Scaffolding in Game-Based Learning (Springer)](https://link.springer.com/article/10.1186/s12909-024-05698-3)
48. [Framework for Scaffolds (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3827669/)
49. [Greater Cognitive Effort for Better Learning (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5854224/)

### MC Design
50. [MC Testing Best Practices (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S2211368118301426)
51. [Optimizing MC Tests as Learning Tools (Bjork Lab)](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2017/01/LittleBjorkMC2014.pdf)
52. [MC Questions for Higher Order Thinking (U Saskatchewan)](https://teaching.usask.ca/articles/2025-02-28-multichoice-questions-higher-order-thinking.php)
