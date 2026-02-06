'use client';

import { useState } from 'react';

interface LessonStep {
  title: string;
  theory: string;
  commands: Array<{ cmd: string; explain: string }>;
  observe: string;
}

interface LessonGuideProps {
  onRunCommand: (command: string) => void;
  currentBackend: string;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. Como funciona una base de datos por dentro',
    theory: `Cuando haces INSERT en PostgreSQL o SET en Redis, ¿que pasa fisicamente? Se escriben bytes en un archivo en tu disco.

Eso es lo que vas a ver aqui. Este engine es una base de datos minima que escribimos desde cero. Cada SET escribe bytes al final de un archivo real en tu computadora (engine/data/engine.log).

El panel de la derecha te muestra el contenido de ese archivo en tiempo real.

Si queres empezar de cero en cualquier momento, usa FLUSHDB para borrar todos los datos.`,
    commands: [
      { cmd: 'FLUSHDB', explain: 'Borra todo y empieza limpio' },
      { cmd: 'SET nombre Maria', explain: 'Escribe bytes al final del archivo' },
      { cmd: 'SET pais Colombia', explain: 'Mas bytes al final' },
      { cmd: 'GET nombre', explain: 'Busca "nombre" en el archivo' },
    ],
    observe: 'Mira el panel derecho: cada bloque es un record binario en el archivo. El numero de la izquierda (0, 18, 38...) es la posicion en bytes desde el inicio del archivo. El archivo solo crece, nunca se modifica lo que ya esta escrito.',
  },
  {
    title: '2. El problema: buscar es lento',
    theory: `Para encontrar un dato, el engine tiene que leer el archivo entero de atras para adelante hasta encontrar la key. Si hay 10 records, lee 10. Si hay 1 millon, lee 1 millon.

En computacion esto se llama O(n): el tiempo de busqueda crece proporcionalmente con la cantidad de datos. Escribir es rapido (O(1), siempre tarda lo mismo), pero leer es lento.

Esta es la version mas basica posible de un storage engine. Se llama "append-only log" en el libro DDIA.`,
    commands: [
      { cmd: 'DEBUG BACKEND append-log', explain: 'Asegurate de estar en el backend basico' },
      { cmd: 'SET a 1', explain: 'Record #1' },
      { cmd: 'SET b 2', explain: 'Record #2' },
      { cmd: 'SET c 3', explain: 'Record #3' },
      { cmd: 'SET d 4', explain: 'Record #4' },
      { cmd: 'GET a', explain: '¿Cuantos records tuvo que revisar?' },
    ],
    observe: 'Para encontrar "a" (que esta al principio), tuvo que revisar TODOS los records. Imagina esto con millones de registros: inaceptable.',
  },
  {
    title: '3. Otro problema: espacio desperdiciado',
    theory: `Si guardas el mismo dato 3 veces, el archivo tiene 3 copias. Solo la ultima importa, pero las anteriores siguen en disco ocupando espacio.

Mira la diferencia entre "Records en disco" (total de records escritos) y "Live Keys" (keys que realmente existen). La diferencia es espacio desperdiciado.`,
    commands: [
      { cmd: 'SET color rojo', explain: 'Primera version' },
      { cmd: 'SET color azul', explain: 'Ahora es azul (la anterior sigue en disco)' },
      { cmd: 'SET color verde', explain: 'Ahora es verde (hay 3 copias en disco)' },
      { cmd: 'GET color', explain: 'Solo devuelve la ultima version' },
      { cmd: 'DBSIZE', explain: 'Cuenta solo los keys vivos, no los records' },
    ],
    observe: 'En el panel derecho, los records obsoletos aparecen atenuados. El archivo crece con cada SET aunque la key sea la misma. Esto se resuelve con "compaction" (tema futuro).',
  },
  {
    title: '4. La solucion: un indice en memoria',
    theory: `El problema del append-log es que no sabe DONDE esta cada dato en el archivo. Tiene que buscar uno por uno.

La solucion: mantener un mapa en la memoria RAM de tu computadora. Para cada key, el mapa guarda la posicion exacta (byte offset) donde esta el dato en disco.

SET → escribe al archivo + guarda la posicion en el mapa
GET → busca la posicion en el mapa + lee ESE byte del disco

Ya no escanea todo. Va directo. Esto es O(1): siempre tarda lo mismo sin importar cuantos datos tengas.

Cambia al backend "hash-index" para ver esto en accion:`,
    commands: [
      { cmd: 'DEBUG BACKEND hash-index', explain: 'Cambia al backend con indice' },
      { cmd: 'FLUSHDB', explain: 'Limpia para ver desde cero' },
      { cmd: 'SET usuario alice', explain: 'Escribe + guarda posicion en el mapa' },
      { cmd: 'SET email alice@test.com', explain: 'Otra entrada en el mapa' },
      { cmd: 'GET usuario', explain: 'Va directo al byte — sin escanear' },
    ],
    observe: 'El panel derecho ahora muestra dos cosas: (1) el mapa en RAM con cada key y su posicion, y (2) el archivo en disco. GET ya no escanea — va directo a la posicion que dice el mapa.',
  },
  {
    title: '5. ¿Que pasa si el engine se muere?',
    theory: `El mapa que vive en RAM se pierde si el proceso se muere (un crash, un corte de luz, un kill).

Pero el archivo en disco sobrevive. Al reiniciar, el engine lee todo el archivo y reconstruye el mapa. Es lento (tiene que leer todo) pero funciona.

El problema: ¿que pasa si el engine muere A MITAD de una escritura? El archivo podria quedar corrupto — bytes a medias, datos incompletos.

Para eso existe el WAL: Write-Ahead Log.`,
    commands: [
      { cmd: 'SET dato_1 valor_1', explain: 'Mira el panel derecho: el WAL crece' },
      { cmd: 'SET dato_2 valor_2', explain: 'Otra entrada en el WAL' },
      { cmd: 'SET dato_3 valor_3', explain: 'El WAL tiene 3 entradas ahora' },
    ],
    observe: 'Mira la seccion "Write-Ahead Log" en el panel derecho. Cada SET aparece ahi con un CRC32 (un checksum que detecta corrupcion). El WAL es la copia de seguridad en tiempo real.',
  },
  {
    title: '6. WAL: la red de seguridad',
    theory: `El WAL es un segundo archivo donde se escribe ANTES de escribir al archivo principal. Cada entrada tiene un checksum CRC32 que verifica que los datos no estan corruptos.

Orden de cada SET:
1. Escribe al WAL (con checksum) ← red de seguridad
2. Escribe al archivo principal
3. Actualiza el mapa en RAM

Si el proceso muere entre el paso 1 y el 2, el WAL tiene los datos. Al reiniciar, el engine encuentra las entradas en el WAL y las recupera.

Vamos a simular un crash. DEBUG WAL INJECT escribe SOLO al WAL (simula que el proceso murio antes de escribir al archivo principal):`,
    commands: [
      { cmd: 'DEBUG WAL INJECT dato_secreto valor_oculto', explain: 'Escribe SOLO al WAL (no al archivo principal)' },
      { cmd: 'GET dato_secreto', explain: 'No lo encuentra — no esta en el archivo principal' },
      { cmd: 'DEBUG WAL STATUS', explain: 'Ve el WAL: tiene la entrada con checksum' },
    ],
    observe: 'dato_secreto esta en el WAL pero NO en el indice. Ahora reinicia el engine (para el proceso y hace npm run engine). Despues de reiniciar, haz GET dato_secreto — va a aparecer. El WAL lo recupero.',
  },
  {
    title: '7. Checkpoint: limpiar el WAL',
    theory: `El WAL crece con cada escritura. Si nunca lo limpias, se hace enorme. En las bases de datos reales, periodicamente se hace un "checkpoint": se limpia el WAL porque todos los datos ya estan seguros en el archivo principal.

Aca podes hacerlo manualmente:

Tambien podes comparar los dos backends: append-log (sin indice, sin WAL) vs hash-index (con indice + WAL). Los datos son los mismos, lo que cambia es la estructura de acceso.

Este es el fundamento del Capitulo 3 de DDIA (Designing Data-Intensive Applications): los storage engines existen porque la forma mas simple no escala.`,
    commands: [
      { cmd: 'DEBUG WAL CHECKPOINT', explain: 'Limpia el WAL (los datos ya estan en el archivo)' },
      { cmd: 'DEBUG BACKEND append-log', explain: 'Cambia al backend sin indice' },
      { cmd: 'DBSIZE', explain: 'Mismos datos, distinta estructura' },
      { cmd: 'DEBUG BACKEND hash-index', explain: 'Vuelve al backend con indice + WAL' },
    ],
    observe: 'Despues del checkpoint, el WAL queda vacio. Los dos backends leen el mismo archivo — lo que cambia es si usan un indice en RAM o no. Esa decision define la velocidad de lectura.',
  },
  {
    title: '8. LSM-Tree: lo mejor de ambos mundos',
    theory: `El hash-index es rapido pero tiene un problema: TODAS las keys deben caber en la memoria RAM. Si tenes 10 millones de keys, necesitas 10 millones de entradas en el mapa. Eso puede no caber.

El LSM-Tree (Log-Structured Merge Tree) resuelve esto con una idea elegante:

1. Escribe en una "memtable" en RAM (una tabla ordenada, pequeña)
2. Cuando la memtable se llena, la baja a disco como un archivo ordenado llamado SSTable (Sorted String Table)
3. Para leer, busca primero en la memtable, despues en los SSTables de mas nuevo a mas viejo

¿Por que ordenado? Porque un archivo ordenado permite buscar con "binary search" (como buscar en un diccionario: abris por la mitad, ves si tu palabra esta antes o despues, repetis).

Cambia al backend LSM-Tree y observa:`,
    commands: [
      { cmd: 'DEBUG BACKEND lsm-tree', explain: 'Cambia al LSM-Tree' },
      { cmd: 'FLUSHDB', explain: 'Empieza limpio' },
      { cmd: 'SET manzana fruta', explain: 'Va a la memtable (RAM)' },
      { cmd: 'SET banana fruta', explain: 'Tambien a la memtable' },
      { cmd: 'SET cereza fruta', explain: 'Mira: estan ORDENADAS en la memtable' },
    ],
    observe: 'El panel derecho muestra la memtable con los datos ORDENADOS alfabeticamente (banana, cereza, manzana). Tambien ves la barra de llenado — cuando llegue al 100%, hace flush a disco.',
  },
  {
    title: '9. Flush: de RAM a disco',
    theory: `La memtable tiene un limite (10 entradas en este demo). Cuando se llena, todo su contenido se escribe a disco como un SSTable: un archivo donde los datos estan ordenados e inmutables (nunca se modifica).

Despues del flush:
- La memtable se vacia (lista para mas datos)
- El WAL se limpia (los datos ya estan seguros en el SSTable)
- El SSTable queda en disco para siempre (hasta compaction)

Llena la memtable para ver el flush en accion:`,
    commands: [
      { cmd: 'SET d 4', explain: '' },
      { cmd: 'SET e 5', explain: '' },
      { cmd: 'SET f 6', explain: '' },
      { cmd: 'SET g 7', explain: '' },
      { cmd: 'SET h 8', explain: '' },
      { cmd: 'SET i 9', explain: '' },
      { cmd: 'SET j 10', explain: 'Este deberia provocar el flush' },
    ],
    observe: 'Cuando la memtable llega a 10 entradas, se escribe un SSTable en disco. La memtable se vacia, y el SSTable aparece abajo con su rango de keys (min → max) y su tamaño en bytes.',
  },
  {
    title: '10. Lectura: memtable primero, SSTables despues',
    theory: `Cuando haces GET, el LSM-Tree busca en orden:

1. Memtable (RAM) — lo mas reciente, lo mas rapido
2. SSTable mas nuevo — por si fue escrito en el ultimo flush
3. SSTable mas viejo — y asi hasta el mas antiguo

Se detiene en el primer resultado que encuentra. Esto significa que si un dato fue actualizado, la version mas nueva (en memtable o SSTable reciente) gana sobre la vieja.

Escribi mas datos para tener cosas en memtable y en SSTables, y despues busca:`,
    commands: [
      { cmd: 'SET k 11', explain: 'Esto va a la memtable' },
      { cmd: 'SET a NUEVO', explain: 'Sobreescribe "a" (que esta en un SSTable)' },
      { cmd: 'GET a', explain: 'Encuentra "NUEVO" en memtable (no busca en SSTable)' },
      { cmd: 'GET d', explain: 'No esta en memtable → busca en SSTable → lo encuentra' },
    ],
    observe: 'GET a devuelve "NUEVO" (de la memtable), no "fruta" (del SSTable). GET d busca en la memtable, no lo encuentra, y va al SSTable. El panel derecho muestra donde esta cada dato.',
  },
  {
    title: '11. Bloom Filter: el atajo probabilistico',
    theory: `Cuando el LSM-Tree busca un dato, revisa cada SSTable de mas nuevo a mas viejo. Si hay 10 SSTables y el dato esta en el ultimo, tuvo que abrir y buscar en 9 archivos inutil mente.

¿Como evitar abrir archivos que NO tienen el dato? Con un Bloom Filter.

Un Bloom Filter es una estructura probabilistica: un arreglo de bits donde cada key "prende" ciertos bits usando funciones de hash. Para preguntar "¿esta esta key?":
- Si algun bit esta APAGADO → "Definitivamente NO esta" (se salta el archivo)
- Si todos los bits estan PRENDIDOS → "QUIZAS esta" (hay que verificar en disco)

Puede dar falsos positivos (decir "quizas" cuando no esta), pero NUNCA falsos negativos.

Cada SSTable ahora tiene un Bloom Filter embebido. Haz varias lecturas de keys que NO existen para ver los "skips":`,
    commands: [
      { cmd: 'GET xyz', explain: 'No existe — el bloom filter de cada SSTable lo sabe' },
      { cmd: 'GET zzz', explain: 'Tampoco existe — bloom filter evita lectura de disco' },
      { cmd: 'GET aaa', explain: 'Otro miss — mira los "skips" en el panel derecho' },
      { cmd: 'GET d', explain: 'Este SI existe — bloom dice "maybe", y lo encuentra' },
    ],
    observe: 'En el panel derecho, cada SSTable muestra su Bloom Filter: cuantos bits tiene, cuantos estan prendidos, la tasa de falsos positivos (FP), y cuantos "skips" (lecturas evitadas). Tambien mira los stats globales arriba.',
  },
  {
    title: '12. Compaction: limpiando SSTables',
    theory: `Cada vez que la memtable se llena, se crea un nuevo SSTable. Sin limpieza, los SSTables se acumulan:
- Lecturas mas lentas (revisar mas archivos)
- Espacio desperdiciado (la misma key en varios archivos)
- Tombstones que no se borran (siguen ocupando espacio)

La solucion: COMPACTION. Es como hacer merge sort de todos los SSTables:
1. Leer todos los SSTables (cada uno ya esta ordenado)
2. Fusionarlos: para cada key, quedarse con la version mas nueva
3. Eliminar tombstones (ya no hacen falta)
4. Escribir UN nuevo SSTable
5. Borrar los viejos

El trade-off: compaction REESCRIBE datos que ya estaban en disco. A esto se le llama "write amplification" — el precio de las escrituras rapidas.

Automaticamente se compacta cuando hay 4+ SSTables. Tambien podes forzar la compaction:`,
    commands: [
      { cmd: 'FLUSHDB', explain: 'Empezar limpio' },
      { cmd: 'SET a 1', explain: '' },
      { cmd: 'SET b 2', explain: '' },
      { cmd: 'SET c 3', explain: '' },
      { cmd: 'SET d 4', explain: '' },
      { cmd: 'SET e 5', explain: '' },
      { cmd: 'SET f 6', explain: '' },
      { cmd: 'SET g 7', explain: '' },
      { cmd: 'SET h 8', explain: '' },
      { cmd: 'SET i 9', explain: '' },
      { cmd: 'SET j 10', explain: 'Flush #1 (10 entries → SSTable)' },
    ],
    observe: 'Mira como se acumulan SSTables. Con 4 SSTables, la compaction se dispara automaticamente: varios archivos → 1 archivo compactado con tag "compacted". Los bytes totales en disco bajan.',
  },
  {
    title: '13. Amplificacion: el gran trade-off',
    theory: `Todo storage engine enfrenta tres tipos de amplificacion:

WRITE AMPLIFICATION: cuantas veces se escribe el mismo dato.
En un LSM-Tree: se escribe al WAL, despues a la memtable, despues al SSTable, y despues la compaction lo reescribe. El mismo dato se escribe 3-4 veces.

READ AMPLIFICATION: cuantos lugares hay que buscar para leer un dato.
Sin bloom filters, hay que buscar en CADA SSTable. Con bloom filters, la mayoria de SSTables se saltan.

SPACE AMPLIFICATION: cuanto espacio extra se usa.
La misma key puede estar en la memtable Y en un SSTable. Los tombstones ocupan espacio hasta que la compaction los elimina.

Ningun storage engine elimina las tres. Es un trade-off:
- LSM-Tree: optimiza ESCRITURAS (rapidas), a costa de read/write amplification
- B-Tree (Session 6): optimiza LECTURAS, a costa de write amplification

Este es el concepto central del Capitulo 3 de DDIA.`,
    commands: [
      { cmd: 'SET k 11', explain: '' },
      { cmd: 'SET l 12', explain: '' },
      { cmd: 'SET m 13', explain: '' },
      { cmd: 'SET n 14', explain: '' },
      { cmd: 'SET o 15', explain: '' },
      { cmd: 'SET p 16', explain: '' },
      { cmd: 'SET q 17', explain: '' },
      { cmd: 'SET r 18', explain: '' },
      { cmd: 'SET s 19', explain: '' },
      { cmd: 'SET t 20', explain: 'Flush #2 + mas SSTables' },
    ],
    observe: 'Mira como crecen los flushes, las compactions, y los bloom filter skips. Cada operacion tiene un costo: escribir es rapido pero genera SSTables que eventualmente hay que compactar. Leer es mas lento porque puede tocar varios archivos — pero el bloom filter ayuda.',
  },
];

export function LessonGuide({ onRunCommand, currentBackend }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = LESSONS[currentStep];

  return (
    <div className="h-full flex flex-col bg-[#faf9f6]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#e8e6e0] flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Guia
        </span>
        <span className="font-mono text-[10px] text-[#a0a090]">
          {currentStep + 1} / {LESSONS.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        {/* Step title */}
        <h2 className="font-mono text-sm text-[#2c2c2c] font-medium mb-4">
          {step.title}
        </h2>

        {/* Theory */}
        <div className="mb-5">
          {step.theory.split('\n\n').map((para, i) => (
            <p key={i} className="text-[13px] text-[#444] leading-relaxed mb-2 last:mb-0">
              {para}
            </p>
          ))}
        </div>

        {/* Commands to run */}
        <div className="mb-5">
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
            Haz click para ejecutar
          </p>
          <div className="space-y-1.5">
            {step.commands.map((c, i) => (
              <button
                key={i}
                onClick={() => onRunCommand(c.cmd)}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] transition-colors">
                  <span className="text-[#4a5d4a] font-mono text-[11px] shrink-0">{'>'}</span>
                  <span className="text-[#e0e0d0] font-mono text-[11px]">{c.cmd}</span>
                  <span className="ml-auto text-[#555] font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    click
                  </span>
                </div>
                {c.explain && (
                  <p className="text-[11px] text-[#999] mt-0.5 pl-3">{c.explain}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* What to observe */}
        <div className="bg-[#f0efe8] px-4 py-3 border-l-2 border-[#c4a07a]">
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-1">
            Que observar
          </p>
          <p className="text-[12px] text-[#555] leading-relaxed">
            {step.observe}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-[#e8e6e0] flex items-center justify-between shrink-0">
        <button
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="font-mono text-[11px] text-[#7a7a6e] hover:text-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        {/* Step dots */}
        <div className="flex gap-1.5">
          {LESSONS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-[#4a5d4a]'
                  : i < currentStep
                    ? 'bg-[#c4a07a]'
                    : 'bg-[#ddd]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentStep(s => Math.min(LESSONS.length - 1, s + 1))}
          disabled={currentStep === LESSONS.length - 1}
          className="font-mono text-[11px] text-[#7a7a6e] hover:text-[#2c2c2c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
