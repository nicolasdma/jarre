# Next Session Prompt

Copy-paste this to start the next session:

---

Continuamos con Jarre. Lee el plan de la sesión anterior:
- `plan/2026-02-09/session-12-visuals-persistence-resegment.md`
- `BACKLOG.md`

## Estado actual
- Learn flow persiste estado en Supabase (learn_progress table)
- ConceptVisual system funcionando: 5 visuals animados con Framer Motion para Ch5
- Ch5 re-segmentado en 5 secciones (16,598 palabras, zero loss)
- Build compila clean, todo seeded en Supabase

## Temas pendientes para esta sesión

### 1. Figuras del DDIA (P1)
El texto traducido referencia figuras que no existen (ej: "Piensa en lo que sucede en la Figura 5-1", "La Figura 5-2 muestra..."). Hay ~14 referencias en Ch5 solo.

Opciones a investigar:
- **Extraer del PDF**: usar pymupdf para extraer imágenes y embedderlas en el markdown
- **Recrear como React/SVG**: dibujar las figuras clave como componentes (similar a ConceptVisuals pero estáticas)
- **Reemplazar con ConceptVisuals**: ya tenemos algunos que cubren las figuras (ej: sync-async visual ≈ Figura 5-2)

Investigar viabilidad y decidir approach.

### 2. Inline Micro-Quizzes (P1)
Idea: después de cada sub-tema dentro de una sección, insertar un quick quiz (true/false o multiple choice) para activar retrieval practice.

Ejemplo: después de la sección sobre "Replicación Síncrona vs Asincrónica", preguntar:
- "En replicación semisíncrona, ¿cuántos seguidores son síncronos?" [1 / todos / ninguno]
- "Si el líder falla en replicación completamente asíncrona, ¿se pueden perder escrituras confirmadas?" [V/F]

**CRÍTICO**: Investigar respaldo académico. Necesitamos citas para propuestas de financiamiento:
- Interpolated testing effect (Szpunar, Khan & Schacter, 2013)
- Forward testing effect (Pastötter & Bäuml, 2014)
- Test-potentiated learning (Arnold & McDermott, 2013)
- Successive relearning (Rawson & Dunlosky, 2013)
- Retrieval practice (Roediger & Butler, 2011)

Diseñar: ¿dónde se insertan? ¿formato? ¿se guardan respuestas? ¿afectan mastery?

### 3. Re-segmentar otros capítulos largos (P2)
Si queda tiempo:
- Ch8: distributed-failures (17,337 words) — debería dividirse
- Ch9: consistency-models (13,736) + consensus (9,954) — ya son 2 secciones pero largas
- Ch11: stream-processing (19,054) — single blob enorme
- Ch2: data-models (12,805) — tolerable pero mejorable

### 4. ConceptVisuals para otros capítulos (P2)
Diseñar y crear visuals para:
- Partitioning (Ch6): hash ring, range partitioning, hotspots
- Consistency (Ch9): linearizability timeline, compare-and-swap
- Consensus (Ch9): Raft election, log replication steps

---
