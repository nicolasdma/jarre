# Solving Memory for Openclaw & General Agents (Pedro @sillydarket, 2026)
## Sesión Pre-Lectura — Preparación Conceptual

**Fecha:** 2026-02-15
**Objetivo:** Construir un modelo mental de las decisiones arquitectónicas detrás de la memoria persistente para agentes AI ANTES de leer el artículo.
**Método:** Explicación progresiva con preguntas y respuestas.

---

## Concepto 1: Context Death — El Problema Fundamental

Todo agente AI opera dentro de una ventana de contexto finita. Cuando la sesión termina, **todo muere**: decisiones tomadas, preferencias del usuario, relaciones entre personas, contexto de proyecto. La siguiente sesión empieza desde cero.

Esto no es un inconveniente menor. Es un defecto estructural que limita a los agentes a ser **herramientas sin estado** en lugar de colaboradores con continuidad.

```
Sesion 1                    Sesion 2                    Sesion 3
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ Contexto rico:  │         │ Contexto: ∅     │         │ Contexto: ∅     │
│ - Decisiones    │  ═══╗   │ "Quien eres?"   │  ═══╗   │ "Quien eres?"   │
│ - Preferencias  │     ║   │ "Que haciamos?" │     ║   │ "Que haciamos?" │
│ - Relaciones    │     ║   │ "Que decidimos?"│     ║   │ "Que decidimos?"│
│ - Proyecto      │     ║   │                 │     ║   │                 │
└─────────────────┘     ║   └─────────────────┘     ║   └─────────────────┘
                        ╚═══ MUERTO ════════════════╚═══ MUERTO
```

La pregunta arquitectónica: **cómo persistes estado cognitivo entre sesiones sin degradar la calidad del agente?**

> **Punto clave:** Context death no es un problema de almacenamiento. Es un problema de **recuperación selectiva** — el agente necesita exactamente la información relevante en el momento correcto, dentro de un budget de tokens limitado.

---

## Concepto 2: Benchmarks de Memoria — Markdown Vence a la Infraestructura

ClawVault parte de un hallazgo empírico contraintuitivo. Al evaluar soluciones de memoria contra el benchmark LoCoMo (Long Conversation Memory), los resultados fueron:

| Solución | Score LoCoMo | Enfoque |
|----------|-------------|---------|
| Mem0 | 68.5% | Memoria especializada con API propia |
| Zep | ~68% | Memory layer con embeddings |
| Vector DBs + RAG | ~65-68% | Búsqueda semántica sobre chunks |
| **Archivos markdown en filesystem** | **74.0%** | Archivos planos con estructura |

**Por qué gana markdown?** Porque los LLMs ya saben trabajar con archivos de texto. Su training data está llena de markdown, YAML, wikis. Cuando le das a un LLM un archivo `.md` bien estructurado, lo parsea con fluidez nativa. Las APIs propietarias de memoria introducen una capa de abstracción que el modelo no conoce de su entrenamiento.

```
Herramientas especializadas:          Archivos markdown:

  Agente                                Agente
    │                                     │
    ▼                                     ▼
  API propietaria                     Filesystem (open)
    │                                     │
    ▼                                     ▼
  Base de datos interna               archivo.md ← LLM sabe leer esto
    │                                   con YAML frontmatter
    ▼                                     │
  Formato custom ← LLM NO               ▼
  conoce esto de                      Formato nativo para el LLM
  su entrenamiento
```

> **Punto clave:** La mejor infraestructura de memoria es la que el LLM ya entiende. No necesitas reinventar el almacenamiento — necesitas estructurar lo que el modelo ya sabe consumir.

---

## Concepto 3: El Insight de Obsidian — Estructura Sobre Archivos Planos

ClawVault no inventa un formato nuevo. Toma el modelo mental de Obsidian: notas como archivos markdown con tres capas de estructura encima.

**Capa 1: YAML Frontmatter** — Metadata tipada en cada archivo:
```yaml
---
title: "Architecture Decision: Event-Driven Pipeline"
date: 2026-02-12
category: decisions
memoryType: decision
priority: 🔴
tags: [architecture, pipeline, backend]
---
El equipo decidió migrar a un pipeline event-driven
porque el approach síncrono no escalaba a 10k msgs/seg...
```

**Capa 2: Wiki-links** — Conexiones explícitas entre memorias:
```markdown
Decidimos usar [[event-driven-pipeline]] después de la
reunión con [[sarah-cto]]. Esto reemplaza el approach
que [[marco-backend]] había propuesto inicialmente.
```

**Capa 3: Estructura de carpetas** — Taxonomía de tipos de memoria:
```
vault/
├── decisions/          ← Decisiones arquitectónicas
│   ├── event-driven-pipeline.md
│   └── postgres-over-mongo.md
├── people/             ← Relaciones y contexto humano
│   ├── sarah-cto.md
│   └── marco-backend.md
├── lessons/            ← Aprendizajes post-mortem
│   └── never-deploy-friday.md
├── projects/           ← Contexto de proyectos activos
│   └── api-migration.md
├── commitments/        ← Promesas y follow-ups
│   └── friday-followup.md
├── preferences/        ← Preferencias del usuario
│   └── coding-style.md
└── handoffs/           ← Transiciones entre sesiones
    └── 2026-02-12.md
```

> **Punto clave:** La magia no está en el formato (markdown es trivial). Está en la **taxonomía de tipos de memoria** y las **relaciones explícitas** entre notas. Obsidian demostró que grafos de conocimiento emergen de links simples entre archivos planos.

---

## Concepto 4: Taxonomía de Tipos de Memoria

No toda memoria es igual. ClawVault clasifica cada pieza de información en tipos discretos porque distintos tipos tienen distintos patrones de acceso y distinta vida útil.

| Tipo | Ejemplo | Patrón de acceso | Vida útil |
|------|---------|-------------------|-----------|
| **decisión** | "Elegimos React sobre Vue" | Al evaluar alternativas | Larga (proyecto) |
| **preference** | "Prefiere dark mode y tabs" | Al generar código/UI | Indefinida |
| **relationship** | "Sarah es la CTO" | Al mencionar personas | Media-larga |
| **commitment** | "Prometió follow-up el viernes" | Búsqueda temporal | Corta (expira) |
| **lesson** | "Nunca deployar viernes" | Al planificar acciones | Indefinida |

Esta taxonomía no es arbitraria. Cada tipo mapea a un tipo distinto de recuperación:

```
Query del agente: "Que sabemos sobre el backend?"

  1. Buscar en decisions/ ──► Decisiones de arquitectura
  2. Buscar en projects/  ──► Estado actual del proyecto
  3. Buscar en people/    ──► Quien trabaja en backend
  4. Buscar en lessons/   ──► Que no repetir
  5. Buscar en commitments/ ──► Que esta pendiente

  Sin taxonomía: búsqueda bruta sobre TODO
  Con taxonomía: búsqueda dirigida por tipo
```

> **Punto clave:** Tipar la memoria permite al agente buscar con intención, no con fuerza bruta. Es la diferencia entre grep sobre todo el disco y un query con WHERE clause.

---

## Concepto 5: El Grafo de Memoria — Asociación via Wiki-Links

Cada nota en el vault puede referenciar a otras usando wiki-links (`[[nombre-nota]]`). El comando `clawvault link --all` escanea el contenido y auto-detecta menciones de entidades conocidas, creando links implícitos.

El resultado es un **grafo de conocimiento** donde las memorias no son registros aislados sino nodos conectados:

```
                    ┌──────────────────────┐
                    │  sarah-cto           │
                    │  (people/)           │
                    └──────┬──┬────────────┘
                           │  │
              ┌────────────┘  └──────────────┐
              │                              │
              ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  event-driven-pipeline  │    │  api-migration          │
│  (decisions/)           │◄──►│  (projects/)            │
└─────────────┬───────────┘    └──────────┬──────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  never-deploy-friday    │    │  friday-followup        │
│  (lessons/)             │    │  (commitments/)         │
└─────────────────────────┘    └─────────────────────────┘
```

**Memoria asociativa:** Cuando el agente necesita contexto sobre `sarah-cto`, no solo lee su nota — traversa los links para descubrir que Sarah estuvo involucrada en la decisión del pipeline y en el proyecto de migración. Esto simula cómo funciona la memoria humana: por asociación, no por índice.

> **Punto clave:** Los wiki-links convierten un directorio plano de archivos en un grafo navegable. El agente puede hacer retrieval asociativo: "Dame todo lo relacionado con X" se resuelve traversando links, no haciendo búsqueda semántica.

---

## Concepto 6: Observational Memory — Compresión con Prioridad

Un agente genera mucha información por sesión. No todo merece el mismo peso en la memoria. ClawVault implementa un sistema de prioridad de tres niveles:

```
Prioridad de observaciones:

  🔴 Critical ──── Decisiones, compromisos, blockers
  │                 SIEMPRE se cargan primero
  │
  🟡 Notable ───── Insights, preferencias, contexto
  │                 Se cargan si hay budget disponible
  │
  🟢 Background ── Updates rutinarios, bajo signal
                    Solo si sobra espacio
```

### Budget-Aware Context Injection

El context window tiene un límite. ClawVault implementa una estrategia de llenado por prioridad:

```
Context Window Budget: 8000 tokens
═══════════════════════════════════════════════════

Paso 1: Cargar todos los 🔴 Critical
[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 3200 tokens

Paso 2: Llenar con 🟡 Notable
[████████████████████████░░░░░░░░░░░░░░░░] 6100 tokens

Paso 3: Si sobra, agregar 🟢 Background
[████████████████████████████████░░░░░░░░] 7800 tokens

Resultado: El agente SIEMPRE tiene las decisiones críticas,
           y completa con contexto adicional según el espacio.
```

### El Bug de Compresión del LLM

Cuando usas un LLM para comprimir observaciones, el modelo **reescribe keywords**. "Decisión: usar Postgres" se convierte en "Postgres fue seleccionado como capa de base de datos." El tag de prioridad original se pierde.

**Fix:** Aplicar regex-based priority enforcement DESPUÉS de la compresión del LLM. El LLM comprime el contenido; un post-proceso determinístico re-inyecta los tags de prioridad.

```
Pipeline de compresión:

  Observación cruda ──► LLM comprime ──► Regex re-aplica ──► Memoria final
  "🔴 Decisión:         "Postgres fue      "🔴 Postgres fue     (prioridad
   usar Postgres"        seleccionado..."    seleccionado..."     preservada)
```

> **Punto clave:** Nunca confíes en un LLM para preservar metadata estructural durante compresión. Los modelos optimizan para fluidez, no para preservación de tags. Usa post-procesamiento determinístico para lo que necesita ser exacto.

---

## Concepto 7: Vault Index — Tabla de Contenido Antes de Búsqueda

El vault puede crecer a cientos o miles de notas. Leerlas todas en cada sesión es imposible. ClawVault resuelve esto con un **patrón de índice**: un archivo único que lista todas las notas con una descripción de una línea.

```
vault/INDEX.md:
─────────────────────────────────────────────────────────
decisions/event-driven-pipeline.md — Migración a pipeline asíncrono
decisions/postgres-over-mongo.md — Elección de DB relacional
people/sarah-cto.md — CTO, decisión-maker en arquitectura
people/marco-backend.md — Lead backend, experto en Go
lessons/never-deploy-friday.md — Incidente de deploy en prod
projects/api-migration.md — Migración REST a gRPC, en progreso
commitments/friday-followup.md — Enviar update a Sarah
...
```

El flujo de retrieval es de dos pasos:

```
Query: "Que decidimos sobre la base de datos?"

  Paso 1: Agente lee INDEX.md (barato, ~200 tokens)
          ──► Identifica: decisions/postgres-over-mongo.md

  Paso 2: Agente lee SOLO esa nota (preciso, ~500 tokens)
          ──► Obtiene contexto completo de la decisión

  SIN índice: leer TODO el vault (~50,000 tokens) o
              hacer embedding search (latencia + costo)
```

**Index vs Embeddings:** No son mutuamente excluyentes. El índice es una tabla de contenidos — rápido para queries directas. Los embeddings son un motor de búsqueda — necesarios para queries semánticas vagas. ClawVault recomienda usar ambos.

> **Punto clave:** Un índice plano es más eficiente que embedding search para la mayoría de queries concretas. Es la versión "grep" vs "Google Search" — grep es instantáneo cuando sabes qué buscas.

---

## Concepto 8: Soberanía de Datos — Zero Cloud, Full Local

ClawVault toma una posición arquitectónica fuerte: **cero llamadas de red** (excepto las opcionales al LLM para compresión). Sin telemetría. Sin sincronización cloud. Las memorias viven exclusivamente en el filesystem local.

Esto no es solo una preferencia de privacidad. Tiene implicaciones arquitectónicas:

```
Arquitectura cloud-dependent:        ClawVault (local-only):

  Agente ──► API Cloud ──► DB         Agente ──► Filesystem local
             │                                     │
             ├── Latencia de red                   ├── Latencia ~0
             ├── Dependencia de uptime             ├── Siempre disponible
             ├── Vendor lock-in                    ├── Zero lock-in
             ├── Datos en servidor ajeno           ├── Datos bajo tu control
             └── Costo por request                 └── Costo: 0
```

La consecuencia más importante: **portabilidad total**. Un vault es un directorio de archivos markdown. Puedes moverlo entre máquinas con `cp -r`, versionarlo con `git`, editarlo con cualquier editor, leerlo sin ningún software especial.

> **Punto clave:** La soberanía de datos no es un feature — es una decisión arquitectónica que elimina clases enteras de problemas (latencia, disponibilidad, lock-in, privacidad). El trade-off es que pierdes sincronización multi-dispositivo nativa.

---

## Resumen Visual

```
                 ClawVault: Memoria para Agentes
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
     Problema          Arquitectura       Principios
          │                 │                 │
    Context death     Markdown + YAML    Zero cloud
    (todo muere       + Wiki-links       Full local
     entre sesiones)       │             Portabilidad
          │          ┌─────┼─────┐
          │          │     │     │
          ▼        Tipos  Grafo  Retrieval
    Benchmarks:    de mem  de      │
    .md > Mem0     │      links  ┌─┴──────┐
    74% > 68.5%    │       │     │        │
                   │       │   Index    Budget-
              decision  [[links]]  (.md)   aware
              preference   │             loading
              relationship │           🔴 → 🟡 → 🟢
              commitment   ▼
              lesson    Memoria
                       asociativa
```

---

## Términos Clave (Inglés → Español)

| Inglés | Español | Contexto |
|--------|---------|----------|
| Context death | Muerte de contexto | Pérdida total de estado al terminar sesión |
| Memory vault | Bóveda de memoria | Directorio raíz donde se almacenan todas las memorias |
| YAML frontmatter | Encabezado YAML | Metadata estructurada al inicio de cada archivo markdown |
| Wiki-link | Enlace wiki | Referencia entre notas usando sintaxis `[[nombre]]` |
| Memory type taxonomy | Taxonomía de tipos de memoria | Clasificación de memorias en categorías discretas |
| Observational memory | Memoria observacional | Información capturada durante una sesión con prioridad |
| Budget-aware loading | Carga consciente de presupuesto | Inyección de contexto limitada por tokens disponibles |
| Vault index | Índice del vault | Archivo único con listado y descripción de todas las notas |
| Priority enforcement | Aplicación de prioridad | Post-proceso que preserva tags de prioridad tras compresión |
| Knowledge graph | Grafo de conocimiento | Red de conexiones entre memorias via wiki-links |
| Context window budget | Presupuesto de ventana de contexto | Tokens disponibles para inyectar memoria en el prompt |
| Data sovereignty | Soberanía de datos | Control total sobre dónde residen los datos |
| Associative retrieval | Recuperación asociativa | Búsqueda por relaciones entre conceptos, no por keywords |
| Signal preservation | Preservación de señal | Mantener información crítica durante compresión |
| Handoff | Traspaso | Documento de transición entre sesiones del agente |

---

## Preguntas de Comprensión (Auto-evaluación)

1. Por qué archivos markdown planos obtienen mejor score que herramientas especializadas de memoria como Mem0 en el benchmark LoCoMo? Qué implica esto sobre el training data de los LLMs?

2. Explica la diferencia entre el vault index y la búsqueda por embeddings. En qué tipo de queries gana cada uno?

3. Si un agente tiene un budget de 4000 tokens y hay 6000 tokens de memorias 🔴 Critical, qué debería hacer el sistema? Qué trade-offs implica?

4. Por qué el LLM reescribe las keywords de prioridad durante la compresión? Por qué un post-proceso determinístico es mejor solución que pedirle al LLM "no cambies los tags"?

5. Diseña un escenario donde la memoria asociativa via wiki-links encuentra información que una búsqueda por embeddings no encontraría. Y un escenario inverso.

6. Qué problemas introduce la arquitectura zero-cloud que una solución con backend centralizado no tendría? (Piensa en equipos, múltiples dispositivos, backups.)

7. La taxonomía de ClawVault tiene 5 tipos de memoria. Propone un tipo adicional que creas necesario y justifica por qué los 5 existentes no lo cubren.

8. Cómo implementarías un mecanismo de "olvido" — memorias que pierden relevancia con el tiempo? Qué criterios usarías para decidir qué olvidar?

9. Compara el approach de ClawVault (archivos + estructura) con un vector database puro (embeddings sin estructura). En qué escala de vault cada uno empieza a fallar?

10. El artículo dice "human knowledge management and agent memory management are the same problem." Está de acuerdo? Identifica al menos una diferencia fundamental entre cómo un humano y un agente recuperan memorias.

11. Si tuvieras que agregar sincronización multi-dispositivo a ClawVault sin comprometer la soberanía de datos, qué arquitectura propondrías?

12. Por qué los handoffs son un tipo de memoria separado y no simplemente un resumen dentro de decisions o projects?
