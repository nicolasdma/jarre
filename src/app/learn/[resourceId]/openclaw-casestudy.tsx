export function OpenClawCaseStudy() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#6366f1]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Case Study · OpenClaw (Peter Steinberger)
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Arquitectura de un Sistema de Agentes
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          Diseccion del sistema open-source mas popular del mundo
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          OpenClaw es un sistema completo para desplegar y orquestar agentes de IA
          que automatizan tareas complejas y se comunican a traves de multiples canales.
          Con 145k+ estrellas en GitHub, es el caso de estudio definitivo de como
          los conceptos teoricos de agentes se implementan en produccion.
        </p>
      </header>

      {/* Visual: Architecture Overview */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-6 text-center">
          Vista general de la arquitectura
        </p>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <div className="flex flex-col items-center gap-4">
            {/* External layer */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 border border-j-border text-center">
                <p className="font-mono text-[9px] text-j-text-tertiary">Slack</p>
              </div>
              <div className="px-3 py-2 border border-j-border text-center">
                <p className="font-mono text-[9px] text-j-text-tertiary">WhatsApp</p>
              </div>
              <div className="px-3 py-2 border border-j-border text-center">
                <p className="font-mono text-[9px] text-j-text-tertiary">Discord</p>
              </div>
              <div className="px-3 py-2 border border-j-border text-center">
                <p className="font-mono text-[9px] text-j-text-tertiary">Web UI</p>
              </div>
            </div>

            <span className="text-xs text-j-text-tertiary">↕ Channels</span>

            {/* Gateway */}
            <div className="px-6 py-3 border-2 border-[#6366f1]/40 bg-[#6366f1]/5 text-center">
              <p className="font-mono text-[10px] text-[#6366f1]">Gateway</p>
              <p className="font-mono text-[8px] text-j-text-tertiary">HTTP / WebSocket</p>
            </div>

            <span className="text-xs text-[#6366f1]">↕ ACP (Agent Communication Protocol)</span>

            {/* Agent core */}
            <div className="w-full border-2 border-dashed border-[#6366f1]/40 p-4">
              <p className="font-mono text-[10px] text-[#6366f1] mb-3 text-center">Agent Core</p>
              <div className="flex items-center justify-center gap-4">
                <div className="px-3 py-2 bg-[#6366f1]/10 border border-[#6366f1]/30 text-center">
                  <p className="font-mono text-[9px] text-[#6366f1]">Skills</p>
                </div>
                <div className="px-3 py-2 bg-[#6366f1]/10 border border-[#6366f1]/30 text-center">
                  <p className="font-mono text-[9px] text-[#6366f1]">Memory</p>
                </div>
                <div className="px-3 py-2 bg-[#6366f1]/10 border border-[#6366f1]/30 text-center">
                  <p className="font-mono text-[9px] text-[#6366f1]">A2UI</p>
                </div>
                <div className="px-3 py-2 bg-[#6366f1]/10 border border-[#6366f1]/30 text-center">
                  <p className="font-mono text-[9px] text-[#6366f1]">Plugins</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-j-text-secondary mt-4 text-center">
            Todo fluye a traves del <span className="font-mono text-[#6366f1]">ACP</span> — el protocolo que desacopla canales de logica
          </p>
        </div>
      </section>

      {/* Section 01: Agent Communication Protocol */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Agent Communication Protocol</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Como hablan los agentes con el mundo
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Imagina un traductor simultaneo en la ONU. El ACP traduce entre el lenguaje
            interno del agente y los multiples protocolos del mundo exterior —
            <span className="text-j-text"> sin que ningun lado necesite conocer los detalles del otro.</span>
          </p>
        </div>

        <p className="text-j-text-secondary leading-relaxed mb-6">
          El ACP es el protocolo propietario de OpenClaw que estandariza la comunicacion
          entre el gateway y los agentes. Maneja sesiones, streaming via NDJSON, y
          permite que cualquier canal (Slack, WhatsApp, web) hable con el agente
          sin que el agente sepa de donde viene el mensaje.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#6366f1] bg-[#6366f1]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">Protocolo propio (ACP)</p>
            <p className="text-sm text-j-text mb-1">Abstraccion sobre canales</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Session management integrado</p>
              <p>+ NDJSON streaming nativo</p>
              <p>+ Desacoplamiento total canal-agente</p>
              <p className="text-j-text-tertiary">- Protocolo no estandar</p>
              <p className="text-j-text-tertiary">- Vendor lock-in potencial</p>
            </div>
          </div>
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">REST directo</p>
            <p className="text-sm text-j-text mb-1">Cada canal habla con el agente</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Estandar conocido</p>
              <p>+ Sin capa adicional</p>
              <p className="text-j-text-tertiary">- El agente conoce cada canal</p>
              <p className="text-j-text-tertiary">- Sin session management unificado</p>
              <p className="text-j-text-tertiary">- N integraciones = N adaptadores</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#6366f1] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            El ACP unifica session management y streaming en un solo protocolo. Cada mensaje
            llega como NDJSON (newline-delimited JSON), permitiendo{' '}
            <span className="text-[#6366f1]">respuestas incrementales sin WebSockets</span> — una decision
            que simplifica enormemente la infraestructura de deployment.
          </p>
        </div>
      </section>

      {/* Section 02: Plugin & Channel Architecture */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Arquitectura de Plugins y Canales</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Una interfaz para gobernar 15+ plataformas
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Una embajada con protocolo diplomatico estandarizado. No importa si el visitante
            es de Francia, Japon o Brasil —
            <span className="text-j-text"> el protocolo de recepcion es el mismo. Cada embajador (plugin) conoce
            las costumbres locales, pero la embajada solo entiende un formato.</span>
          </p>
        </div>

        <p className="text-j-text-secondary leading-relaxed mb-6">
          OpenClaw soporta 15+ plataformas de comunicacion (Slack, Discord, WhatsApp,
          Telegram, email, SMS...) a traves de una unica abstraccion: el ChannelDock.
          Cada canal implementa la misma interfaz, y el sistema de plugins permite
          agregar nuevos canales sin modificar el core del agente.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#6366f1] bg-[#6366f1]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">Plugin approach</p>
            <p className="text-sm text-j-text mb-1">ChannelDock abstraction</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Un canal nuevo = un plugin nuevo</p>
              <p>+ Core del agente intocable</p>
              <p>+ Hot-loading de plugins en runtime</p>
              <p className="text-j-text-tertiary">- Complejidad de la abstraccion</p>
              <p className="text-j-text-tertiary">- Testing de N combinaciones</p>
            </div>
          </div>
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Direct integration</p>
            <p className="text-sm text-j-text mb-1">Cada canal integrado al core</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Simplicidad inicial</p>
              <p>+ Sin capa de abstraccion</p>
              <p className="text-j-text-tertiary">- Modificar core por cada canal</p>
              <p className="text-j-text-tertiary">- Acoplamiento creciente</p>
              <p className="text-j-text-tertiary">- Deployment monolitico</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#6366f1] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            La abstraccion ChannelDock normaliza las diferencias entre plataformas (rate limits,
            formatos de media, threading models) en una{' '}
            <span className="text-[#6366f1]">interfaz uniforme de send/receive</span>. El agente nunca sabe si
            esta respondiendo en Slack o WhatsApp — y esa ignorancia es una feature, no un bug.
          </p>
        </div>
      </section>

      {/* Section 03: Skills y Orquestacion */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Skills y Orquestacion de Herramientas</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              De 1Password a home automation
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Una navaja suiza con herramientas reemplazables. El cuerpo (el agente) es siempre el mismo,
            pero puedes intercambiar la hoja por un destornillador, una sierra o un sacacorchos.
            <span className="text-j-text"> Cada skill se registra, declara sus capacidades, y el agente decide cuando usarla.</span>
          </p>
        </div>

        <p className="text-j-text-secondary leading-relaxed mb-6">
          Las Skills en OpenClaw son modulos autocontenidos que extienden las capacidades del agente:
          gestion de passwords (1Password), home automation (Home Assistant), calendario,
          busqueda web, y docenas mas. Cada skill declara su schema y sus boundaries de seguridad.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#6366f1] bg-[#6366f1]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">OpenClaw Skills</p>
            <p className="text-sm text-j-text mb-1">Modulos con safety boundaries</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Cada skill declara permisos explicitos</p>
              <p>+ Confirmacion del usuario para acciones destructivas</p>
              <p>+ Schema declarativo de input/output</p>
              <p className="text-j-text-tertiary">- Overhead de declaracion</p>
              <p className="text-j-text-tertiary">- Menos flexible que codigo libre</p>
            </div>
          </div>
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">LangChain Tools</p>
            <p className="text-sm text-j-text mb-1">Funciones Python directas</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Maximo de flexibilidad</p>
              <p>+ Ecosistema enorme</p>
              <p className="text-j-text-tertiary">- Sin boundaries de seguridad nativos</p>
              <p className="text-j-text-tertiary">- El dev debe implementar permisos</p>
              <p className="text-j-text-tertiary">- Ejecucion opaca</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#6366f1] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            OpenClaw implementa <span className="text-[#6366f1]">safety boundaries como ciudadanos de primera clase</span>:
            las acciones destructivas (borrar archivos, enviar dinero, modificar configuracion)
            requieren confirmacion explicita del usuario antes de ejecutarse. La seguridad no es
            una capa adicional — esta integrada en el modelo de skills.
          </p>
        </div>
      </section>

      {/* Section 04: Memoria Persistente */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Memoria Persistente y Autenticacion</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Dos capas para no olvidar
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Dos sistemas de memoria: un bloc de notas (memory-core) donde apuntas cosas rapidas
            en archivos planos, y una biblioteca con buscador semantico (memory-lancedb) donde
            guardas conocimiento profundo y lo recuperas por significado.
            <span className="text-j-text"> El bloc es rapido y barato; la biblioteca es potente pero costosa.</span>
          </p>
        </div>

        <p className="text-j-text-secondary leading-relaxed mb-6">
          OpenClaw implementa memoria persistente en dos capas complementarias. memory-core
          almacena informacion en archivos planos con recuperacion por indice, mientras que
          memory-lancedb usa embeddings vectoriales para busqueda semantica. Ambas capas
          se coordinan a traves de hooks automaticos: autoCapture y autoRecall.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#6366f1] bg-[#6366f1]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">memory-core (archivos)</p>
            <p className="text-sm text-j-text mb-1">Recuperacion por indice</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Determinista y transparente</p>
              <p>+ Bajo costo computacional</p>
              <p>+ Editable por humanos</p>
              <p className="text-j-text-tertiary">- Requiere buena organizacion manual</p>
              <p className="text-j-text-tertiary">- Sin busqueda semantica</p>
            </div>
          </div>
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">memory-lancedb (vectores)</p>
            <p className="text-sm text-j-text mb-1">Busqueda por embeddings</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Busqueda por significado, no solo keywords</p>
              <p>+ Descubre conexiones no explicitas</p>
              <p className="text-j-text-tertiary">- Costoso en computo (embeddings)</p>
              <p className="text-j-text-tertiary">- Opaco — dificil de inspeccionar</p>
              <p className="text-j-text-tertiary">- Dependencia de modelo de embeddings</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#6366f1] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Los hooks <span className="text-[#6366f1]">autoCapture y autoRecall</span> son el mecanismo que hace
            que la memoria sea invisible para el agente. autoCapture extrae automaticamente hechos
            relevantes de cada conversacion; autoRecall inyecta contexto relevante al inicio de cada
            sesion. El agente no decide que recordar — el sistema lo hace por el.
          </p>
        </div>
      </section>

      {/* Section 05: A2UI */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">A2UI: Interfaces Generadas por Agentes</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              JSON declarativo, no codigo ejecutable
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Un arquitecto entrega planos (JSON declarativo), y los constructores (renderers)
            edifican con materiales locales (componentes nativos de cada plataforma).
            <span className="text-j-text"> El arquitecto nunca toca un ladrillo — solo describe lo que quiere.
            Los constructores garantizan que la estructura sea segura.</span>
          </p>
        </div>

        <p className="text-j-text-secondary leading-relaxed mb-6">
          A2UI (Agent-to-User Interface) es el sistema de OpenClaw para que los agentes generen
          interfaces de usuario ricas sin escribir codigo ejecutable. El agente emite JSON
          declarativo que describe la UI deseada, y renderers especificos de cada plataforma
          lo convierten en componentes nativos (React, SwiftUI, etc.).
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#6366f1] bg-[#6366f1]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">Declarative JSON</p>
            <p className="text-sm text-j-text mb-1">El agente describe, no ejecuta</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Seguridad por diseno — no hay codigo ejecutable</p>
              <p>+ Portable entre plataformas</p>
              <p>+ Validable con JSON Schema</p>
              <p className="text-j-text-tertiary">- Limitado a componentes predefinidos</p>
              <p className="text-j-text-tertiary">- Menos expresivo que codigo libre</p>
            </div>
          </div>
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Code generation</p>
            <p className="text-sm text-j-text mb-1">El agente genera React/HTML</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+ Flexibilidad total</p>
              <p>+ Componentes custom ilimitados</p>
              <p className="text-j-text-tertiary">- Riesgo de XSS y code injection</p>
              <p className="text-j-text-tertiary">- No portable entre plataformas</p>
              <p className="text-j-text-tertiary">- Requiere sandboxing del render</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#6366f1] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#6366f1] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            La decision de usar JSON declarativo en vez de generacion de codigo es{' '}
            <span className="text-[#6366f1]">security-first rendering</span>: el agente nunca puede inyectar codigo
            ejecutable en el cliente. La superficie de ataque se reduce a un schema JSON validable,
            eliminando por completo vectores de XSS y code injection.
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20">
        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4 text-center">
            Mnemonico
          </p>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="px-3 py-2 border border-[#6366f1] bg-[#6366f1]/5 text-center">
              <p className="text-lg font-light text-[#6366f1]">P</p>
              <p className="font-mono text-[8px] text-j-text-tertiary">Protocolo</p>
            </div>
            <div className="px-3 py-2 border border-[#6366f1] bg-[#6366f1]/5 text-center">
              <p className="text-lg font-light text-[#6366f1]">S</p>
              <p className="font-mono text-[8px] text-j-text-tertiary">Skills</p>
            </div>
            <div className="px-3 py-2 border border-[#6366f1] bg-[#6366f1]/5 text-center">
              <p className="text-lg font-light text-[#6366f1]">M</p>
              <p className="font-mono text-[8px] text-j-text-tertiary">Memoria</p>
            </div>
            <div className="px-3 py-2 border border-[#6366f1] bg-[#6366f1]/5 text-center">
              <p className="text-lg font-light text-[#6366f1]">U</p>
              <p className="font-mono text-[8px] text-j-text-tertiary">UI</p>
            </div>
            <div className="px-3 py-2 border border-[#6366f1] bg-[#6366f1]/5 text-center">
              <p className="text-lg font-light text-[#6366f1]">A</p>
              <p className="font-mono text-[8px] text-j-text-tertiary">Arquitectura</p>
            </div>
          </div>

          <p className="text-center text-sm text-j-text-secondary">
            <span className="font-mono text-[#6366f1]">PSMUA</span> — Los cinco pilares de OpenClaw:
            Protocolo (ACP), Skills, Memoria, UI (A2UI), Arquitectura de plugins
          </p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          ¿Que decisiones arquitectonicas de OpenClaw sacrifican simplicidad por extensibilidad,
          <span className="text-j-text"> y cuales lo contrario?</span>
        </p>
      </section>
    </article>
  );
}
