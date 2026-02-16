export function AttentionPaper() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Paper · Vaswani et al. 2017
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Attention Is All You Need
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          La arquitectura Transformer
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          El paper que elimino la recurrencia y las convoluciones del procesamiento de secuencias.
          Una arquitectura basada enteramente en mecanismos de atencion que cambio para siempre
          el deep learning.
        </p>
      </header>

      {/* Section 01: El Problema de la Secuencia */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">El Problema de la Secuencia</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Las limitaciones de RNNs y LSTMs
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
            Una RNN procesa texto como leer un libro palabra por palabra, sin poder volver atras.
            <span className="text-j-text"> Para cuando llegas a la pagina 100, ya olvidaste lo de la pagina 1.</span>
            Ademas, no puedes leer dos palabras al mismo tiempo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">El cuello de botella</p>
            <p className="text-sm text-j-text mb-2">"Computacion inherentemente secuencial"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>h_t depende de h_(t-1): no se puede paralelizar</p>
              <p>Training time escala linealmente con la longitud de la secuencia</p>
              <p>Las GPUs modernas necesitan paralelismo masivo para ser eficientes</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Long-range dependencies</p>
            <p className="text-sm text-j-text mb-2">"La informacion se degrada con la distancia"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Vanishing gradients: la senal se debilita en secuencias largas</p>
              <p>LSTMs mejoran pero no resuelven el problema fundamental</p>
              <p>Path length entre posiciones lejanas es O(n)</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">La pregunta clave</p>
          <p className="text-j-text">
            Se puede procesar una secuencia entera <span className="text-[#991b1b]">en paralelo</span>, sin perder la capacidad
            de capturar relaciones entre posiciones distantes?
          </p>
        </div>
      </section>

      {/* Section 02: Self-Attention */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Self-Attention</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El mecanismo central del Transformer
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Query, Key, Value
            </p>
            <p className="text-sm text-[#5a5a52]">
              Cada token genera tres vectores: Q (que busco), K (que ofrezco), V (que contengo).
              <span className="text-j-text"> La atencion es el dot product entre Q y K, usado para ponderar los V.</span>
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Scaled dot-product attention
            </p>
            <p className="text-sm text-[#5a5a52]">
              Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V.
              <span className="text-j-text"> La division por sqrt(d_k) es critica: sin ella, los dot products crecen con la dimension</span>
              {' '}y empujan al softmax a regiones de gradientes minusculos.
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
            Self-attention es como estar en una fiesta y poder escuchar a todos simultaneamente.
            <span className="text-j-text"> Cada persona decide a quien prestarle mas atencion segun lo que necesita saber.</span>
            No hay orden fijo — la relevancia determina la conexion.
          </p>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Por que sqrt(d_k)?</p>
          <p className="text-j-text">
            Si Q y K tienen componentes con media 0 y varianza 1, su dot product tiene varianza d_k.
            Con d_k=512, los valores pre-softmax pueden ser enormes. <span className="text-[#991b1b]">Escalar por sqrt(d_k) normaliza la varianza a 1.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Multi-Head Attention */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Multi-Head Attention</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Multiples subespacios de representacion
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
            Una sola cabeza de atencion es como un analista con una sola perspectiva.
            <span className="text-j-text"> Multi-head attention es un equipo de 8 analistas, cada uno mirando el problema desde un angulo diferente</span>
            — uno mira sintaxis, otro semantica, otro correferencia — y despues combinan sus conclusiones.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Como funciona</p>
            <p className="text-sm text-j-text mb-2">"Proyectar, atender, concatenar"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Proyectar Q, K, V a h subespacios distintos (h=8 en el paper)</p>
              <p>Ejecutar atencion en paralelo en cada subespacio</p>
              <p>Concatenar resultados y proyectar de vuelta a d_model</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Por que funciona</p>
            <p className="text-sm text-j-text mb-2">"Diferentes relaciones necesitan diferentes lentes"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Cada head aprende un tipo distinto de relacion</p>
              <p>d_k = d_model/h, asi que el costo total es similar a single-head</p>
              <p>Empiricamente: mas heads mejoran hasta un punto, luego hay diminishing returns</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Con h=8 y d_model=512, cada head opera en dimension d_k=64.
            <span className="text-[#991b1b]"> El costo computacional es identico a hacer single-head attention con dimension completa.</span>
          </p>
        </div>
      </section>

      {/* Section 04: La Arquitectura Transformer */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">La Arquitectura Transformer</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Encoder-Decoder y sus componentes
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
            Componentes del stack
          </p>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">1</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Positional encoding:</span> Inyectar informacion de posicion con funciones sinusoidales — sin esto, el modelo no sabe el orden</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">2</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Multi-head attention:</span> Cada sub-layer permite a cada posicion atender a todas las demas</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">3</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Feed-forward layers:</span> Dos capas lineales con ReLU — procesan cada posicion independientemente</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">4</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Residual connections + LayerNorm:</span> Permiten entrenar redes profundas sin vanishing gradients</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Encoder</p>
            <p className="text-sm text-[#5a5a52] mb-2">6 capas identicas. Cada una: self-attention + feed-forward.</p>
            <p className="text-xs text-j-text-secondary">Procesa toda la secuencia de input en paralelo</p>
          </div>
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Decoder</p>
            <p className="text-sm text-[#5a5a52] mb-2">6 capas. Masked self-attention + cross-attention + feed-forward.</p>
            <p className="text-xs text-j-text-secondary">Genera output autoregressivamente, token por token</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">Masked attention en el decoder</p>
          <p className="text-[#5a5a52]">
            El decoder usa una mascara para que cada posicion solo pueda atender a posiciones anteriores.
            <span className="text-j-text"> Sin esto, el modelo haria trampa viendo tokens futuros durante el entrenamiento.</span>
          </p>
        </div>
      </section>

      {/* Section 05: Resultados e Impacto */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Resultados e Impacto</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Por que cambio todo
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">BLEU en EN-DE</p>
            <p className="text-sm text-j-text-tertiary">28.4 — superando todos los modelos previos</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">BLEU en EN-FR</p>
            <p className="text-sm text-j-text-tertiary">41.0 — nuevo state of the art</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Tiempo de entrenamiento</p>
            <p className="text-sm text-j-text-tertiary">3.5 dias en 8 GPUs (fraccion del costo previo)</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Paralelizacion</p>
            <p className="text-sm text-j-text-tertiary">Ordenes de magnitud mas eficiente que RNNs</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Lo que habilito</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>BERT: encoder-only para comprension de lenguaje</p>
              <p>GPT: decoder-only para generacion de texto</p>
              <p>Vision Transformers: la misma idea aplicada a imagenes</p>
              <p>LLMs modernos: GPT-4, Claude, Gemini — todos son Transformers</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">La idea profunda</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Eliminar la inductive bias de secuencialidad</p>
              <p>Dejar que el modelo aprenda sus propias relaciones</p>
              <p>Escalar con hardware en vez de escalar con arquitectura</p>
              <p>La simplicidad del mecanismo es lo que permite la escala</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">El insight central</p>
          <p className="text-j-text">
            El Transformer no es solo un modelo mejor — es una <span className="text-[#991b1b]">plataforma de compute</span>.
            Su arquitectura permite escalar de forma predecible con mas datos, mas parametros y mas compute.
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">QKVRP</p>
        <p className="text-sm text-j-text-tertiary mb-8">Los cinco pilares del Transformer</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#991b1b] font-medium">Q</span><span className="text-j-text-tertiary">uery busca</span> <span className="text-j-text">— Que informacion necesito?</span></p>
          <p><span className="text-[#991b1b] font-medium">K</span><span className="text-j-text-tertiary">ey ofrece</span> <span className="text-j-text">— Que informacion tengo para dar?</span></p>
          <p><span className="text-[#991b1b] font-medium">V</span><span className="text-j-text-tertiary">alue entrega</span> <span className="text-j-text">— El contenido real que se transfiere</span></p>
          <p><span className="text-[#991b1b] font-medium">R</span><span className="text-j-text-tertiary">esidual conecta</span> <span className="text-j-text">— Gradientes fluyen sin degradarse</span></p>
          <p><span className="text-[#991b1b] font-medium">P</span><span className="text-j-text-tertiary">osition codifica</span> <span className="text-j-text">— Sin orden explicito, el modelo es un bag-of-words</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Por que la <span className="text-j-text">eliminacion de la recurrencia</span>
          {' '}fue mas importante que la mejora en BLEU scores?
        </p>
      </section>
    </article>
  );
}
