export function DDIAChapter1() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#4a5d4a]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
            DDIA · Capítulo 1
          </span>
        </div>

        <h1 className="text-4xl font-light text-[#2c2c2c] mb-2">
          Los Tres Pilares
        </h1>
        <p className="text-2xl font-light text-[#9c9a8e]">
          de los Sistemas de Datos
        </p>

        <p className="mt-8 text-[#7a7a6e] leading-relaxed max-w-xl">
          Kleppmann argumenta que todo sistema de datos exitoso se sostiene sobre tres propiedades fundamentales.
          Si una falla, el sistema eventualmente colapsa.
        </p>
      </header>

      {/* Visual: The Three Pillars */}
      <section className="mb-20">
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-px h-24 bg-[#4a5d4a]" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-1">
              Confiabilidad
            </p>
            <p className="text-[10px] text-[#9c9a8e]">Reliability</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 w-px h-24 bg-[#4a5d4a]" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-1">
              Escalabilidad
            </p>
            <p className="text-[10px] text-[#9c9a8e]">Scalability</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 w-px h-24 bg-[#4a5d4a]" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-1">
              Mantenibilidad
            </p>
            <p className="text-[10px] text-[#9c9a8e]">Maintainability</p>
          </div>
        </div>
        <div className="h-px bg-[#e8e6e0] mt-4" />
      </section>

      {/* Pillar 1: Reliability */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Confiabilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El sistema que no te traiciona
            </p>
          </div>
        </div>

        {/* Analogy */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Analogía</p>
          <p className="text-[#5a5a52]">
            Un auto confiable arranca en invierno, con lluvia, después de 10 años.
            <span className="text-[#2c2c2c]"> No solo cuando las condiciones son perfectas.</span>
          </p>
        </div>

        {/* Fault types */}
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Tres tipos de fallas
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Hardware</p>
              <p className="text-sm text-[#9c9a8e]">Disco muere, RAM corrupta</p>
            </div>
            <p className="font-mono text-xs text-[#4a5d4a]">→ Redundancia</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Software</p>
              <p className="text-sm text-[#9c9a8e]">Bug en producción, cascading failure</p>
            </div>
            <p className="font-mono text-xs text-[#4a5d4a]">→ Testing + Rollback</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Humanos</p>
              <p className="text-sm text-[#9c9a8e]">DELETE sin WHERE, config mal</p>
            </div>
            <p className="font-mono text-xs text-[#4a5d4a]">→ Permisos + Backups</p>
          </div>
        </div>

        {/* Key question */}
        <div className="border-l-2 border-[#4a5d4a] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-2">Pregunta clave</p>
          <p className="text-lg text-[#2c2c2c]">"¿Qué pasa cuando X falla?"</p>
          <p className="text-sm text-[#9c9a8e] mt-1">
            Si no puedes responder para cada componente, tu sistema no es confiable.
          </p>
        </div>
      </section>

      {/* Pillar 2: Scalability */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Escalabilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El sistema que crece contigo
            </p>
          </div>
        </div>

        {/* Anti-definition */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-2">No es</p>
            <p className="text-[#9c9a8e]">"Rápido"</p>
            <p className="text-[#9c9a8e]">"Maneja mucho tráfico"</p>
          </div>
          <div className="p-5 border border-[#4a5d4a] bg-[#4a5d4a]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-2">Es</p>
            <p className="text-[#2c2c2c]">"Cuando el tráfico crece 10x,</p>
            <p className="text-[#2c2c2c]">¿qué tengo que cambiar?"</p>
          </div>
        </div>

        {/* Percentiles */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">Concepto: Percentiles</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[#9c9a8e] w-12">p50</span>
              <div className="flex-1 h-1 bg-[#e8e6e0]">
                <div className="h-full w-[50%] bg-[#4a5d4a]" />
              </div>
              <span className="text-xs text-[#9c9a8e]">200ms</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[#9c9a8e] w-12">p95</span>
              <div className="flex-1 h-1 bg-[#e8e6e0]">
                <div className="h-full w-[75%] bg-[#8b7355]" />
              </div>
              <span className="text-xs text-[#9c9a8e]">800ms</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[#9c9a8e] w-12">p99</span>
              <div className="flex-1 h-1 bg-[#e8e6e0]">
                <div className="h-full w-[95%] bg-[#c4a07a]" />
              </div>
              <span className="text-xs text-[#9c9a8e]">2.5s</span>
            </div>
          </div>

          <p className="text-sm text-[#5a5a52]">
            <span className="text-[#2c2c2c]">El promedio miente.</span> Amazon mide p99.9 porque el usuario
            más lento suele ser el que más compra (carrito lleno = más queries).
          </p>
        </div>

        {/* Scaling approaches */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center py-6">
            <p className="text-3xl mb-2">↑</p>
            <p className="text-[#2c2c2c] mb-1">Vertical</p>
            <p className="text-xs text-[#9c9a8e]">Máquina más grande</p>
            <p className="font-mono text-[10px] text-[#c4a07a] mt-2">Límite físico</p>
          </div>
          <div className="text-center py-6">
            <p className="text-3xl mb-2">↔</p>
            <p className="text-[#2c2c2c] mb-1">Horizontal</p>
            <p className="text-xs text-[#9c9a8e]">Más máquinas</p>
            <p className="font-mono text-[10px] text-[#c4a07a] mt-2">Complejidad distribuida</p>
          </div>
        </div>
      </section>

      {/* Pillar 3: Maintainability */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Mantenibilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El regalo a tu yo del futuro
            </p>
          </div>
        </div>

        {/* Cost insight */}
        <div className="border-l-2 border-[#8b7355] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-2">Insight de Kleppmann</p>
          <p className="text-[#2c2c2c]">La mayoría del costo de software es mantenimiento, no desarrollo inicial.</p>

          <div className="flex items-center gap-2 mt-4">
            <div className="h-2 w-[20%] bg-[#4a5d4a]" />
            <div className="h-2 w-[80%] bg-[#e8e6e0]" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#9c9a8e]">20% Dev</span>
            <span className="text-[10px] text-[#9c9a8e]">80% Mantenimiento</span>
          </div>
        </div>

        {/* Three sub-principles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Operabilidad</p>
            <p className="text-sm text-[#9c9a8e]">Fácil de monitorear y deployar</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Simplicidad</p>
            <p className="text-sm text-[#9c9a8e]">Sin complejidad accidental</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Evolucionabilidad</p>
            <p className="text-sm text-[#9c9a8e]">Fácil de cambiar</p>
          </div>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#9c9a8e] uppercase mb-6">Mnemotécnico</p>

        <p className="text-6xl font-light text-[#2c2c2c] mb-2">REM</p>
        <p className="text-sm text-[#9c9a8e] mb-8">Como el sueño profundo donde se consolida la memoria</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#4a5d4a] font-medium">R</span><span className="text-[#9c9a8e]">eliability</span> <span className="text-[#2c2c2c]">— Resiste fallas</span></p>
          <p><span className="text-[#4a5d4a] font-medium">E</span><span className="text-[#9c9a8e]">scalability</span> <span className="text-[#2c2c2c]">— Escala con carga</span></p>
          <p><span className="text-[#4a5d4a] font-medium">M</span><span className="text-[#9c9a8e]">aintainability</span> <span className="text-[#2c2c2c]">— Modificable en el futuro</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-[#e8e6e0]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          En tu último proyecto, ¿cuál de los tres pilares
          <span className="text-[#2c2c2c]"> sacrificaste sin darte cuenta</span>?
        </p>
      </section>
    </article>
  );
}
