export function Kz2hBuildingGpt() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#1e40af]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Video · Karpathy Zero to Hero · Lecture 7
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Let&apos;s build GPT
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          Attention y Transformers desde cero
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          De &quot;el banco cerca del rio&quot; vs &quot;el banco me cobro comision&quot; hasta el bloque
          completo del Transformer. Attention, softmax, multi-head, positional encoding,
          feed-forward, residual connections — todo con ejemplos numericos paso a paso.
        </p>
      </header>

      {/* Section 01: El Problema del Contexto */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">El Problema del Contexto</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Por que los RNNs no alcanzaban
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">El problema</p>
          <p className="text-[#5a5a52]">
            &quot;El banco esta cerca del rio&quot; vs &quot;El banco me cobro comision&quot;.
            <span className="text-j-text"> &quot;Banco&quot; tiene el mismo embedding en ambos casos, pero significados opuestos.</span>
            El modelo necesita mirar el contexto para desambiguar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#1e40af] bg-[#1e40af]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#1e40af] uppercase mb-3">RNNs/LSTMs</p>
            <p className="text-sm text-j-text mb-2">Procesamiento secuencial</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Palabra por palabra, en orden</p>
              <p>No se puede paralelizar</p>
              <p>La palabra 200 olvido a la palabra 1</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Attention</p>
            <p className="text-sm text-j-text mb-2">Cada palabra mira a todas</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Acceso directo a toda la secuencia</p>
              <p>Totalmente parallelizable</p>
              <p>Sin limite de distancia</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#1e40af] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#1e40af] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Attention elimina la recurrencia por completo: <span className="text-[#1e40af]">cada palabra puede conectarse
            directamente con cualquier otra</span>, sin importar la distancia. Eso es lo que habilito los LLMs modernos.
          </p>
        </div>
      </section>

      {/* Section 02: Q, K, V */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Q, K, V — Query, Key, Value</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Tres proyecciones, un mecanismo
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia del diccionario</p>
          <p className="text-[#5a5a52]">
            Query = la palabra que buscas. Key = la entrada del diccionario que matchea.
            <span className="text-j-text"> Value = la definicion que obtienes.</span>
            El Key te ayuda a encontrar, el Value es lo que recibes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#1e40af] bg-[#1e40af]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#1e40af] uppercase mb-3">Tres proyecciones</p>
            <p className="text-sm text-j-text mb-2">Misma palabra, tres roles</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Q = vector × W_q (¿que busco?)</p>
              <p>K = vector × W_k (¿que ofrezco?)</p>
              <p>V = vector × W_v (¿que informacion cargo?)</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">La formula</p>
            <p className="text-sm text-j-text mb-2">Attention(Q,K,V)</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>score = Q · K (dot product)</p>
              <p>÷ √d_k (estabilidad numerica)</p>
              <p>softmax → promedio ponderado de V</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#1e40af] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#1e40af] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Las tres matrices W_q, W_k, W_v <span className="text-[#1e40af]">se aprenden durante el entrenamiento</span>.
            Son como tres filtros distintos aplicados a la misma informacion,
            cada uno optimizado para su rol.
          </p>
        </div>
      </section>

      {/* Section 03: Softmax */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Softmax — Convertir Scores en Porcentajes</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              e^x, division, y el ganador se lleva mas
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Ejemplo numerico</p>
          <p className="text-[#5a5a52]">
            Scores [-3, 5, -1, 2] → e^x [0.05, 148.4, 0.37, 7.39] → divide entre suma 156.21
            <span className="text-j-text"> → [0.03%, 95%, 0.24%, 4.73%]. El score mas alto se lleva casi todo.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#1e40af] bg-[#1e40af]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#1e40af] uppercase mb-3">¿Por que e^x?</p>
            <p className="text-sm text-j-text mb-2">Siempre positivo</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>e^(-3) = 0.05 → positivo</p>
              <p>e^(5) = 148.4 → positivo</p>
              <p>Agranda las diferencias: el ganador domina</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">√d_k scaling</p>
            <p className="text-sm text-j-text mb-2">Estabilidad numerica</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Sin √d_k, dot products crecen mucho</p>
              <p>Softmax se satura → gradientes desaparecen</p>
              <p>d_k = dimension de los keys (ej: 64)</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#1e40af] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#1e40af] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Softmax es solo: <span className="text-[#1e40af]">e^(score) / suma de todos los e^(scores)</span>.
            Convierte cualquier lista de numeros en porcentajes positivos que suman 1.
          </p>
        </div>
      </section>

      {/* Section 04-09: remaining sections as summary cards */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">El Promedio Ponderado</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Mezclar Values segun relevancia
            </p>
          </div>
        </div>
        <div className="border-l-2 border-[#1e40af] pl-6 py-2">
          <p className="text-j-text">
            Cada palabra mezcla los Values de todas las demas, ponderados por los scores de atencion.
            Despues de esto, <span className="text-[#1e40af]">&quot;come&quot; ya sabe quien come y que come</span>.
            Y todo ocurre en paralelo — por eso los transformers son rapidos.
          </p>
        </div>
      </section>

      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Multi-Head Attention</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              8 perspectivas en paralelo
            </p>
          </div>
        </div>
        <div className="border-l-2 border-[#1e40af] pl-6 py-2">
          <p className="text-j-text">
            En vez de 1 atencion con 512 dimensiones: <span className="text-[#1e40af]">8 cabezas de 64 dimensiones cada una</span>.
            Cada cabeza aprende relaciones distintas (gramaticales, semanticas, posicionales).
            Al final: concatenar las 8 salidas y proyectar de vuelta a 512.
          </p>
        </div>
      </section>

      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">06</span>
          <div>
            <h2 className="text-xl text-j-text">Positional Encoding</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El orden importa
            </p>
          </div>
        </div>
        <div className="border-l-2 border-[#1e40af] pl-6 py-2">
          <p className="text-j-text">
            Sin posicion, &quot;el gato come el pez&quot; y &quot;el pez come el gato&quot; son iguales.
            Solucion: <span className="text-[#1e40af]">sumar un vector de posicion a cada embedding</span>.
            Ahora cada palabra codifica que es + donde esta.
          </p>
        </div>
      </section>

      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">07</span>
          <div>
            <h2 className="text-xl text-j-text">Feed-Forward + Residual + LayerNorm</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Interpretar, proteger, estabilizar
            </p>
          </div>
        </div>
        <div className="border-l-2 border-[#1e40af] pl-6 py-2">
          <p className="text-j-text">
            Feed-Forward (512→2048→512) interpreta lo que la atencion recopilo,
            por posicion independientemente.
            Residual connections suman la entrada original como <span className="text-[#1e40af]">red de seguridad</span>.
            LayerNorm estabiliza los valores.
          </p>
        </div>
      </section>

      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">08</span>
          <div>
            <h2 className="text-xl text-j-text">El Bloque Completo</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              ×6 bloques → softmax sobre 50K palabras
            </p>
          </div>
        </div>
        <div className="border-l-2 border-[#1e40af] pl-6 py-2">
          <p className="text-j-text">
            Attn → residual → LayerNorm → FF → residual → LayerNorm.
            Apilado <span className="text-[#1e40af]">6 veces</span>. Al final: vector de la ultima posicion →
            50,000 scores → softmax → prediccion de la siguiente palabra.
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>
        <p className="text-6xl font-light text-j-text mb-2">C·Q·S·M·B</p>
        <div className="space-y-1 text-j-text-secondary">
          <p><span className="text-j-text font-medium">C</span>ontexto — el problema que resuelve attention</p>
          <p><span className="text-j-text font-medium">Q</span>KV — tres proyecciones de cada palabra</p>
          <p><span className="text-j-text font-medium">S</span>oftmax — scores a porcentajes</p>
          <p><span className="text-j-text font-medium">M</span>ulti-head — 8 perspectivas en paralelo</p>
          <p><span className="text-j-text font-medium">B</span>loque — attn + FF + residual, ×6</p>
        </div>
      </section>

      {/* Pregunta final */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si attention permite que cada palabra mire a TODAS las demas,
          ¿que pasa cuando la secuencia tiene 100,000 tokens?
          ¿Por que es un problema y como lo resuelven los modelos modernos?
        </p>
      </section>
    </article>
  );
}
