export function P0LinearAlgebra() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#2563eb]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            MML · Algebra Lineal
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Algebra Lineal para ML
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          El lenguaje nativo de los datos y los modelos
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Cada dato que entra a un modelo es un vector. Cada capa de una red neuronal es una
          transformacion lineal. Entender algebra lineal no es opcional — es entender que
          hace la maquina con tus datos en cada paso.
        </p>
      </header>

      {/* Section 01: Vectores, Espacios Vectoriales y Bases */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Vectores, Espacios Vectoriales y Bases</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Los bloques fundamentales de la representacion
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
            Un vector es como una direccion en un mapa con magnitud. Un espacio vectorial es el
            mapa completo — todas las direcciones posibles.
            <span className="text-j-text"> Una base es el sistema de coordenadas minimo que necesitas para describir cualquier punto del mapa.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#2563eb] bg-[#2563eb]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-3">Vector geometrico</p>
            <p className="text-sm text-j-text mb-2">Flecha con direccion y magnitud en R^n</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Representacion intuitiva: puntos en el espacio</p>
              <p>Suma = paralelogramo, escalar = estirar/encoger</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Vector abstracto</p>
            <p className="text-sm text-j-text mb-2">Cualquier objeto que cumpla los axiomas vectoriales</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Funciones, polinomios y senales son vectores</p>
              <p>Los embeddings de palabras viven en espacios vectoriales</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#2563eb] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            En ML, cada feature es una dimension. Un dataset de 1000 muestras con 768 features
            es una coleccion de 1000 vectores en R^768.
            <span className="text-[#2563eb]"> La base que elijas determina como interpretas esos vectores.</span>
          </p>
        </div>
      </section>

      {/* Section 02: Matrices y Transformaciones Lineales */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Matrices y Transformaciones Lineales</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Las funciones que mueven datos entre espacios
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
            Una matriz es una maquina que transforma vectores. Le das un vector de entrada y
            te devuelve otro vector de salida.
            <span className="text-j-text"> Cada capa de una red neuronal es exactamente esto: una multiplicacion de matrices seguida de una no-linealidad.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#2563eb] bg-[#2563eb]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-3">Transformacion</p>
            <p className="text-sm text-j-text mb-2">Rotacion, escalado, reflexion, proyeccion</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Wx + b: la operacion mas comun en deep learning</p>
              <p>W define que transformacion aplicar al input x</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Composicion</p>
            <p className="text-sm text-j-text mb-2">Multiplicar matrices = componer transformaciones</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>AB aplica primero B, luego A (ojo con el orden)</p>
              <p>Una red profunda es una cadena de composiciones</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#2563eb] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            El rango de una matriz te dice cuantas dimensiones de informacion preserva la transformacion.
            <span className="text-[#2563eb]"> Si el rango es menor que la dimension del input, estas perdiendo informacion — y eso a veces es exactamente lo que quieres (compresion).</span>
          </p>
        </div>
      </section>

      {/* Section 03: Geometria Analitica */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Normas, Productos Internos y Proyecciones</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Medir distancias y similitudes en el espacio
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
            La norma es tu regla para medir longitudes. El producto interno es tu herramienta
            para medir angulos y similitud.
            <span className="text-j-text"> Cuando buscas documentos similares con cosine similarity, estas usando el producto interno normalizado.</span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Norma L2 (Euclidiana)</p>
            <p className="text-sm text-j-text-tertiary">Distancia en linea recta — la mas comun</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Norma L1 (Manhattan)</p>
            <p className="text-sm text-j-text-tertiary">Distancia caminando por cuadras — promueve sparsity</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Cosine Similarity</p>
            <p className="text-sm text-j-text-tertiary">Angulo entre vectores — ignora magnitud</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Proyeccion ortogonal</p>
            <p className="text-sm text-j-text-tertiary">La sombra de un vector sobre otro — base de least squares</p>
          </div>
        </div>

        <div className="border-l-2 border-[#2563eb] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            La eleccion de norma y metrica cambia completamente el comportamiento del modelo.
            <span className="text-[#2563eb]"> L1 regularization produce modelos sparse, L2 produce pesos pequenos pero no cero. La geometria de tu espacio define que aprende el modelo.</span>
          </p>
        </div>
      </section>

      {/* Section 04: Descomposicion de Matrices */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Determinantes, Eigenvalores y SVD</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Descomponer matrices para entender que hacen
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
            Descomponer una matriz es como factorizar un numero en primos. Revela la estructura
            oculta.
            <span className="text-j-text"> Los eigenvalores te dicen cuanto estira la transformacion en cada direccion principal. SVD hace lo mismo pero para cualquier matriz, no solo cuadradas.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#2563eb] bg-[#2563eb]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-3">Eigendecomposition</p>
            <p className="text-sm text-j-text mb-2">Av = lambda * v — direcciones que no cambian</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Solo para matrices cuadradas</p>
              <p>Eigenvalores = factores de escala en cada direccion propia</p>
              <p>Base de PCA, analisis de estabilidad y Google PageRank</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">SVD (A = U Sigma V^T)</p>
            <p className="text-sm text-j-text mb-2">Rotacion, escalado, rotacion — para cualquier matriz</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Funciona para matrices rectangulares (m x n)</p>
              <p>Singular values = importancia de cada componente</p>
              <p>Base de compresion, LSA, y low-rank approximations</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#2563eb] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            SVD es probablemente la herramienta mas versatil del algebra lineal.
            <span className="text-[#2563eb]"> Truncar los singular values pequenos te da la mejor aproximacion de bajo rango — es la base matematica de LoRA para fine-tuning eficiente de LLMs.</span>
          </p>
        </div>
      </section>

      {/* Section 05: Reduccion de Dimensionalidad */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">PCA, t-SNE y UMAP</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Reducir dimensiones sin perder lo esencial
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
            Imagina que fotografias un objeto 3D desde el mejor angulo posible para que se vea
            toda su forma en una foto 2D.
            <span className="text-j-text"> PCA encuentra ese angulo optimo — la proyeccion que maximiza la varianza visible.</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#2563eb]">PCA</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-1">Lineal</p>
            <p className="text-xs text-j-text-tertiary">Maximiza varianza, proyeccion global optima</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#2563eb]">t-SNE</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-1">No lineal</p>
            <p className="text-xs text-j-text-tertiary">Preserva vecindarios locales, bueno para clusters</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-2xl mb-2 text-[#2563eb]">UMAP</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-1">Topologico</p>
            <p className="text-xs text-j-text-tertiary">Preserva estructura global y local, mas rapido</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#2563eb] bg-[#2563eb]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-3">PCA en la practica</p>
            <p className="text-sm text-j-text mb-2">Eigenvalores de la matriz de covarianza</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Preprocesamiento: reducir 768 dims a 50 sin perder mucho</p>
              <p>Whitening: decorrelacionar features antes de entrenar</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Conexion con ML</p>
            <p className="text-sm text-j-text mb-2">Autoencoders son PCA no lineal</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>El bottleneck de un autoencoder aprende representaciones comprimidas</p>
              <p>VAEs generalizan esto con distribuciones probabilisticas</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#2563eb] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#2563eb] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            La curse of dimensionality hace que los datos en alta dimension se comporten de forma contraintuitiva — todos los puntos estan lejos de todos.
            <span className="text-[#2563eb]"> Reducir dimensiones no es un lujo: es necesario para que las distancias y similitudes tengan sentido.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">VMDDR</p>
        <p className="text-sm text-j-text-tertiary mb-8">Los cinco pilares del algebra lineal para ML</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#2563eb] font-medium">V</span><span className="text-j-text-tertiary">ectores</span> <span className="text-j-text">— Espacios, bases y representaciones</span></p>
          <p><span className="text-[#2563eb] font-medium">M</span><span className="text-j-text-tertiary">atrices</span> <span className="text-j-text">— Transformaciones lineales y composicion</span></p>
          <p><span className="text-[#2563eb] font-medium">D</span><span className="text-j-text-tertiary">istancias</span> <span className="text-j-text">— Normas, productos internos y proyecciones</span></p>
          <p><span className="text-[#2563eb] font-medium">D</span><span className="text-j-text-tertiary">escomposicion</span> <span className="text-j-text">— Eigenvalores, SVD y estructura oculta</span></p>
          <p><span className="text-[#2563eb] font-medium">R</span><span className="text-j-text-tertiary">educcion</span> <span className="text-j-text">— PCA, t-SNE, UMAP y la maldicion de la dimensionalidad</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si una red neuronal es una secuencia de transformaciones lineales con no-linealidades,
          <span className="text-j-text"> que pasa con la representacion de los datos en cada capa y por que necesitamos las no-linealidades?</span>
        </p>
      </section>
    </article>
  );
}
