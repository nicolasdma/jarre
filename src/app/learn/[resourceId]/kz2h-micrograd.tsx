export function Kz2hMicrograd() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Video · Karpathy Zero to Hero · Lecture 1
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Micrograd
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          Reverse-mode automatic differentiation desde cero
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Como se calculan automaticamente los gradientes de cualquier expresion
          matematica, y por que ese mecanismo — reverse-mode automatic differentiation
          — es el motor de todo el deep learning moderno.
        </p>

        <p className="mt-4 text-sm text-j-text-tertiary max-w-xl">
          Prerequisito para building-gpt: el training loop y la chain rule que
          construimos aqui son los que entrenan el Transformer.
        </p>
      </header>

      {/* Section 01: Qué es ML */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Que es ML — La Fabrica que Aprende Sola</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              De programacion tradicional a aprender de datos
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Cambio de paradigma</p>
          <p className="text-[#5a5a52]">
            Programacion tradicional: reglas + datos → respuesta.
            <span className="text-j-text"> Machine Learning: datos + respuestas → reglas.</span>
            {' '}El conocimiento deja de residir en el codigo y pasa a residir en los datos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Los 3 ingredientes</p>
            <p className="text-sm text-j-text mb-2">Todo ML tiene esto</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>1. Datos — ejemplos del mundo real</p>
              <p>2. Modelo — funcion con pesos ajustables</p>
              <p>3. Entrenamiento — minimizar el error</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Micrograd</p>
            <p className="text-sm text-j-text mb-2">Reverse-mode AD en ~100 lineas</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Baydin et al. 2018: AD ≠ backprop</p>
              <p>Backprop es un caso especial de AD</p>
              <p>Lo demas es eficiencia (Karpathy)</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Todo deep learning es <span className="text-[#991b1b]">ajustar perillas para minimizar el error</span>.
            La unica diferencia entre micrograd y GPT-4 es la cantidad de perillas.
          </p>
        </div>
      </section>

      {/* Section 02: Value — layout de lista numerada */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Value — Un Numero con Memoria</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              La clase que hace posible el autograd
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {[
            { num: '1', title: 'data', desc: 'El valor numerico (escalar)' },
            { num: '2', title: '_children', desc: 'Referencias a los Values que lo crearon (padres)' },
            { num: '3', title: '_op', desc: 'La operacion que lo genero (+, *, tanh...)' },
            { num: '4', title: 'grad', desc: 'Derivada de la salida final respecto a este valor (inicia en 0.0)' },
          ].map((item) => (
            <div key={item.num} className="flex gap-4 items-start p-4 border-l-2 border-j-border-input">
              <span className="font-mono text-2xl font-light text-[#e8e6e0] shrink-0 w-8">{item.num}</span>
              <div>
                <p className="text-j-text font-mono text-sm">.{item.title}</p>
                <p className="text-xs text-j-text-secondary mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Cada operacion construye un <span className="text-[#991b1b]">DAG (grafo aciclico dirigido)</span> automaticamente.
            {' '}Sin el grafo, no hay backprop.
            {' '}Griewank 2008: reverse-mode AD cuesta ≤5x el forward pass, sin importar cuantos parametros.
          </p>
        </div>
      </section>

      {/* Section 03: Derivada Parcial — callout box central */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">La Derivada Parcial — El Momento Eureka</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              a=3, b=4, c=a*b=12 — y todo cobra sentido
            </p>
          </div>
        </div>

        <div className="relative p-8 bg-[#991b1b]/5 border border-[#991b1b]/20 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-4">Ejemplo numerico central</p>
          <div className="text-center space-y-3">
            <p className="text-j-text font-mono text-lg">c = a × b, con a=3, b=4</p>
            <div className="flex justify-center gap-12 mt-4">
              <div>
                <p className="text-xs text-j-text-tertiary uppercase mb-1">Muevo a +0.01</p>
                <p className="text-j-text font-mono">c cambia 0.04</p>
                <p className="text-[#991b1b] font-mono text-xl mt-1">∂c/∂a = b = 4</p>
              </div>
              <div>
                <p className="text-xs text-j-text-tertiary uppercase mb-1">Muevo b +0.01</p>
                <p className="text-j-text font-mono">c cambia 0.03</p>
                <p className="text-[#991b1b] font-mono text-xl mt-1">∂c/∂b = a = 3</p>
              </div>
            </div>
            <p className="text-sm text-j-text-secondary mt-4 italic">
              &quot;Cada variable es la pendiente de la otra&quot;
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-j-border">
                <th className="text-left py-2 text-j-text-tertiary font-mono text-[10px] uppercase">Operacion</th>
                <th className="text-left py-2 text-j-text-tertiary font-mono text-[10px] uppercase">∂/∂ entrada 1</th>
                <th className="text-left py-2 text-j-text-tertiary font-mono text-[10px] uppercase">∂/∂ entrada 2</th>
              </tr>
            </thead>
            <tbody className="text-j-text font-mono">
              <tr className="border-b border-j-border/50">
                <td className="py-2">a × b</td>
                <td className="py-2">b</td>
                <td className="py-2">a</td>
              </tr>
              <tr>
                <td className="py-2">a + b</td>
                <td className="py-2">1</td>
                <td className="py-2">1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Con solo estas dos reglas
            <span className="text-[#991b1b]"> se calcula el efecto de CUALQUIER perilla</span> en un sistema
            de millones de operaciones. CS231n: error relativo &gt; 1e-2 = bug.
          </p>
        </div>
      </section>

      {/* Section 04: Backprop — cards verticales (forward/backward como flujos) */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Backpropagation y la Chain Rule</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Multiplicar efectos paso a paso, hacia atras
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-[#991b1b]">→</span>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase">Forward pass</p>
            </div>
            <p className="text-sm text-j-text mb-2">Evaluar de izquierda a derecha</p>
            <p className="text-xs text-j-text-secondary">
              Cada operacion (+, *, tanh) crea un Value con _backward closure.
              El grafo se construye implicitamente.
            </p>
          </div>

          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-j-warm-dark">←</span>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase">Backward pass</p>
            </div>
            <p className="text-sm text-j-text mb-2">Propagar de derecha a izquierda</p>
            <p className="text-xs text-j-text-secondary">
              Orden topologico inverso. Cada nodo: self.grad += derivada_local × out.grad.
              Chain rule aplicada automaticamente.
            </p>
          </div>

          <div className="p-5 border border-j-border bg-white/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-j-text-tertiary">⚠</span>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">El bug critico</p>
            </div>
            <p className="text-sm text-j-text mb-2">Acumulacion: siempre += nunca =</p>
            <p className="text-xs text-j-text-secondary">
              Si un nodo contribuye por multiples caminos, gradientes se SUMAN.
              + zero_grad() antes de cada iteracion, o gradientes se contaminan.
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Hochreiter 1991: multiplicar muchos numeros &lt; 1 → gradiente → 0.
            <span className="text-[#991b1b]"> Sigmoid con 100 capas: gradiente ≈ 10⁻⁶⁰.</span>
            {' '}ReLU (derivada = 1) fue la solucion.
          </p>
        </div>
      </section>

      {/* Section 05: MLP — layout tabla/comparación */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">De una Neurona a un MLP</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              41 perillas vs 1.8 billones — mismo mecanismo
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-j-border">
                <th className="text-left py-2 text-j-text-tertiary font-mono text-[10px] uppercase">Componente</th>
                <th className="text-left py-2 text-j-text-tertiary font-mono text-[10px] uppercase">Operacion</th>
                <th className="text-left py-2 text-j-text-tertiary font-mono text-[10px] uppercase">Parametros</th>
              </tr>
            </thead>
            <tbody className="text-j-text">
              <tr className="border-b border-j-border/50">
                <td className="py-2 font-mono text-sm">Neuron</td>
                <td className="py-2 text-xs text-j-text-secondary">tanh(Σ(w·x) + b)</td>
                <td className="py-2 text-xs text-j-text-secondary">n_inputs + 1</td>
              </tr>
              <tr className="border-b border-j-border/50">
                <td className="py-2 font-mono text-sm">Layer</td>
                <td className="py-2 text-xs text-j-text-secondary">n neuronas independientes</td>
                <td className="py-2 text-xs text-j-text-secondary">n × (n_inputs + 1)</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-sm">MLP</td>
                <td className="py-2 text-xs text-j-text-secondary">capas encadenadas secuencialmente</td>
                <td className="py-2 text-xs text-j-text-secondary">Σ por capa</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Training loop</p>
          <div className="text-xs text-j-text-secondary space-y-1 font-mono">
            <p>1. Forward → prediccion</p>
            <p>2. Loss → que tan mal (MSE)</p>
            <p>3. Zero grad → limpiar gradientes</p>
            <p>4. Backward → calcular gradientes</p>
            <p>5. Update → p.data -= lr × p.grad</p>
          </div>
          <p className="text-xs text-j-text-tertiary mt-3">
            Cybenko 1989: MLP = aproximador universal (existencial, no constructivo).
            Adam (Kingma 2015) adapta LR por parametro. ~80% de papers usan Adam.
          </p>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Las capas ocultas aprenden cosas que <span className="text-[#991b1b]">nadie programo</span>: gramatica,
            logica, conceptos abstractos. Emergen del ajuste de perillas.
            Mismo ciclo en micrograd y en PyTorch.
          </p>
        </div>
      </section>

      {/* Mnemonic — GRAVE */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>
        <p className="text-6xl font-light text-j-text mb-2">G·R·A·V·E</p>
        <div className="space-y-1 text-j-text-secondary">
          <p><span className="text-j-text font-medium">G</span>rafo — todo computo es un grafo de operaciones (Value + DAG)</p>
          <p><span className="text-j-text font-medium">R</span>egla local — cada nodo sabe su derivada (derivada parcial)</p>
          <p><span className="text-j-text font-medium">A</span>cumular — chain rule multiplica hacia atras, gradientes se suman</p>
          <p><span className="text-j-text font-medium">V</span>otar — neuronas pesan, suman, deciden (MLP)</p>
          <p><span className="text-j-text font-medium">E</span>ntrenar — forward, loss, backward, update</p>
        </div>
      </section>

      {/* Pregunta final — conecta con building-gpt */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si este MLP de 41 parametros converge en ~20 iteraciones con 4 datos,
          que cambia cuando escalas a 124M parametros procesando secuencias de texto?
        </p>
      </section>
    </article>
  );
}
