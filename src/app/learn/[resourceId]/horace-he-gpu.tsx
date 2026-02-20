export function HoraceHeGpu() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Article · Horace He 2022
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Making Deep Learning Go Brrrr
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          GPU performance desde primeros principios
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Tu GPU tiene 312 teraflops. Pero estas obteniendo 0.2. Este articulo
          explica por que — y que hacer al respecto. El modelo mental mas importante
          para cualquier trabajo de optimizacion en deep learning.
        </p>
      </header>

      {/* Section 01: Los Tres Regímenes */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Los Tres Regimenes</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Compute · Memory · Overhead
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
            Una GPU es como una fabrica.
            <span className="text-j-text"> Envias instrucciones (overhead), materiales (memory bandwidth), </span>
            todo para mantener la produccion (compute). Si la fabrica crece mas rapido que la
            velocidad de envio de materiales, nunca alcanzas su capacidad maxima.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Compute</p>
            <p className="text-sm text-j-text mb-1">312 TF (Tensor Cores)</p>
            <p className="text-xs text-j-text-secondary">19.5 TF sin matmul</p>
          </div>
          <div className="p-4 border border-[#8b7355] bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-2">Memory</p>
            <p className="text-sm text-j-text mb-1">1.5 TB/s bandwidth</p>
            <p className="text-xs text-j-text-secondary">80 GB DRAM (HBM)</p>
          </div>
          <div className="p-4 border border-j-border bg-white/30">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">Overhead</p>
            <p className="text-sm text-j-text mb-1">Python, PyTorch</p>
            <p className="text-xs text-j-text-secondary">Dispatch, launch</p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-4">
          <p className="text-sm text-j-text">
            <strong>Insight clave:</strong> Saber en que regimen estas determina que optimizacion importa.
            Si eres memory-bound, mas FLOPS no ayudan. Si eres compute-bound, reescribir en C++ no ayuda.
          </p>
        </div>
      </section>

      {/* Section 02: Memory Bandwidth */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Memory Bandwidth</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El cuello de botella invisible
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
            SRAM es la fabrica (rapida, pequena ~20 MB). DRAM es el almacen (grande ~80 GB, lento).
            <span className="text-j-text"> Cada GPU kernel necesita traer datos del almacen y devolverlos. </span>
            Para ops simples como cos(x), casi todo el tiempo se gasta en el transporte.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Sin fusion</p>
            <p className="text-sm text-j-text mb-2">x.cos().cos()</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>4 accesos a global memory</p>
              <p>Leer x, escribir x1, leer x1, escribir x2</p>
            </div>
          </div>
          <div className="p-5 border border-[#8b7355] bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-3">Con fusion</p>
            <p className="text-sm text-j-text mb-2">x.cos().cos() (fusionado)</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>2 accesos a global memory</p>
              <p>Leer x, escribir x2. Speedup ~2x</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#8b7355] pl-4">
          <p className="text-sm text-j-text">
            <strong>Insight clave:</strong> Operator fusion es la optimizacion mas importante en deep learning.
            Por eso gelu y relu cuestan lo mismo — cuando estan fusionadas, el bottleneck es la memoria, no el compute.
          </p>
        </div>
      </section>

      {/* Section 03: Roofline Model */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">El Roofline Model</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Compute intensity como metrica clave
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Numeros clave (A100)</p>
          <div className="text-[#5a5a52] space-y-1 text-sm">
            <p>400B numeros/segundo cargados (32-bit) vs 20T operaciones/segundo</p>
            <p className="text-j-text">Necesitas ~100 ops por elemento para que compute &gt; memory cost</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Memory-bound</p>
            <p className="text-sm text-j-text mb-1">repeat &lt; 32</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Memory bandwidth saturado (~1.5 TB/s)</p>
              <p>Compute subutilizado (0.2 TF de 9.75 TF)</p>
            </div>
          </div>
          <div className="p-5 border border-[#8b7355] bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-3">Compute-bound</p>
            <p className="text-sm text-j-text mb-1">repeat &gt; 64</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Compute saturado (~9.75 TF)</p>
              <p>Memory bandwidth empieza a caer</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-4">
          <p className="text-sm text-j-text">
            <strong>Insight clave:</strong> FLOPS alcanzados / FLOPS pico te dice que tan compute-bound estas.
            80% = bastante bien. El resto es probablemente memory-bandwidth.
          </p>
        </div>
      </section>

      {/* Section 04: Overhead */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Overhead y Diagnostico</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Python, async execution, soluciones
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Escala del problema</p>
          <p className="text-[#5a5a52]">
            Python: 32M ops/s. PyTorch dispatch: 280K ops/s. A100: 312T ops/s.
            <span className="text-j-text"> En un FLOP de Python, el A100 haria 9.75 millones.</span>
          </p>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border border-j-border">
            <thead>
              <tr className="bg-white/30">
                <th className="text-left p-3 font-mono text-[10px] tracking-[0.1em] text-j-text-tertiary uppercase border-b border-j-border">Regimen</th>
                <th className="text-left p-3 font-mono text-[10px] tracking-[0.1em] text-j-text-tertiary uppercase border-b border-j-border">Deteccion</th>
                <th className="text-left p-3 font-mono text-[10px] tracking-[0.1em] text-j-text-tertiary uppercase border-b border-j-border">Solucion</th>
              </tr>
            </thead>
            <tbody className="text-j-text-secondary">
              <tr className="border-b border-j-border/50">
                <td className="p-3 text-j-text">Overhead</td>
                <td className="p-3">2x batch, &lt;2x runtime</td>
                <td className="p-3">torch.compile, CUDA Graphs</td>
              </tr>
              <tr className="border-b border-j-border/50">
                <td className="p-3 text-j-text">Bandwidth</td>
                <td className="p-3">Bajo FLOPS utilization</td>
                <td className="p-3">Operator Fusion</td>
              </tr>
              <tr>
                <td className="p-3 text-j-text">Compute</td>
                <td className="p-3">&gt;80% peak FLOPS</td>
                <td className="p-3">Tensor Cores, mas GPUs</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-l-2 border-[#8b7355] pl-4">
          <p className="text-sm text-j-text">
            <strong>Insight clave:</strong> PyTorch esconde el overhead con ejecucion asincrona — la CPU encola
            kernels mientras la GPU los ejecuta. Solo falla cuando los kernels son demasiado pequenos.
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>
        <p className="text-6xl font-light text-j-text mb-2">C M O</p>
        <div className="flex justify-center gap-8 mt-4">
          <div>
            <p className="font-mono text-xs text-[#991b1b]">C</p>
            <p className="text-sm text-j-text-secondary">Compute</p>
          </div>
          <div>
            <p className="font-mono text-xs text-[#8b7355]">M</p>
            <p className="text-sm text-j-text-secondary">Memory</p>
          </div>
          <div>
            <p className="font-mono text-xs text-j-text-tertiary">O</p>
            <p className="text-sm text-j-text-secondary">Overhead</p>
          </div>
        </div>
        <p className="text-xs text-j-text-tertiary mt-4">Antes de optimizar: identifica tu regimen</p>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si operator fusion hace que gelu cueste lo mismo que relu, que otras
          &quot;optimizaciones&quot; comunes podrian ser irrelevantes una vez que
          entiendes los tres regimenes?
        </p>
      </section>
    </article>
  );
}
