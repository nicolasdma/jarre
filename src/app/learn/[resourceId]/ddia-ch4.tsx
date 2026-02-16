export function DDIAChapter4() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#991b1b]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            DDIA · Capitulo 4
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Codificacion
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          y Evolucion
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          Como traducir datos de memoria a bytes y viceversa, y por que la compatibilidad
          entre versiones del schema es la clave para despliegues sin downtime.
        </p>
      </header>

      {/* Section 01: Encoding Formats */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Formatos de Codificacion</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              JSON, XML, CSV y sus limitaciones
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
            Como traducir un libro: en tu mente tienes ideas ricas y conectadas.
            <span className="text-j-text"> Al escribirlas en papel, necesitas un formato que otro lector pueda entender</span>
            {' '}— incluso si habla otro &quot;idioma&quot; (otro lenguaje de programacion).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Texto (JSON/XML)</p>
            <p className="text-sm text-j-text mb-2">&quot;Legible por humanos, universal&quot;</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>81 bytes para un documento simple</p>
              <p>Nombres de campo repetidos en cada registro</p>
              <p>Ambiguedad de numeros (int vs float)</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Binario (Protobuf/Avro)</p>
            <p className="text-sm text-j-text mb-2">&quot;Compacto, tipado, con schema&quot;</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>33 bytes para el mismo documento</p>
              <p>Field tags reemplazan nombres</p>
              <p>Compatibilidad verificable automaticamente</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Dato clave</p>
          <p className="text-j-text">
            Twitter IDs de 64 bits deben transmitirse como strings en JSON.
            JavaScript solo tiene <span className="text-[#991b1b]">IEEE 754 doubles</span> — cualquier entero mayor a 2^53 se corrompe silenciosamente.
          </p>
        </div>
      </section>

      {/* Section 02: Thrift & Protocol Buffers */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Thrift y Protocol Buffers</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Field tags como clave de evolucion
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
            El truco: numeros en lugar de nombres
          </p>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">1</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Schema:</span> Defines campos con un numero unico (field tag)</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">2</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Encode:</span> Solo el tag (no el nombre) se incluye en los bytes</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#991b1b] text-[10px] text-white font-mono">3</span>
            <p className="text-sm text-[#5a5a52]"><span className="text-[#991b1b]">Evolve:</span> Tags desconocidos se ignoran — forward compatibility gratis</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">Regla de oro</p>
          <p className="text-[#5a5a52]">
            Nunca cambies el numero de tag de un campo.
            <span className="text-j-text"> Renombrar esta bien (los nombres no se codifican)</span>,
            pero cambiar el tag invalida todos los datos existentes.
          </p>
        </div>
      </section>

      {/* Section 03: Avro */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Apache Avro</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Sin field tags, maximo compacto
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
            Como empacar una maleta: no etiquetas cada prenda.
            <span className="text-j-text"> El que desempaca sabe el orden</span> porque tiene la misma lista de lo que metiste (el schema).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#991b1b] bg-[#991b1b]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-3">Writer&apos;s schema</p>
            <p className="text-sm text-j-text mb-2">El schema usado al escribir los datos</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Se incluye en el archivo o via schema registry</p>
              <p>Cada registro se codifica sin field tags: solo valores</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Reader&apos;s schema</p>
            <p className="text-sm text-j-text mb-2">El schema que el codigo del lector espera</p>
            <div className="text-xs text-j-text-secondary space-y-1">
              <p>Puede diferir del writer&apos;s schema</p>
              <p>Avro resuelve las diferencias por nombre de campo</p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Ventaja unica de Avro</p>
          <p className="text-j-text">
            Sin field tags, puedes <span className="text-[#991b1b]">generar schemas dinamicamente</span> desde tablas SQL.
            Si la tabla cambia, generas un nuevo schema y los datos viejos y nuevos coexisten.
          </p>
        </div>
      </section>

      {/* Section 04: Schema Evolution */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Evolucion de Schemas</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Forward y backward compatibility
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Backward compatibility
            </p>
            <p className="text-sm text-[#5a5a52]">
              Codigo nuevo puede leer datos escritos por codigo viejo.
              <span className="text-j-text"> Generalmente facil: el desarrollador conoce el formato viejo.</span>
            </p>
          </div>

          <div className="p-5 border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">
              Forward compatibility
            </p>
            <p className="text-sm text-[#5a5a52]">
              Codigo viejo puede leer datos escritos por codigo nuevo.
              <span className="text-j-text"> Mas dificil: requiere ignorar graciosamente lo que no entiende.</span>
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#991b1b] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#991b1b] uppercase mb-2">Por que importa</p>
          <p className="text-j-text">
            En un rolling upgrade, algunos servidores corren version nueva y otros la vieja <span className="text-[#991b1b]">simultaneamente</span>.
            Ambas direcciones de compatibilidad son necesarias.
          </p>
        </div>
      </section>

      {/* Section 05: Modes of Dataflow */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-j-text">Modos de Dataflow</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Databases, servicios, mensajes
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Via base de datos</p>
            <p className="text-sm text-j-text-tertiary">Te envias un mensaje a tu yo futuro</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Via servicios (REST/RPC)</p>
            <p className="text-sm text-j-text-tertiary">Cliente-servidor sincrono por la red</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-j-border">
            <p className="text-j-text">Via message passing</p>
            <p className="text-sm text-j-text-tertiary">Asincrono, desacoplado, con buffer</p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">RPC: la ilusion peligrosa</p>
          <p className="text-[#5a5a52]">
            Una llamada de red no es una llamada local: puede fallar por timeout,
            ejecutarse dos veces, tardar mil veces mas.
            <span className="text-j-text"> Los frameworks modernos (gRPC) no ocultan estas diferencias — las hacen explicitas.</span>
          </p>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>

        <p className="text-6xl font-light text-j-text mb-2">SERF</p>
        <p className="text-sm text-j-text-tertiary mb-8">Las cuatro ideas centrales del capitulo</p>

        <div className="inline-block text-left space-y-1">
          <p><span className="text-[#991b1b] font-medium">S</span><span className="text-j-text-tertiary">chemas tipan</span> <span className="text-j-text">— El schema es documentacion viva + contrato</span></p>
          <p><span className="text-[#991b1b] font-medium">E</span><span className="text-j-text-tertiary">volucion preserva</span> <span className="text-j-text">— Forward + backward = rolling upgrades</span></p>
          <p><span className="text-[#991b1b] font-medium">R</span><span className="text-j-text-tertiary">epresentacion compacta</span> <span className="text-j-text">— Binario &gt; texto para escala</span></p>
          <p><span className="text-[#991b1b] font-medium">F</span><span className="text-j-text-tertiary">lujo de datos decide</span> <span className="text-j-text">— DB, REST, mensajes: cada uno con sus reglas</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si tu equipo despliega 10 veces al dia, que pasa con los datos escritos por
          <span className="text-j-text"> la version N-1 </span>
          cuando ya corren 5 instancias de la version N?
        </p>
      </section>
    </article>
  );
}
