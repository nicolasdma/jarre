# Prompt: Generar Contenido Pedagógico para Jarre

> Este es el prompt operativo. Pegalo al inicio de una sesión junto con el material fuente.
> Referencia dos documentos que DEBEN leerse antes de ejecutar:
> - `cursos/CONTENT-QUALITY-STANDARD.md` → define la calidad del texto
> - `cursos/TEMPLATE-CONTENT-GENERATION.md` → define la infraestructura técnica (archivos, scripts, DB)

---

## Instrucciones

Vas a producir el contenido pedagógico completo para un recurso del sistema Jarre.

### Paso 0: Leer los estándares

Antes de escribir una sola línea:

1. Leé `cursos/CONTENT-QUALITY-STANDARD.md` completo. Internalizá:
   - La naturaleza del texto (§1): instrumento de comprensión, no traducción ni resumen
   - El tono (§2): conversacional-preciso, voseo argentino, sin tono tutorial/paper/chatbot
   - El pipeline de 3 iteraciones (§3) y las 6 operaciones de la Iteración 2
   - Los 9 elementos pedagógicos obligatorios (§5, A-I)
   - El ritmo: ciclo de 3 beats por concepto (§6)
   - Las métricas de referencia (§7): 5 secciones, 16K-25K chars cada una, ~100K total

2. Leé `cursos/TEMPLATE-CONTENT-GENERATION.md` para entender la infraestructura (formatos JSON, scripts, archivos a crear).

### Paso 1: Obtener y entender el material fuente

- Si es un video de YouTube: obtener el transcript completo
- Si es un paper/libro: leer el PDF completo
- Si hay material de estudio en `ml_deep/`, leerlo también — es fuente de enriquecimiento

**No empieces a escribir hasta entender el material completo.**

### Paso 2: Iteración 1 — Conversación cruda

Producir una conversación de aprendizaje en español:
- Capturar las ideas principales en orden progresivo
- Incluir confusiones naturales de un estudiante avanzado
- Preservar momentos eureka
- Código y ejemplos concretos
- Términos técnicos en inglés

**Output:** `ml_deep/{nombre}-conversacion-completa.md` (~400-600 líneas)

**Mostrarme el resultado y esperar aprobación antes de continuar.**

### Paso 3: Iteración 2 — Enrichment pedagógico

Tomar la conversación aprobada y enriquecerla aplicando las 6 operaciones:

1. **Expandir** lo que asume conocimiento previo (1 línea → 10-20 líneas)
2. **Insistir con otro ángulo** en conceptos clave (narrativo + formal + numérico)
3. **Construir momentos eureka** (tensión → revelación → anclaje)
4. **Crear analogías funcionales** (mapeables, escalables, descartables)
5. **Repetir distribuido** donde el concepto reaparece en contexto nuevo
6. **Explicitar código** con prosa + construcción incremental (build-up, no dump)

Además agregar:
- Contexto histórico
- Rigor matemático (demostraciones formales, notación ∂)
- Comparaciones de ecosistema (frameworks, alternativas)
- Diagnóstico y debugging
- Verificación numérica después de CADA fórmula

Resegmentar en **5 secciones** con:
- Títulos metafóricos (no "Sección 1: X")
- Progresión: S0(contexto) → S1(building block) → S2(mecanismo) → S3(automatización) → S4(integración)
- 16K-25K caracteres por sección

**Output:** `scripts/output/{resource-id}-resegmented.json`

**Producir sección por sección. Mostrarme cada una y esperar aprobación antes de la siguiente.**

### Paso 4: Iteración 3 — Cross-linking y refinamiento

Sobre las secciones aprobadas:
- Agregar links 🔗 a otros recursos del sistema (0-1 en S0-S1, 2-4 en S3-S4)
- Agregar reglas prácticas como takeaways mnemotécnicos en S2+
- Revisar tono, progresión, ritmo
- Agregar pregunta de cierre que apunte al siguiente recurso

### Paso 5: Verificación final

Correr la checklist de §10 del QUALITY-STANDARD:
- [ ] Cada concepto tiene triple cobertura (intuición + formalismo + verificación)
- [ ] Cada bloque de código tiene prosa explicativa
- [ ] Cada sección tiene analogía + cross-link + checkpoint
- [ ] 16K-25K caracteres por sección
- [ ] Se puede leer de corrido sin otra fuente
- [ ] Los 9 elementos pedagógicos están presentes (§5)

### Paso 6: Infraestructura técnica

Seguir `TEMPLATE-CONTENT-GENERATION.md` pasos 0-8 para:
- Crear conceptos en DB
- Seedear secciones a Supabase
- Crear Advance Organizer (componente TSX)
- Registrar rutas
- Crear inline quizzes, reading questions, ejercicios
- Crear playground

---

## Reglas de ejecución

- **No apures.** Cada iteración se muestra y se aprueba antes de pasar a la siguiente.
- **No resumas.** Si algo del original tiene 10 páginas, el contenido enriquecido tiene 30, no 3.
- **No inventes datos.** Si no está en el material fuente, no lo agregues como si lo estuviera.
- **Sí agregá contexto.** Comparaciones con otros frameworks, contexto histórico, debugging — eso sí se agrega.
- **El gold standard de *calidad pedagógica* es kz2h-micrograd** — el tono, los momentos eureka, la triple cobertura. Pero el *volumen* debe ajustarse al tipo de fuente (ver §7 del QUALITY-STANDARD). Ante la duda, mirá `scripts/output/kz2h-micrograd-resegmented.json` para referencia de calidad.
- **No re-derives entre secciones.** Si un concepto ya fue explicado completo en S_n, S_{n+1} lo referencia ("como vimos en S_n..."), no lo re-explica desde cero.

---

## Input

**Material fuente:** [pegar link, PDF, o indicar archivo]
**Resource ID:** [e.g. `kz2h-makemore`, `attention-paper`]
**Título:** [en español]
**Fase de estudio:** [1-11, default 2 para Karpathy]
