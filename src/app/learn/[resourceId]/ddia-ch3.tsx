export function DDIAChapter3() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#4a5d4a]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
            DDIA · Capítulo 3
          </span>
        </div>

        <h1 className="text-4xl font-light text-[#2c2c2c] mb-2">
          Almacenamiento
        </h1>
        <p className="text-2xl font-light text-[#9c9a8e]">
          y Recuperación de Datos
        </p>

        <p className="mt-8 text-[#7a7a6e] leading-relaxed max-w-xl">
          Cómo las bases de datos organizan datos en disco para que guardar y buscar sea eficiente.
          Todo se reduce a un trade-off: optimizar escrituras vs optimizar lecturas.
        </p>
      </header>

      {/* The Core Trade-off */}
      <section className="mb-20">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#4a5d4a] bg-[#4a5d4a]/5 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-2">Escrituras rápidas</p>
            <p className="text-3xl mb-2">✍️</p>
            <p className="text-sm text-[#5a5a52]">Guardar datos eficientemente</p>
          </div>
          <div className="p-5 border border-[#8b7355] bg-[#8b7355]/5 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-2">Lecturas rápidas</p>
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm text-[#5a5a52]">Encontrar datos eficientemente</p>
          </div>
        </div>

        <div className="border-l-2 border-[#4a5d4a] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-2">Trade-off central</p>
          <p className="text-[#2c2c2c]">
            No puedes tener ambos al máximo. Cada motor de almacenamiento elige dónde poner el cursor.
          </p>
        </div>
      </section>

      {/* Concept: Disk I/O */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">00</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">El Cuello de Botella</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Disco vs RAM
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">Velocidad de acceso</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[#9c9a8e] w-16">RAM</span>
              <div className="flex-1 h-1 bg-[#e8e6e0]">
                <div className="h-full w-[2%] bg-[#4a5d4a]" />
              </div>
              <span className="text-xs text-[#4a5d4a] font-medium">~100 ns</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[#9c9a8e] w-16">SSD</span>
              <div className="flex-1 h-1 bg-[#e8e6e0]">
                <div className="h-full w-[25%] bg-[#8b7355]" />
              </div>
              <span className="text-xs text-[#8b7355]">~100 μs</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[#9c9a8e] w-16">HDD</span>
              <div className="flex-1 h-1 bg-[#e8e6e0]">
                <div className="h-full w-[100%] bg-[#c4a07a]" />
              </div>
              <span className="text-xs text-[#c4a07a]">~10 ms</span>
            </div>
          </div>

          <p className="text-sm text-[#5a5a52]">
            El disco es hasta <span className="text-[#2c2c2c] font-medium">100,000x más lento</span> que la RAM.
            Todo en bases de datos se diseña para minimizar accesos a disco.
          </p>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Analogía</p>
          <p className="text-[#5a5a52]">
            <span className="text-[#4a5d4a]">RAM</span> = tu escritorio. Todo a la mano, instantáneo.
            <br />
            <span className="text-[#8b7355]">Disco</span> = un almacén a 5 cuadras. Cada dato requiere un viaje.
          </p>
        </div>
      </section>

      {/* Concept: Indexes */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Índices</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              El atajo para encontrar datos
            </p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Analogía</p>
          <p className="text-[#5a5a52]">
            El índice de un libro. En vez de leer 500 páginas buscando "Kafka",
            <span className="text-[#2c2c2c]"> vas al índice: "Kafka → página 234".</span>
          </p>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          El costo de los índices
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Espacio en disco</p>
              <p className="text-sm text-[#9c9a8e]">Cada índice es una estructura adicional</p>
            </div>
            <p className="font-mono text-xs text-[#c4a07a]">Costo</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Escrituras más lentas</p>
              <p className="text-sm text-[#9c9a8e]">Cada INSERT actualiza todos los índices</p>
            </div>
            <p className="font-mono text-xs text-[#c4a07a]">Costo</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#e8e6e0]">
            <div>
              <p className="text-[#2c2c2c]">Lecturas más rápidas</p>
              <p className="text-sm text-[#9c9a8e]">Encuentra datos sin escanear todo</p>
            </div>
            <p className="font-mono text-xs text-[#4a5d4a]">Beneficio</p>
          </div>
        </div>
      </section>

      {/* B-Tree */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">B-Tree</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              PostgreSQL · MySQL · SQLite
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#4a5d4a] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-2">Filosofía</p>
          <p className="text-lg text-[#2c2c2c]">"Mantengo todo ordenado siempre, así buscar es rápido."</p>
        </div>

        {/* Tree visualization */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">Estructura del árbol</p>

          <pre className="text-xs font-mono text-[#5a5a52] bg-[#f5f4f0] p-4 overflow-x-auto text-center">
{`          [50]              ← raíz
         /    \\
    [20, 35]   [65, 80]    ← nodos intermedios
    /  |  \\     /  |  \\
  [..] [..] [..] [..] [..]  ← hojas (datos)`}
          </pre>

          <p className="text-xs text-[#7a7a6e] mt-4 text-center">
            Millones de registros → solo <span className="font-mono text-[#4a5d4a]">3-4 niveles</span> de profundidad
          </p>
        </div>

        {/* Search example */}
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Búsqueda: encontrar ID = 42
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4a5d4a] text-[10px] text-white font-mono">1</span>
            <p className="text-sm text-[#5a5a52]">Raíz: ¿42 &lt; 50? → Sí → <span className="text-[#4a5d4a]">izquierda</span></p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4a5d4a] text-[10px] text-white font-mono">2</span>
            <p className="text-sm text-[#5a5a52]">Nodo [20,35]: ¿42 &gt; 35? → Sí → <span className="text-[#4a5d4a]">tercer hijo</span></p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4a5d4a] text-[10px] text-white font-mono">3</span>
            <p className="text-sm text-[#5a5a52]">Hoja → <span className="text-[#4a5d4a] font-medium">dato encontrado</span></p>
          </div>
        </div>

        {/* Split explanation */}
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Escritura: el problema del split
        </p>

        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-3">Caso feliz</p>
              <p className="text-sm text-[#5a5a52] mb-2">La hoja tiene espacio</p>
              <pre className="text-[10px] font-mono text-[#5a5a52] bg-[#f5f4f0] p-3">
{`[33, 35, __, __]
      ↓
[33, 35, 37, __]`}
              </pre>
              <p className="text-[10px] text-[#4a5d4a] mt-2">1 escritura</p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Split</p>
              <p className="text-sm text-[#5a5a52] mb-2">La hoja está llena</p>
              <pre className="text-[10px] font-mono text-[#5a5a52] bg-[#f5f4f0] p-3">
{`[33, 35, 36, 38]
      ↓ split
[33,35] [36,37,38]`}
              </pre>
              <p className="text-[10px] text-[#c4a07a] mt-2">3 escrituras + actualizar padre</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-3">Fortalezas</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>• Lectura en 3-4 saltos, siempre</li>
              <li>• Datos siempre ordenados</li>
              <li>• Probado por 40+ años</li>
              <li>• Excelente para rangos (BETWEEN)</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Debilidades</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>• Splits hacen escrituras costosas</li>
              <li>• Escritura aleatoria en disco</li>
              <li>• Fragmentación con el tiempo</li>
              <li>• Necesita WAL para durabilidad</li>
            </ul>
          </div>
        </div>
      </section>

      {/* LSM-Tree */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">LSM-Tree</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Cassandra · RocksDB · LevelDB
            </p>
          </div>
        </div>

        <div className="border-l-2 border-[#8b7355] pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-2">Filosofía</p>
          <p className="text-lg text-[#2c2c2c]">"Primero escribo rápido, después organizo."</p>
        </div>

        {/* Write flow */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">Flujo de escritura</p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4a5d4a] text-xs text-white font-mono shrink-0">1</span>
              <div className="flex-1 p-3 border border-[#4a5d4a] bg-[#4a5d4a]/5">
                <p className="text-xs font-mono text-[#4a5d4a]">Memtable (RAM)</p>
                <p className="text-sm text-[#5a5a52]">Dato nuevo → se guarda ordenado en memoria</p>
              </div>
            </div>
            <div className="flex justify-center">
              <span className="text-[#9c9a8e]">↓ cuando se llena</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8b7355] text-xs text-white font-mono shrink-0">2</span>
              <div className="flex-1 p-3 border border-[#8b7355] bg-[#8b7355]/5">
                <p className="text-xs font-mono text-[#8b7355]">SSTable (Disco)</p>
                <p className="text-sm text-[#5a5a52]">Se escribe completa al disco como archivo ordenado</p>
              </div>
            </div>
            <div className="flex justify-center">
              <span className="text-[#9c9a8e]">↓ en segundo plano</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c4a07a] text-xs text-white font-mono shrink-0">3</span>
              <div className="flex-1 p-3 border border-[#c4a07a] bg-[#c4a07a]/5">
                <p className="text-xs font-mono text-[#c4a07a]">Compactación</p>
                <p className="text-sm text-[#5a5a52]">Fusionar SSTables para reducir cantidad de archivos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Read problem */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">El problema al leer</p>

          <pre className="text-xs font-mono text-[#5a5a52] bg-[#f5f4f0] p-4 overflow-x-auto">
{`Buscar dato 22:

  ¿Memtable?   → No
  ¿SSTable-3?  → No
  ¿SSTable-2?  → ¡Sí!

  Peor caso: revisar TODOS los SSTables`}
          </pre>

          <p className="text-xs text-[#7a7a6e] mt-4">
            Solución: <span className="font-mono text-[#4a5d4a]">Bloom filters</span> — estructura probabilística que dice
            "definitivamente NO está aquí" sin leer el archivo.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-3">Fortalezas</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>• Escritura secuencial (muy rápida)</li>
              <li>• Sin splits ni reorganización</li>
              <li>• Mejor uso del ancho de banda de disco</li>
              <li>• Compresión más eficiente</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">Debilidades</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>• Lecturas pueden tocar múltiples archivos</li>
              <li>• Compactación consume recursos</li>
              <li>• Latencia menos predecible</li>
              <li>• Datos duplicados temporalmente</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WAL */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">Write-Ahead Log</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              La caja negra de la base de datos
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4a5d4a] text-[10px] text-white font-mono">1</span>
            <p className="text-sm text-[#5a5a52]">ANTES de tocar los datos → escribir <span className="text-[#4a5d4a]">"voy a hacer X"</span> en el log</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4a5d4a] text-[10px] text-white font-mono">2</span>
            <p className="text-sm text-[#5a5a52]">Hacer la operación real</p>
          </div>
          <div className="flex items-center gap-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4a5d4a] text-[10px] text-white font-mono">3</span>
            <p className="text-sm text-[#5a5a52]">Si se cae el sistema → <span className="text-[#4a5d4a]">leer el log y reparar</span></p>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-3">Analogía</p>
          <p className="text-[#5a5a52]">
            Un piloto que antes de cada acción dice en voz alta lo que va a hacer y lo graba.
            <span className="text-[#2c2c2c]"> Si algo sale mal, la grabación permite reconstruir qué pasó.</span>
          </p>
          <p className="text-xs text-[#4a5d4a] mt-3">
            PostgreSQL (Supabase) usa WAL. Por eso es tan confiable.
          </p>
        </div>
      </section>

      {/* OLTP vs OLAP */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">05</span>
          <div>
            <h2 className="text-xl text-[#2c2c2c]">OLTP vs OLAP</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              Transacciones vs Analytics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-[#4a5d4a] bg-[#4a5d4a]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-3">OLTP — Por Filas</p>
            <p className="text-sm text-[#2c2c2c] mb-3">"Dame el pedido #12345"</p>
            <div className="text-xs text-[#7a7a6e] space-y-1">
              <p>1 fila, todas las columnas</p>
              <p>PostgreSQL, MySQL</p>
              <p>La app del usuario</p>
            </div>
          </div>
          <div className="p-5 border border-[#8b7355] bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-3">OLAP — Por Columnas</p>
            <p className="text-sm text-[#2c2c2c] mb-3">"Total de ventas por región"</p>
            <div className="text-xs text-[#7a7a6e] space-y-1">
              <p>Millones de filas, 2-3 columnas</p>
              <p>BigQuery, Redshift, ClickHouse</p>
              <p>Dashboards internos</p>
            </div>
          </div>
        </div>

        {/* Row vs Column visual */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#d4d0c8]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#d4d0c8]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#d4d0c8]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#d4d0c8]" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">Cómo se guardan los datos</p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[#4a5d4a] mb-2 font-mono">Por filas (row-oriented)</p>
              <pre className="text-[10px] font-mono text-[#5a5a52] bg-[#f5f4f0] p-3">
{`Fila 1: id|nombre|monto|fecha
Fila 2: id|nombre|monto|fecha
Fila 3: id|nombre|monto|fecha`}
              </pre>
              <p className="text-[10px] text-[#9c9a8e] mt-2">Lee toda la fila para cada registro</p>
            </div>
            <div>
              <p className="text-xs text-[#8b7355] mb-2 font-mono">Por columnas (column-oriented)</p>
              <pre className="text-[10px] font-mono text-[#5a5a52] bg-[#f5f4f0] p-3">
{`Col id:     [1, 2, 3, ...]
Col nombre: [A, B, C, ...]
Col monto:  [500, 300, ...]
Col fecha:  [ene, feb, ...]`}
              </pre>
              <p className="text-[10px] text-[#9c9a8e] mt-2">Solo lee las columnas necesarias</p>
            </div>
          </div>
        </div>

        {/* ETL */}
        <div className="border-l-2 border-[#8b7355] pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#8b7355] uppercase mb-2">Empresas grandes usan ambos</p>
          <p className="text-[#2c2c2c] mb-2">
            OLTP para la app + OLAP para analytics, conectados por <span className="font-mono text-[#4a5d4a]">ETL</span>.
          </p>
          <p className="text-sm text-[#7a7a6e]">
            ETL (Extract, Transform, Load): proceso que copia datos de la base transaccional a la analítica.
            No existe UNA base de datos que haga todo perfecto.
          </p>
        </div>
      </section>

      {/* Decision Framework */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-6">
          Framework de decisión
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">"Necesito lecturas rápidas, escribo poco"</p>
            <p className="font-mono text-xs text-[#4a5d4a]">→ B-Tree</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">"Escribo millones por segundo (logs, métricas)"</p>
            <p className="font-mono text-xs text-[#4a5d4a]">→ LSM-Tree</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">"Queries con WHERE id = X"</p>
            <p className="font-mono text-xs text-[#4a5d4a]">→ Row store</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">"Queries con SUM, AVG, GROUP BY sobre millones"</p>
            <p className="font-mono text-xs text-[#4a5d4a]">→ Column store</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-[#e8e6e0]">
            <p className="text-[#2c2c2c]">"Necesito durabilidad ante crashes"</p>
            <p className="font-mono text-xs text-[#4a5d4a]">→ WAL</p>
          </div>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#9c9a8e] uppercase mb-6">Mnemotécnico</p>

        <p className="text-5xl font-light text-[#2c2c2c] mb-2">BLC</p>
        <p className="text-sm text-[#9c9a8e] mb-8">Los tres temas del capítulo</p>

        <div className="inline-block text-left space-y-2">
          <p><span className="text-[#4a5d4a] font-medium">B</span><span className="text-[#9c9a8e]">-Trees vs LSM</span> <span className="text-[#2c2c2c]">— Lecturas vs Escrituras</span></p>
          <p><span className="text-[#4a5d4a] font-medium">L</span><span className="text-[#9c9a8e]">ogs & WAL</span> <span className="text-[#2c2c2c]">— Durabilidad ante crashes</span></p>
          <p><span className="text-[#4a5d4a] font-medium">C</span><span className="text-[#9c9a8e]">olumnas vs Filas</span> <span className="text-[#2c2c2c]">— OLTP vs OLAP</span></p>
        </div>
      </section>

      {/* Key terms */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-6">
          Términos clave del capítulo
        </p>

        <div className="space-y-2">
          {[
            ['Storage engine', 'Motor de almacenamiento', 'Cómo la DB guarda datos en disco'],
            ['Index', 'Índice', 'Estructura que acelera búsquedas'],
            ['B-tree', 'B-tree', 'Árbol balanceado, optimizado para lecturas'],
            ['LSM-tree', 'LSM-tree', 'Log-Structured Merge Tree, optimizado para escrituras'],
            ['SSTable', 'SSTable', 'Sorted String Table, archivo ordenado en disco'],
            ['Memtable', 'Memtable', 'Tabla en memoria RAM (parte del LSM)'],
            ['Compaction', 'Compactación', 'Fusionar SSTables para reducir cantidad'],
            ['WAL', 'Log de escritura anticipada', 'Log de seguridad ante crashes'],
            ['Bloom filter', 'Filtro Bloom', 'Evita lecturas innecesarias en SSTables'],
            ['OLTP', 'OLTP', 'Online Transaction Processing'],
            ['OLAP', 'OLAP', 'Online Analytical Processing'],
            ['Column-oriented', 'Por columnas', 'Optimizado para analytics'],
            ['Data warehouse', 'Almacén de datos', 'Base analítica separada'],
            ['ETL', 'ETL', 'Extract, Transform, Load'],
          ].map(([en, es, desc]) => (
            <div key={en} className="flex items-center justify-between py-2 border-b border-[#e8e6e0]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#4a5d4a] w-32">{en}</span>
                <span className="text-sm text-[#2c2c2c]">{es}</span>
              </div>
              <span className="text-xs text-[#9c9a8e] text-right max-w-[200px]">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-[#e8e6e0]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          Si tu base de datos tuviera 100x más escrituras mañana,
          <span className="text-[#2c2c2c]"> ¿qué cambiarías primero?</span>
        </p>
      </section>
    </article>
  );
}
