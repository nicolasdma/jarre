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
          Backpropagation desde cero
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Construir un motor de autodiferenciacion completo en ~100 lineas de Python.
          Desde la aritmetica de valores escalares hasta entrenar una red neuronal
          que aprende, pasando por la chain rule implementada como codigo.
        </p>
      </header>

      {/* Section 01: Value y el Grafo Computacional */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Value y el Grafo Computacional</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              La abstraccion fundamental de autograd
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
            Imagina una cadena de montaje donde cada operacion (+, *, tanh) es una estacion.
            <span className="text-j-text"> Cada estacion recuerda de donde vinieron sus piezas.</span>
            Cuando al final detectas un defecto, puedes rastrear exactamente que estacion contribuyo
            al problema — eso es el backward pass.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">La clase Value</p>
            <p className="text-sm text-j-text mb-2">Un escalar con historia</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Almacena: dato, gradiente, operacion que lo creo</p>
              <p>Cada operacion (+, *, **) crea un nuevo Value</p>
              <p>Los hijos se guardan como _prev (set de padres)</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">DAG de operaciones</p>
            <p className="text-sm text-j-text mb-2">Estructura que habilita backprop</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Directed Acyclic Graph: inputs → operaciones → output</p>
              <p>Forward pass: evalua el grafo de izquierda a derecha</p>
              <p>Backward pass: propaga gradientes de derecha a izquierda</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            El grafo computacional es la estructura de datos que hace posible <span className="text-[#991b1b]">calcular gradientes automaticamente</span>.
            Sin el, tendrias que derivar cada funcion a mano.
          </p>
        </div>
      </section>

      {/* Section 02: Derivadas y la Chain Rule */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Derivadas y la Chain Rule</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El principio matematico detras de backpropagation
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
            Si empujas una ficha de domino (input), la cadena de fichas amplifica o atenua el efecto.
            <span className="text-j-text"> La derivada mide cuanto se mueve la ultima ficha por cada milimetro que empujas la primera.</span>
            La chain rule te dice: multiplica los efectos de cada eslabon.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Derivada local</p>
            <p className="text-sm text-j-text mb-2">dL/dx = lim h→0 [f(x+h) - f(x)] / h</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Para +: dL/da = 1, dL/db = 1 (distribuye el gradiente)</p>
              <p>Para *: dL/da = b, dL/db = a (cruza los valores)</p>
              <p>Para tanh: dL/dx = 1 - tanh(x)^2</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Chain rule en accion</p>
            <p className="text-sm text-j-text mb-2">dL/dx = (dL/dy) * (dy/dx)</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Cada nodo recibe el gradiente de su padre</p>
              <p>Lo multiplica por su derivada local</p>
              <p>Lo pasa a sus hijos: propagacion hacia atras</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Backpropagation no es magia: es la <span className="text-[#991b1b]">chain rule aplicada recursivamente</span> sobre
            el grafo computacional. Cada nodo solo necesita saber su derivada local.
          </p>
        </div>
      </section>

      {/* Section 03: Backpropagation Automatizado */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Backpropagation Automatizado</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              De gradientes manuales a ._backward()
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
            Calcular gradientes a mano es como hacer contabilidad con lapiz.
            <span className="text-j-text"> Funciona, pero con 1000 parametros necesitas automatizacion.</span>
            El metodo _backward() es el software contable: cada operacion sabe como distribuir su &quot;credito&quot;.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Topological sort</p>
            <p className="text-sm text-j-text mb-2">Orden correcto de recorrido</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Antes de propagar, ordenas los nodos</p>
              <p>Garantiza que un nodo se procesa despues de todos sus consumidores</p>
              <p>Reverse topological order = backward pass</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Acumulacion de gradientes</p>
            <p className="text-sm text-j-text mb-2">El detalle critico</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Si un nodo se usa multiples veces, los gradientes se SUMAN</p>
              <p>self.grad += no self.grad = (error clasico de implementacion)</p>
              <p>Multivariate chain rule: suma de contribuciones parciales</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            La acumulacion de gradientes (+=) es el error mas comun al implementar backprop.
            Si un valor se usa dos veces, <span className="text-[#991b1b]">sus gradientes se acumulan, no se reemplazan</span>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Reverse-mode (backprop)</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Del output hacia los inputs</p>
              <p>1 pass → gradientes de TODOS los parametros</p>
              <p>Eficiente: muchos params, 1 loss</p>
              <p>Usado por micrograd, PyTorch, building-gpt</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Forward-mode</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>De los inputs hacia el output</p>
              <p>1 pass → derivada respecto a 1 parametro</p>
              <p>Eficiente: pocos params, muchos outputs</p>
              <p>Usado para Jacobianos, no para redes neuronales</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Neuronas y Capas */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Neuronas, Capas y MLP</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Construyendo una red neuronal sobre micrograd
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
            Una neurona es un mini-votante: pesa cada input, suma los votos, y decide &quot;si&quot; o &quot;no&quot; (activacion).
            <span className="text-j-text"> Una capa es un comite de votantes. Un MLP son varios comites en serie,</span>
            donde cada comite refina la decision del anterior.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Neurona = w*x + b</p>
            <p className="text-sm text-j-text mb-2">Producto punto + bias + activacion</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Pesos (w): cuanto importa cada input</p>
              <p>Bias (b): umbral de activacion</p>
              <p>tanh: squash a [-1, 1] — la no-linealidad</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">MLP completo</p>
            <p className="text-sm text-j-text mb-2">Multi-Layer Perceptron</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Clase Neuron: n pesos + 1 bias</p>
              <p>Clase Layer: k neuronas en paralelo</p>
              <p>Clase MLP: capas apiladas secuencialmente</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Toda red neuronal — desde micrograd hasta GPT-4 — es una composicion de
            <span className="text-[#991b1b]"> operaciones diferenciables</span>. Si puedes calcular el gradiente de cada operacion,
            puedes entrenar la red.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">SGD (micrograd)</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Learning rate global, fijo</p>
              <p>w -= lr × grad</p>
              <p>Simple pero sensible a la escala de gradientes</p>
              <p>Requiere tuning cuidadoso del lr</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Adam (building-gpt)</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Learning rate adaptativo por parametro</p>
              <p>Usa media y varianza de gradientes historicos</p>
              <p>Mas robusto al lr inicial</p>
              <p>AdamW agrega weight decay separado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 05: Training Loop */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">El Training Loop</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Forward, loss, backward, update — el ciclo del aprendizaje
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
            Entrenar es como afinar un instrumento musical.
            <span className="text-j-text"> Tocas una nota (forward), escuchas que tan desafinada esta (loss),
            identificas que cuerda ajustar y en que direccion (backward),</span>
            y giras la clavija un poco (update). Repites hasta que suene bien.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Los 4 pasos</p>
            <p className="text-sm text-j-text mb-2">Cada iteracion de entrenamiento</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>1. Forward: calcular predicciones</p>
              <p>2. Loss: medir el error (MSE, cross-entropy)</p>
              <p>3. Backward: calcular gradientes (backprop)</p>
              <p>4. Update: p.data -= learning_rate * p.grad</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Detalles criticos</p>
            <p className="text-sm text-j-text mb-2">Lo que puede salir mal</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Zero grad: resetear gradientes antes de cada backward</p>
              <p>Learning rate: muy alto diverge, muy bajo no aprende</p>
              <p>La loss debe bajar monotonamente (con ruido)</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            El training loop es identico en micrograd y en PyTorch: <span className="text-[#991b1b]">forward → loss → backward → step</span>.
            La unica diferencia es la escala: micrograd opera en escalares, PyTorch en tensores.
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>
        <p className="text-6xl font-light text-j-text mb-2">G·R·A·D·S</p>
        <div className="space-y-1 text-j-text-secondary">
          <p><span className="text-j-text font-medium">G</span>rafo — Value construye un DAG de operaciones</p>
          <p><span className="text-j-text font-medium">R</span>egla de la cadena — chain rule como pegamento multiplicativo</p>
          <p><span className="text-j-text font-medium">A</span>utomatizacion — backward() recorre el grafo en orden topologico inverso</p>
          <p><span className="text-j-text font-medium">D</span>iseno de red — Neuron → Layer → MLP, composicion de primitivas</p>
          <p><span className="text-j-text font-medium">S</span>tep de entrenamiento — Forward → Loss → Backward → Update → Zero grad</p>
        </div>
      </section>

      {/* Pregunta final */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Que cambia cuando pasamos de 41 parametros (micrograd) a 124 millones (GPT-2)?
          La respuesta no es &quot;mas de lo mismo&quot; — es building-gpt.
        </p>
      </section>
    </article>
  );
}
