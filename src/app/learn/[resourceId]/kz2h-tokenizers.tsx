export function Kz2hTokenizers() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#059669]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Video · Karpathy Zero to Hero · Lecture 2
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Tokenizers
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          De texto a numeros — el primer paso
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Por que los LLMs no pueden contar letras en &quot;strawberry&quot;, por que los typos
          los confunden, y como BPE convierte texto arbitrario en una secuencia de IDs
          que el modelo puede procesar.
        </p>
      </header>

      {/* Section 01: Tokenizacion */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Tokenizacion — Partir el Texto en Pedazos</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Ni letras ni palabras — subwords
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
            Una red neuronal solo entiende numeros. No sabe que es &quot;gato&quot;.
            <span className="text-j-text"> Necesitas convertir texto en numeros, pero ¿letras? ¿palabras? ¿algo intermedio?</span>
            Letras son demasiado granulares. Palabras son infinitas. Tokens son el punto medio.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">BPE</p>
            <p className="text-sm text-j-text mb-2">Byte Pair Encoding</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Empieza con caracteres individuales</p>
              <p>Merge iterativo de pares mas frecuentes</p>
              <p>GPT-4: ~100,000 tokens en el diccionario</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Ejemplos</p>
            <p className="text-sm text-j-text mb-2">Tokenizacion en practica</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>&quot;gato&quot; → [gato] (1 token, comun)</p>
              <p>&quot;backprop&quot; → [back, prop] (2 tokens)</p>
              <p>&quot;Nicolas&quot; → [Nic, ol, as] (3 tokens, raro)</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            El tokenizador es <span className="text-[#059669]">completamente ciego</span>. No entiende espanol ni gramatica.
            Solo sabe que pedazos de texto aparecieron mucho en los datos de entrenamiento.
            Toda la &quot;inteligencia&quot; viene despues.
          </p>
        </div>
      </section>

      {/* Section 02: Por qué no cuentan letras */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Por Que los LLMs No Cuentan Letras</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Tokens ≠ caracteres — y las consecuencias
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Ejemplo revelador</p>
          <p className="text-[#5a5a52]">
            &quot;tiene&quot; → 1 token → 1 embedding → el modelo SABE que significa.
            <span className="text-j-text"> &quot;tinee&quot; → 2 tokens → &quot;tin&quot; + &quot;ee&quot; → basura semantica.</span>
            El modelo recibe una secuencia de tokens completamente diferente por un typo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Typos y errores</p>
            <p className="text-sm text-j-text mb-2">Tokens diferentes</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Typo comun → modelo lo vio muchas veces → entiende</p>
              <p>Typo raro → tokens sin sentido → falla</p>
              <p>&quot;strawberry&quot; → tokens, no letras → no cuenta R</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Consecuencias</p>
            <p className="text-sm text-j-text mb-2">Lo que esto explica</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>LLMs escriben mejor que internet promedio</p>
              <p>&quot;vaca&quot; (10M veces) gana a &quot;baca&quot; (50K veces)</p>
              <p>Alucinaciones: elige lo probable, no lo verdadero</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            El modelo <span className="text-[#059669]">nunca ve letras, solo ve tokens</span>.
            Eso explica por que no cuentan letras, por que los typos confunden,
            y por que escriben mejor que el promedio de internet.
          </p>
        </div>
      </section>

      {/* Section 03: De Tokens a Embeddings */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">De Tokens a Embeddings — El Pipeline</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Tokenizar → IDs → embedding lookup
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">El flujo completo</p>
          <p className="text-[#5a5a52]">
            &quot;El gato duerme&quot; → tokenizar → [512, 8847, 23091]
            <span className="text-j-text"> → embedding lookup (tabla 100K × 768)</span>
            → 3 vectores de 768 numeros cada uno → la red neuronal procesa esto.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Embedding matrix</p>
            <p className="text-sm text-j-text mb-2">Una tabla que se aprende</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>100,000 tokens × 768 dimensiones</p>
              <p>= 76.8 millones de parametros</p>
              <p>Empieza random, se ajusta con backprop</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Palabras cercanas</p>
            <p className="text-sm text-j-text mb-2">Efecto emergente</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>&quot;gato&quot; y &quot;perro&quot; → vectores cercanos</p>
              <p>Aparecen en contextos similares</p>
              <p>rey - hombre + mujer ≈ reina</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            Nadie le dice al modelo que &quot;gato&quot; y &quot;perro&quot; son similares.
            El modelo <span className="text-[#059669]">descubre que ponerlos cerca reduce su error</span>.
            Las asociaciones son un efecto emergente del entrenamiento.
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>
        <p className="text-6xl font-light text-j-text mb-2">T·C·E</p>
        <div className="space-y-1 text-j-text-secondary">
          <p><span className="text-j-text font-medium">T</span>okenizar — partir texto en subwords (BPE)</p>
          <p><span className="text-j-text font-medium">C</span>onsecuencias — tokens ≠ letras, typos, alucinaciones</p>
          <p><span className="text-j-text font-medium">E</span>mbeddings — tabla aprendida, significado emerge</p>
        </div>
      </section>

      {/* Pregunta final */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si las dimensiones del embedding no tienen nombres humanos,
          ¿como sabemos que los embeddings funcionan bien?
          ¿Y que pasa con los sesgos que absorben del texto de entrenamiento?
        </p>
      </section>
    </article>
  );
}
