# The Two Patterns by Which Agents Connect Sandboxes (Harrison Chase, LangChain 2026)
## Sesión Pre-Lectura — Preparación Conceptual

**Fecha:** 2026-02-15
**Objetivo:** Construir un mapa mental de los conceptos clave ANTES de leer el blog post en inglés.
**Método:** Explicación progresiva con preguntas y respuestas.

---

## Concepto 1: Por Qué los Agentes Necesitan Sandboxes

Un agente de IA que ejecuta código tiene un problema fundamental: **necesita acceso a un computador real** (instalar paquetes, leer archivos, ejecutar scripts), pero darle acceso sin restricciones a tu máquina es suicidio operacional. Puede leer tus credenciales, borrar archivos, hacer requests a tu red interna.

Un **sandbox** es un entorno aislado — un computador dentro de tu computador — donde el agente puede operar sin tocar nada fuera de su burbuja.

```
Sin sandbox:
┌─────────────────────────────────────────────┐
│  TU MAQUINA                                 │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Agente  │──│ ~/.ssh/  │  │ .env.local│  │
│  │ LLM     │──│ ~/docs/  │  │ red corp  │  │
│  └─────────┘  └──────────┘  └───────────┘  │
│  ↑ acceso total = riesgo total              │
└─────────────────────────────────────────────┘

Con sandbox:
┌─────────────────────────────────────────────┐
│  TU MAQUINA                                 │
│  ┌─────────────────────────────────┐        │
│  │  SANDBOX (Docker/VM)           │        │
│  │  ┌─────────┐  ┌────────────┐  │        │
│  │  │ Agente  │──│ /workspace │  │        │
│  │  │ LLM     │  │ (aislado)  │  │        │
│  │  └─────────┘  └────────────┘  │        │
│  └─────────────────────────────────┘        │
│  ↑ sin acceso a ~/.ssh, .env, red interna   │
└─────────────────────────────────────────────┘
```

El post de Chase distingue tres niveles de sandbox:
- **Full-computer sandbox** (Docker, VMs) — el foco del artículo
- **Process-level sandbox** (bubblewrap) — aislamiento a nivel de proceso, excluido
- **Language-level sandbox** (Pyodide) — ejecución en WASM, excluido

> **Insight central:** El problema no es SI aislar al agente, sino CÓMO conectar al agente con su sandbox. Y ahí emergen exactamente dos patrones arquitectónicos.

---

## Concepto 2: Pattern 1 — Agent Runs IN Sandbox

El primer patrón coloca al agente **dentro** del sandbox. Construyes una imagen Docker (o VM) con tu framework de agente pre-instalado, levantas el contenedor, y te conectas desde fuera para enviar mensajes.

```
PATTERN 1: Agent IN Sandbox
┌─────────────────────────────────────────────────────┐
│  HOST (tu maquina / servidor)                       │
│                                                     │
│  ┌─── App / Orquestador ───┐                        │
│  │   "Ejecuta este codigo" │                        │
│  └──────────┬──────────────┘                        │
│             │ HTTP / WebSocket                      │
│             │ (cruza boundary del sandbox)           │
│  ┌──────────▼──────────────────────────────┐        │
│  │  SANDBOX (Docker container / VM)        │        │
│  │                                         │        │
│  │  ┌──────────┐  ┌───────────────────┐   │        │
│  │  │  Agente  │──│ Filesystem local  │   │        │
│  │  │  + LLM   │  │ /workspace/       │   │        │
│  │  │  + Tools │  │ paquetes, datos   │   │        │
│  │  └──────────┘  └───────────────────┘   │        │
│  │                                         │        │
│  │  API keys dentro ← riesgo de seguridad │        │
│  │  Endpoint expuesto (HTTP API)           │        │
│  └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Cómo funciona en la práctica

1. Construyes un `Dockerfile` con tu agente, framework (LangChain, etc.), dependencias
2. Levantas el contenedor — el agente corre adentro y expone un endpoint (HTTP o WebSocket)
3. Tu aplicación externa se comunica con el agente a través de ese endpoint
4. El agente tiene acceso directo al filesystem del sandbox

### Beneficios

- **Development mirror:** el entorno dentro del sandbox replica exactamente tu entorno local de desarrollo
- **Acceso directo a filesystem:** el agente lee y escribe archivos sin latencia de red
- **Acoplamiento fuerte agente-entorno:** ideal cuando el agente necesita interactuar constantemente con un estado persistente en disco

> **Punto clave:** Este patrón es natural cuando piensas en el agente como un "proceso que vive en un servidor". Pero esa intuición esconde trade-offs serios.

---

## Concepto 3: Trade-offs de Pattern 1 — El Costo de Vivir Adentro

El Pattern 1 tiene costos que no son obvios hasta que lo operas en producción:

**Seguridad: API keys dentro del sandbox.**
Si el agente corre adentro, las API keys (OpenAI, Anthropic, Supabase) también tienen que vivir adentro. Un prompt injection exitoso o una vulnerabilidad en una dependencia puede exfiltrar esas keys.

**Iteración lenta: rebuild por cada cambio.**
Cambiar una línea del prompt del agente requiere reconstruir la imagen Docker completa. En ciclos rápidos de desarrollo, esto mata la productividad.

**Lógica de lifecycle: sandbox debe estar activo antes de usarlo.**
El sandbox necesita estar "levantado" antes de que el agente pueda recibir mensajes. Eso significa lógica adicional de resume/start/healthcheck.

**Exfiltración de código.**
El código del agente y sus prompts viven dentro del sandbox. Si el sandbox es comprometido, todo es visible.

**Privilegios uniformes** (observación de Nuno Campos, Witan Labs):
> "No part of agent can have more privileges than bash tool."

Esto es fundamental: si el agente tiene acceso a bash dentro del sandbox, TODA herramienta del agente opera con los mismos privilegios que bash. No puedes tener una herramienta con permisos restringidos y otra con permisos elevados — el techo de privilegios es uniforme.

---

## Concepto 4: Pattern 2 — Sandbox as Tool

El segundo patrón invierte la arquitectura: el agente corre **fuera** del sandbox (en tu servidor o máquina local), y cuando necesita ejecutar código, llama a un sandbox remoto vía API.

```
PATTERN 2: Sandbox as Tool
┌─────────────────────────────────────────────────────────┐
│  HOST (tu maquina / servidor)                           │
│                                                         │
│  ┌────────────────────────────────────────┐             │
│  │  Agente (local)                        │             │
│  │  ┌──────────┐  ┌───────────────────┐  │             │
│  │  │  LLM     │  │  API keys seguras │  │             │
│  │  │  + Tools │  │  (.env.local)     │  │             │
│  │  └────┬─────┘  └───────────────────┘  │             │
│  │       │                                │             │
│  │       │ tool_call: "execute_code"      │             │
│  └───────┼────────────────────────────────┘             │
│          │                                              │
│          │ SDK / API call (red)                          │
│          │                                              │
│  ┌───────▼─────────────────────────────────────┐        │
│  │  SANDBOX REMOTO (E2B / Modal / Daytona)     │        │
│  │                                              │        │
│  │  ┌───────────────┐  ┌──────────────────┐   │        │
│  │  │  Ejecuta code │  │  /workspace/     │   │        │
│  │  │  Python, bash │  │  archivos, pkgs  │   │        │
│  │  └───────────────┘  └──────────────────┘   │        │
│  │                                              │        │
│  │  Sin API keys ← seguridad por diseño        │        │
│  └──────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### Cómo funciona en la práctica

1. El agente corre localmente o en tu servidor — tiene acceso a API keys de forma segura
2. Cuando genera código que necesita ejecutarse, invoca un SDK (E2B, Modal, Daytona, Runloop)
3. El SDK envía el código al sandbox remoto, ejecuta, y devuelve el resultado
4. El sandbox es **stateful**: variables, archivos y paquetes persisten entre invocaciones
5. El sandbox es simplemente **otra herramienta** en el toolkit del agente

> **Insight clave:** Conceptualmente, ejecutar código en un sandbox remoto no es distinto de llamar a una API de búsqueda o una base de datos. Es un tool call más.

---

## Concepto 5: Beneficios Arquitectónicos de Pattern 2

Pattern 2 tiene ventajas estructurales que lo hacen preferible en la mayoría de escenarios modernos:

| Dimensión | Pattern 1 (Agent IN) | Pattern 2 (Sandbox as Tool) |
|-----------|---------------------|----------------------------|
| **Iteración** | Rebuild imagen Docker por cada cambio | Cambio de código/prompt instantáneo |
| **API keys** | Dentro del sandbox (expuestas) | Fuera del sandbox (seguras) |
| **Separación de estado** | Estado del agente y del sandbox mezclados | Estado del agente separado del sandbox |
| **Tolerancia a fallos** | Si sandbox crashea, agente muere | Si sandbox crashea, agente sobrevive |
| **Paralelización** | Un agente = un sandbox | Un agente puede usar N sandboxes en paralelo |
| **Costo** | Sandbox activo todo el tiempo | Pagas solo durante ejecución |
| **Escalabilidad futura** | Agente limitado a recursos del sandbox | Agente en CPU, sandbox futuro en GPU |

### Paralelización

Esto merece atención especial. Con Pattern 2, un solo agente puede orquestar **múltiples sandboxes simultáneos**:

```
                    ┌──────────┐
                    │  Agente  │
                    │  (local) │
                    └────┬─────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
    ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
    │ Sandbox A   │ │ Sand. B │ │ Sandbox C   │
    │ test suite  │ │ data    │ │ build       │
    │ Python 3.12 │ │ process │ │ frontend    │
    └─────────────┘ └─────────┘ └─────────────┘
           │             │             │
           └─────────────┼─────────────┘
                         │
                  Resultados combinados
```

Esto no es posible con Pattern 1, donde el agente está atado a un único sandbox.

---

## Concepto 6: Trade-off Central de Pattern 2 — Latencia de Red

El costo principal de Pattern 2 es **latencia de red**. Cada ejecución de código cruza un boundary de red:

```
Secuencia temporal Pattern 2:

Agente: genera codigo ─────────────────────────────► t0
        │
        ├── enviar a sandbox (red) ──────────────── t0 + ~20ms
        │
        ├── sandbox ejecuta ─────────────────────── t0 + ~20ms + exec_time
        │
        ├── resultado vuelve (red) ──────────────── t0 + ~40ms + exec_time
        │
        ├── agente procesa resultado ────────────── t0 + ~45ms + exec_time
        │
        └── siguiente iteración...

Para UNA ejecución: ~40ms overhead (insignificante)
Para 100 ejecuciones iterativas: ~4 segundos de overhead acumulado
```

### Mitigación: Sesiones Stateful

Los proveedores de sandbox (E2B, Daytona, etc.) mitigan esto con **sesiones stateful**:
- Variables persisten entre invocaciones (no re-inicializas el intérprete)
- Archivos creados persisten en el filesystem del sandbox
- Paquetes instalados se mantienen
- Esto reduce la cantidad de ejecuciones necesarias (no repites imports, setup, etc.)

> **Punto clave:** La latencia de red es real pero mitigable. En la práctica, el cuello de botella suele ser la latencia del LLM (segundos) no la del sandbox (milisegundos).

---

## Concepto 7: Criterios de Decisión y Boundary de Seguridad

La elección entre patrones no es estética — depende de restricciones concretas:

### Elige Pattern 1 cuando:
- El agente necesita interacción **constante y de baja latencia** con el filesystem
- El entorno de producción debe ser idéntico al de desarrollo (mirror exacto)
- El agente necesita acceso persistente a librerías/servicios específicos del sandbox
- Escenarios de larga duración donde el agente "vive" en su entorno

### Elige Pattern 2 cuando:
- Iteras rápidamente sobre prompts y lógica del agente
- Las API keys **no deben** estar dentro del sandbox (la mayoría de escenarios)
- Necesitas separación limpia entre estado del agente y estado de ejecución
- Quieres paralelizar ejecuciones en múltiples sandboxes
- Optimización de costos (pay-per-execution vs always-on)

### El Modelo de Amenaza

```
                    BOUNDARY DE SEGURIDAD
                           │
Pattern 1:                 │
  [Agente + API keys]      │     [Host]
  Todo dentro del sandbox  │     Protegido
  Si sandbox comprometido  │
  → keys exfiltradas       │
                           │
Pattern 2:                 │
  [Sandbox: solo codigo]   │     [Host + Agente + API keys]
  Sin credenciales         │     Protegido + keys seguras
  Si sandbox comprometido  │
  → solo el codigo expuesto│
```

La diferencia es dónde vive la **superficie de ataque**. En Pattern 1, un prompt injection que logre ejecución arbitraria tiene acceso a las API keys. En Pattern 2, el peor caso es que el atacante ejecute código en un sandbox sin credenciales.

---

## Concepto 8: Ecosistema y Convergencia del Mercado

El artículo menciona múltiples proveedores y herramientas que operan en este espacio:

| Proveedor/Herramienta | Tipo | Patrón que habilita |
|----------------------|------|---------------------|
| **E2B** | Cloud sandboxes (microVMs) | Pattern 2 |
| **Modal** | Serverless compute | Pattern 2 |
| **Daytona** | Dev environments | Pattern 2 |
| **Runloop** | Sandbox execution | Pattern 2 |
| **Zo Computer** | Agent computer | Ambos |
| **deepagents** | Agent framework | Pattern 2 |
| **OpenCode** | Code agent | Ambos |
| **Witan Labs** | Agent infra (Nuno Campos) | Pattern 2 |

La tendencia del mercado converge hacia Pattern 2: la mayoría de proveedores están construyendo APIs de sandbox-as-a-service, no imágenes Docker para meter agentes adentro.

### Ejemplo de Código (Pattern 2 con Daytona + LangChain)

```python
from daytona import Daytona
from langchain_anthropic import ChatAnthropic
from deepagents import create_deep_agent
from langchain_daytona import DaytonaSandbox

# 1. Crear sandbox remoto
sandbox = Daytona().create()

# 2. Envolver como tool backend
backend = DaytonaSandbox(sandbox=sandbox)

# 3. Crear agente con sandbox como herramienta
agent = create_deep_agent(
    model=ChatAnthropic(model="claude-sonnet-4-20250514"),
    system_prompt="You are a Python coding assistant with sandbox access.",
    backend=backend,
)

# 4. Invocar — el agente decide cuándo ejecutar código en el sandbox
result = agent.invoke({
    "messages": [{"role": "user", "content": "Run a small python script"}]
})

# 5. Cleanup
sandbox.stop()
```

> **Observa:** El agente no sabe ni le importa dónde corre el sandbox. Solo tiene un tool que ejecuta código. La abstracción es limpia.

---

## Resumen Visual

```
         The Two Patterns by Which Agents Connect Sandboxes
                              │
              ┌───────────────┼───────────────┐
              │                               │
        Pattern 1                       Pattern 2
     Agent IN Sandbox              Sandbox as Tool
              │                               │
    ┌─────────┴──────────┐       ┌────────────┴────────────┐
    │                    │       │                          │
  Agente vive        Filesystem  Agente vive          Sandbox es
  DENTRO del         acceso      FUERA del            un tool call
  sandbox            directo     sandbox              vía API/SDK
    │                    │       │                          │
  API keys           Dev         API keys              Latencia
  adentro ←          mirror      afuera ←              de red ←
  RIESGO             exacto      SEGURO                MITIGABLE
    │                            │                          │
  Rebuild            Cambios     Paralelización        Sesiones
  por cada           instantáneos  N sandboxes          stateful
  cambio                          simultáneos
              │                               │
              └───────────────┼───────────────┘
                              │
                    Criterio de decisión:
                    Acoplamiento vs Separación
                    Seguridad vs Conveniencia
                    Latencia local vs Latencia de red
```

---

## Términos Clave (Inglés → Español)

| Inglés | Español | Qué es |
|--------|---------|--------|
| Sandbox | Caja de arena / Entorno aislado | Entorno de ejecución con boundaries que impiden acceso al host |
| Container | Contenedor | Instancia aislada de un OS (Docker), comparte kernel con el host |
| Virtual Machine (VM) | Máquina virtual | Emulación completa de hardware, aislamiento más fuerte que contenedor |
| Boundary | Frontera / Límite | La línea de separación entre el entorno del agente y el host |
| Prompt injection | Inyección de prompt | Ataque donde input malicioso manipula el comportamiento del LLM |
| Stateful session | Sesión con estado | Sesión donde variables, archivos y paquetes persisten entre ejecuciones |
| Exfiltration | Exfiltración | Extracción no autorizada de datos sensibles (keys, código, prompts) |
| Tool call | Llamada a herramienta | Invocación de una función/API por parte del agente como paso de razonamiento |
| Fan-out (execution) | Ejecución distribuida | Un agente lanzando tareas a múltiples sandboxes en paralelo |
| Pay-per-execution | Pago por ejecución | Modelo de costo donde solo pagas cuando el sandbox está activo ejecutando |
| Dev mirror | Espejo de desarrollo | Entorno de producción que replica exactamente el entorno de desarrollo local |
| Separation of concerns | Separación de responsabilidades | Principio donde cada componente tiene un rol único y bien definido |
| Process-level sandbox | Sandbox a nivel de proceso | Aislamiento usando restricciones del OS (bubblewrap, seccomp) |
| Language-level sandbox | Sandbox a nivel de lenguaje | Aislamiento ejecutando código en un runtime restringido (Pyodide/WASM) |

---

## Preguntas de Comprensión (Auto-evaluación)

1. **Explica por qué un agente sin sandbox es un riesgo de seguridad, incluso si el agente "se porta bien" la mayoría del tiempo.** Piensa en prompt injection y dependencias comprometidas.

2. **Dibuja de memoria la arquitectura de Pattern 1 y Pattern 2.** Dónde están las API keys en cada uno? Dónde está el agente? Dónde está el código ejecutable?

3. **La observación de Nuno Campos dice: "No part of agent can have more privileges than bash tool."** Explica por qué esto es una limitación fundamental de Pattern 1, no solo un detalle de implementación.

4. **Si tu agente hace 200 ejecuciones de código iterativas en un loop, cuál patrón tiene peor performance? Por qué? Cómo lo mitigarías?**

5. **Un equipo tiene un agente que genera y ejecuta tests automáticamente. Necesita acceso a 5 repositorios distintos simultáneamente. Qué patrón recomendarías y por qué?**

6. **Explica por qué "rebuild imagen Docker por cada cambio" es un trade-off no trivial.** Piensa en el ciclo de desarrollo de un agente donde cambias prompts 50 veces al día.

7. **En Pattern 2, qué pasa si el sandbox remoto crashea a mitad de ejecución?** Compara con lo que pasa en Pattern 1 en el mismo escenario.

8. **Por qué la mayoría de proveedores del ecosistema (E2B, Modal, Daytona, Runloop) están construyendo para Pattern 2?** Qué dice esto sobre la dirección del mercado?

9. **Un agente con Pattern 2 necesita leer un archivo de 10GB en el sandbox y procesarlo línea por línea. Es Pattern 2 la mejor opción aquí? Por qué sí o por qué no?**

10. **Diseña un ataque de prompt injection contra Pattern 1 y otro contra Pattern 2. Cuál tiene peores consecuencias? Qué se puede exfiltrar en cada caso?**

11. **El concepto de "sandbox as tool" implica que ejecutar código es equivalente a cualquier otro tool call. En qué escenarios esta abstracción se rompe o es insuficiente?**

12. **Relaciona los conceptos de este artículo con el principio de mínimo privilegio (least privilege). Cuál patrón lo respeta mejor y por qué?**
