export function DDIAChapter8() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
            DDIA · Capitulo 8
          </span>
        </div>

        <h1 className="text-4xl font-light text-[#2c2c2c] mb-2">
          Los Problemas de
        </h1>
        <p className="text-2xl font-light text-[#9c9a8e]">
          los Sistemas Distribuidos
        </p>

        <p className="mt-8 text-[#7a7a6e] leading-relaxed max-w-xl">
          Todo lo que puede fallar en un sistema distribuido, va a fallar.
          Este capitulo es un catalogo de pesadillas — y por que debemos disenar para ellas.
        </p>
      </header>

      {/* The fundamental problem */}
      <section className="mb-20">
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Analogia</p>
          <p className="text-[#5a5a52]">
            Un programa en una sola maquina es como hablar cara a cara.
            <span className="text-[#2c2c2c]"> Un sistema distribuido es como comunicarse por cartas — pueden perderse, llegar en desorden, o nunca llegar.</span>
          </p>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Diferencia fundamental</p>
          <p className="text-[#2c2c2c]">
            En una sola maquina, las cosas funcionan o no. En un sistema distribuido,
            <span className="text-[#991b1b]"> las cosas pueden estar parcialmente rotas</span> — y eso es mucho peor.
          </p>
        </div>
      </section>

      {/* Section 01: Unreliable Networks */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Redes No Confiables</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El paquete que nunca llego
            </p>
          </div>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Que puede fallar con un request
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Request se pierde en la red</p>
            <p className="font-mono text-xs text-[#991b1b]">Nunca llega</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Request espera en una cola</p>
            <p className="font-mono text-xs text-[#991b1b]">Llega tarde</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Nodo remoto se cayo</p>
            <p className="font-mono text-xs text-[#991b1b]">No responde</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">Response se pierde en la red</p>
            <p className="font-mono text-xs text-[#991b1b]">Ejecuto pero no sabes</p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">El problema real</p>
          <p className="text-lg text-[#2c2c2c]">"No recibir respuesta no te dice si la operacion se ejecuto o no."</p>
          <p className="text-sm text-[#9c9a8e] mt-1">
            Timeouts son la unica herramienta, pero un timeout no distingue entre nodo caido y red lenta.
          </p>
        </div>
      </section>

      {/* Section 02: Unreliable Clocks */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Relojes No Confiables</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El tiempo no es lo que crees
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Time-of-day clock</p>
            <p className="text-sm text-[#2c2c2c] mb-2">"Que hora es ahora"</p>
            <div className="text-xs text-[#7a7a6e] space-y-1">
              <p>Sincronizado via NTP</p>
              <p>Puede saltar hacia atras</p>
              <p>No apto para medir duracion</p>
            </div>
          </div>
          <div className="p-5 border border-[#059669] bg-[#059669]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-3">Monotonic clock</p>
            <p className="text-sm text-[#2c2c2c] mb-2">"Cuanto tiempo paso"</p>
            <div className="text-xs text-[#7a7a6e] space-y-1">
              <p>Solo avanza, nunca retrocede</p>
              <p>Relativo a un punto arbitrario</p>
              <p>Ideal para medir duracion local</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Peligro: Last-Write-Wins con timestamps</p>
          <p className="text-[#5a5a52]">
            Nodo A escribe a las 10:00:00.100. Nodo B escribe a las 10:00:00.050.
            <span className="text-[#2c2c2c]"> Pero el reloj de B esta adelantado — su escritura fue en realidad despues.</span>
            LWW descarta la escritura de A. Dato perdido silenciosamente.
          </p>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Leccion</p>
          <p className="text-[#2c2c2c]">
            Los relojes de maquinas diferentes pueden diferir en milisegundos o incluso segundos.
            <span className="text-[#991b1b]"> Nunca uses timestamps para determinar orden entre nodos.</span>
          </p>
        </div>
      </section>

      {/* Section 03: Process Pauses */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Pausas de Proceso</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El hilo que se congelo
            </p>
          </div>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Que puede pausar tu proceso
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Garbage Collection</p>
              <p className="text-sm text-[#9c9a8e]">Stop-the-world GC puede pausar segundos</p>
            </div>
            <p className="font-mono text-xs text-[#991b1b]">JVM, Go, .NET</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">VM suspended</p>
              <p className="text-sm text-[#9c9a8e]">Migracion de VM en el cloud</p>
            </div>
            <p className="font-mono text-xs text-[#991b1b]">AWS, GCP</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Disk I/O bloqueante</p>
              <p className="text-sm text-[#9c9a8e]">Swap, page faults, fsync</p>
            </div>
            <p className="font-mono text-xs text-[#991b1b]">Cualquier OS</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Escenario peligroso</p>
          <p className="text-[#5a5a52]">
            Un lider obtiene un lease (lock con expiracion). Se pausa por GC.
            <span className="text-[#2c2c2c]"> El lease expira. Otro nodo se convierte en lider. El primero se despierta y cree que sigue siendo lider.</span>
          </p>
          <p className="text-xs text-[#991b1b] mt-3">
            Resultado: dos nodos actuando como lider simultaneamente.
          </p>
        </div>
      </section>

      {/* Section 04: Knowledge, Truth, and Lies */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Verdad y Mentiras</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Que puedes saber en un sistema distribuido
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Un nodo no puede confiar en si mismo
            </p>
            <p className="text-sm text-[#5a5a52]">
              Un nodo puede creer que es el lider, pero si los demas no lo reconocen, no lo es.
              La verdad la decide la mayoria (quorum), no el individuo.
            </p>
          </div>

          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Fencing tokens
            </p>
            <p className="text-sm text-[#5a5a52]">
              Cada vez que se otorga un lock/lease, se incrementa un token monotono.
              El storage rechaza escrituras con tokens viejos.
              Asi un lider zombie no puede corromper datos.
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Modelo de sistema</p>
          <p className="text-[#2c2c2c]">
            Kleppmann define tres modelos: <span className="text-[#991b1b]">crash-stop</span> (nodo muere y no vuelve),
            <span className="text-[#991b1b]"> crash-recovery</span> (puede volver con datos persistidos),
            y <span className="text-[#991b1b]"> Byzantine</span> (nodos pueden mentir).
          </p>
        </div>
      </section>

      {/* Section 05: Byzantine Faults */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Fallas Bizantinas</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Cuando los nodos mienten
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
            Generales bizantinos deben coordinar un ataque, pero algunos son traidores.
            <span className="text-[#2c2c2c]"> Envian mensajes contradictorios a distintos generales.</span>
            Necesitas al menos 2/3 de nodos honestos para llegar a consenso.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#059669] uppercase mb-2">No necesitas BFT</p>
            <p className="text-sm text-[#5a5a52]">Datacenters controlados, software confiable. Asumes que los nodos no mienten, solo fallan.</p>
          </div>
          <div className="p-5 border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Si necesitas BFT</p>
            <p className="text-sm text-[#5a5a52]">Blockchains, redes peer-to-peer sin confianza. Los participantes pueden actuar maliciosamente.</p>
          </div>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#9c9a8e] uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-[#2c2c2c] mb-2">NCP</p>
        <p className="text-sm text-[#9c9a8e] mb-8">Las tres fuentes de problemas distribuidos</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#991b1b] font-medium">N</span><span className="text-[#9c9a8e]">etwork miente</span> <span className="text-[#2c2c2c]">— Paquetes se pierden, retrasan, duplican</span></p>
          <p><span className="text-[#991b1b] font-medium">C</span><span className="text-[#9c9a8e]">locks derivan</span> <span className="text-[#2c2c2c]">— No confies en timestamps entre nodos</span></p>
          <p><span className="text-[#991b1b] font-medium">P</span><span className="text-[#9c9a8e]">rocesses pausan</span> <span className="text-[#2c2c2c]">— GC, VM migration, disk I/O</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-[#e8e6e0]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          En tu sistema actual, si la red entre dos servicios se cae por 30 segundos,
          <span className="text-[#2c2c2c]"> que le pasa al usuario?</span>
        </p>
      </section>
    </article>
  );
}
