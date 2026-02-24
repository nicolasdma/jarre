# Session 17 — Plan Maestro: UX Hardening

**Fecha:** 2026-02-14
**Fuentes:** Analista de Sesgos Cognitivos, Diseñador de Respuesta Emocional, Auditoría UX/UI
**Principio:** Cada fase produce código funcional. No se empieza la siguiente sin cerrar la anterior.

---

## Fase 1: Seguridad y Resiliencia (P0)
> Sin esto, el sistema es vulnerable. Bloquea cualquier otra mejora.

### 1A. Auth en rutas API desprotegidas
- Añadir `withAuth` a `POST /api/playground/tutor`
- Añadir `withAuth` a `POST /api/self-explanation/validate`
- `GET /api/proxy-pdf`: whitelist de dominios + validación estricta de URL

### 1B. Error boundaries en rutas críticas
- Crear `error.tsx` en: `/evaluate/[resourceId]`, `/review`, `/learn/[resourceId]`, `/library`
- Cada uno: mensaje amigable + botón retry + link a biblioteca
- Estilo con tokens `j-*`

### 1C. Errores internos no filtrados al cliente
- `src/lib/api/errors.ts`: para errores no-ApiError, retornar mensaje genérico al cliente
- Log completo en servidor, mensaje limpio al usuario

### 1D. Retry-save completo
- `/api/evaluate/retry-save`: recibir y guardar payload completo (preguntas + respuestas + rubrics), no solo score
- Documentar al usuario qué se guardó si el retry parcial ocurre

### 1E. Refresh proactivo de sesión
- Antes de operaciones críticas (submit evaluación), verificar/refrescar token Supabase
- Diferenciar "sesión expirada" de "no autenticado" en el UI

### 1F. Streaming con timeout
- `callDeepSeekStream()`: añadir `AbortSignal.timeout(60_000)`
- UI: botón "Cancelar" después de 15s de inactividad del stream

### 1G. Eliminar console.log de debug
- `selection-popover.tsx` línea ~61: eliminar console.log

---

## Fase 2: Feedback y Estados de Carga (P0)
> El usuario no sabe si la app funciona. Esto mata la confianza.

### 2A. Loading states con actividad visual
- `evaluation-flow.tsx`: reemplazar texto estático por spinner + texto + estimación de tiempo
- Añadir botón "Cancelar" con AbortController después de 10s
- Aplicar mismo patrón en review-session.tsx para submit de respuestas

### 2B. Confirmación en Cancel de evaluación
- Al presionar Cancel mid-evaluación: diálogo "¿Seguro? Tu progreso se guardará como borrador"
- Comunicar al usuario que el draft en localStorage existe

### 2C. Review session: retry en error
- Preservar respuesta del usuario en state si submit falla
- Añadir botón "Reintentar" que reenvíe el mismo payload

### 2D. Categorización de errores en cliente
- Crear tipos: `NetworkError`, `AuthError`, `LLMError`, `ValidationError`
- Mensajes y acciones específicas para cada tipo:
  - Network → "Sin conexión. Reintentar"
  - Auth → "Sesión expirada. Iniciar sesión"
  - LLM → "El servicio está ocupado. Esperar e intentar"
  - Validation → "Revisa tu respuesta"

### 2E. Sistema de notificaciones (toast)
- Integrar `sonner` con estilos `j-*`
- Usar para: save success, error de red, XP ganado, cambio de idioma

---

## Fase 3: Transparencia de Evaluación (P0-P1)
> Ataca directamente el sesgo de desconfianza en la automatización.
> Sin esto, un score de 65% se percibe como arbitrario.

### 3A. Rúbrica visible en resultados
- Mostrar las 3 dimensiones (Accuracy, Completeness, Depth) con sus scores individuales en la pantalla de resultados
- Misma visualización que ya existe en review cards (●● dots) pero en evaluaciones principales
- El usuario puede auditar POR QUÉ sacó 65% y no 80%

### 3B. Reframing del copy de resultados
- Score < 60%: cambiar "Hay margen de mejora" → "Identificaste áreas clave para profundizar"
- Eliminar la palabra "vacíos" (gaps) → usar "áreas de exploración"
- Botón "VOLVER A LA BIBLIOTECA" → "Ver material de estudio" o "Profundizar en el tema"
- Añadir mensaje normalizador: "Las evaluaciones son herramientas de descubrimiento, no juicios"

### 3C. Predicción: copy del resultado negativo
- Cuando predicción > realidad: cambiar de tono punitivo a metacognitivo
- "La diferencia entre tu predicción y el resultado señala exactamente dónde enfocar tu próxima lectura"
- No usar "fallaste" ni "te sobreestimaste"

### 3D. Indicador de longitud esperada en preguntas
- Añadir hint bajo cada textarea: "2-4 oraciones suelen ser suficientes" o "Un párrafo con ejemplo concreto"
- Reduce ansiedad de "¿cuánto escribo?"

### 3E. Preguntas una a la vez (opcional, evaluar)
- Considerar mostrar preguntas secuencialmente en vez de todas juntas
- Reduce el efecto "muro de texto" que abruma
- Si se implementa: progress indicator "Pregunta 2 de 5"

---

## Fase 4: Consistencia Visual y Componentes (P1)
> Deuda de integración. El sistema tiene gusto pero no coherencia.

### 4A. Componente Button Jarre
- Crear variantes: `j-primary`, `j-secondary`, `j-ghost`, `j-danger`
- Encapsular el patrón repetido: `font-mono text-[10px] tracking-[0.15em] bg-j-accent...`
- 2 tamaños: `default` (px-6 py-3) y `sm` (px-4 py-2)
- Migrar los 20+ botones inline al componente

### 4B. Dark mode: eliminar bg-white hardcodeado
- Búsqueda global de `bg-white` y `bg-stone-` fuera de globals.css
- Reemplazar por tokens `j-*` correspondientes
- Archivos conocidos: ConfidenceIndicator, QuickQuiz, InlineQuiz, ReviewStep, PracticeEvalStep, ConceptSection, Login, Signup

### 4C. Auth pages al sistema de diseño
- Login y Signup: migrar de `bg-stone-50`, `text-red-600` a tokens `j-*`
- Es la grieta visual más obvia — el usuario entra a "otro producto"

### 4D. Componente de error unificado
- Un solo `<ErrorMessage>` que reemplace los 3 estilos actuales
- Yellow box, text-j-error inline, text-xs → uno solo

### 4E. Componente BackLink
- Un `<BackLink href="/library">Biblioteca</BackLink>` reutilizable
- Reemplazar las 3 variantes actuales (texto plano, botón circular, t() key)

### 4F. Iconografía: elegir una convención
- Auditar uso de Unicode (✓, ▶), emojis (💡), SVG custom
- Elegir: Lucide icons (ya en el proyecto) como estándar
- Migrar las instancias más visibles

---

## Fase 5: Accesibilidad Crítica (P1)
> WCAG mínimo. No perfección, pero sí lo básico.

### 5A. Layout semántico
- `layout.tsx`: envolver contenido en `<main id="main-content">`
- Añadir `<nav>` al header
- Skip-link: "Saltar al contenido principal"

### 5B. Focus trap en overlays
- Crear hook `useFocusTrap` reutilizable
- Aplicar en: mobile-nav.tsx, learn-toc.tsx (mobile), quick-quiz.tsx
- Mobile nav: cerrar con Escape + click outside + overlay semitransparente

### 5C. Semántica en componentes interactivos
- QuickQuiz: `role="dialog"` + `aria-modal`
- InlineQuiz MC: `role="radiogroup"` + `role="radio"` en opciones
- ConfidenceIndicator: `aria-pressed` en estado seleccionado

### 5D. Touch targets mínimos
- Establecer `min-h-[44px] min-w-[44px]` en elementos interactivos mobile
- Revisar badges y botones con `text-[8px]` / `px-1.5`

---

## Fase 6: Experiencia Emocional (P1-P2)
> Los problemas no son de diseño sino de interfaz emocional.

### 6A. Celebración de logros
- Score ≥ 80%: animación/momento de "pop" emocional (no solo verde)
- XP ganado: mostrar brevemente vía toast en vez de fire-and-forget silencioso
- Primera evaluación completada: mensaje especial de bienvenida

### 6B. Loop de recuperación post-score-bajo
- Después de < 60%: no solo "Volver a biblioteca"
- Añadir: "Releer [secciones específicas]" con links directos al contenido relevante
- Copy de invitación: "Cuando te sientas listo, volvé a intentarlo"
- Mostrar qué dimensiones fueron bajas para guiar el estudio

### 6C. Streak resiliente
- Perder streak: no castigar, amortiguar
- "¡Volviste! Tu racha anterior fue de 14 días" en vez de "Streak: 0"
- Considerar "longest streak" como metric permanente junto al streak actual

### 6D. Cold start del dashboard
- Primer login (0 evaluaciones): mensaje de bienvenida contextual
- "Tu viaje empieza aquí. Elegí un recurso de la biblioteca para tu primera evaluación"
- No mostrar stats en 0 — mostrar call-to-action

### 6E. Review: variabilidad emocional
- Cada 5 tarjetas: micro-feedback de progreso ("5 de 12 completadas")
- Ocasionalmente: dato interesante o conexión entre conceptos
- Reconocer el regreso después de ausencia: "¡Volviste después de 3 días!"

---

## Fase 7: Limpieza y Simplificación (P2-P3)
> Reducir superficie de mantenimiento.

### 7A. Purgar dependencias no usadas
- Verificar y remover: `framer-motion` (si no hay imports), `gray-matter`
- Evaluar: `tldraw` (700KB) — ¿se usa activamente?

### 7B. Consolidar traducciones
- Migrar ternarios inline `lang === 'es' ? ... : ...` a `t()` centralizado
- Unificar prop naming: elegir `language` o `lang`, refactorizar

### 7C. Unificar mastery levels
- Una sola fuente de verdad: `getMasteryLevels(lang)`
- Eliminar array hardcodeado en landing

### 7D. Loading skeletons
- `loading.tsx` en `/library`, `/review`, `/` (dashboard)
- Skeletons con tokens `j-*`

### 7E. Grid mastery responsive
- Landing: `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`

### 7F. Simplificar componentes
- LanguageSelector: reducir a `<select>` nativo
- ThemeToggle: usar Lucide icons
- Evaluar: playground wrappers → parametrizar con `[type]/page.tsx`

---

## Notas de Implementación

### Orden de ejecución recomendado
```
Fase 1 (Seguridad)     ←── PRIMERO, no negociable
Fase 2 (Feedback)      ←── Segundo, visible para el usuario
Fase 3 (Transparencia) ←── Tercero, resuelve desconfianza
Fase 4 (Consistencia)  ←── Cuarto, deuda visual
Fase 5 (Accesibilidad) ←── Puede intercalarse con Fase 4
Fase 6 (Emocional)     ←── Después de que la base esté sólida
Fase 7 (Limpieza)      ←── Continuo, intercalar cuando haya espacio
```

### Lo que NO entra en este plan
- Features nuevas (tutor orchestrator, nuevos playgrounds)
- Contenido nuevo (seed quizzes, traducir papers)
- Refactors arquitecturales profundos (cambiar SM-2, cambiar estructura de rutas)
- El plan se enfoca en solidificar lo existente

### Principio guía
> "Los problemas identificados no son defectos fundamentales del producto sino puntos de fricción en la interfaz emocional entre un sistema bien diseñado y la psicología inevitable de ser evaluado."

Cada fase reduce fricción. No agrega complejidad.
