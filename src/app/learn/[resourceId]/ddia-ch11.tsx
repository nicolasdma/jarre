export function DDIAChapter11() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            DDIA · Capitulo 11
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Procesamiento
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          de Flujos
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Los datos no siempre llegan en lotes. A veces fluyen continuamente,
          evento por evento, y el sistema debe procesarlos a medida que llegan.
          Stream processing es el paradigma que hace esto posible.
        </p>
      </header>

      {/* Section 01: Event Streams */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Transmision de Flujos de Eventos</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Sistemas de mensajeria
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
            Un sistema de mensajes es como un servicio postal.
            <span className="text-j-text"> El productor envia cartas, el broker las almacena, y el consumidor las recoge.</span>
            La diferencia es si las cartas se guardan o se descartan despues de leerlas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Direct messaging</p>
            <p className="text-sm text-j-text mb-2">"Productor habla directamente al consumidor"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>UDP multicast, ZeroMQ, webhooks</p>
              <p>Sin intermediario, baja latencia</p>
              <p>Si el consumidor cae, los mensajes se pierden</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Message broker</p>
            <p className="text-sm text-j-text mb-2">"Un intermediario almacena y distribuye"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>RabbitMQ, ActiveMQ, NATS</p>
              <p>Desacopla productores de consumidores</p>
              <p>Tolera que el consumidor este temporalmente offline</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Pregunta clave del diseno</p>
          <p className="text-j-text">
            Que pasa si los consumidores no pueden seguir el ritmo de los productores?
            Tres opciones: descartar mensajes, hacer buffering (cola), o aplicar <span className="text-[#991b1b]">backpressure</span>.
          </p>
        </div>
      </section>

      {/* Section 02: Partitioned Logs */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Logs Particionados</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Kafka y el log como estructura
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
            Un log particionado es como un libro de contabilidad con multiples volumenes.
            <span className="text-j-text"> Cada volumen (particion) es append-only y se lee secuencialmente.</span>
            Puedes releer cualquier pagina pasada sin que desaparezca.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Consumer offset
            </p>
            <p className="text-sm text-[#5a5a52]">
              Cada consumidor lleva un puntero (offset) que indica hasta donde ha leido.
              <span className="text-j-text"> Si se cae, retoma desde su ultimo offset guardado.</span>
              No necesita acknowledgment individual por mensaje.
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Replay de mensajes
            </p>
            <p className="text-sm text-[#5a5a52]">
              A diferencia de un message broker tradicional, los mensajes no se borran al consumirlos.
              <span className="text-j-text"> Puedes rebobinar el offset y reprocesar todo el historico.</span>
              Esto habilita debug, migraciones y recalculo de vistas derivadas.
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Kafka en una frase</p>
          <p className="text-j-text">
            Un log distribuido, particionado y replicado. Combina la durabilidad de una base de datos
            con el throughput de un sistema de mensajeria. <span className="text-[#991b1b]">Lo mejor de ambos mundos.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Databases and Streams */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Bases de Datos y Flujos</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Change Data Capture
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
            CDC es como instalar camaras en una bodega.
            <span className="text-j-text"> Cada vez que alguien mueve un producto, la camara lo registra</span>
            y otros sistemas (inventario, contabilidad) se actualizan automaticamente.
          </p>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Como funciona CDC
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Write-ahead log</p>
            <p className="text-sm text-j-text-tertiary">Se lee el WAL de la base de datos</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Stream de cambios</p>
            <p className="text-sm text-j-text-tertiary">Cada INSERT/UPDATE/DELETE se convierte en un evento</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Sistemas derivados</p>
            <p className="text-sm text-j-text-tertiary">Indices, caches y search engines se actualizan</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Orden preservado</p>
            <p className="text-sm text-j-text-tertiary">Los cambios llegan en el mismo orden que ocurrieron</p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">El problema que resuelve</p>
          <p className="text-j-text">
            Mantener multiples sistemas sincronizados (base de datos, cache, search index)
            sin dual writes. Con CDC, la base de datos es la <span className="text-[#991b1b]">unica fuente de verdad</span>
            y todo lo demas se deriva de ella.
          </p>
        </div>
      </section>

      {/* Section 04: Event Sourcing */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Event Sourcing e Inmutabilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              El estado como derivado de eventos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Estado mutable</p>
            <p className="text-sm text-j-text mb-2">"Actualizo el saldo directamente"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>UPDATE balance SET amount = 500</p>
              <p>El valor anterior se pierde</p>
              <p>No sabes como llegaste a ese estado</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Event sourcing</p>
            <p className="text-sm text-j-text mb-2">"Registro cada transaccion"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>+1000, -200, -300 = saldo 500</p>
              <p>Historial completo preservado</p>
              <p>Puedes reconstruir cualquier estado pasado</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Ventajas de la inmutabilidad</p>
          <p className="text-[#5a5a52]">
            Si un log es append-only, es mucho mas facil de replicar, debuggear y auditar.
            <span className="text-j-text"> Nunca se borra ni se modifica un evento pasado.</span>
            Es como la contabilidad: no borras un error, lo corriges con un nuevo asiento.
          </p>
          <p className="text-xs text-j-warm mt-3">
            Limitacion: el log crece indefinidamente. Necesitas compactacion o snapshots
            para evitar que el almacenamiento explote.
          </p>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">CDC vs Event Sourcing</p>
          <p className="text-j-text">
            CDC extrae eventos del WAL de una base de datos existente. Event sourcing
            disena la aplicacion <span className="text-[#991b1b]">desde cero</span> alrededor de eventos como
            ciudadanos de primera clase.
          </p>
        </div>
      </section>

      {/* Section 05: Stream Processing */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Procesamiento de Flujos</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Joins, ventanas y tolerancia a fallos
            </p>
          </div>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Tipos de procesamiento
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Complex Event Processing</p>
            <p className="text-sm text-j-text-tertiary">Detectar patrones en flujos de eventos</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Stream analytics</p>
            <p className="text-sm text-j-text-tertiary">Agregaciones continuas sobre ventanas de tiempo</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Materialized views</p>
            <p className="text-sm text-j-text-tertiary">Vistas derivadas actualizadas en tiempo real</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Stream-Stream</p>
            <p className="text-xs text-j-text-tertiary">Dos flujos se cruzan en una ventana temporal</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Stream-Table</p>
            <p className="text-xs text-j-text-tertiary">Flujo enriquecido con datos de una tabla</p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Table-Table</p>
            <p className="text-xs text-j-text-tertiary">Dos tablas CDC mantenidas sincronizadas</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">Tolerancia a fallos</p>
          <p className="text-[#5a5a52]">
            En batch processing, si falla, reprocesas todo el lote. En streams no puedes esperar.
            <span className="text-j-text"> Se usan checkpoints periodicos y micro-batching</span>
            para garantizar exactly-once semantics sin sacrificar latencia.
          </p>
          <p className="text-xs text-[#991b1b] mt-3">
            Exactly-once es realmente "effectively-once": el procesamiento puede repetirse,
            pero el efecto observable es como si ocurriera una sola vez.
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">LICEP</p>
        <p className="text-sm text-j-text-tertiary mb-8">Las cinco ideas centrales del capitulo</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#991b1b] font-medium">L</span><span className="text-j-text-tertiary">ogs particionados</span> <span className="text-j-text">— Append-only, replayable, duradero</span></p>
          <p><span className="text-[#991b1b] font-medium">I</span><span className="text-j-text-tertiary">nmutabilidad</span> <span className="text-j-text">— Nunca borrar, siempre agregar</span></p>
          <p><span className="text-[#991b1b] font-medium">C</span><span className="text-j-text-tertiary">DC sincroniza</span> <span className="text-j-text">— Una fuente de verdad, muchos derivados</span></p>
          <p><span className="text-[#991b1b] font-medium">E</span><span className="text-j-text-tertiary">vent sourcing</span> <span className="text-j-text">— Estado = fold de eventos</span></p>
          <p><span className="text-[#991b1b] font-medium">P</span><span className="text-j-text-tertiary">rocesamiento</span> <span className="text-j-text">— Joins, ventanas, exactly-once</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si pudieras reemplazar tu base de datos por un <span className="text-j-text">log inmutable de eventos</span>,
          {' '}que ganarias y que perderia tu sistema?
        </p>
      </section>
    </article>
  );
}
