export function LilianWengDistributed() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Article · Lilian Weng 2021
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          How to Train Really Large Models on Many GPUs?
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          Paralelismo distribuido para modelos masivos
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Un modelo de 175B parametros necesita 700 GB solo para sus pesos. No cabe en
          una GPU. Ni en diez. Este articulo mapea las tecnicas para distribuir el
          entrenamiento entre cientos o miles de GPUs — y las trampas de cada enfoque.
        </p>
      </header>

      {/* Section 01: Data Parallelism */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Data Parallelism</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Copiar el modelo, dividir los datos
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
            Como un examen donde cada estudiante tiene la misma hoja de respuestas (modelo) pero
            diferente set de preguntas (datos).
            <span className="text-j-text"> Al final, comparten sus notas para que todos aprendan lo mismo.</span>
            Eso es AllReduce.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">BSP (Synchronous)</p>
            <p className="text-sm text-j-text mb-2">&quot;Todos esperan al mas lento&quot;</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Cada worker sincroniza gradientes al final del minibatch</p>
              <p>Garantiza pesos identicos en todos los workers</p>
              <p>Problema: idle time proporcional al worker mas lento</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">ASP (Asynchronous)</p>
            <p className="text-sm text-j-text mb-2">&quot;Cada uno a su ritmo&quot;</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Workers actualizan pesos sin esperar a los demas</p>
              <p>Elimina idle time completamente</p>
              <p>Problema: weight staleness — gradientes sobre pesos obsoletos</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Limitacion fatal</p>
          <p className="text-j-text">
            Cada GPU necesita una copia completa del modelo.
            Un modelo de 175B params en FP32 = <span className="text-[#991b1b]">700 GB</span>.
            Ninguna GPU tiene esa memoria. Se necesita model parallelism.
          </p>
        </div>
      </section>

      {/* Section 02: Pipeline Parallelism */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Pipeline Parallelism</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Linea de ensamblaje para redes neuronales
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
            Como una fabrica de autos: mientras la estacion 1 suelda el chasis del auto B,
            la estacion 2 pinta el auto A.
            <span className="text-j-text"> Cada estacion trabaja en un auto diferente simultaneamente.</span>
            Sin pipeline, cada estacion espera a que la anterior termine con el mismo auto.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">GPipe</p>
            <p className="text-sm text-j-text mb-2">&quot;Sync al final del batch&quot;</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Minibatch se divide en m microbatches</p>
              <p>Bubble fraction = (d-1)/(m+d-1)</p>
              <p>Con m=16, d=4: solo 16% de tiempo desperdiciado</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">PipeDream (1F1B)</p>
            <p className="text-sm text-j-text mb-2">&quot;Forward y backward intercalados&quot;</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Intercala 1 forward + 1 backward por step</p>
              <p>Weight stashing para consistencia de pesos</p>
              <p>PipeDream-2BW: solo 2 versiones de pesos en memoria</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">El tradeoff central</p>
          <p className="text-j-text">
            Pipeline reduce memoria por GPU pero introduce <span className="text-[#991b1b]">bubbles</span> —
            tiempo muerto. Mas microbatches = menos bubbles, pero mas memoria para activaciones.
          </p>
        </div>
      </section>

      {/* Section 03: Tensor Parallelism */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Tensor Parallelism</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Partir operaciones dentro de una capa
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
            Como dividir una multiplicacion gigante de matrices: GPU-0 calcula la mitad
            izquierda del resultado, GPU-1 la mitad derecha.
            <span className="text-j-text"> Cada GPU hace la mitad del trabajo de una sola capa.</span>
            Requiere conexiones ultra-rapidas (NVLink) entre GPUs.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              MLP: Column + Row split
            </p>
            <p className="text-sm text-[#5a5a52]">
              Primera matriz se divide por columnas (cada GPU computa GeLU local),
              segunda por filas (resultados parciales se suman con AllReduce).
              Solo 2 AllReduce por capa.
            </p>
          </div>
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Attention: Heads distribuidos
            </p>
            <p className="text-sm text-[#5a5a52]">
              Multi-head attention se presta naturalmente: si hay 8 heads y 8 GPUs,
              cada GPU computa 1 head completo. La proyeccion de salida Wo se divide por filas.
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">PTD-P: Paralelismo 3D</p>
          <p className="text-j-text">
            Megatron-LM combina <span className="text-[#991b1b]">TP dentro del nodo</span> (NVLink),
            PP entre nodos (InfiniBand), y DP entre replicas.
            Para 1T params: TP=8 x PP=64 x DP=6 = 3,072 GPUs.
          </p>
        </div>
      </section>

      {/* Section 04: Mixture-of-Experts */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Mixture-of-Experts</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Mas parametros, mismo computo
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
            Como un hospital con 16 especialistas. Cada paciente (token) es dirigido
            solo al especialista relevante por una recepcionista (router).
            <span className="text-j-text"> El hospital tiene la capacidad de 16 doctores, pero cada paciente
            solo ve 1 o 2.</span> Mas capacidad total sin mas costo por paciente.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">GShard (600B)</p>
            <p className="text-sm text-j-text mb-2">&quot;Top-2 routing con capacity limits&quot;</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Cada token va a sus 2 mejores experts</p>
              <p>Expert capacity limita tokens por expert</p>
              <p>Auxiliary loss para balanceo de carga</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Switch (1.6T)</p>
            <p className="text-sm text-j-text mb-2">&quot;k=1 — un solo expert por token&quot;</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Simplificacion radical: 1 expert, mitad de compute</p>
              <p>FP32 selectivo en router para estabilidad</p>
              <p>1.6 trillones de params, ~100B activos</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">El problema del balanceo</p>
          <p className="text-j-text">
            Sin intervencion, el router crea un <span className="text-[#991b1b]">feedback loop</span>:
            experts populares mejoran mas, reciben mas tokens, mejoran mas.
            Se necesita auxiliary loss + ruido para forzar diversidad.
          </p>
        </div>
      </section>

      {/* Section 05: Memory Saving */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Ahorro de Memoria</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              ZeRO, mixed precision y gradient checkpointing
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
            Imagina 64 estudiantes, cada uno con una copia identica de una enciclopedia
            de 700 paginas (pesos + optimizer states).
            <span className="text-j-text"> ZeRO dice: que cada uno guarde solo 11 paginas, y cuando
            necesite otra pagina, la pide al companero que la tiene.</span>
            64x menos memoria por persona.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">ZeRO Stage 1-2-3</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p><span className="text-j-text font-medium">Stage 1:</span> Particiona optimizer states → de 12 a 12/N bytes/param</p>
              <p><span className="text-j-text font-medium">Stage 2:</span> + Particiona gradientes → ahorra 2 bytes/param adicionales</p>
              <p><span className="text-j-text font-medium">Stage 3:</span> + Particiona parametros → cada GPU tiene solo 16/N bytes/param</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-2">Mixed Precision + Gradient Checkpointing</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p><span className="text-j-text font-medium">FP16/BF16:</span> 2x menos memoria, 2x mas throughput en Tensor Cores</p>
              <p><span className="text-j-text font-medium">Loss scaling:</span> Previene gradient underflow en FP16</p>
              <p><span className="text-j-text font-medium">Checkpointing:</span> Memoria de activaciones de O(l) a O(sqrt(l)), costo: +33% compute</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">El stack completo</p>
          <p className="text-j-text">
            GPT-3 (175B): <span className="text-[#991b1b]">1,024+ A100s</span> con ZeRO Stage 2-3 + BF16 +
            activation recomputation + TP=8 x PP=16 x DP=8.
            Cada tecnica es necesaria — sin una sola de ellas, no cabe.
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>
        <p className="text-6xl font-light text-j-text mb-2">D-P-T-M-Z</p>
        <div className="mt-6 space-y-1">
          <p className="text-sm text-[#5a5a52]"><span className="text-j-text font-medium">D</span>ata Parallelism — copiar modelo, dividir datos</p>
          <p className="text-sm text-[#5a5a52]"><span className="text-j-text font-medium">P</span>ipeline Parallelism — linea de ensamblaje por capas</p>
          <p className="text-sm text-[#5a5a52]"><span className="text-j-text font-medium">T</span>ensor Parallelism — partir matrices dentro de una capa</p>
          <p className="text-sm text-[#5a5a52]"><span className="text-j-text font-medium">M</span>ixture-of-Experts — mas params, menos compute activo</p>
          <p className="text-sm text-[#5a5a52]"><span className="text-j-text font-medium">Z</span>eRO — eliminar redundancia entre GPUs</p>
        </div>
      </section>

      {/* Pregunta final */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si pudieras usar solo dos de estas cinco tecnicas para entrenar un modelo
          de 100B parametros, ¿cuales elegirias y por que?
        </p>
      </section>
    </article>
  );
}
