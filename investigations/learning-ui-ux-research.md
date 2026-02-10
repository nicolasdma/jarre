# Investigacion: UI/UX Optima para Aprendizaje Profundo

> Investigacion academica consolidada para el rediseno de la interfaz de Jarre.
> 7 dimensiones investigadas, 80+ papers citados, 13+ plataformas analizadas.
> Fecha: 2026-02-10

---

## Tabla de Contenidos

1. [Estado Actual de Jarre](#1-estado-actual-de-jarre)
2. [Tipografia para Aprendizaje](#2-tipografia-para-aprendizaje)
3. [Carga Cognitiva y Principios Multimedia](#3-carga-cognitiva-y-principios-multimedia)
4. [Layout y Organizacion de Contenido](#4-layout-y-organizacion-de-contenido)
5. [Integracion de Testing y Evaluaciones](#5-integracion-de-testing-y-evaluaciones)
6. [Psicologia del Color y Elementos Visuales](#6-psicologia-del-color-y-elementos-visuales)
7. [Analisis de Plataformas de Referencia](#7-analisis-de-plataformas-de-referencia)
8. [Sintesis: Principios de Diseno para Jarre](#8-sintesis-principios-de-diseno-para-jarre)
9. [Bibliografia Completa](#9-bibliografia-completa)

---

## 1. Estado Actual de Jarre

### Flujo de Aprendizaje: 5 Pasos

El proyecto implementa un flujo estructurado: **ACTIVATE → APPLY → LEARN → REVIEW → EVALUATE**

- **ACTIVATE**: Organizador avanzado especifico del recurso. Presenta conceptos previos.
- **APPLY**: Playground interactivo (latency-simulator, storage-engine) + preguntas guiadas.
- **LEARN**: Secciones con pre-question → contenido (markdown + figuras + inline quizzes) → post-test.
- **REVIEW**: Repaso de todas las preguntas del capitulo (inline quizzes + open-ended evaluadas por DeepSeek).
- **EVALUATE**: Enlace a evaluacion completa del recurso.

### Sistema Visual Actual

- **Fuentes**: Geist (sans-serif) body text 18px, Geist Mono para labels/botones
- **Paleta**: Verde oscuro `#4a5d4a` (primario), marron `#c4a07a` (secundario), fondo off-white `#faf9f6`
- **Layout**: Columna unica max-width 3xl (768px), padding 32px
- **Contenido**: Markdown renderizado con react-markdown, figuras inyectadas, quizzes MC/TF inline
- **67 figuras** extraidas de DDIA, **22 quizzes inline** (solo Ch5), **231 preguntas** en banco

### Problemas de UX Identificados

1. **Orden de pasos confuso**: APPLY antes de LEARN es contra-intuitivo
2. **Scroll profundo sin orientacion**: capitulos de 9-23K palabras sin resegmentar
3. **Sin indicador de progreso dentro de seccion**: el usuario se pierde en lecturas largas
4. **Pre-question sin feedback**: se registra pero no se evalua (sensacion de desperdicio)
5. **Inline quizzes pueden romper flujo de lectura**: sin opcion de "leer primero, responder despues"
6. **Colores muy sutiles para feedback**: verde `#4a5d4a` vs gris `#7d6b6b` dificil de distinguir
7. **No hay dark mode**
8. **Mobile no optimizado** para playgrounds

---

## 2. Tipografia para Aprendizaje

### 2.1 Serif vs Sans-Serif

**Conclusion: la diferencia es menor de lo que se cree.** Lo que importa mas son x-height, espaciado entre caracteres y grosor de trazo.

- Revision de **72 estudios** no encontro conclusion valida a favor de ninguna categoria (Arditi & Cho, 2005).
- Estudio con **eye-tracking** no encontro diferencias significativas (Beymer et al., 2008).
- **Calibri** (sans-serif) preferida sobre Times New Roman para lectura en pantalla (Cogent Education, 2021).

### 2.2 Tamano Optimo

Estudio con **eye-tracking en 104 participantes** (Rello, Pielot & Marcos, CHI 2016):
- La legibilidad **aumento significativamente** con el tamano de fuente.
- Comprension tuvo **mas respuestas correctas para tamanos 18 y 26**.
- **Recomendacion: sitios con mucho texto deben usar fuentes de 18px o mayor.**

### 2.3 Line-Height

- Extremos (0.8 y 1.8) **perjudican** legibilidad (Rello et al., 2016).
- WCAG recomienda **al menos 1.5em**.
- **Recomendacion: body text 1.6, headings 1.2-1.3.**

### 2.4 Line-Length (Caracteres por Linea)

- Rango ideal: **50-75 CPL**, optimo **66 CPL** (Visible Language, 2005).
- Descripciones > 80 CPL fueron **omitidas 41% mas** (Baymard Institute).
- **Recomendacion: max-width 680-720px (~65-70 CPL a 18px).**

### 2.5 Font Weight

- Pesos **light (300) rinden pobremente** en pantalla (ResearchGate, 2016).
- Fuentes con **mayor peso = velocidades de lectura mas rapidas**.
- **Recomendacion: body Regular (400), nunca Light (300), headings Bold (700).**

### 2.6 Disfluencia (Sans Forgetica): NO FUNCIONA

- Multiple estudios mostraron que Sans Forgetica **no mejora retencion** y puede perjudicarla (Wetzler et al., 2021; Taylor & Sanson, 2022).
- La disfluencia ralentiza el procesamiento local **pero dana el procesamiento relacional** entre palabras.
- **Conclusion: no usar fuentes disfluentes. Invertir en testing interpolado y spaced repetition.**

### 2.7 Tipografia Responsiva

| Propiedad | Mobile (<768px) | Tablet | Desktop (>1024px) |
|-----------|-----------------|--------|--------------------|
| Body | 16-17px | 18px | 18-20px |
| H1 | 28px | 32px | 36px |
| H2 | 22px | 24px | 28px |
| H3 | 18px | 20px | 22px |
| Line-height | 1.6 | 1.6 | 1.6 |
| Max-width | 100% - 32px | 680px | 720px |

### 2.8 Fuentes Recomendadas

| Fuente | Tipo | Nota |
|--------|------|------|
| **Literata** | Serif | Disenada por Google para lectura prolongada en pantalla |
| **Georgia** | Serif | X-height grande, serifas engrosadas para claridad en pantalla |
| **Inter** | Sans-serif | Disenada para pantallas, x-height alta, reduce fatiga ocular |
| **Source Sans Pro** | Sans-serif | Creada para legibilidad en UI |
| **Lato** | Sans-serif | Usada por Khan Academy, balance calidez/profesionalismo |

**Dato clave**: Wallace et al. (2022, ACM TOCHI) encontraron que la velocidad de lectura **aumento 35%** al comparar la fuente mas rapida vs la mas lenta para cada individuo. **No existe una fuente optima universal; la personalizacion importa.**

---

## 3. Carga Cognitiva y Principios Multimedia

### 3.1 Los Tres Tipos de Carga (Sweller, 1988)

| Tipo | Descripcion | Estrategia |
|------|-------------|-----------|
| **Intrinseca** | Complejidad del material | No se puede reducir (es el tema) |
| **Extrinseca** | Causada por mal diseno | **MINIMIZAR** (layout, nav, decoracion) |
| **Germane** | Esfuerzo de aprendizaje productivo | **MAXIMIZAR** (esquemas, conexiones) |

### 3.2 Los 15 Principios de Mayer (3ra Ed., 2022)

#### A. Reducir Procesamiento Extrinseco

| Principio | Descripcion | Tamano de efecto |
|-----------|-------------|-----------------|
| **Coherencia** | Eliminar material irrelevante | d = 0.86 |
| **Senalizacion** | Senales que destaquen organizacion | d = 0.38 |
| **Redundancia** | Eliminar texto cuando ya hay narr. + graficos | d = 0.87 |
| **Contiguidad Espacial** | Texto e imagenes juntos | **d = 1.10** |
| **Contiguidad Temporal** | Presentacion simultanea | **d = 1.31** |

#### B. Gestionar Procesamiento Esencial

| Principio | Descripcion |
|-----------|-------------|
| **Segmentacion** | Dividir en segmentos manejables |
| **Pre-training** | Ensenar conceptos clave ANTES de la leccion |
| **Modalidad** | Graficos + narracion > graficos + texto |
| **Multimedia** | Palabras + graficos > solo palabras |

#### C. Fomentar Procesamiento Generativo

| Principio | Descripcion |
|-----------|-------------|
| **Personalizacion** | Estilo conversacional > formal |
| **Actividad Generativa** | Resumir, mapear, explicar mejoran aprendizaje |

### 3.3 Segmentacion: Tamano Optimo de Chunks

- **Cowan (2001, 2010)**: el limite real del foco de atencion es **~4 chunks** (no 7 de Miller).
- **Cada segmento entre quizzes**: no exceder ~4-5 ideas principales o **800-1200 palabras**.
- Hassanabadi et al. (2023): la segmentacion alta **reduce significativamente la carga cognitiva**.

### 3.4 Senalizacion (Signaling)

- Meta-analisis (Schneider et al., 2018): efecto medio d = 0.38.
- Las senales textuales (bold, headings, listas) tienen efecto **mas robusto** que las visuales.
- **Un color de senalizacion > multiples** (Chen et al., 2024): demasiados colores aumenta carga.
- **Recomendacion: max 2 colores semanticos** (conceptos clave + advertencias).

### 3.5 Contiguidad Espacial

- Texto e imagenes correspondientes **deben estar cerca** (d = 1.10, Moreno & Mayer, 1999).
- Split-attention effect: cuando la info esta espacialmente distante, se genera carga extrinseca.
- **NUNCA poner figuras en modal o tab separada.**
- Considerar **sticky figures**: que se mantengan visibles mientras se lee la explicacion.

### 3.6 Redundancia: Cuando MENOS es Mas

- Si un diagrama se autoexplica, agregar texto redundante **dana el aprendizaje** (Liu & Gu, 2023).
- Regla: **si quitarlo no pierde informacion, quitarlo**.
- Aplicar a: tooltips que repiten texto, captions que repiten parrafo anterior, badges/iconos decorativos.

### 3.7 Progressive Disclosure y Expertise Reversal

- **Kalyuga et al. (2003, 2007)**: lo que ayuda a novatos puede **perjudicar a expertos**.
- La interfaz ideal **se adapta al nivel del usuario**.
- Mastery levels (0-4) como mecanismo de adaptive disclosure:
  - Nivel 0-1: pre-questions + lectura guiada + quizzes MC/TF faciles
  - Nivel 2-3: menos guia, preguntas mas abiertas (escenarios, trade-offs)
  - Nivel 4: evaluacion tipo "ensenanza" sin apoyo

### 3.8 Working Memory: Implicaciones para UI

- **Cowan (2010)**: ~4 chunks es el limite funcional.
- Dashboard: **max 4 acciones principales** visibles.
- Nav en recurso: no mas de **4-5 secciones** visibles en barra de progreso.
- MC con **4 opciones** es optimo (5+ aumenta carga sin mejorar discriminacion).
- Los 4 pasos del flujo (ACTIVATE, LEARN, APPLY, EVALUATE) se alinean con el limite.

---

## 4. Layout y Organizacion de Contenido

### 4.1 Scroll Vertical vs Paginacion

- **Scroll vertical segmentado** es preferido para contenido educativo largo.
- Scroll infinito causa fatiga y desensibilizacion (CHI 2025).
- Scroll depth del **75%** se considera ideal; mas alla la atencion decae.
- **Recomendacion: scroll vertical con anclas visibles + barra de progreso horizontal superior.**

### 4.2 Columna Unica vs Multi-Columna

- **Columna unica es superior** para contenido educativo en pantalla.
- Eye-tracking (HCI International 2024): columna unica **optimiza comprension y reduce fatiga visual**.
- Texto de ancho medio se lee mejor que muy ancho o muy estrecho (Dyson & Kipping, 1997).
- **Recomendacion: columna unica con max-width ~680px.**

### 4.3 Sidebar con Table of Contents

- TOC fija mejora **findability** y orientacion en documentos largos.
- Debe resaltar la seccion actual via Intersection Observer.
- En mobile: drawer accesible desde boton flotante.
- Incluir indicadores de completitud (checkmarks por seccion).

### 4.4 Patrones de Lectura (Eye-Tracking)

| Patron | Cuando Ocurre | Implicacion |
|--------|---------------|-------------|
| **F-Pattern** | Busqueda de info especifica | Info clave en primeras lineas |
| **Layer-Cake** | Contenido denso con buenos titulos | Invertir en headings descriptivos |
| **Commitment** | Contenido que engancha | **Objetivo ideal para aprendizaje** |
| **Spotted** | Revision o busqueda | Negritas para terminos clave |

**Disenar para fomentar commitment pattern**: parrafos cortos (3-4 lineas), headings cada 200-300 palabras, negritas en terminos clave, figuras intercaladas.

### 4.5 Visualizacion de Progreso: 3 Efectos Psicologicos

1. **Efecto Zeigarnik**: Tareas incompletas permanecen en la mente. Barras de progreso explotan este efecto.
2. **Efecto Endowed Progress** (Nunes & Dreze, 2006): Progreso inicial artificial **aumenta motivacion** para completar.
3. **Efecto Goal Gradient**: Usuarios **aceleran esfuerzo** al acercarse a la meta.

**Implementar 3 niveles de progreso**:
- **Micro**: Barra horizontal superior (3px) mostrando scroll en seccion actual.
- **Meso**: Checkmarks en TOC lateral por seccion completada.
- **Macro**: Dashboard con porcentaje por recurso y concepto.

### 4.6 Densidad de Contenido Optima

- Max **3-4 conceptos clave** por pantalla visible (sin scroll).
- Parrafos de **3-5 lineas** maximo.
- Un heading cada **200-300 palabras**.
- Una figura o quiz cada **400-600 palabras**.
- Columbia Business School: despues de 3-4 beneficios clave, info adicional **reduce** efectividad.

### 4.7 Whitespace

- Aumentar whitespace **mejora comprension** ~20% (Wichita State University).
- **80% de lectores** prefieren mas whitespace.
- Double spacing > single spacing para comprension (ERIC).

### 4.8 Elementos Sticky

| Elemento | Sticky? | Justificacion |
|----------|---------|---------------|
| Header (comprimido, 48px) | Si | Acceso rapido, se oculta en scroll-down |
| Barra de progreso (3px) | Si | Orientacion constante, top absoluto |
| TOC sidebar | Si | Scroll independiente, top: 60px |
| Boton de herramientas | Si | FAB para notas, glosario |
| Quiz actual | No | Debe ser inline |
| Footer | No | No agrega valor durante lectura |

### 4.9 Layout Global Propuesto

```
+------------------------------------------------------------------+
| [Logo] Jarre     [Progreso: ====>       60%]      [Dashboard]    | <- 48px sticky
+------------------------------------------------------------------+
|            |                                      |               |
|  SIDEBAR   |      CONTENIDO PRINCIPAL             |   MARGEN      |
|  (TOC)     |                                      |   (notas)     |
|            |  max-width: 680px                    |               |
|  - Intro   |  font-size: 18px                     |               |
|  > Sec 1 * |  line-height: 1.7                    |               |
|  - Sec 2   |                                      |               |
|  - Sec 3   |  [Figuras intercaladas]              |               |
|  - Quiz    |  [Quiz inline cada 400-600 palabras] |               |
|            |                                      |               |
| sticky     |  [Scroll vertical segmentado]        |  >1200px only |
+------------------------------------------------------------------+
```

### 4.10 Breakpoints

| Breakpoint | Sidebar | Contenido | Margen Notas |
|-----------|---------|-----------|-------------|
| >1200px | Visible, sticky | 680px centrado | Visible |
| 768-1200px | Collapsible (toggle) | 680px centrado | Oculto |
| <768px | Drawer (boton flotante) | Full-width, padding 16px | Oculto |

---

## 5. Integracion de Testing y Evaluaciones

### 5.1 Interpolated Testing (Preguntas Embebidas)

**Szpunar, Khan & Schacter (2013, PNAS)**: Interpolar tests de memoria en lecturas online:
- **Reduce mind-wandering a la mitad**
- **Triplica la toma de notas**
- Mejora significativamente la retencion

**Jing, Szpunar & Schacter (2016)**: El testing interpolado mejora la **integracion de informacion** entre segmentos. Los estudiantes conectan mejor conceptos de diferentes partes.

**Pastotter & Bauml (2014)**: **Forward testing effect**: tests sobre material previo **facilitan el aprendizaje de material nuevo** posterior (reset del encoding).

**Richland, Kornell & Kao (2009)**: **Pretesting effect**: incluso cuando los estudiantes **fallan**, el mero intento de recuperacion **mejora el aprendizaje posterior**. Valida pre-preguntas antes de cada seccion.

**Frecuencia optima**: cada 5-7 min de lectura (~800-1200 palabras), insertar 2-3 preguntas breves.

### 5.2 Testing Effect: 10 Beneficios (Roediger et al., 2011)

1. Recuperacion que ayuda a retencion posterior
2. Identificacion de lagunas de conocimiento
3. Mayor transferencia a nuevos contextos
4. Mejor organizacion del conocimiento
5. Mejora de la recuperacion de material relacionado no testeado
6. Prevencion de interferencia (forward testing effect)
7. Mejora metacognitiva (mejor calibracion)
8. Prevencion del "sobrestudio" innecesario
9. Potenciacion del estudio posterior
10. Mejora de la aplicacion del conocimiento

**Dunlosky et al. (2013)**: Practice testing y distributed practice son las **dos estrategias mas efectivas** (utilidad alta). Subrayar y releer son baja utilidad.

### 5.3 Feedback Design

**Shute (2008)**: Tipos de feedback en orden de efectividad creciente:

| Tipo | Ejemplo UI |
|------|------------|
| Knowledge of Results (KR) | Checkmark verde / X roja |
| Knowledge of Correct Response (KCR) | "La respuesta correcta es B" |
| Elaborated - Topic | Parrafo explicando el concepto |
| Elaborated - Response | "Tu respuesta es incorrecta porque..." |
| Elaborated - Error | "El error es confundir X con Y" |
| Elaborated - Hints | "Piensa en la relacion entre A y B" |

**La calidad del feedback importa mas que su timing.**

**Hattie & Timperley (2007)**: 4 niveles de feedback:
1. Task level (correcto/incorrecto)
2. **Process level** (estrategias usadas) -- MAS PODEROSO
3. **Self-regulation level** (metacognicion) -- MAS PODEROSO
4. Self level (sobre la persona) -- EVITAR

### 5.4 Confidence-Based Assessment

**Gardner-Medwin (2006)**: Certainty-Based Marking con 3 niveles:

| Certeza | Si correcto | Si incorrecto |
|---------|-------------|---------------|
| Baja | +1 | 0 |
| Media | +2 | -2 |
| Alta | +3 | -6 |

**Matriz de deteccion de conocimiento**:

| | Correcta | Incorrecta |
|---|---|---|
| **Alta Confianza** | Conocimiento solido | **MISCONCEPTION (mas valiosa)** |
| **Baja Confianza** | Intuicion (reforzar) | Laguna normal |

**Pedir confianza DESPUES de responder** (no antes, contamina la respuesta).

### 5.5 Spaced Repetition UI

**Rawson & Dunlosky (2022)**: Successive relearning = retrieval + spacing. 83% retencion a 30 dias con 5 sesiones.

**Botones de dificultad optimos: 3** (no 4 como Anki):
- "No lo se" (reset)
- "Lo recuerdo con esfuerzo" (intervalo corto)
- "Lo se bien" (intervalo largo)

**Mostrar el intervalo resultante**: "Proximo repaso: en 3 dias" da control.

### 5.6 Self-Explanation Prompts

**Chi & Wylie (2014)** -- Framework ICAP:
```
Interactive > Constructive > Active > Passive
(dialogar)    (explicar)    (anotar)   (leer)
```

**Prompts focalizados > open-ended**:
- "Explica por que la replicacion sincrona sacrifica disponibilidad" (BUENO)
- "Explica este concepto" (MALO, demasiado vago)

### 5.7 Metacognitive Scaffolding

**Bjork, Dunlosky & Kornell (2013)**: Los estudiantes tienen "ilusiones de competencia" -- creen que saben mas de lo que saben (especialmente despues de releer). El testing rompe esta ilusion.

**Hattie & Timperley (2007)**: 3 preguntas metacognitivas:
1. Hacia donde voy? (meta)
2. Como voy? (progreso)
3. Que sigue? (acciones)

**Implementar**: Dashboard de calibracion (confianza vs precision), prediccion pre-sesion.

### 5.8 Reduccion de Ansiedad (Low-Stakes Design)

**Deci & Ryan (2000)**: 3 necesidades psicologicas basicas: autonomia, competencia, relacion.

**Putwain (2008)**: La ansiedad puede ser **mayor** en low-stakes que en high-stakes. La sensacion de control importa mas que las consecuencias reales.

#### Vocabulario

| EVITAR | USAR |
|--------|------|
| Examen | Practica |
| Test | Repaso |
| Calificacion | Progreso |
| Incorrecto | Aun no |
| Fallaste | Oportunidad de aprender |
| Has acertado 3 de 10 | Has avanzado en 3 conceptos |

#### Diseno anti-ansiedad

- **NUNCA rojo para errores** -- usar gris oscuro o ambar suave
- Sin temporizadores visibles
- Sin puntuacion prominente durante sesion
- Permitir re-intentos
- Feedback como conversacion: "Hmm, no exactamente. Piensa en..."
- Opcion de "no se" como respuesta valida

### 5.9 Gamification: Que Funciona y Que No

**Sailer & Homner (2020)**: Meta-analisis riguroso:

| Outcome | Effect Size | Estabilidad |
|---------|------------|-------------|
| Cognitivo | g = 0.49 | **Estable** con rigor |
| Motivacional | g = 0.36 | Inestable |
| Conductual | g = 0.25 | Inestable |

**SI implementar**: Barras de progreso, badges de maestria, visualizacion de avance.
**NO implementar**: Leaderboards, points acumulativos, streaks (erosionan motivacion intrinseca -- Deci & Ryan, 2000).

### 5.10 Mapa del Flujo Optimo

```
LECTURA DE SECCION
|
|-- Pre-pregunta (pretesting effect, Richland 2009)
|
|-- Contenido (~500-800 palabras)
|
|-- Quiz inline MC/TF (interpolated testing, Szpunar 2013)
|
|-- Contenido (~500-800 palabras)
|
|-- Quiz inline MC/TF + Confianza (CBM, Gardner-Medwin 2006)
|
|-- Contenido final (~500-800 palabras)
|
|-- Self-explanation prompt (ICAP, Chi & Wylie 2014)
|
|-- Resumen de seccion con feedback elaborativo (Shute 2008)
|
SESION DE REPASO (dias despues)
|
|-- Prediccion pre-sesion (metacognicion, Bjork 2013)
|
|-- Tarjetas con 3 botones de dificultad (Rawson & Dunlosky 2022)
|
|-- Feedback elaborativo por tarjeta (Hattie & Timperley 2007)
|
|-- Resumen post-sesion + calibracion (Kornell & Bjork 2007)
```

---

## 6. Psicologia del Color y Elementos Visuales

### 6.1 Rojo vs Azul (Mehta & Zhu, 2009, Science)

Con 600+ participantes en 6 estudios:
- **Rojo**: mejora detalle (memoria, revision) hasta **31% mas** que azul.
- **Azul**: mejora creatividad, **doble** de outputs creativos.
- Mecanismo: rojo = evitacion (atencion al detalle); azul = aproximacion (exploracion).

**Excepcion** (Xia et al., 2016): en tareas **dificiles**, azul > rojo (colores calidos distraen en alta carga cognitiva).

### 6.2 Color y Memoria

Dzulkifli & Mustafar (2013): Fondos de color mejoran reconocimiento vs monocromaticos. Colores calidos producen mayor efecto en memoria a traves de activacion emocional.

### 6.3 Color Coding para Categorias

**Max 5-7 colores semanticos** (limite de Miller). Nunca solo color (accesibilidad -- WCAG 1.4.1).

```
Teoria/Concepto     -> Azul (confianza, profundidad)
Ejemplo Practico    -> Verde (aplicacion, crecimiento)
Ejercicio/Quiz      -> Naranja/Ambar (atencion activa)
Advertencia/Trampa  -> Rojo (peligro, solo alertas)
Definicion/Glosario -> Violeta (referencia, terminologia)
```

### 6.4 Dark Mode vs Light Mode

| Aspecto | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Comprension lectora | **Mejor** | Peor |
| Correccion de textos | **Mejor** | Peor |
| Fatiga visual (baja luz) | Peor | **Mejor** |
| Tareas complejas (precision) | Peor | **Mejor** |

**Mecanismo**: Light mode -> pupila se contrae -> mayor profundidad de campo -> mejor enfoque.

**Recomendacion: Light mode por defecto para estudio, dark mode como opcion.**

### 6.5 Highlighting (Instructor-Provided vs Learner-Generated)

**Dunlosky et al. (2013)**: Highlighting por el estudiante = **baja utilidad**.
**Ponce, Mayer & Mendez (2022)**: Meta-analisis con 36 articulos:

| Tipo | Memoria | Comprension |
|------|---------|-------------|
| Generado por estudiante | d = 0.36 | No significativo |
| **Proporcionado por instructor** | **d = 0.44** | **d = 0.44** |

**Conclusion: usar emphasis controlado por el sistema** (bold, color) como "instructor-provided highlighting". Max 2-3 frases resaltadas por seccion.

### 6.6 Jerarquia Visual con Color

- Un solo color de senalizacion > multiples colores (Chen et al., 2024, Behavioral Sciences).
- **3 niveles max de enfasis visual** (primario, secundario, terciario).
- Regla 60-70% dominante + 10-20% acento + neutros el resto.

### 6.7 Iconografia

- Iconos **reducen tiempo de escaneo** y mejoran recall (Google Research).
- Deben ser: reductivos (1 idea), consistentes (mismo estilo), reconocibles (sin pensar), complementarios (con texto).
- **Cuando NO usar**: conceptos abstractos complejos, cuando texto es suficiente, decoracion.

### 6.8 Ilustraciones y Diagramas

**Guo et al. (2020, AERA Open)**: Meta-analisis:
- Graficos **relevantes** mejoran aprendizaje.
- Graficos **decorativos** (interesantes pero irrelevantes) **perjudican** aprendizaje.
- **Las 67 figuras de DDIA son diagramas conceptuales simplificados = tipo mas efectivo.**

### 6.9 Diseno Emocional

**Um, Plass, Hayward & Homer (2012, J. Educational Psychology)**: Con 118 participantes:
- Colores calidos + formas redondeadas + rostros antropomorficos **indujeron emociones positivas**.
- Estudiantes con diseno emocional: material percibido como **menos dificil**, invirtieron **mas esfuerzo**, mayor **motivacion y satisfaccion**.
- **Justifica invertir en micro-animaciones, paleta calida, formas redondeadas.**

### 6.10 Accesibilidad

- **1 de cada 12 hombres** tiene daltonismo (8%).
- WCAG: contraste minimo **4.5:1** texto normal, **3:1** texto grande.
- **Nunca solo color**: siempre acompanar con texto, iconos o formas.
- Combinaciones seguras para daltonismo: **Azul + Naranja**, **Azul + Amarillo**, **Negro + Blanco**.
- Problematicas: Rojo + Verde (clasico error).

### 6.11 Paleta Propuesta para Jarre

```
Contexto: plataforma de aprendizaje tecnico profundo para adultos.
Tono: serio pero motivante, tecnico pero acogedor.

Base (Light):
  background:      #FFFFFF
  text-primary:    #1E293B (ratio ~14:1)
  text-secondary:  #64748B (ratio ~5:1)

Base (Dark):
  background:      #0F172A
  text-primary:    #E2E8F0 (ratio ~12:1)
  text-secondary:  #94A3B8 (ratio ~7:1)

Semantico - Contenido:
  teoria/concepto:  #2563EB (blue-600)
  ejemplo:          #059669 (emerald-600)
  ejercicio/quiz:   #D97706 (amber-600)
  advertencia:      #DC2626 (red-600, solo alertas)
  definicion:       #7C3AED (violet-600)

Semantico - Estado:
  exito/correcto:   #16A34A (green-600)
  error/incorrecto: #DC2626 (red-600)
  progreso:         #2563EB (blue-600)
  pendiente:        #9CA3AF (gray-400)

Todos pasan WCAG AA sobre fondo blanco.
Para dark mode: usar variantes -400.
```

---

## 7. Analisis de Plataformas de Referencia

### 7.1 Brilliant.org

- **Problem-first pedagogy**: pre-test antes de ensenar.
- Un concepto = una pantalla completa (no scroll largo).
- Widgets interactivos manipulables (no solo texto).
- **Adoptar**: pre-tests interactivos, simulaciones para sistemas distribuidos.

### 7.2 Khan Academy

- Mastery system: Familiar -> Proficient -> Mastered (sesiones separadas).
- Progreso visual por habilidad con colores progresivos.
- Dashboard de debilidades ("estos conceptos necesitan refuerzo").
- **Adoptar**: visualizacion de mastery por concepto, dashboard de debilidades.

### 7.3 Duolingo

- Streaks diarios (mecanica mas adictiva).
- Lecciones de 3-5 min (micro-learning puro).
- **Degradacion visual de mastery**: lecciones "se apagan" con el tiempo.
- **Adoptar**: degradacion visual (conceptos sin review reciente se apagan), micro-sesiones de 5 min para review.

### 7.4 Andy Matuschak / Orbit (Mnemonic Medium)

**El referente mas relevante para Jarre.**

- Spaced repetition embebido directamente en ensayos narrativos.
- Las cards las escribe el **autor-experto** (no el estudiante).
- "Conceptual mastery is actually enabled by a mastery of details."
- Resultados: 30 min practica -> casi todo recordado a 2 semanas. 1.5 horas -> 9+ semanas.
- **Adoptar**: review prompts embebidos en lectura, mostrar al usuario donde esta absorbiendo y donde no.

### 7.5 Execute Program

- Lecciones intercalan prosa con codigo interactivo ejecutable.
- **Limite diario**: no puedes avanzar mas de X lecciones/dia (previene cramming).
- Revision = hacer, no recordar ("usa Array.map" en vez de "que hace Array.map?").
- **Adoptar**: limite diario de secciones nuevas, evaluaciones basadas en hacer.

### 7.6 Readwise Reader

- **Doble barra de progreso** (horizontal global + vertical parrafo actual) -- la mejor implementacion.
- Ancho de linea ajustable (narrow/medium/wide).
- Keyboard-first (leer, navegar, resaltar sin mouse).
- Notas en margen derecho sin salir del flujo.
- **Adoptar**: doble barra de progreso, keyboard shortcuts (j/k scroll, q quiz, t TOC).

### 7.7 Nicky Case (Explorable Explanations)

- **Play-then-explain**: explorar antes de formalizar.
- Simulations > static images.
- **Adoptar**: simulaciones interactivas para Raft consensus, replicacion, particionamiento.

### 7.8 Modelo Ideal para Jarre

La combinacion de:
1. **Estructura de Brilliant**: un concepto por pantalla, problem-first.
2. **Mnemonic medium de Orbit**: review prompts embebidos, escritos por experto.
3. **Habit formation de Duolingo**: degradacion visual, micro-sesiones de 5 min.
4. **Daily mix de Execute Program**: reviews + nueva leccion cada dia.
5. **Evaluacion profunda de Jarre**: trade-offs, escenarios, error detection evaluados por LLM.
6. **Visual graph de Obsidian**: mapa de conocimiento creciendo.

**Diferenciador de Jarre**: ninguna plataforma combina lectura profunda + evaluacion LLM + spaced repetition, todo integrado.

---

## 8. Sintesis: Principios de Diseno para Jarre

### 8.1 Los 10 Mandamientos del UI de Jarre

1. **Columna unica 680px, fuente 18px, line-height 1.7** -- tipografia optimizada para lectura prolongada
2. **Segmentos de 800-1200 palabras** con quiz intercalado -- gestionar carga cognitiva
3. **Contiguidad espacial estricta** -- figuras junto al texto que las referencia, nunca en modal
4. **Max 2 colores semanticos** para senalizacion -- un color para conceptos, otro para advertencias
5. **Feedback elaborativo siempre** -- el "por que" es mas importante que el "que"
6. **Lenguaje de crecimiento** -- "practica" no "examen", "aun no" no "incorrecto"
7. **3 niveles de progreso** -- micro (scroll), meso (TOC checkmarks), macro (dashboard)
8. **Confianza como dato** -- pedir despues de responder para detectar misconceptions
9. **Progressive disclosure adaptativo** -- mas scaffolding para novatos, menos para expertos
10. **Light mode default** -- dark mode como opcion, nunca rojo para errores

### 8.2 Prioridades de Implementacion

#### Alta Prioridad (impacto directo)

| Cambio | Fundamento |
|--------|-----------|
| Reordenar a ACTIVATE → LEARN → APPLY → REVIEW → EVALUATE | Sentido comun + progressive disclosure |
| Resegmentar capitulos largos (800-1200 palabras) | Segmenting Principle (Mayer) + Cowan (4 chunks) |
| TOC sidebar sticky con progreso | Zeigarnik Effect + NNGroup best practices |
| Barra de progreso 3px top | Endowed Progress + Goal Gradient |
| Feedback elaborativo en quizzes | Shute (2008) + Hattie & Timperley (2007) |
| Confianza post-respuesta (3 niveles) | Gardner-Medwin (2006) CBM |
| Vocabulary: "Practica" no "Examen" | Deci & Ryan (2000) SDT |

#### Media Prioridad (mejoras de UX)

| Cambio | Fundamento |
|--------|-----------|
| Degradacion visual de mastery | Duolingo + spaced repetition visibility |
| Focus mode en lectura (ocultar nav) | Coherence Principle + atencion |
| Sticky figures durante lectura | Spatial Contiguity (d = 1.10) |
| Keyboard shortcuts (j/k, q, t) | Readwise Reader + power users |
| Dashboard de calibracion confianza-precision | Bjork et al. (2013) metacognicion |
| Self-explanation prompts focalizados | Chi & Wylie (2014) ICAP framework |

#### Exploratorio (requiere R&D)

| Cambio | Fundamento |
|--------|-----------|
| Simulaciones interactivas (Raft, replicacion) | Nicky Case + Brilliant |
| FSRS en lugar de SM-2 | Algoritmo moderno adaptativo |
| Daily mix (reviews + nueva leccion) | Execute Program |
| Concept graph visual | Obsidian + prerequisite system |

### 8.3 CSS Variables Sugeridas

```css
:root {
  /* Font families */
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;

  /* Font sizes (fluid) */
  --text-sm: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 1.75rem);
  --text-3xl: clamp(1.75rem, 1.5rem + 1.25vw, 2.25rem);

  /* Line heights */
  --leading-tight: 1.2;
  --leading-snug: 1.3;
  --leading-normal: 1.6;
  --leading-relaxed: 1.7;

  /* Content width */
  --content-width: min(680px, 100% - 2rem);

  /* Spacing */
  --space-paragraph: 1.5em;
  --space-section: 3em;
}
```

---

## 9. Bibliografia Completa

### Carga Cognitiva y Multimedia Learning
1. Sweller, J. (1988). Cognitive Load During Problem Solving. *Cognitive Science*, 12(2), 257-285.
2. Sweller, J., van Merrienboer, J.J.G., & Paas, F. (1998). Cognitive Architecture and Instructional Design. *Educational Psychology Review*, 10(3), 251-296.
3. Sweller, J., van Merrienboer, J.J.G., & Paas, F. (2019). Cognitive Architecture and Instructional Design: 20 Years Later. *Educational Psychology Review*, 31, 261-292.
4. Mayer, R.E. (2001/2009/2021). *Multimedia Learning*. Cambridge University Press.
5. Mayer, R.E., & Fiorella, L. (Eds.) (2022). *The Cambridge Handbook of Multimedia Learning* (3rd ed.). Cambridge University Press.
6. Mayer, R.E., & Moreno, R. (2003). Nine Ways to Reduce Cognitive Load. *Educational Psychologist*, 38(1), 43-52.
7. Mayer, R.E. (2023). Past, Present, and Future of Multimedia Learning. *Educational Psychology Review*, 35, art. 72.
8. Miller, G.A. (1956). The Magical Number Seven. *Psychological Review*, 63(2), 81-97.
9. Cowan, N. (2001). The magical number 4. *Behavioral and Brain Sciences*, 24(1), 87-114.
10. Cowan, N. (2010). The Magical Mystery Four. *Current Directions in Psychological Science*, 19(1), 51-57.
11. Moreno, R., & Mayer, R.E. (1999). Modality and Contiguity. *J. Educational Psychology*, 91(2), 358-368.
12. Chandler, P., & Sweller, J. (1991). Cognitive load theory and format of instruction. *Cognition and Instruction*, 8(4), 293-332.
13. Kalyuga, S. et al. (2003). The Expertise Reversal Effect. *Educational Psychologist*, 38(1), 23-31.
14. Kalyuga, S. (2007). Expertise Reversal: Implications. *Educational Psychology Review*, 19, 509-539.
15. Schneider, S. et al. (2018). Meta-analysis of signaling. *Educational Research Review*, 23, 1-24.
16. Hassanabadi, H. et al. (2023). Segmentation on cognitive load. *BMC Psychology*, 11, 431.
17. Liu, Y., & Gu, X. (2023). Two types of redundancy. *Frontiers in Psychology*, 14, 1148035.
18. Chen, Y. et al. (2024). Color Cues on Learning. *Behavioral Sciences*, 14(7), 560.
19. Baddeley, A. (1992). Working Memory. *Science*, 255(5044), 556-559.

### Testing y Evaluacion
20. Szpunar, K.K. et al. (2013). Interpolated memory tests. *PNAS*, 110(16), 6313-6317.
21. Jing, H.G. et al. (2016). Interpolated testing and integration. *J. Exp. Psychology: Applied*, 22(3), 305-318.
22. Pastotter, B. & Bauml, K.-H.T. (2014). The forward effect of testing. *Frontiers in Psychology*, 5, 286.
23. Richland, L.E. et al. (2009). The pretesting effect. *J. Exp. Psychology: Applied*, 15(3), 243-257.
24. Roediger, H.L. & Karpicke, J.D. (2006). Power of testing memory. *Perspectives on Psychological Science*, 1(3), 181-210.
25. Roediger, H.L. et al. (2011). Ten benefits of testing. *Psychology of Learning and Motivation*, 55, 1-36.
26. Dunlosky, J. et al. (2013). Effective learning techniques. *Psychological Science in the Public Interest*, 14(1), 4-58.

### Feedback y Metacognicion
27. Shute, V.J. (2008). Formative feedback. *Review of Educational Research*, 78(1), 153-189.
28. Hattie, J. & Timperley, H. (2007). The power of feedback. *Review of Educational Research*, 77(1), 81-112.
29. Butler, A.C. & Roediger, H.L. (2008). Feedback and MC testing. *Memory & Cognition*, 36(3), 604-616.
30. Gardner-Medwin, A.R. (2006). Confidence-based marking. *Innovative Assessment in Higher Education*. Routledge.
31. Sparck, E.M. et al. (2016). Confidence-weighted testing. *Cognitive Research*, 1(1), 3.
32. Fleming, S.M. (2024). Metacognition and confidence. *Annual Review of Psychology*, 75, 241-268.
33. Kornell, N. & Bjork, R.A. (2007). Promise and perils of self-regulated study. *Psychonomic Bulletin & Review*, 14(2), 219-224.
34. Bjork, R.A. et al. (2013). Self-regulated learning. *Annual Review of Psychology*, 64, 417-444.

### Spaced Repetition y Desirable Difficulties
35. Rawson, K.A. & Dunlosky, J. (2022). Successive relearning. *Current Directions in Psychological Science*, 31(4), 362-368.
36. Bjork, R.A. (1994). Memory and metamemory. *Metacognition: Knowing about knowing*. MIT Press.

### Self-Explanation y Engagement
37. Chi, M.T.H. & Wylie, R. (2014). The ICAP framework. *Educational Psychologist*, 49(4), 219-243.
38. Wylie, R. & Chi, M.T.H. (2014). Self-explanation in multimedia learning. *Cambridge Handbook of Multimedia Learning*.

### Gamification
39. Sailer, M. & Homner, L. (2020). Gamification of learning: meta-analysis. *Educational Psychology Review*, 32, 77-112.
40. Zeng, J. et al. (2024). Gamification on academic performance. *British Journal of Educational Technology*, 55(5), 1746-1773.
41. Deci, E.L. & Ryan, R.M. (2000). Goal pursuits. *Psychological Inquiry*, 11(4), 227-268.

### Ansiedad y Motivacion
42. Putwain, D.W. (2008). Deconstructing test anxiety. *Emotional and Behavioural Difficulties*, 13(2), 141-155.
43. Van Boekel, M. et al. (2024). Test anxiety in low-stakes assessments. *Contemporary Educational Psychology*, 76, 102251.

### Tipografia
44. Rello, L. et al. (2016). Font Size and Line Spacing on Readability. *CHI 2016*. ACM.
45. Wallace, S. et al. (2022). Individuated Reading Experiences. *ACM TOCHI*.
46. Wetzler, E.L. et al. (2021). Sans Forgetica is Not the Font of Knowledge. *SAGE Open*.
47. Brown, N. (2024). The Cognitive Type Project. *arXiv:2403.04087*.
48. Arditi, A. & Cho, J. (2005). Serifs and font legibility. *Vision Research*.

### Color y Diseno Visual
49. Mehta, R. & Zhu, R.J. (2009). Blue or Red? *Science*, 323, 1226-1229.
50. Xia, T. et al. (2016). Red and Blue on Cognitive Tasks. *Frontiers in Psychology*, 7, 784.
51. Dzulkifli, M.A. & Mustafar, M.F. (2013). Colour on Memory Performance. *Malaysian J. Medical Sciences*, 20(2), 3-9.
52. Ponce, H.R. et al. (2022). Highlighting meta-analysis. *Educational Psychology Review*, 34, 989-1024.
53. Richardson, R.T. et al. (2014). Color and Contrast in E-Learning. *JOLT (MERLOT)*, 10(4).
54. Um, E. et al. (2012). Emotional Design in Multimedia Learning. *J. Educational Psychology*, 104(2), 485-498.
55. Norman, D.A. (2004). *Emotional Design*. Basic Books.
56. Guo, D. et al. (2020). Graphics and Reading Comprehension. *AERA Open*, 6(1).
57. Davenport, J. (2008). When Do Diagrams Enhance Learning? *OLI, Carnegie Mellon*.
58. Elliot, A.J. & Maier, M.A. (2014). Color Psychology. *Annual Review of Psychology*, 65, 95-120.

### Layout y Eye-Tracking
59. CHI 2025. Scrolling in the Deep. ACM.
60. HCI International 2024. Eye Tracking Column Formats. ACM.
61. Dyson, M.C. & Kipping, G.J. (1997/2005). Optimal Line Length. *Visible Language*.
62. Nunes, J.C. & Dreze, X. (2006). Endowed Progress Effect. *J. Consumer Research*.
63. NNGroup (2006/2017). F-Shaped Pattern.
64. NNGroup. Sticky Headers, Progressive Disclosure, Text Scanning Patterns.
65. Baymard Institute. Line Length Readability.

### Microlearning
66. Leong, K. et al. (2024). Microlearning framework. *Heliyon*, 10(23), e41444.

### Mnemonic Medium
67. Matuschak, A. & Nielsen, M. (2019). How can we develop transformative tools for thought?
68. Matuschak, A. How to write good prompts.

### Libros
69. Clark, R.C. & Mayer, R.E. (2011). *E-Learning and the Science of Instruction*. Wiley.
70. Carroll, J.M. & Rosson, M.B. (1987). Paradox of the active user. MIT Press.

---

> Documento generado el 2026-02-10 para el proyecto Jarre.
> Proximo paso: usar esta investigacion para disenar un plan de rediseno UI/UX concreto.
