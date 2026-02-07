export function DDIAChapter5() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#2d4a6a]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
            DDIA · Capitulo 5
          </span>
        </div>

        <h1 className="text-4xl font-light text-[#2c2c2c] mb-2">
          Replicacion
        </h1>
        <p className="text-2xl font-light text-[#9c9a8e]">
          Copias de los Mismos Datos
        </p>

        <p className="mt-8 text-[#7a7a6e] leading-relaxed max-w-xl">
          Tener los mismos datos en multiples nodos conectados por red.
          Suena simple, pero las implicaciones son profundas: latencia, disponibilidad, consistencia.
        </p>
      </header>

      {/* Why replicate */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-6">
          Por que replicar
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Disponibilidad</p>
              <p className="text-sm text-[#9c9a8e]">Si un nodo muere, otro responde</p>
            </div>
            <p className="font-mono text-xs text-[#2d4a6a]">Tolerancia a fallas</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Latencia</p>
              <p className="text-sm text-[#9c9a8e]">Servidor cerca del usuario</p>
            </div>
            <p className="font-mono text-xs text-[#2d4a6a]">Geografico</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Throughput</p>
              <p className="text-sm text-[#9c9a8e]">Mas replicas = mas lecturas en paralelo</p>
            </div>
            <p className="font-mono text-xs text-[#2d4a6a]">Escalabilidad</p>
          </div>
        </div>
      </section>

      {/* Section 01: Leader-based replication */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Replicacion Lider-Seguidor</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              La arquitectura mas comun
            </p>
          </div>
        </div>

        {/* Visual: Leader-Follower */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">Flujo de escritura</p>

          <pre className="text-xs font-mono text-[#5a5a52] bg-[#f5f4f0] p-4 overflow-x-auto text-center">
{`  Cliente
    |
    v
 [LIDER]  ← todas las escrituras aqui
  / | \\
 v  v  v
[F1][F2][F3]  ← seguidores (replicas)
    ^
    |
  Cliente  ← lecturas de cualquiera`}
          </pre>
        </div>

        {/* Analogy */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Un profesor (lider) da la clase original. Los asistentes (seguidores) toman notas.
            <span className="text-[#2c2c2c]"> Si un asistente falta, copia las notas de otro. Pero solo el profesor puede cambiar el contenido.</span>
          </p>
        </div>
      </section>

      {/* Section 02: Sync vs Async */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Sincrono vs Asincrono</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El trade-off fundamental de la replicacion
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#2d4a6a] bg-[#2d4a6a]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-3">Sincrono</p>
            <p className="text-sm text-[#2c2c2c] mb-3">"Espero a que la replica confirme."</p>
            <div className="text-xs text-[#7a7a6e] space-y-1">
              <p>+ Garantia de consistencia</p>
              <p>+ Datos siempre en al menos 2 nodos</p>
              <p>- Un seguidor lento bloquea todo</p>
            </div>
          </div>
          <div className="p-5 border border-[#8b7355] bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-3">Asincrono</p>
            <p className="text-sm text-[#2c2c2c] mb-3">"Escribo y sigo. La replica se pone al dia."</p>
            <div className="text-xs text-[#7a7a6e] space-y-1">
              <p>+ Lider nunca se bloquea</p>
              <p>+ Mayor throughput</p>
              <p>- Si el lider muere, pierdes datos no replicados</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#2d4a6a] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">En la practica</p>
          <p className="text-[#2c2c2c]">
            La mayoria usa <span className="text-[#2d4a6a]">semi-sincrono</span>: un seguidor sincrono (backup garantizado)
            y el resto asincrono. Si el sincrono falla, otro toma su lugar.
          </p>
        </div>
      </section>

      {/* Section 03: Replication Lag */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Replication Lag</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El desfase inevitable
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
            Publicas un tweet. Lo ves en tu telefono, pero tu amigo al lado
            <span className="text-[#2c2c2c]"> no lo ve por 5 segundos.</span> Ambos estan leyendo de servidores distintos.
          </p>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Tres problemas del lag
        </p>

        <div className="space-y-6">
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">
              Read-after-write consistency
            </p>
            <p className="text-sm text-[#5a5a52] mb-2">
              Escribes algo y al refrescar no lo ves porque leiste de una replica desactualizada.
            </p>
            <p className="text-xs text-[#2d4a6a]">
              Solucion: leer del lider si el dato es del usuario actual y fue modificado recientemente.
            </p>
          </div>

          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">
              Monotonic reads
            </p>
            <p className="text-sm text-[#5a5a52] mb-2">
              Ves un comentario, refrescas, desaparece. Refrescas otra vez, reaparece. Cada request va a una replica diferente.
            </p>
            <p className="text-xs text-[#2d4a6a]">
              Solucion: fijar al usuario a una replica (sticky session por hash del user ID).
            </p>
          </div>

          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">
              Consistent prefix reads
            </p>
            <p className="text-sm text-[#5a5a52] mb-2">
              Ves la respuesta antes que la pregunta porque las replicas recibieron los datos en distinto orden.
            </p>
            <p className="text-xs text-[#2d4a6a]">
              Solucion: escribir datos causalmente relacionados en la misma particion.
            </p>
          </div>
        </div>
      </section>

      {/* Section 04: Failover */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Failover y Split Brain</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Cuando el lider muere
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d4a6a] text-[10px] text-white font-mono">1</span>
            <p className="text-sm text-[#5a5a52]">Detectar que el lider fallo (timeout de heartbeats)</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d4a6a] text-[10px] text-white font-mono">2</span>
            <p className="text-sm text-[#5a5a52]">Elegir un nuevo lider (el seguidor mas actualizado)</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d4a6a] text-[10px] text-white font-mono">3</span>
            <p className="text-sm text-[#5a5a52]">Reconfigurar clientes para escribir al nuevo lider</p>
          </div>
        </div>

        {/* Split brain */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Peligro: Split Brain</p>
          <p className="text-[#5a5a52] mb-3">
            El lider viejo se recupera y cree que sigue siendo lider.
            <span className="text-[#2c2c2c]"> Ahora hay dos lideres aceptando escrituras distintas.</span>
          </p>
          <p className="text-sm text-[#7a7a6e]">
            Datos divergentes, potencial corrupcion. Es uno de los problemas mas peligrosos en sistemas distribuidos.
          </p>
        </div>

        <div className="border-l-2 border-[#c4a07a] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-2">Pregunta clave</p>
          <p className="text-lg text-[#2c2c2c]">"Si el lider muere, cuantas escrituras pierdes?"</p>
          <p className="text-sm text-[#9c9a8e] mt-1">
            La respuesta depende de si tu replicacion es sincrona o asincrona.
          </p>
        </div>
      </section>

      {/* Section 05: Multi-leader and Leaderless */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Otros Modelos</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Multi-lider y sin lider
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">Multi-lider</p>
            <p className="text-sm text-[#5a5a52] mb-3">Multiples nodos aceptan escrituras (ej. datacenters separados).</p>
            <p className="text-xs text-[#c4a07a]">Problema: conflictos de escritura. Dos lideres escriben datos distintos para la misma key.</p>
          </div>
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">Sin lider (Dynamo)</p>
            <p className="text-sm text-[#5a5a52] mb-3">Cualquier nodo acepta lecturas y escrituras (ej. Cassandra).</p>
            <p className="text-xs text-[#c4a07a]">Quorum: leer de R nodos, escribir en W nodos. Si W+R &gt; N, garantizas lectura fresca.</p>
          </div>
        </div>

        <div className="border-l-2 border-[#2d4a6a] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#2d4a6a] uppercase mb-2">Resolucion de conflictos</p>
          <p className="text-[#2c2c2c]">
            Last-write-wins (LWW), merge automatico, o dejar que la app resuelva.
            <span className="text-[#9c9a8e]"> Ninguna solucion es perfecta — cada una pierde datos o complejiza la app.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#9c9a8e] uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-[#2c2c2c] mb-2">LAG</p>
        <p className="text-sm text-[#9c9a8e] mb-8">El desfase que define la replicacion</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#2d4a6a] font-medium">L</span><span className="text-[#9c9a8e]">ider propaga</span> <span className="text-[#2c2c2c]">— Una fuente de verdad para escrituras</span></p>
          <p><span className="text-[#2d4a6a] font-medium">A</span><span className="text-[#9c9a8e]">sincrono retrasa</span> <span className="text-[#2c2c2c]">— Las replicas siempre van detras</span></p>
          <p><span className="text-[#2d4a6a] font-medium">G</span><span className="text-[#9c9a8e]">arantias varian</span> <span className="text-[#2c2c2c]">— Read-your-writes, monotonic, prefix</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-[#e8e6e0]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si tu base de datos tiene replicacion asincrona y el lider muere,
          <span className="text-[#2c2c2c]"> cuantos segundos de datos estas dispuesto a perder?</span>
        </p>
      </section>
    </article>
  );
}
