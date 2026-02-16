export function ScalingLawsPaper() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Paper · Kaplan et al. 2020
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Scaling Laws
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          para modelos de lenguaje neurales
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          El rendimiento de los modelos de lenguaje sigue leyes de potencia predecibles
          al escalar parametros, datos y compute. Este paper cuantifica exactamente como
          y revela las reglas del juego del scaling.
        </p>
      </header>

      {/* Section 01: Power Laws en Deep Learning */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Power Laws en Deep Learning</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Loss como funcion de tres ejes
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
            Entrenar un modelo es como excavar un pozo. Puedes cavar mas profundo (mas compute),
            con una pala mas grande (mas parametros), o en terreno mas rico (mas datos).
            <span className="text-j-text"> La relacion entre esfuerzo y resultado sigue reglas matematicas precisas.</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 border border-j-border">
            <p className="text-3xl mb-2 text-[#991b1b]">N</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-1">Parameters</p>
            <p className="text-xs text-j-text-tertiary">Tamano del modelo</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-3xl mb-2 text-[#991b1b]">D</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-1">Dataset</p>
            <p className="text-xs text-j-text-tertiary">Cantidad de datos</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-3xl mb-2 text-[#991b1b]">C</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-1">Compute</p>
            <p className="text-xs text-j-text-tertiary">FLOPs de entrenamiento</p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">El descubrimiento</p>
          <p className="text-j-text">
            La loss sigue power laws suaves con cada eje: L(x) ~ x^(-alpha).
            <span className="text-[#991b1b]"> Son lineas rectas en escala log-log</span>, lo que significa que
            el progreso es predecible con ordenes de magnitud de anticipacion.
          </p>
        </div>
      </section>

      {/* Section 02: Leyes de Escala */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Leyes de Escala</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Los exponentes especificos
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">L(N) ~ N^(-0.076)</p>
            <p className="text-sm text-j-text-tertiary">Loss decrece lentamente con parametros</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">L(D) ~ D^(-0.095)</p>
            <p className="text-sm text-j-text-tertiary">Loss decrece un poco mas rapido con datos</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">L(C) ~ C^(-0.050)</p>
            <p className="text-sm text-j-text-tertiary">Loss decrece mas lentamente con compute total</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">C ~ 6ND</p>
            <p className="text-sm text-j-text-tertiary">Compute total es aprox. 6 * params * tokens</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Implicacion critica</p>
            <p className="text-sm text-j-text mb-2">"10x compute = mejora modesta"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Para reducir la loss a la mitad necesitas ~1000x mas compute</p>
              <p>Los exponentes son pequenos: el progreso es caro</p>
              <p>Pero es predecible — puedes planificar tu presupuesto de training</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Universalidad</p>
            <p className="text-sm text-j-text mb-2">"Las leyes se mantienen across architectures"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Diferentes hyperparameters no cambian los exponentes</p>
              <p>El shape de la red importa poco comparado con N total</p>
              <p>Los exponentes son propiedades del task, no del modelo</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">Atencion</p>
          <p className="text-[#5a5a52]">
            Estos exponentes son del paper original de Kaplan (2020).
            <span className="text-j-text"> Chinchilla (2022) los reviso y encontro que los datos importan mas de lo que Kaplan estimaba.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Compute-Optimal Training */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Compute-Optimal Training</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El insight de Chinchilla
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
            Kaplan decia: "si tienes mas dinero, compra un cerebro mas grande".
            <span className="text-j-text"> Chinchilla demostro: "mejor compra un cerebro mediano y dale mas libros para leer".</span>
            El balance entre tamano y datos es la clave.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Kaplan (2020)</p>
            <p className="text-sm text-j-text mb-2">"Escala parametros agresivamente"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Con mas compute, aumenta N mucho mas rapido que D</p>
              <p>Modelos grandes entrenados con pocos tokens</p>
              <p>Gopher 280B: entrenado con 300B tokens</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Chinchilla (2022)</p>
            <p className="text-sm text-j-text mb-2">"Escala parametros y datos al mismo ritmo"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>D optimo ~ 20 * N (20 tokens por parametro)</p>
              <p>Chinchilla 70B con 1.4T tokens supero a Gopher 280B</p>
              <p>4x menos parametros, mejor rendimiento, menor costo de inferencia</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">La leccion</p>
          <p className="text-j-text">
            La mayoria de los LLMs pre-Chinchilla estaban <span className="text-[#991b1b]">significativamente undertrained</span>.
            Tenian demasiados parametros para la cantidad de datos con los que fueron entrenados.
          </p>
        </div>
      </section>

      {/* Section 04: Overfitting y Data Requirements */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Overfitting y Data Requirements</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Cuando los datos se vuelven el cuello de botella
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              La trampa del overfitting
            </p>
            <p className="text-sm text-[#5a5a52]">
              Un modelo con mas parametros que datos efectivos memoriza en vez de generalizar.
              <span className="text-j-text"> Las scaling laws asumen que N y D crecen juntos — si solo crece N, la loss deja de mejorar.</span>
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Sample efficiency
            </p>
            <p className="text-sm text-[#5a5a52]">
              Modelos mas grandes son mas eficientes en datos: aprenden mas por token.
              <span className="text-j-text"> Pero esto no elimina la necesidad de datos suficientes — solo reduce el ratio minimo.</span>
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              El muro de los datos
            </p>
            <p className="text-sm text-[#5a5a52]">
              Internet tiene una cantidad finita de texto de alta calidad.
              <span className="text-j-text"> Estamos acercandonos al limite de datos disponibles para entrenar LLMs.</span>
              Esto esta impulsando investigacion en datos sinteticos y curricula de entrenamiento.
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
            Es como un estudiante brillante en una biblioteca pequena.
            <span className="text-j-text"> Por mas inteligente que sea, si ya leyo todos los libros, necesita libros nuevos para seguir aprendiendo.</span>
            Releer los mismos no ayuda — empieza a memorizar en vez de entender.
          </p>
        </div>
      </section>

      {/* Section 05: Implicaciones Practicas */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Implicaciones Practicas</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Como usar las scaling laws en la practica
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Budget allocation</p>
            <p className="text-sm text-j-text mb-2">"Donde poner el proximo dolar de compute"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Si tu modelo esta undertrained: mas datos/tokens</p>
              <p>Si tienes datos de sobra: mas parametros</p>
              <p>La regla de oro: ~20 tokens por parametro (post-Chinchilla)</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Diminishing returns</p>
            <p className="text-sm text-j-text mb-2">"Cada 10x cuesta mas y rinde menos"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Los exponentes son menores a 1: retornos decrecientes garantizados</p>
              <p>De GPT-3 a GPT-4: ~100x mas compute, mejora notable pero no 100x</p>
              <p>El costo marginal de cada punto de loss se dispara exponencialmente</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
            Decisiones practicas que habilitan las scaling laws
          </p>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">1</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Predecir rendimiento:</span> Entrenar modelos pequenos y extrapolar la loss del modelo grande</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">2</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Optimizar costo:</span> Elegir el tamano de modelo que minimiza loss para un budget fijo</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">3</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Planificar infraestructura:</span> Saber cuantas GPUs y cuanto tiempo necesitas antes de empezar</p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">La tension actual</p>
          <p className="text-j-text">
            Las scaling laws dicen que siempre puedes mejorar con mas compute.
            Pero los costos crecen exponencialmente mientras los retornos son logaritmicos.
            <span className="text-[#991b1b]"> En algun punto, escalar deja de ser economicamente viable.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">NDC</p>
        <p className="text-sm text-j-text-tertiary mb-8">Los tres ejes del scaling</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#991b1b] font-medium">N</span><span className="text-j-text-tertiary"> parametros escalan</span> <span className="text-j-text">— Modelo mas grande, loss mas baja (L ~ N^-0.076)</span></p>
          <p><span className="text-[#991b1b] font-medium">D</span><span className="text-j-text-tertiary"> datos alimentan</span> <span className="text-j-text">— Mas tokens, mejor generalizacion (L ~ D^-0.095)</span></p>
          <p><span className="text-[#991b1b] font-medium">C</span><span className="text-j-text-tertiary"> compute unifica</span> <span className="text-j-text">— C ~ 6ND, el presupuesto total que importa</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si tuvieras un budget fijo de compute, <span className="text-j-text">como decidirias entre un modelo mas grande
          con menos datos</span> o uno mas pequeno con mas datos?
        </p>
      </section>
    </article>
  );
}
