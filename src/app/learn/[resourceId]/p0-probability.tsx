export function P0Probability() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#7c3aed]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            MML · Probabilidad y Teoria de la Informacion
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Probabilidad y Teoria de la Informacion
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          El framework para razonar bajo incertidumbre
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Cada prediccion de un modelo es una distribucion de probabilidad. Cada loss function
          mide divergencia entre distribuciones. Cada decision de entrenamiento es inferencia
          bayesiana implicita. La probabilidad no es un tema mas — es el fundamento de todo ML.
        </p>
      </header>

      {/* Section 01: Espacios de Probabilidad y Variables Aleatorias */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Espacios de Probabilidad y Variables Aleatorias</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Los cimientos formales de la incertidumbre
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
            Un espacio de probabilidad es como un juego de mesa con reglas: defines los resultados
            posibles (omega), los eventos que te interesan (sigma-algebra), y cuanto pesa cada uno (medida P).
            <span className="text-j-text"> Una variable aleatoria es simplemente una funcion que traduce los resultados del juego a numeros que puedes calcular.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#7c3aed] bg-[#7c3aed]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-3">Discreto</p>
            <p className="text-sm text-j-text mb-2">Conjuntos contables de resultados</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>PMF: P(X = x) para cada valor posible</p>
              <p>Clasificacion: softmax produce PMF sobre clases</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Continuo</p>
            <p className="text-sm text-j-text mb-2">Intervalos reales, densidades en vez de masas</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>PDF: f(x) donde P(a &lt; X &lt; b) = integral de f</p>
              <p>Regresion, VAEs, diffusion models usan distribuciones continuas</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#7c3aed] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            La expectativa E[X] no es solo un promedio — es un operador lineal fundamental.
            <span className="text-[#7c3aed]"> Casi todo en ML se puede expresar como minimizar E[L(theta)] sobre la distribucion de los datos.</span>
          </p>
        </div>
      </section>

      {/* Section 02: Distribuciones */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Gaussiana, Bernoulli, Categorical y Dirichlet</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Las familias de distribuciones que aparecen en todas partes
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
            Las distribuciones son como moldes para la incertidumbre. Cada una captura un tipo
            diferente de aleatoriedad.
            <span className="text-j-text"> Elegir la distribucion correcta es elegir que suposiciones haces sobre tus datos — y eso determina tu loss function.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#7c3aed]">N(mu, sigma)</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-1">Gaussiana</p>
            <p className="text-xs text-j-text-tertiary">MSE loss, VAE prior, batch normalization</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#7c3aed]">Ber(p)</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-1">Bernoulli</p>
            <p className="text-xs text-j-text-tertiary">Binary classification, dropout, sigmoid output</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#7c3aed]">Cat(p1..pk)</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-1">Categorical</p>
            <p className="text-xs text-j-text-tertiary">Multiclass, softmax, next-token prediction</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#7c3aed]">Dir(alpha)</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-1">Dirichlet</p>
            <p className="text-xs text-j-text-tertiary">Prior sobre distribuciones, topic models (LDA)</p>
          </div>
        </div>

        <div className="border-l-2 border-[#7c3aed] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            La Gaussiana multivariada aparece en todas partes porque el Central Limit Theorem garantiza
            que sumas de variables independientes convergen a ella.
            <span className="text-[#7c3aed]"> Su parametro de covarianza Sigma codifica las correlaciones entre features — es una matriz de algebra lineal.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Bayes, MLE y MAP */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Bayes, MLE y MAP</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Fundamentos de todo entrenamiento
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
            MLE es un detective que busca la explicacion mas compatible con la evidencia, sin prejuicios.
            MAP es el mismo detective pero con experiencia previa que lo guia.
            <span className="text-j-text"> Bayes completo no elige una explicacion — mantiene todas las posibles con su probabilidad. Es mas honesto pero mucho mas costoso.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#7c3aed] bg-[#7c3aed]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-3">MLE</p>
            <p className="text-sm text-j-text mb-2">Maximizar P(datos | theta)</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Equivalente a minimizar negative log-likelihood</p>
              <p>Cross-entropy loss = NLL para distribuciones categoricas</p>
              <p>MSE loss = NLL para Gaussianas</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">MAP</p>
            <p className="text-sm text-j-text mb-2">Maximizar P(theta | datos) con prior</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>MLE + termino de regularizacion del prior</p>
              <p>Prior Gaussiano = L2 regularization (weight decay)</p>
              <p>Prior Laplaciano = L1 regularization (sparsity)</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#7c3aed] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            Cada vez que entrenas un modelo con cross-entropy loss + weight decay, estas haciendo MAP
            con likelihood categorica y prior Gaussiano.
            <span className="text-[#7c3aed]"> La conexion entre probabilidad y optimizacion no es una metafora — es matematicamente exacta.</span>
          </p>
        </div>
      </section>

      {/* Section 04: Entropia, Cross-Entropy y KL Divergence */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Entropia, Cross-Entropy y KL Divergence</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Medir informacion y comparar distribuciones
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
            La entropia mide cuanta &quot;sorpresa promedio&quot; hay en una fuente de informacion.
            Un dado justo tiene alta entropia; uno cargado, baja.
            <span className="text-j-text"> Cross-entropy mide cuanto te cuesta codificar mensajes de una fuente P usando un codigo disenado para Q. KL divergence es el costo extra por usar el codigo equivocado.</span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">H(P) = -sum P log P</p>
            <p className="text-sm text-j-text-tertiary">Entropia — incertidumbre intrinseca de P</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">H(P, Q) = -sum P log Q</p>
            <p className="text-sm text-j-text-tertiary">Cross-entropy — la loss function mas usada en clasificacion</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">KL(P || Q) = H(P,Q) - H(P)</p>
            <p className="text-sm text-j-text-tertiary">Divergencia — cuanto difieren P y Q (no simetrica)</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Perplexity = 2^H</p>
            <p className="text-sm text-j-text-tertiary">Metrica de evaluacion de language models</p>
          </div>
        </div>

        <div className="border-l-2 border-[#7c3aed] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            Minimizar cross-entropy es equivalente a minimizar KL divergence entre la distribucion real
            y la del modelo (porque H(P) es constante).
            <span className="text-[#7c3aed]"> Cuando un LLM reporta perplexity de 10, significa que en promedio esta &quot;tan confundido&quot; como si eligiera entre 10 opciones equiprobables.</span>
          </p>
        </div>
      </section>

      {/* Section 05: Informacion Mutua, ELBO y Deep Learning */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Informacion Mutua, ELBO y Deep Learning</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Conexiones avanzadas con modelos generativos
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
            La informacion mutua mide cuanto saber X te ayuda a predecir Y. Si son independientes, es cero.
            <span className="text-j-text"> ELBO es un truco ingenioso: cuando no puedes calcular la likelihood exacta (como en VAEs), optimizas una cota inferior que es mas facil de computar.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#7c3aed] bg-[#7c3aed]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-3">Informacion Mutua</p>
            <p className="text-sm text-j-text mb-2">I(X;Y) = KL(P(X,Y) || P(X)P(Y))</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Cuanta informacion comparten X e Y</p>
              <p>Simetrica, siempre no negativa</p>
              <p>Usada en feature selection y representation learning</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">ELBO</p>
            <p className="text-sm text-j-text mb-2">Evidence Lower BOund para modelos latentes</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>ELBO = E[log p(x|z)] - KL(q(z|x) || p(z))</p>
              <p>Reconstruccion - regularizacion del latente</p>
              <p>Fundamento de VAEs y diffusion models</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
            Conexiones con deep learning moderno
          </p>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7c3aed] text-[10px] text-white font-mono">1</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#7c3aed]">VAEs:</span> Optimizan ELBO para aprender representaciones latentes generativas</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7c3aed] text-[10px] text-white font-mono">2</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#7c3aed]">Diffusion:</span> KL divergence entre el proceso forward y reverse guia la denoising</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7c3aed] text-[10px] text-white font-mono">3</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#7c3aed]">Contrastive learning:</span> InfoNCE maximiza una cota inferior de la informacion mutua</p>
          </div>
        </div>

        <div className="border-l-2 border-[#7c3aed] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#7c3aed] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            La teoria de la informacion conecta todo: la loss function (cross-entropy), la regularizacion
            (KL), la evaluacion (perplexity), y los modelos generativos (ELBO).
            <span className="text-[#7c3aed]"> No es una rama separada de ML — es el lenguaje unificador.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">EDBEI</p>
        <p className="text-sm text-j-text-tertiary mb-8">Los cinco pilares de la probabilidad para ML</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#7c3aed] font-medium">E</span><span className="text-j-text-tertiary">spacios</span> <span className="text-j-text">— Probabilidad formal, variables aleatorias y expectativas</span></p>
          <p><span className="text-[#7c3aed] font-medium">D</span><span className="text-j-text-tertiary">istribuciones</span> <span className="text-j-text">— Gaussiana, Bernoulli, Categorical, Dirichlet</span></p>
          <p><span className="text-[#7c3aed] font-medium">B</span><span className="text-j-text-tertiary">ayes</span> <span className="text-j-text">— MLE, MAP y la conexion probabilidad-optimizacion</span></p>
          <p><span className="text-[#7c3aed] font-medium">E</span><span className="text-j-text-tertiary">ntropia</span> <span className="text-j-text">— Cross-entropy, KL divergence y perplexity</span></p>
          <p><span className="text-[#7c3aed] font-medium">I</span><span className="text-j-text-tertiary">nformacion</span> <span className="text-j-text">— Mutual information, ELBO y modelos generativos</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si toda loss function es implicitamente una suposicion probabilistica sobre los datos,
          <span className="text-j-text"> que esta asumiendo tu modelo cuando usas cross-entropy loss y que pasaria si esa suposicion fuera incorrecta?</span>
        </p>
      </section>
    </article>
  );
}
