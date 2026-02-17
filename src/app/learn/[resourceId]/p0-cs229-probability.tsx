export function P0CS229Probability() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#059669]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            CS229 · Probability Review
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Probabilidad para Machine Learning
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          Lo esencial, aplicado y conciso
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Esta no es la version exhaustiva de MML — es lo que necesitas saber para ML, destilado por
          el curso de Andrew Ng. Un review conciso y aplicado: las distribuciones que importan, la
          inferencia que usas cada vez que entrenas, y la teoria de la informacion detras de toda
          loss function. Cada concepto conecta directamente con algo que implementas.
        </p>
      </header>

      {/* Section 01: Variables Aleatorias y Distribuciones Basicas */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Variables Aleatorias y Distribuciones Basicas</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              probability-statistics
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
            Las variables aleatorias son traductores: convierten resultados de experimentos en numeros
            que puedes calcular.
            <span className="text-j-text"> La expectativa es el resumen mas honesto de esos numeros.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Discreto</p>
            <p className="text-sm text-j-text mb-2">PMF: probabilidad puntual para cada valor</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Clasificacion: softmax produce PMF sobre clases</p>
              <p>Cada token en un LLM es una variable discreta</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Continuo</p>
            <p className="text-sm text-j-text mb-2">PDF: densidad, no probabilidad puntual</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Regresion: prediccion de valores continuos</p>
              <p>VAEs: latent space es continuo</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            La matriz de covarianza Sigma codifica las correlaciones entre features.
            <span className="text-[#059669]"> Sus eigenvalues son PCA — la descomposicion que encuentras en algebra lineal es la misma que usas para reducir dimensionalidad.</span>
          </p>
        </div>
      </section>

      {/* Section 02: Distribuciones Clasicas y sus Propiedades */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Distribuciones Clasicas y sus Propiedades</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              probability-statistics
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
            Cada distribucion es una plantilla que codifica suposiciones sobre tus datos. Gaussiana = MSE,
            Bernoulli = cross-entropy.
            <span className="text-j-text"> Elegir la distribucion CORRECTA es elegir la loss function correcta.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#059669]">N(mu, sigma)</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-1">Gaussiana</p>
            <p className="text-xs text-j-text-tertiary">MSE loss, regresion, variables continuas</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#059669]">Ber(p)</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-1">Bernoulli</p>
            <p className="text-xs text-j-text-tertiary">BCE loss, clasificacion binaria</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#059669]">Beta(a, b)</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-1">Beta</p>
            <p className="text-xs text-j-text-tertiary">Prior conjugado para Bernoulli</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#059669]">Pois(lambda)</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-1">Poisson</p>
            <p className="text-xs text-j-text-tertiary">Count models, eventos por intervalo</p>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            La tabla distribucion → loss function no es arbitraria — es MLE.
            <span className="text-[#059669]"> Maximizar la likelihood de una Gaussiana equivale a minimizar MSE. Maximizar la likelihood de una Bernoulli equivale a minimizar binary cross-entropy. La loss function ES la distribucion.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Inferencia: MLE, MAP y Bayes */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Inferencia: MLE, MAP y Bayes</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              probability-statistics
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
            MLE es un fotografo que elige el angulo donde la escena se ve mejor. MAP es el mismo
            fotografo pero con un filtro (el prior).
            <span className="text-j-text"> Bayes completo no elige un angulo — guarda la foto panoramica completa.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">MLE</p>
            <p className="text-sm text-j-text mb-2">Maximizar P(D|theta)</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Sin prior, solo los datos hablan</p>
              <p>Puede overfittear con pocos datos</p>
              <p>Equivalente a minimizar NLL</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">MAP</p>
            <p className="text-sm text-j-text mb-2">Maximizar P(theta|D) con prior</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Prior = regularizacion</p>
              <p>Weight decay = prior Gaussiano</p>
              <p>L1 = prior Laplaciano (sparsity)</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            Weight decay en PyTorch = MAP con prior Gaussiano. L1 regularization = prior Laplaciano.
            <span className="text-[#059669]"> No es un truco de optimizacion — es Bayes. Cada regularizador que usas codifica una creencia sobre los parametros.</span>
          </p>
        </div>
      </section>

      {/* Section 04: Entropia, KL Divergence y Cross-Entropy */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Entropia, KL Divergence y Cross-Entropy</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              information-theory
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
            La entropia mide cuanta sorpresa promedio hay en una fuente. Cross-entropy mide el costo de
            codificar mensajes de P usando un codigo para Q.
            <span className="text-j-text"> KL divergence es el costo extra por usar el codigo equivocado.</span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">H(P) = -sum P log P</p>
            <p className="text-sm text-j-text-tertiary">Entropia — incertidumbre intrinseca de P</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">H(P, Q) = -sum P log Q</p>
            <p className="text-sm text-j-text-tertiary">Cross-entropy — la loss function de clasificacion</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">KL(P || Q) = H(P,Q) - H(P)</p>
            <p className="text-sm text-j-text-tertiary">Divergencia — costo extra por usar Q en vez de P</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Perplexity = 2^H</p>
            <p className="text-sm text-j-text-tertiary">Metrica de evaluacion de language models</p>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            Minimizar cross-entropy = minimizar KL divergence (porque H(P) es constante).
            <span className="text-[#059669]"> En RLHF, la penalizacion KL previene reward hacking — sin ella, el modelo colapsa hacia outputs que explotan la reward function.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">VDIC</p>
        <p className="text-sm text-j-text-tertiary mb-8">Los cuatro pilares de probabilidad para ML</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#059669] font-medium">V</span><span className="text-j-text-tertiary">ariables</span> <span className="text-j-text">— RVs, expectativa, varianza, covarianza</span></p>
          <p><span className="text-[#059669] font-medium">D</span><span className="text-j-text-tertiary">istribuciones</span> <span className="text-j-text">— Gaussiana, Bernoulli, Beta, Poisson</span></p>
          <p><span className="text-[#059669] font-medium">I</span><span className="text-j-text-tertiary">nferencia</span> <span className="text-j-text">— MLE, MAP, Bayes, regularizacion como prior</span></p>
          <p><span className="text-[#059669] font-medium">C</span><span className="text-j-text-tertiary">ross-entropy</span> <span className="text-j-text">— Entropia, KL divergence, perplexity</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si cada loss function implica una suposicion probabilistica,
          <span className="text-j-text"> que asume tu modelo cuando usas MSE vs cross-entropy, y cuando esa suposicion seria incorrecta?</span>
        </p>
      </section>
    </article>
  );
}
