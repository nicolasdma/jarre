export function AgentSandboxPatterns() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#059669]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Article · Harrison Chase (LangChain)
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Los Dos Patrones
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          Agente ↔ Sandbox
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Harrison Chase plantea que existen exactamente dos arquitecturas para conectar
          agentes de IA a entornos de ejecucion aislados. La decision entre ellas no es
          preferencia — es una funcion del modelo de seguridad, velocidad de iteracion
          y necesidades de paralelizacion.
        </p>
      </header>

      {/* Visual overview: Pattern 1 vs Pattern 2 */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-6">
          Vista general
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#2d4a6a] bg-[#2d4a6a]/5 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-3">
              Pattern 1
            </p>
            <p className="text-j-text mb-1">Agent IN Sandbox</p>
            <p className="text-xs text-j-text-tertiary">El agente vive dentro del contenedor</p>

            <div className="mt-4 p-3 border border-[#2d4a6a]/30 bg-[#2d4a6a]/5">
              <p className="font-mono text-[10px] text-[#2d4a6a] mb-2">Docker / VM</p>
              <div className="flex items-center justify-center gap-2">
                <div className="px-2 py-1 bg-[#2d4a6a]/10 border border-[#2d4a6a]/30">
                  <p className="font-mono text-[9px] text-[#2d4a6a]">Agent</p>
                </div>
                <span className="text-[10px] text-j-text-tertiary">+</span>
                <div className="px-2 py-1 bg-[#2d4a6a]/10 border border-[#2d4a6a]/30">
                  <p className="font-mono text-[9px] text-[#2d4a6a]">Tools</p>
                </div>
                <span className="text-[10px] text-j-text-tertiary">+</span>
                <div className="px-2 py-1 bg-[#2d4a6a]/10 border border-[#2d4a6a]/30">
                  <p className="font-mono text-[9px] text-[#2d4a6a]">Files</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border border-[#059669] bg-[#059669]/5 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">
              Pattern 2
            </p>
            <p className="text-j-text mb-1">Sandbox as Tool</p>
            <p className="text-xs text-j-text-tertiary">El agente llama al sandbox remotamente</p>

            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="px-2 py-1 bg-[#059669]/10 border border-[#059669]/30">
                <p className="font-mono text-[9px] text-[#059669]">Agent</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-mono text-[9px] text-j-text-tertiary">API/SDK</span>
                <span className="text-xs text-[#059669]">→</span>
              </div>
              <div className="p-2 border border-[#059669]/30 bg-[#059669]/5">
                <p className="font-mono text-[9px] text-[#059669] mb-1">Sandbox</p>
                <div className="flex gap-1">
                  <div className="px-1 bg-[#059669]/10">
                    <p className="font-mono text-[8px] text-[#059669]">Tools</p>
                  </div>
                  <div className="px-1 bg-[#059669]/10">
                    <p className="font-mono text-[8px] text-[#059669]">Files</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            La diferencia fundamental es donde vive el agente, no donde se ejecuta el codigo.
            Esto determina el modelo de seguridad completo.
          </p>
        </div>
      </section>

      {/* Section 01: Por Que Sandboxes */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Por Que Sandboxes</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El problema de seguridad
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
            Un agente con acceso a tu filesystem es como darle las llaves de tu casa a un desconocido.
            <span className="text-j-text"> Puede que haga lo que le pediste. Puede que borre /etc.</span>
          </p>
        </div>

        <p className="text-j-text-secondary leading-relaxed mb-6">
          Los agentes de IA necesitan ejecutar codigo, manipular archivos y usar herramientas.
          Hacerlo directamente en la maquina del desarrollador es un riesgo de seguridad inaceptable.
          Los sandboxes (contenedores Docker, VMs, microVMs) proporcionan aislamiento.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Ejecucion de codigo</p>
              <p className="text-sm text-j-text-tertiary">El agente genera y ejecuta scripts</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Aislamiento</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Acceso a filesystem</p>
              <p className="text-sm text-j-text-tertiary">Lee, crea, modifica archivos</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Contenedor</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Uso de herramientas</p>
              <p className="text-sm text-j-text-tertiary">Instala paquetes, ejecuta comandos</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Permisos limitados</p>
          </div>
        </div>
      </section>

      {/* Section 02: Pattern 1 — Agent IN Sandbox */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Pattern 1 — Agent IN Sandbox</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Todo dentro del contenedor
            </p>
          </div>
        </div>

        {/* Architecture diagram */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">Arquitectura</p>

          <div className="flex flex-col items-center gap-3">
            {/* Docker boundary */}
            <div className="w-full border-2 border-dashed border-[#2d4a6a]/40 p-4">
              <p className="font-mono text-[10px] text-[#2d4a6a] mb-3 text-center">Docker Container / VM</p>
              <div className="flex items-center justify-center gap-4">
                <div className="px-3 py-2 bg-[#2d4a6a]/10 border border-[#2d4a6a]/30 text-center">
                  <p className="font-mono text-[10px] text-[#2d4a6a]">LLM Agent</p>
                  <p className="font-mono text-[8px] text-j-text-tertiary">+ API Keys</p>
                </div>
                <span className="text-xs text-j-text-tertiary">↔</span>
                <div className="px-3 py-2 bg-[#2d4a6a]/10 border border-[#2d4a6a]/30 text-center">
                  <p className="font-mono text-[10px] text-[#2d4a6a]">Filesystem</p>
                </div>
                <span className="text-xs text-j-text-tertiary">↔</span>
                <div className="px-3 py-2 bg-[#2d4a6a]/10 border border-[#2d4a6a]/30 text-center">
                  <p className="font-mono text-[10px] text-[#2d4a6a]">Tools</p>
                </div>
              </div>
            </div>
            <span className="text-xs text-j-text-tertiary">↕ red aislada</span>
            <div className="px-3 py-2 border border-j-border text-center">
              <p className="font-mono text-[10px] text-j-text-tertiary">Host / Maquina del dev</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Beneficios</p>
          <ul className="space-y-2 text-sm text-[#5a5a52]">
            <li>+ Acceso directo al filesystem — el agente lee y escribe como un dev real</li>
            <li>+ Espejo del entorno de desarrollo — mismas dependencias, misma estructura</li>
            <li>+ Sin latencia de red entre agente y herramientas</li>
          </ul>
        </div>

        <div className="border-l-2 border-[#2d4a6a] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">Caso de uso ideal</p>
          <p className="text-j-text">
            Cuando necesitas que el agente trabaje exactamente como un desarrollador humano:
            navegando archivos, editando codigo, corriendo tests.
          </p>
        </div>
      </section>

      {/* Section 03: Trade-offs de Pattern 1 */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Trade-offs de Pattern 1</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Los costos de tener todo adentro
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">API Keys expuestas</p>
              <p className="text-sm text-j-text-tertiary">Las claves viven dentro del sandbox con el agente</p>
            </div>
            <p className="font-mono text-xs text-j-warm">Riesgo de seguridad</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Rebuild por cada cambio</p>
              <p className="text-sm text-j-text-tertiary">Modificar el agente requiere reconstruir el contenedor</p>
            </div>
            <p className="font-mono text-xs text-j-warm">Iteracion lenta</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Privilegios uniformes</p>
              <p className="text-sm text-j-text-tertiary">El agente tiene acceso a todo dentro del sandbox</p>
            </div>
            <p className="font-mono text-xs text-j-warm">Sin granularidad</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Es como enviar a un empleado a una oficina remota con todas las llaves y credenciales.
            <span className="text-j-text"> Funciona, pero si algo sale mal, esta solo con acceso total.</span>
          </p>
        </div>
      </section>

      {/* Section 04: Pattern 2 — Sandbox as Tool */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Pattern 2 — Sandbox as Tool</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El sandbox es una herramienta mas
            </p>
          </div>
        </div>

        {/* Architecture diagram */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">Arquitectura</p>

          <div className="flex items-center justify-center gap-6">
            {/* Agent side */}
            <div className="border border-[#059669]/30 p-4 text-center">
              <p className="font-mono text-[10px] text-[#059669] mb-2">Local / Host</p>
              <div className="px-3 py-2 bg-[#059669]/10 border border-[#059669]/30">
                <p className="font-mono text-[10px] text-[#059669]">LLM Agent</p>
                <p className="font-mono text-[8px] text-j-text-tertiary">+ API Keys</p>
              </div>
            </div>

            {/* Connection */}
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[9px] text-j-text-tertiary">API / SDK</span>
              <div className="w-16 h-px bg-[#059669]" />
              <span className="font-mono text-[9px] text-j-text-tertiary">HTTP</span>
            </div>

            {/* Sandbox side */}
            <div className="border-2 border-dashed border-[#059669]/40 p-4 text-center">
              <p className="font-mono text-[10px] text-[#059669] mb-2">Sandbox Remoto</p>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-[#059669]/10 border border-[#059669]/30">
                  <p className="font-mono text-[9px] text-[#059669]">Filesystem</p>
                </div>
                <div className="px-2 py-1 bg-[#059669]/10 border border-[#059669]/30">
                  <p className="font-mono text-[9px] text-[#059669]">Tools</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-j-text-secondary mt-4 text-center">
            Las API keys <span className="font-mono text-[#059669]">nunca entran</span> al sandbox
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Beneficios</p>
          <ul className="space-y-2 text-sm text-[#5a5a52]">
            <li>+ API keys aisladas — las credenciales nunca entran al sandbox</li>
            <li>+ Iteracion rapida — cambias el agente sin reconstruir el contenedor</li>
            <li>+ Paralelizacion — un agente puede lanzar multiples sandboxes en paralelo</li>
            <li>+ Fault isolation — si el sandbox muere, el agente sigue vivo</li>
          </ul>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Trade-off principal</p>
          <p className="text-j-text">
            Latencia de red entre agente y sandbox. Pero Chase argumenta que es mitigable
            y que los beneficios de seguridad y paralelizacion lo compensan con creces.
          </p>
        </div>
      </section>

      {/* Section 05: Comparacion */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Comparacion</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Dimension por dimension
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <div className="grid grid-cols-3 gap-4 mb-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">Dimension</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase text-center">Agent IN</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase text-center">Sandbox as Tool</p>
          </div>

          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-j-border">
              <p className="text-sm text-j-text">API Keys</p>
              <p className="text-sm text-j-text-tertiary text-center">Dentro del sandbox</p>
              <p className="text-sm text-[#059669] text-center">Fuera, aisladas</p>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-j-border">
              <p className="text-sm text-j-text">Iteracion</p>
              <p className="text-sm text-j-text-tertiary text-center">Rebuild contenedor</p>
              <p className="text-sm text-[#059669] text-center">Hot reload local</p>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-j-border">
              <p className="text-sm text-j-text">Paralelismo</p>
              <p className="text-sm text-j-text-tertiary text-center">1 agente = 1 sandbox</p>
              <p className="text-sm text-[#059669] text-center">1 agente = N sandboxes</p>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-j-border">
              <p className="text-sm text-j-text">Latencia</p>
              <p className="text-sm text-[#059669] text-center">Cero (local)</p>
              <p className="text-sm text-j-text-tertiary text-center">Red (mitigable)</p>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-j-border">
              <p className="text-sm text-j-text">Filesystem</p>
              <p className="text-sm text-[#059669] text-center">Acceso directo</p>
              <p className="text-sm text-j-text-tertiary text-center">Via API</p>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3">
              <p className="text-sm text-j-text">Fault isolation</p>
              <p className="text-sm text-j-text-tertiary text-center">Agente muere con sandbox</p>
              <p className="text-sm text-[#059669] text-center">Independientes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 06: Criterios de Decision */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">06</span>
          <div>
            <h2 className="text-xl text-j-text">Criterios de Decision</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Como elegir el patron correcto
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-5 border border-j-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#059669]">01</span>
              <p className="text-j-text font-medium">Modelo de seguridad</p>
            </div>
            <p className="text-sm text-j-text-tertiary">
              ¿Donde viven tus API keys? Si no pueden estar en el sandbox → Pattern 2.
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#059669]">02</span>
              <p className="text-j-text font-medium">Velocidad de iteracion</p>
            </div>
            <p className="text-sm text-j-text-tertiary">
              ¿Cambias el agente frecuentemente? Si rebuild es costoso → Pattern 2.
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#059669]">03</span>
              <p className="text-j-text font-medium">Necesidad de paralelizacion</p>
            </div>
            <p className="text-sm text-j-text-tertiary">
              ¿Un agente necesita multiples entornos simultaneos? → Pattern 2.
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#059669]">04</span>
              <p className="text-j-text font-medium">Fidelidad del entorno</p>
            </div>
            <p className="text-sm text-j-text-tertiary">
              ¿El agente necesita ver exactamente lo que ve un dev? → Pattern 1.
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Tendencia del mercado</p>
          <p className="text-j-text">
            El ecosistema (E2B, Modal, Daytona, Runloop) converge hacia Pattern 2.
            La seguridad y la paralelizacion pesan mas que la latencia de red.
          </p>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-6">
          Ecosistema actual
        </p>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center py-4 border border-j-border">
            <p className="text-j-text text-sm mb-1">E2B</p>
            <p className="font-mono text-[9px] text-[#059669]">Pattern 2</p>
          </div>
          <div className="text-center py-4 border border-j-border">
            <p className="text-j-text text-sm mb-1">Modal</p>
            <p className="font-mono text-[9px] text-[#059669]">Pattern 2</p>
          </div>
          <div className="text-center py-4 border border-j-border">
            <p className="text-j-text text-sm mb-1">Daytona</p>
            <p className="font-mono text-[9px] text-[#059669]">Pattern 2</p>
          </div>
          <div className="text-center py-4 border border-j-border">
            <p className="text-j-text text-sm mb-1">Runloop</p>
            <p className="font-mono text-[9px] text-[#059669]">Pattern 2</p>
          </div>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si tu agente necesita ejecutar codigo con acceso a APIs externas,
          <span className="text-j-text"> ¿donde deberian vivir las credenciales y por que?</span>
        </p>
      </section>
    </article>
  );
}
