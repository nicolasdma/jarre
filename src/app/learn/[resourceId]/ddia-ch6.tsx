export function DDIAChapter6() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#059669]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
            DDIA · Capitulo 6
          </span>
        </div>

        <h1 className="text-4xl font-light text-[#2c2c2c] mb-2">
          Particionamiento
        </h1>
        <p className="text-2xl font-light text-[#9c9a8e]">
          Dividir Datos entre Nodos
        </p>

        <p className="mt-8 text-[#7a7a6e] leading-relaxed max-w-xl">
          Cuando los datos no caben en un solo nodo, los divides en particiones (shards).
          La pregunta clave: como decides que dato va a que nodo?
        </p>
      </header>

      {/* Why partition */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-6">
          Particionamiento vs Replicacion
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#2d4a6a] bg-[#2d4a6a]/5 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">Replicacion (Ch5)</p>
            <p className="text-sm text-[#5a5a52]">Mismos datos en multiples nodos</p>
            <p className="font-mono text-[10px] text-[#2d4a6a] mt-2">Disponibilidad</p>
          </div>
          <div className="p-5 border border-[#059669] bg-[#059669]/5 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Particionamiento (Ch6)</p>
            <p className="text-sm text-[#5a5a52]">Datos distintos en nodos distintos</p>
            <p className="font-mono text-[10px] text-[#059669] mt-2">Escalabilidad</p>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Insight clave</p>
          <p className="text-[#2c2c2c]">
            Son complementarios. Cada particion se replica en multiples nodos para tolerancia a fallas.
          </p>
        </div>
      </section>

      {/* Section 01: Hash partitioning */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Particionamiento por Hash</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Distribucion uniforme
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">Mecanismo</p>

          <pre className="text-xs font-mono text-[#5a5a52] bg-[#f5f4f0] p-4 overflow-x-auto text-center">
{`  key = "user-42"
    |
    v
  hash("user-42") = 0x7A3F...
    |
    v
  0x7A3F mod 4 = 2
    |
    v
  Particion 2`}
          </pre>

          <p className="text-xs text-[#7a7a6e] mt-4 text-center">
            La funcion hash distribuye las keys <span className="font-mono text-[#059669]">uniformemente</span> entre particiones
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Fortalezas</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>+ Distribucion uniforme de datos</li>
              <li>+ Evita hotspots por claves secuenciales</li>
              <li>+ Simple de implementar</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Debilidades</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>- Range queries imposibles</li>
              <li>- Keys adyacentes terminan en particiones distintas</li>
              <li>- Rebalanceo costoso si se usa mod N</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 02: Range partitioning */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Particionamiento por Rango</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Datos ordenados por key
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">Distribucion por rangos</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 border border-[#059669] bg-[#059669]/5">
              <p className="font-mono text-[10px] text-[#059669]">Particion 1</p>
              <p className="text-sm text-[#5a5a52] mt-1">A — G</p>
            </div>
            <div className="text-center p-3 border border-[#059669] bg-[#059669]/5">
              <p className="font-mono text-[10px] text-[#059669]">Particion 2</p>
              <p className="text-sm text-[#5a5a52] mt-1">H — P</p>
            </div>
            <div className="text-center p-3 border border-[#059669] bg-[#059669]/5">
              <p className="font-mono text-[10px] text-[#059669]">Particion 3</p>
              <p className="text-sm text-[#5a5a52] mt-1">Q — Z</p>
            </div>
          </div>

          <p className="text-xs text-[#7a7a6e] mt-4 text-center">
            Como una enciclopedia: volumen 1 (A-G), volumen 2 (H-P), volumen 3 (Q-Z)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Fortalezas</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>+ Range queries eficientes</li>
              <li>+ Datos ordenados dentro de cada particion</li>
              <li>+ Scan secuencial posible</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Debilidades</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>- Hotspots si las keys no se distribuyen bien</li>
              <li>- Timestamps como key = toda la carga en una particion</li>
              <li>- Desbalance sin ajuste dinamico</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 03: Hotspots */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Hotspots</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              La particion sobrecargada
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Una celebridad con 100M de seguidores publica un tweet.
            <span className="text-[#2c2c2c]"> Toda esa carga cae en la particion que tiene su user ID.</span>
            Las otras 99 particiones estan tranquilas.
          </p>
        </div>

        <div className="border-l-2 border-[#c4a07a] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-2">Pregunta clave</p>
          <p className="text-lg text-[#2c2c2c]">"Tu particionamiento asume distribucion uniforme. La realidad casi nunca lo es."</p>
        </div>
      </section>

      {/* Section 04: Rebalancing */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Rebalanceo</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Mover datos entre nodos
            </p>
          </div>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Estrategias de rebalanceo
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Particiones fijas</p>
              <p className="text-sm text-[#9c9a8e]">Crear 1000 particiones desde el inicio, asignar a nodos</p>
            </div>
            <p className="font-mono text-xs text-[#059669]">Riak, Elasticsearch</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Particiones dinamicas</p>
              <p className="text-sm text-[#9c9a8e]">Se dividen cuando crecen demasiado</p>
            </div>
            <p className="font-mono text-xs text-[#059669]">HBase, MongoDB</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#c4a07a]">hash(key) mod N</p>
              <p className="text-sm text-[#9c9a8e]">Agregar un nodo mueve casi todos los datos</p>
            </div>
            <p className="font-mono text-xs text-[#c4a07a]">Evitar</p>
          </div>
        </div>

        <div className="border-l-2 border-[#059669] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">Consistent hashing</p>
          <p className="text-[#2c2c2c]">
            Con consistent hashing, agregar un nodo solo mueve 1/N de los datos en promedio, no todos.
            Es la base de Dynamo, Cassandra, y la mayoria de sistemas modernos.
          </p>
        </div>
      </section>

      {/* Section 05: Secondary Indexes */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Indices Secundarios</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Buscar por algo que no es la key
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Local index</p>
            <p className="text-sm text-[#2c2c2c] mb-2">"Cada particion mantiene su propio indice"</p>
            <p className="text-xs text-[#7a7a6e]">Escritura rapida, lectura requiere scatter-gather (consultar todas las particiones).</p>
          </div>
          <div className="p-5 border border-[#8b7355] bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-3">Global index</p>
            <p className="text-sm text-[#2c2c2c] mb-2">"Un indice que cubre todas las particiones"</p>
            <p className="text-xs text-[#7a7a6e]">Lectura rapida (una particion), escritura requiere transaccion distribuida.</p>
          </div>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#9c9a8e] uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-[#2c2c2c] mb-2">HRR</p>
        <p className="text-sm text-[#9c9a8e] mb-8">Las tres operaciones del particionamiento</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#059669] font-medium">H</span><span className="text-[#9c9a8e]">ash distribuye</span> <span className="text-[#2c2c2c]">— Uniforme pero sin rangos</span></p>
          <p><span className="text-[#059669] font-medium">R</span><span className="text-[#9c9a8e]">ange ordena</span> <span className="text-[#2c2c2c]">— Rangos posibles pero riesgo de hotspots</span></p>
          <p><span className="text-[#059669] font-medium">R</span><span className="text-[#9c9a8e]">ebalance mueve</span> <span className="text-[#2c2c2c]">— Agregar nodos sin mover todo</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-[#e8e6e0]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si tu base de datos crece 100x y necesitas 50 nodos,
          <span className="text-[#2c2c2c]"> como decides que key va a que nodo sin mover todo al agregar el nodo 51?</span>
        </p>
      </section>
    </article>
  );
}
