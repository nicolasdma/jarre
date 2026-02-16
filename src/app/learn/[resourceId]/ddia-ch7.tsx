export function DDIAChapter7() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            DDIA · Capitulo 7
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Transacciones
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          La herramienta contra el caos concurrente
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Multiples clientes leyendo y escribiendo los mismos datos simultaneamente.
          Sin transacciones, todo puede salir mal. Con ellas, la base de datos te protege — pero cuanto?
        </p>
      </header>

      {/* Section 01: ACID */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">ACID y Conceptos Base</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              No todo ACID es igual
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
            Como una operacion quirurgica: se completa toda o no se hace.
            <span className="text-j-text"> No dejas al paciente abierto si algo sale mal</span>
            {' '}— deshaces todo y vuelves al estado original.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text font-medium">Atomicity</p>
              <p className="text-xs text-j-text-secondary">Mejor nombre: &quot;Abortability&quot;</p>
            </div>
            <p className="text-sm text-j-text-tertiary max-w-xs text-right">Todo o nada. Si falla, se revierte todo.</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text font-medium">Consistency</p>
              <p className="text-xs text-j-text-secondary">La &quot;C&quot; es de relleno</p>
            </div>
            <p className="text-sm text-j-text-tertiary max-w-xs text-right">Propiedad de la app, no de la DB.</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text font-medium">Isolation</p>
              <p className="text-xs text-j-text-secondary">El corazon del capitulo</p>
            </div>
            <p className="text-sm text-j-text-tertiary max-w-xs text-right">Transacciones concurrentes no interfieren.</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <div>
              <p className="text-j-text font-medium">Durability</p>
              <p className="text-xs text-j-text-secondary">WAL + replicacion</p>
            </div>
            <p className="text-sm text-j-text-tertiary max-w-xs text-right">Datos commiteados sobreviven crashes.</p>
          </div>
        </div>
      </section>

      {/* Section 02: Weak Isolation */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Aislamiento Debil</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Read committed y snapshot isolation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Read Committed</p>
            <p className="text-sm text-j-text mb-2">El minimo viable</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>No dirty reads: solo ves datos commiteados</p>
              <p>No dirty writes: no sobrescribes sin commit</p>
              <p>Pero: permite read skew</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Snapshot Isolation</p>
            <p className="text-sm text-j-text mb-2">Foto consistente en el tiempo</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>MVCC: multiples versiones de cada fila</p>
              <p>Cada transaccion ve un snapshot al inicio</p>
              <p>Pero: permite write skew</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Read skew: el ejemplo de Alice</p>
          <p className="text-j-text">
            Alice tiene $500 + $500. Lee cuenta 1 ($500), la transferencia se ejecuta,
            lee cuenta 2 ($600). Ve un total de <span className="text-[#991b1b]">$1100</span> en lugar de $1000.
          </p>
        </div>
      </section>

      {/* Section 03: Lost Updates */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Actualizaciones Perdidas</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Read-modify-write concurrente
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">5 soluciones, 5 trade-offs</p>
          <div className="space-y-2 mt-3 text-sm text-[#5a5a52]">
            <p><span className="text-[#991b1b] font-medium">1.</span> Operaciones atomicas — <span className="text-j-text">UPDATE x = x + 1</span></p>
            <p><span className="text-[#991b1b] font-medium">2.</span> Explicit locking — <span className="text-j-text">SELECT FOR UPDATE</span></p>
            <p><span className="text-[#991b1b] font-medium">3.</span> Deteccion automatica — <span className="text-j-text">DB aborta al detectar conflicto</span></p>
            <p><span className="text-[#991b1b] font-medium">4.</span> Compare-and-set — <span className="text-j-text">WHERE value = old_value</span></p>
            <p><span className="text-[#991b1b] font-medium">5.</span> Conflict resolution — <span className="text-j-text">Para multi-lider/leaderless</span></p>
          </div>
        </div>
      </section>

      {/* Section 04: Write Skew */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Write Skew y Phantoms</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              La anomalia que snapshot isolation no previene
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
            Dos doctores de guardia se sienten mal. Ambos verifican: &quot;hay 2 de guardia, puedo irme&quot;.
            <span className="text-j-text"> Ambos se van. Resultado: 0 doctores.</span>
            {' '}Cada uno tomo una decision valida individualmente, pero colectivamente violaron el invariante.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Write skew</p>
            <p className="text-sm text-j-text mb-2">Escriben objetos diferentes</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Leen los mismos datos</p>
              <p>Escriben registros distintos</p>
              <p>El invariante se viola colectivamente</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Phantom</p>
            <p className="text-sm text-j-text mb-2">Filas que aun no existen</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>No puedes lockear lo que no existe</p>
              <p>SELECT FOR UPDATE no retorna filas</p>
              <p>Unica solucion general: serializabilidad</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 05: Serializability */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Serializabilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Tres caminos, un destino
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Serial real
            </p>
            <p className="text-sm text-[#5a5a52]">
              Un solo thread. Sin concurrencia, no hay anomalias.
              <span className="text-j-text"> Funciona si todo cabe en RAM y las transacciones son cortas.</span>
            </p>
            <p className="text-xs text-j-text-secondary mt-2">VoltDB, Redis, Datomic</p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Two-Phase Locking (2PL)
            </p>
            <p className="text-sm text-[#5a5a52]">
              Lectores bloquean escritores y viceversa. Correcto pero lento.
              <span className="text-j-text"> Deadlocks frecuentes, latencia impredecible.</span>
            </p>
            <p className="text-xs text-j-text-secondary mt-2">MySQL InnoDB (default), PostgreSQL (historico)</p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              SSI (Serializable Snapshot Isolation)
            </p>
            <p className="text-sm text-[#5a5a52]">
              Optimista: ejecuta sin bloquear, verifica al commitear.
              <span className="text-j-text"> Rendimiento cercano a snapshot isolation.</span>
            </p>
            <p className="text-xs text-j-text-secondary mt-2">PostgreSQL 9.1+</p>
          </div>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">SWAPS</p>
        <p className="text-sm text-j-text-tertiary mb-8">Las cinco capas de complejidad transaccional</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#991b1b] font-medium">S</span><span className="text-j-text-tertiary">ingle-object atomics</span> <span className="text-j-text">— El minimo: CAS y WAL</span></p>
          <p><span className="text-[#991b1b] font-medium">W</span><span className="text-j-text-tertiary">eak isolation</span> <span className="text-j-text">— Read committed, snapshot isolation</span></p>
          <p><span className="text-[#991b1b] font-medium">A</span><span className="text-j-text-tertiary">nomalias</span> <span className="text-j-text">— Lost updates, write skew, phantoms</span></p>
          <p><span className="text-[#991b1b] font-medium">P</span><span className="text-j-text-tertiary">revencion</span> <span className="text-j-text">— Locks, CAS, deteccion automatica</span></p>
          <p><span className="text-[#991b1b] font-medium">S</span><span className="text-j-text-tertiary">erializability</span> <span className="text-j-text">— Serial, 2PL, SSI</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Tu aplicacion tiene un bug de concurrencia que solo ocurre 1 de cada 1000 veces.
          <span className="text-j-text"> Como lo detectarias </span>
          si no puedes reproducirlo consistentemente?
        </p>
      </section>
    </article>
  );
}
