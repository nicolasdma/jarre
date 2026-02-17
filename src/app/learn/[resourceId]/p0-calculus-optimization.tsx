export function P0CalculusOptimization() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#dc2626]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            MML · Calculo y Optimizacion
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Calculo y Optimizacion para ML
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          Como aprende una red neuronal, paso a paso
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Entrenar un modelo es un problema de optimizacion: encontrar los parametros que minimizan
          una funcion de error. El calculo diferencial es el motor que permite calcular en que direccion
          ajustar cada peso. Sin gradientes, no hay aprendizaje.
        </p>
      </header>

      {/* Section 01: Derivadas Parciales y Gradientes */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Derivadas Parciales y Gradientes</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              La brujula del aprendizaje
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
            Imagina que estas en una montana con niebla y quieres bajar al valle. No ves el camino
            completo, pero puedes sentir la inclinacion del suelo bajo tus pies.
            <span className="text-j-text"> El gradiente es exactamente eso: te dice en que direccion el suelo sube mas rapido, y tu caminas en la direccion opuesta.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#dc2626] bg-[#dc2626]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#dc2626] uppercase mb-3">Derivada parcial</p>
            <p className="text-sm text-j-text mb-2">Cuanto cambia f si mueves solo un parametro</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>df/dw_i: sensibilidad de la loss a un peso especifico</p>
              <p>Fijas todo lo demas, varías solo w_i</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Gradiente (nabla f)</p>
            <p className="text-sm text-j-text mb-2">Vector de todas las derivadas parciales juntas</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Apunta en la direccion de maximo crecimiento</p>
              <p>Su magnitud indica que tan empinada es la pendiente</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#dc2626] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#dc2626] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            Un modelo con 7B parametros tiene un gradiente de 7 mil millones de componentes.
            <span className="text-[#dc2626]"> Cada componente dice exactamente cuanto y en que direccion ajustar ese peso para reducir el error.</span>
          </p>
        </div>
      </section>

      {/* Section 02: Regla de la Cadena y Grafos Computacionales */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Regla de la Cadena y Grafos Computacionales</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Como propagar informacion a traves de funciones compuestas
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
            Si una fabrica tiene 10 estaciones en serie y el producto final sale defectuoso,
            necesitas rastrear el defecto hacia atras, estacion por estacion.
            <span className="text-j-text"> La regla de la cadena hace exactamente eso: multiplica las sensibilidades locales de cada paso para obtener el efecto total.</span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">df/dx = df/dg * dg/dx</p>
            <p className="text-sm text-j-text-tertiary">Cadena simple: dos funciones compuestas</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Multivariate chain rule</p>
            <p className="text-sm text-j-text-tertiary">Suma sobre todos los caminos intermedios</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Grafo computacional</p>
            <p className="text-sm text-j-text-tertiary">DAG donde cada nodo es una operacion</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Forward vs Reverse mode</p>
            <p className="text-sm text-j-text-tertiary">Reverse es eficiente cuando outputs &lt; inputs</p>
          </div>
        </div>

        <div className="border-l-2 border-[#dc2626] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#dc2626] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            PyTorch y TensorFlow construyen grafos computacionales automaticamente.
            <span className="text-[#dc2626]"> Autograd aplica la regla de la cadena en modo reverso para calcular todos los gradientes en una sola pasada hacia atras.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Backpropagation */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Backpropagation: Derivacion Completa</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El algoritmo que hizo posible deep learning
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
            Backprop es como un sistema de retroalimentacion en una empresa. El resultado final
            (la loss) genera una senal que viaja hacia atras por cada departamento (capa),
            <span className="text-j-text"> diciendole a cada empleado (peso) exactamente cuanto contribuyo al error y como ajustarse.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#dc2626] bg-[#dc2626]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#dc2626] uppercase mb-3">Forward pass</p>
            <p className="text-sm text-j-text mb-2">Calcular la prediccion y la loss</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Input pasa por cada capa secuencialmente</p>
              <p>Se guardan las activaciones intermedias (para el backward)</p>
              <p>Al final se calcula L(y_pred, y_true)</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Backward pass</p>
            <p className="text-sm text-j-text mb-2">Calcular dL/dw para cada peso</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Empieza en la loss, propaga hacia la primera capa</p>
              <p>Usa activaciones guardadas + regla de la cadena</p>
              <p>Costo: ~2x el forward pass (por las multiplicaciones)</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#dc2626] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#dc2626] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            Backpropagation no es un algoritmo de aprendizaje — es un algoritmo de calculo de gradientes.
            <span className="text-[#dc2626]"> El aprendizaje ocurre cuando usas esos gradientes para actualizar los pesos (eso es el optimizador).</span>
          </p>
        </div>
      </section>

      {/* Section 04: Descenso de Gradiente y Variantes */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Descenso de Gradiente y Variantes</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Estrategias para navegar la superficie de loss
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
            Gradient descent puro es como bajar una montana dando pasos en la direccion mas
            empinada. Funciona, pero es lento y se traba en valles estrechos.
            <span className="text-j-text"> SGD con momentum es como una bola de nieve: acumula velocidad y puede atravesar baches pequenos.</span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Batch GD</p>
            <p className="text-sm text-j-text-tertiary">Usa todo el dataset — preciso pero lento y costoso</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">SGD (Stochastic)</p>
            <p className="text-sm text-j-text-tertiary">Un sample a la vez — ruidoso pero rapido y regulariza</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Mini-batch SGD</p>
            <p className="text-sm text-j-text-tertiary">El compromiso que usa todo el mundo (32-512 samples)</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">SGD + Momentum</p>
            <p className="text-sm text-j-text-tertiary">Acumula velocidad en direcciones consistentes</p>
          </div>
        </div>

        <div className="border-l-2 border-[#dc2626] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#dc2626] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            El learning rate es el hiperparametro mas critico de todo el entrenamiento.
            <span className="text-[#dc2626]"> Muy grande y diverges. Muy pequeno y tardas una eternidad. Encontrar el rango correcto es mas importante que elegir el optimizador.</span>
          </p>
        </div>
      </section>

      {/* Section 05: Adam, Convexidad y Learning Rate Schedules */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Adam, Convexidad y Learning Rate Schedules</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Optimizadores adaptativos y la geometria de la loss
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
            SGD es un coche con una sola velocidad. Adam es un coche con transmision automatica:
            <span className="text-j-text"> adapta su velocidad en cada dimension segun el terreno. En zonas planas acelera, en zonas empinadas frena.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#dc2626] bg-[#dc2626]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#dc2626] uppercase mb-3">Adam optimizer</p>
            <p className="text-sm text-j-text mb-2">Momentum + adaptive learning rates por parametro</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>m: media movil del gradiente (momentum, primer momento)</p>
              <p>v: media movil del gradiente^2 (varianza, segundo momento)</p>
              <p>Bias correction para los primeros pasos</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">LR Schedules</p>
            <p className="text-sm text-j-text mb-2">Cambiar el learning rate durante el entrenamiento</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Warmup: empezar lento para estabilizar los primeros pasos</p>
              <p>Cosine decay: reducir suavemente hacia el final</p>
              <p>Step decay: reducir abruptamente en milestones</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">Atencion</p>
          <p className="text-[#5a5a52]">
            Las loss surfaces de redes neuronales son no convexas — tienen saddle points, minimos locales
            y mesetas.
            <span className="text-j-text"> Pero en la practica, los minimos locales en alta dimension tienden a ser casi tan buenos como el global. El verdadero problema son los saddle points.</span>
          </p>
        </div>

        <div className="border-l-2 border-[#dc2626] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#dc2626] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            AdamW (Adam con weight decay desacoplado) es el optimizador estandar para entrenar LLMs.
            <span className="text-[#dc2626]"> GPT, LLaMA, y la mayoria de modelos modernos usan AdamW con cosine schedule y warmup lineal.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">GRCBA</p>
        <p className="text-sm text-j-text-tertiary mb-8">El camino completo del aprendizaje automatico</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#dc2626] font-medium">G</span><span className="text-j-text-tertiary">radientes</span> <span className="text-j-text">— Derivadas parciales que miden sensibilidad</span></p>
          <p><span className="text-[#dc2626] font-medium">R</span><span className="text-j-text-tertiary">egla de cadena</span> <span className="text-j-text">— Componer derivadas a traves de funciones</span></p>
          <p><span className="text-[#dc2626] font-medium">C</span><span className="text-j-text-tertiary">adena hacia atras</span> <span className="text-j-text">— Backpropagation, de la loss a los pesos</span></p>
          <p><span className="text-[#dc2626] font-medium">B</span><span className="text-j-text-tertiary">ajada</span> <span className="text-j-text">— Gradient descent y sus variantes (SGD, mini-batch)</span></p>
          <p><span className="text-[#dc2626] font-medium">A</span><span className="text-j-text-tertiary">dam</span> <span className="text-j-text">— Optimizadores adaptativos y learning rate schedules</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si backpropagation solo calcula gradientes y el optimizador solo los usa para dar un paso,
          <span className="text-j-text"> donde exactamente ocurre el &quot;aprendizaje&quot; y que significa realmente que un modelo &quot;aprenda&quot;?</span>
        </p>
      </section>
    </article>
  );
}
