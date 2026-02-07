export function DDIAChapter9() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
            DDIA · Capitulo 9
          </span>
        </div>

        <h1 className="text-4xl font-light text-[#2c2c2c] mb-2">
          Consistencia
        </h1>
        <p className="text-2xl font-light text-[#9c9a8e]">
          y Consenso
        </p>

        <p className="mt-8 text-[#7a7a6e] leading-relaxed max-w-xl">
          El objetivo final de los sistemas distribuidos: hacer que multiples nodos
          se comporten como si fueran uno solo. Spoiler: es extraordinariamente dificil.
        </p>
      </header>

      {/* Section 01: Linearizability */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Linearizabilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              La garantia mas fuerte
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
            Como una variable global compartida. Si alguien la cambia,
            <span className="text-[#2c2c2c]"> todos la ven cambiada inmediatamente.</span>
            No hay "veo el valor viejo porque mi replica esta desactualizada".
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Linearizable</p>
            <p className="text-sm text-[#2c2c2c] mb-2">"Como si hubiera una sola copia de los datos"</p>
            <div className="text-xs text-[#7a7a6e] space-y-1">
              <p>Una vez leido el valor nuevo, nadie ve el viejo</p>
              <p>Operaciones parecen atomicas e instantaneas</p>
              <p>Costo: latencia alta, baja disponibilidad</p>
            </div>
          </div>
          <div className="p-5 border border-[#8b7355] bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-3">Eventual consistency</p>
            <p className="text-sm text-[#2c2c2c] mb-2">"Eventualmente todos ven lo mismo"</p>
            <div className="text-xs text-[#7a7a6e] space-y-1">
              <p>Temporalmente puedes ver datos stale</p>
              <p>No hay garantia de cuando converge</p>
              <p>Beneficio: alta disponibilidad y baja latencia</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Donde necesitas linearizabilidad</p>
          <p className="text-[#2c2c2c]">
            Eleccion de lider, constraints de unicidad (usernames), locks distribuidos.
            En estos casos, "eventual" no es suficiente — necesitas saber la verdad <span className="text-[#991b1b]">ahora</span>.
          </p>
        </div>
      </section>

      {/* Section 02: Ordering Guarantees */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Garantias de Orden</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Causalidad y orden total
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Orden total
            </p>
            <p className="text-sm text-[#5a5a52]">
              Puedes comparar cualquier par de eventos y decir cual fue primero.
              Como los numeros naturales: 3 &lt; 5, siempre.
              <span className="text-[#2c2c2c]"> La linearizabilidad implica orden total.</span>
            </p>
          </div>

          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Orden parcial (causalidad)
            </p>
            <p className="text-sm text-[#5a5a52]">
              Algunos eventos son causalmente relacionados (A causa B), otros son concurrentes.
              <span className="text-[#2c2c2c]"> No puedes ordenar eventos concurrentes, y eso esta bien.</span>
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Lamport timestamps</p>
          <p className="text-[#5a5a52]">
            Cada nodo tiene un contador. Al enviar un mensaje, incluye su contador.
            Al recibir, toma el maximo entre su contador y el recibido, e incrementa.
            <span className="text-[#2c2c2c]"> Genera un orden total consistente con causalidad.</span>
          </p>
          <p className="text-xs text-[#c4a07a] mt-3">
            Limitacion: solo ordena despues del hecho. No sirve para decidir en tiempo real
            (ej. "este username ya existe?").
          </p>
        </div>
      </section>

      {/* Section 03: Distributed Transactions */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Transacciones Distribuidas</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              2PC y sus problemas
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-2">
            Two-Phase Commit (2PC)
          </p>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">1</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Prepare:</span> Coordinador pregunta "pueden hacer commit?" a todos los participantes</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">2</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Commit:</span> Si todos dicen "si", el coordinador manda commit. Si uno dice "no", todos hacen abort.</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">El problema de 2PC</p>
          <p className="text-[#5a5a52]">
            Si el coordinador muere despues del prepare pero antes del commit,
            <span className="text-[#2c2c2c]"> los participantes quedan bloqueados indefinidamente</span> — no saben si hacer commit o abort.
            Los locks se quedan tomados.
          </p>
          <p className="text-xs text-[#991b1b] mt-3">
            2PC es un protocolo de bloqueo. Si el coordinador falla, el sistema se detiene.
          </p>
        </div>
      </section>

      {/* Section 04: Consensus */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Consenso</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Raft, Paxos, y ponerse de acuerdo
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Definicion</p>
          <p className="text-lg text-[#2c2c2c]">
            Consenso: multiples nodos se ponen de acuerdo en un valor, de forma que la decision es final e irrevocable.
          </p>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Propiedades de un algoritmo de consenso
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Uniform agreement</p>
            <p className="text-sm text-[#9c9a8e]">Todos deciden el mismo valor</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Integrity</p>
            <p className="text-sm text-[#9c9a8e]">Cada nodo decide una sola vez</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Validity</p>
            <p className="text-sm text-[#9c9a8e]">El valor decidido fue propuesto por alguien</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Termination</p>
            <p className="text-sm text-[#9c9a8e]">Todo nodo que no falla eventualmente decide</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Raft</p>
            <p className="text-sm text-[#5a5a52] mb-2">Disenado para ser entendible. Lider elegido, log replicado.</p>
            <p className="text-xs text-[#7a7a6e]">etcd, Consul, CockroachDB</p>
          </div>
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Paxos</p>
            <p className="text-sm text-[#5a5a52] mb-2">El algoritmo original. Notoriamente dificil de implementar.</p>
            <p className="text-xs text-[#7a7a6e]">Google Chubby, Spanner</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Raft es como una eleccion: un candidato pide votos. Si obtiene mayoria, se convierte en lider.
            <span className="text-[#2c2c2c]"> Si el lider desaparece, los seguidores inician una nueva eleccion.</span>
            Cada "mandato" (term) tiene un unico lider.
          </p>
        </div>
      </section>

      {/* Section 05: CAP */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">El Teorema CAP</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              La eleccion imposible
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 border border-[#e8e6e0]">
            <p className="text-3xl mb-2 text-[#991b1b]">C</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-1">Consistency</p>
            <p className="text-xs text-[#9c9a8e]">Linearizabilidad</p>
          </div>
          <div className="text-center p-4 border border-[#e8e6e0]">
            <p className="text-3xl mb-2 text-[#991b1b]">A</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-1">Availability</p>
            <p className="text-xs text-[#9c9a8e]">Siempre responde</p>
          </div>
          <div className="text-center p-4 border border-[#e8e6e0]">
            <p className="text-3xl mb-2 text-[#991b1b]">P</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-1">Partition tol.</p>
            <p className="text-xs text-[#9c9a8e]">Sobrevive a red rota</p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">La realidad</p>
          <p className="text-[#2c2c2c]">
            Las particiones de red van a ocurrir. No es opcional. Entonces la eleccion real es:
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b] font-medium">CP:</span> Consistencia. Error si no hay quorum. (ej. ZooKeeper)</p>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b] font-medium">AP:</span> Disponibilidad. Responde con datos potencialmente stale. (ej. Cassandra)</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Critica de Kleppmann al CAP</p>
          <p className="text-[#5a5a52]">
            CAP es demasiado simplista. En la practica, hay un espectro entre C y A, no una eleccion binaria.
            <span className="text-[#2c2c2c]"> Es mas util pensar en que garantias especificas necesitas para cada operacion.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#9c9a8e] uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-[#2c2c2c] mb-2">LOC</p>
        <p className="text-sm text-[#9c9a8e] mb-8">Las tres ideas centrales del capitulo</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#991b1b] font-medium">L</span><span className="text-[#9c9a8e]">inearizability ordena</span> <span className="text-[#2c2c2c]">— Como si hubiera una sola copia</span></p>
          <p><span className="text-[#991b1b] font-medium">O</span><span className="text-[#9c9a8e]">rdering restringe</span> <span className="text-[#2c2c2c]">— Causalidad vs orden total</span></p>
          <p><span className="text-[#991b1b] font-medium">C</span><span className="text-[#9c9a8e]">onsensus acuerda</span> <span className="text-[#2c2c2c]">— Raft/Paxos para decidir juntos</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-[#e8e6e0]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          En tu sistema, que operaciones <span className="text-[#2c2c2c]">necesitan linearizabilidad</span>
          {' '}y cuales pueden tolerar eventual consistency?
        </p>
      </section>
    </article>
  );
}
