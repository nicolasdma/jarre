# Prompt para próxima sesión: Investigación de producto standalone

## Contexto

Jarre ya tiene un pipeline funcional que toma un PDF (DDIA) y genera una experiencia de aprendizaje optimizada: extracción de texto/figuras, segmentación por conceptos, traducción fiel, micro-quizzes interpolados (MC/TF), evaluación con LLM, y spaced repetition SM-2.

La hipótesis es que esto puede ser un **producto standalone**: un servicio donde subes un PDF (textbook, paper, manual técnico) y te devuelve una experiencia de lectura aumentada optimizada para máximo aprendizaje.

## Tarea

Investigar en profundidad — en español — los siguientes ejes. Usar fuentes académicas (papers, meta-análisis), datos de mercado, y análisis competitivo real. Documentar todo en `investigations/pdf-transpiler-product-research.md`.

### 1. Fundamento académico — ¿Por qué funciona?

Investigar los papers y meta-análisis que respaldan cada componente del pipeline:

- **Interpolated testing / retrieval practice**: Szpunar, Khan & Schacter (2013) PNAS, Adesope et al. (2017) meta-analysis, Rowland (2014) meta, Yang et al. (2021) meta — ¿cuáles son los effect sizes reales para quizzes intercalados durante la lectura vs. lectura pasiva?
- **Forward testing effect**: Pastötter & Bäuml (2014) — ¿los quizzes intermedios mejoran la retención del material POSTERIOR (no solo el testeado)?
- **Pretesting effect**: Richland, Kornell & Kao (2009) — ¿intentar responder ANTES de leer mejora la comprensión?
- **Desirable difficulties**: Bjork & Bjork (2011) — ¿la dificultad óptima durante el aprendizaje mejora la retención a largo plazo?
- **Successive relearning**: Rawson & Dunlosky (2022) CDPS — ¿la combinación de retrieval practice + spaced repetition es superior a cualquiera por separado?
- **Multimedia learning**: Mayer (2009) — ¿las figuras integradas con texto mejoran vs. texto solo?
- **Segmentation principle**: Mayer & Chandler (2001) — ¿dividir contenido en segmentos manejables mejora la comprensión?
- **Translation/L2 processing**: ¿Hay evidencia de que leer en L1 (idioma nativo) vs. L2 mejora la retención conceptual para material técnico?
- **AI tutoring**: ¿Qué dice la evidencia sobre tutores IA vs. sin tutor? Buscar meta-análisis recientes (2023-2026).

Para cada uno: citar el paper, el effect size (Cohen's d, Hedges' g), el N, y la conclusión principal.

### 2. Landscape competitivo — ¿Quién existe?

Investigar productos existentes que hagan algo similar:

- **Readwise Reader** — ¿qué hace exactamente? ¿tiene quizzes? ¿traduce?
- **Scholarcy** — resúmenes de papers automáticos
- **Explainpaper** — explicaciones de papers con IA
- **Elicit** — búsqueda semántica de papers
- **Consensus** — IA para papers académicos
- **NotebookLM (Google)** — ¿qué hace con PDFs?
- **Shiken** — quizzes generados de PDFs
- **Quizlet** / **Anki** — flashcards, pero sin el pipeline completo
- **Coursera / edX** — cursos estructurados, pero no transpilan TU contenido
- **Speechify** — audio de PDFs
- **Notion AI** / **Obsidian** — notas + IA, pero sin pipeline de aprendizaje
- **Any PDF-to-learning tools** que hayan surgido en 2025-2026

Para cada uno: ¿qué hace? ¿qué NO hace que Jarre sí? ¿Pricing? ¿Users estimados?

### 3. Propuesta de valor diferencial

Ningún producto existente hace el pipeline COMPLETO:
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

Articular claramente: ¿cuál es el moat? ¿Qué es difícil de replicar?

### 4. Análisis de mercado

- **TAM**: ¿Cuántos estudiantes universitarios hay globalmente? ¿Cuántos profesionales técnicos?
- **Willingness to pay**: ¿Cuánto pagan por herramientas de estudio? (Quizlet Plus ~$8/mes, Readwise ~$8/mes, Coursera Plus ~$60/mes)
- **Pain point validation**: ¿Hay datos sobre cuánto tiempo se pierde leyendo PDFs mal formateados? ¿Cuántos estudiantes leen en un segundo idioma?
- **Modelo de negocio**: freemium (N PDFs gratis/mes), pro (ilimitado + traducción + tutor IA), enterprise (universidades, corporaciones)
- **Unit economics**: costo de procesar un PDF (LLM tokens para traducción + quizzes + evaluación)

### 5. Legalidad y fair use

- ¿Es legal transpilar un PDF comprado para uso personal? (fair use, transformative use)
- ¿Precedentes legales? (ej. Google Books, HathiTrust)
- ¿Diferencia entre redistribuir contenido vs. transformarlo para uso propio?
- ¿Cómo lo manejan Readwise, Scholarcy, etc.?

### 6. Riesgos y contraargumentos

- Dependencia de LLMs (costo, latencia, calidad)
- PDFs complejos (layouts de 2 columnas, fórmulas LaTeX, código)
- Calidad de traducción para material técnico
- "¿Por qué no leo el PDF directamente?"
- Competencia de incumbentes (Google, OpenAI, Apple) que podrían hacer esto nativamente
- Piratería: ¿alguien subiría un PDF que no compró?

### 7. MVP standalone — ¿Qué construir primero?

Si fuera a lanzar esto como producto separado de Jarre:
- ¿Web app? ¿Desktop? ¿Extensión de navegador?
- ¿Qué features son MVP vs. V2?
- ¿Stack tecnológico?
- ¿Timeline realista?

## Output esperado

Un documento exhaustivo en `investigations/pdf-transpiler-product-research.md` con:
- Todas las secciones anteriores
- Citas académicas con links cuando sea posible
- Tabla comparativa de competidores
- Números concretos (effect sizes, TAM, pricing)
- Conclusión: go/no-go y por qué

## Instrucciones técnicas

- Todo en español
- Usar WebSearch para datos actualizados (2025-2026)
- Usar fuentes académicas reales (no inventar papers)
- Lanzar múltiples agents en paralelo para cada eje de investigación
- Ser riguroso: si un dato no se encuentra, decirlo explícitamente
