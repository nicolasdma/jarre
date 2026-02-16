export function ClawvaultAgentMemory() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#059669]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Article · Pedro (@sillydarket)
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Memoria para Agentes
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          El Approach ClawVault
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Los agentes de IA sufren de amnesia total entre sesiones. ClawVault propone
          que la solucion no es mas infraestructura, sino archivos markdown planos
          con una estructura inteligente. El problema nunca fue almacenar — fue
          recuperar selectivamente.
        </p>
      </header>

      {/* Visual: The Problem — Context Death */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-6 text-center">
          El problema fundamental
        </p>

        <div className="flex items-center justify-center gap-3">
          <div className="px-4 py-3 border border-[#059669] bg-[#059669]/5 text-center">
            <p className="font-mono text-[10px] text-[#059669] uppercase mb-1">Sesion 1</p>
            <p className="text-xs text-j-text">Contexto rico</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-px bg-[#991b1b]" />
            <p className="font-mono text-[9px] text-[#991b1b] mt-1">muerte</p>
          </div>
          <div className="px-4 py-3 border border-[#059669] bg-[#059669]/5 text-center">
            <p className="font-mono text-[10px] text-[#059669] uppercase mb-1">Sesion 2</p>
            <p className="text-xs text-j-text">Desde cero</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-px bg-[#991b1b]" />
            <p className="font-mono text-[9px] text-[#991b1b] mt-1">muerte</p>
          </div>
          <div className="px-4 py-3 border border-[#059669] bg-[#059669]/5 text-center">
            <p className="font-mono text-[10px] text-[#059669] uppercase mb-1">Sesion 3</p>
            <p className="text-xs text-j-text">Desde cero</p>
          </div>
        </div>

        <p className="text-center text-sm text-j-text-tertiary mt-4">
          Cada sesion empieza sin memoria. Todo el contexto acumulado se pierde.
        </p>
      </section>

      {/* Section 01: Context Death */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Context Death</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              La amnesia de los agentes
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
            Imagina un asistente brillante que cada manana olvida todo lo que hicieron juntos ayer.
            <span className="text-j-text"> No le falta inteligencia — le falta memoria persistente.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">No es</p>
            <p className="text-j-text-tertiary">Un problema de almacenamiento</p>
            <p className="text-j-text-tertiary">Guardar datos es trivial</p>
          </div>
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Es</p>
            <p className="text-j-text">Un problema de recuperacion selectiva</p>
            <p className="text-j-text">Saber que cargar y cuando</p>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            La ventana de contexto del LLM es finita. No puedes cargar toda la memoria — necesitas
            un sistema que <span className="text-[#059669]">seleccione inteligentemente</span> que recordar en cada momento.
          </p>
        </div>
      </section>

      {/* Section 02: Markdown > Infraestructura */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Markdown Supera a la Infraestructura</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Benchmark: archivos planos vs herramientas especializadas
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
            LoCoMo Benchmark
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-[#059669]">.md plano (ClawVault)</span>
                <span className="font-mono text-xs text-[#059669]">74.0%</span>
              </div>
              <div className="h-2 bg-j-border">
                <div className="h-full bg-[#059669]" style={{ width: '74%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-j-text-tertiary">Mem0 (especializado)</span>
                <span className="font-mono text-xs text-j-text-tertiary">68.5%</span>
              </div>
              <div className="h-2 bg-j-border">
                <div className="h-full bg-j-text-tertiary" style={{ width: '68.5%' }} />
              </div>
            </div>
          </div>

          <p className="text-sm text-[#5a5a52]">
            <span className="text-j-text">Archivos markdown planos superan a herramientas especializadas.</span>{' '}
            Los LLMs entienden markdown nativamente porque fueron entrenados con cantidades masivas de texto en ese formato.
          </p>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Por que funciona</p>
          <p className="text-j-text">
            El markdown es parte del lenguaje nativo de los LLMs. No necesitas serializacion,
            parsing especial, ni adaptadores. <span className="text-[#059669]">El formato ya esta en los pesos del modelo.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Arquitectura Obsidian */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Arquitectura Obsidian</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Tres capas de estructura
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="relative p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">
              Capa 1 — YAML Frontmatter
            </p>
            <p className="text-sm text-j-text mb-1">Metadata estructurada al inicio de cada nota</p>
            <p className="text-xs text-j-text-tertiary">
              Tipo, prioridad, fecha, tags — legible por humanos y maquinas
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-px h-4 bg-j-border" />
          </div>

          <div className="relative p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">
              Capa 2 — Wiki-links
            </p>
            <p className="text-sm text-j-text mb-1">Conexiones asociativas entre notas</p>
            <p className="text-xs text-j-text-tertiary">
              [[nota-destino]] crea un grafo de conocimiento navegable
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-px h-4 bg-j-border" />
          </div>

          <div className="relative p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">
              Capa 3 — Estructura de Carpetas
            </p>
            <p className="text-sm text-j-text mb-1">Taxonomia jerarquica del vault</p>
            <p className="text-xs text-j-text-tertiary">
              Organizacion por tipo de memoria: decisions/, preferences/, etc.
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Como un cerebro: el YAML es la etiqueta del recuerdo, los wiki-links son las sinapsis
            entre memorias, y las carpetas son las regiones cerebrales especializadas.
            <span className="text-j-text"> Tres niveles de organizacion, todos en texto plano.</span>
          </p>
        </div>
      </section>

      {/* Section 04: Taxonomia de Memoria */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Taxonomia de Memoria</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Cinco tipos con patrones de acceso distintos
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Decisions</p>
              <p className="text-sm text-j-text-tertiary">Decisiones tomadas y su razonamiento</p>
            </div>
            <p className="font-mono text-xs text-[#059669]">Acceso frecuente</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Preferences</p>
              <p className="text-sm text-j-text-tertiary">Preferencias del usuario sobre estilo y proceso</p>
            </div>
            <p className="font-mono text-xs text-[#059669]">Cada sesion</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Relationships</p>
              <p className="text-sm text-j-text-tertiary">Personas, proyectos y conexiones entre entidades</p>
            </div>
            <p className="font-mono text-xs text-j-text-tertiary">Bajo demanda</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Commitments</p>
              <p className="text-sm text-j-text-tertiary">Promesas, deadlines y acuerdos pendientes</p>
            </div>
            <p className="font-mono text-xs text-[#991b1b]">Critico</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Lessons</p>
              <p className="text-sm text-j-text-tertiary">Errores pasados y lecciones aprendidas</p>
            </div>
            <p className="font-mono text-xs text-j-warm-dark">Larga vida</p>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Clave del diseno</p>
          <p className="text-j-text">
            Cada tipo de memoria tiene un patron de acceso y un tiempo de vida diferente.
            <span className="text-[#059669]"> La taxonomia determina como y cuando se inyecta en el contexto.</span>
          </p>
        </div>
      </section>

      {/* Section 05: Budget-Aware Loading */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Budget-Aware Loading</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Inyeccion de contexto por prioridad
            </p>
          </div>
        </div>

        <p className="text-j-text-secondary leading-relaxed mb-8">
          La ventana de contexto tiene un limite fijo. El sistema llena el espacio disponible
          cargando memorias por orden de prioridad — lo critico primero, lo secundario si cabe.
        </p>

        <div className="space-y-4 mb-8">
          <div className="p-4 border border-[#991b1b] bg-[#991b1b]/5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase">
                Critico
              </p>
              <p className="font-mono text-xs text-[#991b1b]">Siempre se carga</p>
            </div>
            <div className="h-2 bg-j-border">
              <div className="h-full bg-[#991b1b]" style={{ width: '100%' }} />
            </div>
            <p className="text-xs text-j-text-tertiary mt-2">
              Commitments activos, decisiones recientes, preferencias del usuario
            </p>
          </div>

          <div className="p-4 border border-[#ca8a04] bg-[#ca8a04]/5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#ca8a04] uppercase">
                Notable
              </p>
              <p className="font-mono text-xs text-[#ca8a04]">Si hay espacio</p>
            </div>
            <div className="h-2 bg-j-border">
              <div className="h-full bg-[#ca8a04]" style={{ width: '65%' }} />
            </div>
            <p className="text-xs text-j-text-tertiary mt-2">
              Lecciones relevantes, relaciones del proyecto actual
            </p>
          </div>

          <div className="p-4 border border-[#059669] bg-[#059669]/5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase">
                Background
              </p>
              <p className="font-mono text-xs text-[#059669]">Solo si sobra</p>
            </div>
            <div className="h-2 bg-j-border">
              <div className="h-full bg-[#059669]" style={{ width: '30%' }} />
            </div>
            <p className="text-xs text-j-text-tertiary mt-2">
              Contexto historico, relaciones lejanas, decisiones antiguas
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Como hacer una maleta con espacio limitado: primero el pasaporte y medicinas,
            luego la ropa esencial, y si queda espacio, los libros.
            <span className="text-j-text"> Nunca llevas todo — priorizas lo que importa.</span>
          </p>
        </div>
      </section>

      {/* Section 06: Vault Index */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">06</span>
          <div>
            <h2 className="text-xl text-j-text">Vault Index</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Recuperacion en dos pasos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Paso 1: Leer indice</p>
            <p className="text-sm text-j-text mb-2">~200 tokens</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Un archivo resumen con todas las notas disponibles</p>
              <p>Titulo, tipo y relevancia de cada nota</p>
              <p>El agente decide que necesita antes de cargar nada</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Paso 2: Fetch selectivo</p>
            <p className="text-sm text-j-text mb-2">Solo lo necesario</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Cargar unicamente las notas relevantes al contexto actual</p>
              <p>Evitar saturar la ventana con informacion irrelevante</p>
              <p>El agente tiene agency sobre su propia memoria</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">Index-based</p>
            <p className="text-sm text-j-text-tertiary">Determinista, barato, explicable</p>
            <p className="text-xs text-j-text-tertiary mt-1">El agente lee un mapa y decide</p>
          </div>
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">Embedding-based</p>
            <p className="text-sm text-j-text-tertiary">Semantico, costoso, opaco</p>
            <p className="text-xs text-j-text-tertiary mt-1">Busqueda vectorial por similitud</p>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Trade-off central</p>
          <p className="text-j-text">
            El indice es mas barato y transparente, pero requiere que las notas esten bien
            tituladas y categorizadas. <span className="text-[#059669]">La calidad de la recuperacion depende de la calidad de la organizacion.</span>
          </p>
        </div>
      </section>

      {/* Section 07: Data Sovereignty */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">07</span>
          <div>
            <h2 className="text-xl text-j-text">Soberania de Datos</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Zero cloud, full local
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">Ventajas del texto plano</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#059669]">01</span>
              <p className="text-sm text-j-text">Sin dependencia de servicios cloud — funciona offline</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#059669]">02</span>
              <p className="text-sm text-j-text">Portabilidad total — son archivos .md, se mueven a cualquier lado</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#059669]">03</span>
              <p className="text-sm text-j-text">Versionable con git — historial completo de cambios</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#059669]">04</span>
              <p className="text-sm text-j-text">Legible por humanos — puedes inspeccionar y editar la memoria directamente</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Principio de diseno</p>
          <p className="text-j-text">
            La memoria del agente debe ser <span className="text-[#059669]">propiedad del usuario</span>,
            no de un proveedor de infraestructura. Archivos planos garantizan eso por definicion.
          </p>
        </div>
      </section>

      {/* Knowledge Graph Visual */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-6 text-center">
          Grafo de conocimiento via wiki-links
        </p>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="w-16 h-16 border border-[#059669] flex items-center justify-center mb-2">
                <span className="font-mono text-[9px] text-[#059669]">decision</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-px bg-j-border" />
              <span className="font-mono text-[8px] text-j-text-tertiary">[[link]]</span>
              <div className="w-12 h-px bg-j-border" />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 border border-j-warm-dark flex items-center justify-center mb-2">
                <span className="font-mono text-[9px] text-j-warm-dark">lesson</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-px bg-j-border" />
              <span className="font-mono text-[8px] text-j-text-tertiary">[[link]]</span>
              <div className="w-12 h-px bg-j-border" />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 border border-[#ca8a04] flex items-center justify-center mb-2">
                <span className="font-mono text-[9px] text-[#ca8a04]">commit</span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-j-text-tertiary mt-4">
            Cada [[wiki-link]] crea una arista en el grafo. Recuperacion por traversal, no por embedding.
          </p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si tu agente pudiera recordar <span className="text-j-text">solo 5 cosas</span> entre sesiones,
          ¿cuales elegirias y por que?
        </p>
      </section>
    </article>
  );
}
