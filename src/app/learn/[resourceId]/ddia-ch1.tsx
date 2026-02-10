export function DDIAChapter1() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-j-accent" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            DDIA · Capítulo 1
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Los Tres Pilares
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          de los Sistemas de Datos
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Kleppmann argumenta que todo sistema de datos exitoso se sostiene sobre tres propiedades fundamentales.
          Si una falla, el sistema eventualmente colapsa.
        </p>
      </header>

      {/* Visual: The Three Pillars */}
      <section className="mb-20">
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-px h-24 bg-j-accent" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-1">
              Confiabilidad
            </p>
            <p className="text-[10px] text-j-text-tertiary">Reliability</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 w-px h-24 bg-j-accent" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-1">
              Escalabilidad
            </p>
            <p className="text-[10px] text-j-text-tertiary">Scalability</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 w-px h-24 bg-j-accent" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-1">
              Mantenibilidad
            </p>
            <p className="text-[10px] text-j-text-tertiary">Maintainability</p>
          </div>
        </div>
        <div className="h-px bg-j-border mt-4" />
      </section>

      {/* Pillar 1: Reliability */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Confiabilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El sistema que no te traiciona
            </p>
          </div>
        </div>

        {/* Analogy */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogía</p>
          <p className="text-[#5a5a52]">
            Un auto confiable arranca en invierno, con lluvia, después de 10 años.
            <span className="text-j-text"> No solo cuando las condiciones son perfectas.</span>
          </p>
        </div>

        {/* Fault types */}
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Tres tipos de fallas
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Hardware</p>
              <p className="text-sm text-j-text-tertiary">Disco muere, RAM corrupta</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Redundancia</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Software</p>
              <p className="text-sm text-j-text-tertiary">Bug en producción, cascading failure</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Testing + Rollback</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text">Humanos</p>
              <p className="text-sm text-j-text-tertiary">DELETE sin WHERE, config mal</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Permisos + Backups</p>
          </div>
        </div>

        {/* Key question */}
        <div className="border-l-2 border-j-accent pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-2">Pregunta clave</p>
          <p className="text-lg text-j-text">"¿Qué pasa cuando X falla?"</p>
          <p className="text-sm text-j-text-tertiary mt-1">
            Si no puedes responder para cada componente, tu sistema no es confiable.
          </p>
        </div>
      </section>

      {/* Pillar 2: Scalability */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Escalabilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El sistema que crece contigo
            </p>
          </div>
        </div>

        {/* Anti-definition */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-2">No es</p>
            <p className="text-j-text-tertiary">"Rápido"</p>
            <p className="text-j-text-tertiary">"Maneja mucho tráfico"</p>
          </div>
          <div className="p-5 border border-j-accent bg-j-accent/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-2">Es</p>
            <p className="text-j-text">"Cuando el tráfico crece 10x,</p>
            <p className="text-j-text">¿qué tengo que cambiar?"</p>
          </div>
        </div>

        {/* Percentiles */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">Concepto: Percentiles</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-j-text-tertiary w-12">p50</span>
              <div className="flex-1 h-1 bg-j-border">
                <div className="h-full w-[50%] bg-j-accent" />
              </div>
              <span className="text-xs text-j-text-tertiary">200ms</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-j-text-tertiary w-12">p95</span>
              <div className="flex-1 h-1 bg-j-border">
                <div className="h-full w-[75%] bg-[#8b7355]" />
              </div>
              <span className="text-xs text-j-text-tertiary">800ms</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-j-text-tertiary w-12">p99</span>
              <div className="flex-1 h-1 bg-j-border">
                <div className="h-full w-[95%] bg-[#c4a07a]" />
              </div>
              <span className="text-xs text-j-text-tertiary">2.5s</span>
            </div>
          </div>

          <p className="text-sm text-[#5a5a52]">
            <span className="text-j-text">El promedio miente.</span> Amazon mide p99.9 porque el usuario
            más lento suele ser el que más compra (carrito lleno = más queries).
          </p>
        </div>

        {/* Scaling approaches */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center py-6">
            <p className="text-3xl mb-2">↑</p>
            <p className="text-j-text mb-1">Vertical</p>
            <p className="text-xs text-j-text-tertiary">Máquina más grande</p>
            <p className="font-mono text-[10px] text-j-warm mt-2">Límite físico</p>
          </div>
          <div className="text-center py-6">
            <p className="text-3xl mb-2">↔</p>
            <p className="text-j-text mb-1">Horizontal</p>
            <p className="text-xs text-j-text-tertiary">Más máquinas</p>
            <p className="font-mono text-[10px] text-j-warm mt-2">Complejidad distribuida</p>
          </div>
        </div>
      </section>

      {/* Pillar 3: Maintainability */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Mantenibilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El regalo a tu yo del futuro
            </p>
          </div>
        </div>

        {/* Cost insight */}
        <div className="border-l-2 border-j-warm-dark pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-2">Insight de Kleppmann</p>
          <p className="text-j-text">La mayoría del costo de software es mantenimiento, no desarrollo inicial.</p>

          <div className="flex items-center gap-2 mt-4">
            <div className="h-2 w-[20%] bg-j-accent" />
            <div className="h-2 w-[80%] bg-j-border" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-j-text-tertiary">20% Dev</span>
            <span className="text-[10px] text-j-text-tertiary">80% Mantenimiento</span>
          </div>
        </div>

        {/* Three sub-principles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Operabilidad</p>
            <p className="text-sm text-j-text-tertiary">Fácil de monitorear y deployar</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Simplicidad</p>
            <p className="text-sm text-j-text-tertiary">Sin complejidad accidental</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Evolucionabilidad</p>
            <p className="text-sm text-j-text-tertiary">Fácil de cambiar</p>
          </div>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotécnico</p>

        <p className="text-6xl font-light text-j-text mb-2">REM</p>
        <p className="text-sm text-j-text-tertiary mb-8">Como el sueño profundo donde se consolida la memoria</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-j-accent font-medium">R</span><span className="text-j-text-tertiary">eliability</span> <span className="text-j-text">— Resiste fallas</span></p>
          <p><span className="text-j-accent font-medium">E</span><span className="text-j-text-tertiary">scalability</span> <span className="text-j-text">— Escala con carga</span></p>
          <p><span className="text-j-accent font-medium">M</span><span className="text-j-text-tertiary">aintainability</span> <span className="text-j-text">— Modificable en el futuro</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          En tu último proyecto, ¿cuál de los tres pilares
          <span className="text-j-text"> sacrificaste sin darte cuenta</span>?
        </p>
      </section>
    </article>
  );
}
