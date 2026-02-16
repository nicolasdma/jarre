export function TailAtScale() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            Paper · Dean & Barroso 2013
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          The Tail at Scale
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          Latencia de cola en sistemas distribuidos
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          En sistemas a gran escala, la latencia promedio es irrelevante. Lo que importa
          son los percentiles altos: p99 y p999. Un solo servidor lento puede arruinar
          la experiencia de millones de usuarios.
        </p>
      </header>

      {/* Section 01: El Problema de la Cola */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">El Problema de la Cola</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Por que importan los percentiles altos
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
            Como un restaurante con 100 meseros. Tu pedido necesita algo de cada uno.
            <span className="text-j-text"> Basta con que uno sea lento para que toda tu comida se retrase.</span>
            Eso es fan-out amplification.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">p99 / p999</p>
            <p className="text-sm text-j-text mb-2">"El 1% o 0.1% mas lento de las requests"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Un servicio con p99 de 1s: 1 de cada 100 requests tarda mas de 1s</p>
              <p>En Google, un usuario genera ~100 RPCs por busqueda</p>
              <p>Con 100 RPCs, el p99 del servicio se vuelve tu mediana</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Fan-out amplification</p>
            <p className="text-sm text-j-text mb-2">"El peor servidor define tu latencia"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Request que toca N servidores: P(alguno lento) = 1-(1-p)^N</p>
              <p>Con 100 servidores y p99=1%: 63% de requests tendran un servidor lento</p>
              <p>La cola se amplifica exponencialmente con el fan-out</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">La paradoja de la escala</p>
          <p className="text-j-text">
            Mientras mas servidores involucres en una request, peor se pone la latencia de cola.
            Optimizar el promedio es inutil — necesitas atacar los <span className="text-[#991b1b]">outliers</span>.
          </p>
        </div>
      </section>

      {/* Section 02: Causas de la Variabilidad */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Causas de la Variabilidad</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Por que los servidores se vuelven lentos
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Shared resources
            </p>
            <p className="text-sm text-[#5a5a52]">
              Multiples procesos comparten CPU, memoria, red y disco.
              <span className="text-j-text"> Un vecino ruidoso puede causar interferencia impredecible.</span>
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Garbage collection
            </p>
            <p className="text-sm text-[#5a5a52]">
              Las pausas de GC son impredecibles y pueden durar cientos de milisegundos.
              <span className="text-j-text"> Un servidor en GC parece muerto temporalmente.</span>
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Queuing y background tasks
            </p>
            <p className="text-sm text-[#5a5a52]">
              Tareas de mantenimiento (compaction, logging, replicacion) roban recursos.
              <span className="text-j-text"> Las colas internas crecen silenciosamente y explotan en latencia.</span>
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Cada servidor es como un empleado que ademas de su trabajo tiene reuniones sorpresa,
            pausas obligatorias y papeleo inesperado.
            <span className="text-j-text"> No puedes predecir cuando le tocara una interrupcion.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Tecnicas Within-Request */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Tecnicas Within-Request</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Reduccion de latencia dentro de una request
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Hedged requests</p>
            <p className="text-sm text-j-text mb-2">"Envia la misma request a multiples replicas"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Envia a una replica, si no responde en el p95, envia a una segunda</p>
              <p>Toma la primera respuesta que llegue, cancela la otra</p>
              <p>Costo: solo 5% mas de carga, pero mejora drasticamente la cola</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Tied requests</p>
            <p className="text-sm text-j-text mb-2">"Hedged requests pero coordinadas"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Envia a dos replicas simultaneamente desde el inicio</p>
              <p>Cada replica sabe de la otra — cuando una empieza, cancela la otra</p>
              <p>Elimina trabajo duplicado y reduce variabilidad aun mas</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Micro-partitioning</p>
          <p className="text-j-text">
            Dividir los datos en muchas mas particiones que servidores. Permite balancear carga
            dinamicamente y mover <span className="text-[#991b1b]">hot partitions</span> entre maquinas de forma granular.
          </p>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">Clave</p>
          <p className="text-[#5a5a52]">
            Hedged requests no atacan la causa del problema — solo mitigan el efecto.
            <span className="text-j-text"> Es como pedir dos taxis: no arreglas el trafico, pero reduces tu riesgo personal.</span>
          </p>
        </div>
      </section>

      {/* Section 04: Tecnicas Cross-Request */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Tecnicas Cross-Request</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Reduccion sistemica de variabilidad
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Load balancing</p>
            <p className="text-sm text-j-text-tertiary">Evitar enviar requests a servidores sobrecargados</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Micro-sharding</p>
            <p className="text-sm text-j-text-tertiary">Mas shards que servidores para balanceo dinamico</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Selective replication</p>
            <p className="text-sm text-j-text-tertiary">Replicar mas los datos mas accedidos</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Request coalescing</p>
            <p className="text-sm text-j-text-tertiary">Agrupar requests identicas para evitar trabajo redundante</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Las tecnicas within-request son como llevar paraguas por si llueve.
            <span className="text-j-text"> Las tecnicas cross-request son como construir un techo.</span>
            Ambas sirven, pero una es reactiva y la otra es estructural.
          </p>
        </div>
      </section>

      {/* Section 05: Tolerancia a Largo Plazo */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Tolerancia a Largo Plazo</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Degradacion elegante y proteccion continua
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Canary requests</p>
            <p className="text-sm text-j-text mb-2">"Prueba con uno antes de mandar a todos"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Envia la request primero a un solo servidor</p>
              <p>Si falla o es lenta, no propagues al resto</p>
              <p>Protege contra queries malignas que derriban clusters</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Latency-induced probation</p>
            <p className="text-sm text-j-text mb-2">"Sacar temporalmente a servidores lentos"</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Detectar servidores con latencia anormalmente alta</p>
              <p>Ponerlos en probation: dejar de enviarles trafico real</p>
              <p>Reincorporarlos cuando su latencia se normalice</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Graceful degradation</p>
          <p className="text-j-text">
            Cuando el sistema esta bajo presion, es mejor devolver resultados parciales o aproximados
            que dejar al usuario esperando. <span className="text-[#991b1b]">Respuesta rapida e imperfecta &gt; respuesta perfecta y lenta.</span>
          </p>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">La leccion de Google</p>
          <p className="text-[#5a5a52]">
            Google sirve resultados de busqueda incompletos si algunos backends son lentos.
            <span className="text-j-text"> El usuario prefiere 95% de los resultados en 200ms que 100% en 2 segundos.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">CHEAT</p>
        <p className="text-sm text-j-text-tertiary mb-8">Las cinco defensas contra la latencia de cola</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#991b1b] font-medium">C</span><span className="text-j-text-tertiary">ola importa</span> <span className="text-j-text">— p99 define la experiencia, no el promedio</span></p>
          <p><span className="text-[#991b1b] font-medium">H</span><span className="text-j-text-tertiary">edged requests</span> <span className="text-j-text">— Apostar a multiples replicas</span></p>
          <p><span className="text-[#991b1b] font-medium">E</span><span className="text-j-text-tertiary">liminar variabilidad</span> <span className="text-j-text">— GC, shared resources, queuing</span></p>
          <p><span className="text-[#991b1b] font-medium">A</span><span className="text-j-text-tertiary">rquitectura adaptativa</span> <span className="text-j-text">— Load balancing, micro-sharding</span></p>
          <p><span className="text-[#991b1b] font-medium">T</span><span className="text-j-text-tertiary">olerancia elegante</span> <span className="text-j-text">— Degradar antes que bloquear</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          En tu sistema, donde usarias <span className="text-j-text">hedged requests</span>
          {' '}y donde el costo extra de trafico seria inaceptable?
        </p>
      </section>
    </article>
  );
}
