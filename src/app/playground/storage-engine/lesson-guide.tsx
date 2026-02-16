'use client';

import {
  LessonGuideShell,
  type LessonStep,
  type LessonGuideColors,
} from '@/components/playground/lesson-guide-shell';

// ---------------------------------------------------------------------------
// Extended step with executable commands
// ---------------------------------------------------------------------------

interface StorageStep extends LessonStep {
  commands: Array<{ cmd: string; explain: string }>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LessonGuideProps {
  onRunCommand: (command: string) => void;
  currentBackend: string;
}

// ---------------------------------------------------------------------------
// Colors (warm/earthy theme for storage-engine)
// ---------------------------------------------------------------------------

const COLORS: LessonGuideColors = {
  accent: '#c4a07a',   // j-warm — active dot + callout border
  visited: '#c4a07a',  // visited dots
  calloutBg: '#f0efe8',
};

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const STEPS: StorageStep[] = [
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

Vamos a simular un crash. DEBUG WAL INJECT escribe SOLO al WAL (simula que el proceso murio antes de escribir al archivo principal). Despues, DEBUG CRASH mata el proceso SIN limpiar el WAL (como un corte de luz real):`,
    commands: [
      { cmd: 'DEBUG WAL INJECT dato_secreto valor_oculto', explain: 'Escribe SOLO al WAL (no al archivo principal)' },
      { cmd: 'GET dato_secreto', explain: 'No lo encuentra — no esta en el archivo principal' },
      { cmd: 'DEBUG WAL STATUS', explain: 'Ve el WAL: tiene la entrada con checksum' },
      { cmd: 'DEBUG CRASH', explain: 'Mata el proceso SIN limpiar — simula un crash real' },
    ],
    observe: 'dato_secreto esta en el WAL pero NO en el indice. Despues de DEBUG CRASH, el engine muere. Reinicialo con npm run engine y haz GET dato_secreto — va a aparecer. El WAL lo recupero. IMPORTANTE: si usas Ctrl+C en vez de DEBUG CRASH, el engine limpia el WAL al cerrar (como un shutdown limpio) y no hay nada que recuperar.',
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
  {
    title: '14. B-Tree: paginas en disco',
    theory: `El LSM-Tree escribe datos en archivos inmutables (SSTables). Pero hay otra forma totalmente distinta: el B-Tree.

Un B-Tree divide el disco en PAGINAS fijas de 4 KB (como PostgreSQL). Cada pagina es un nodo del arbol con espacio para un numero limitado de keys. Cuando haces SET, el engine encuentra la pagina correcta y la SOBREESCRIBE en su lugar.

Esta es la diferencia fundamental:
- LSM-Tree: APPEND (nunca modifica lo que ya escribio)
- B-Tree: IN-PLACE UPDATE (reescribe la pagina donde esta el dato)

Cambia al backend B-Tree para ver esta estructura:`,
    commands: [
      { cmd: 'DEBUG BACKEND b-tree', explain: 'Cambia al backend B-Tree' },
      { cmd: 'FLUSHDB', explain: 'Empieza limpio' },
      { cmd: 'SET manzana fruta', explain: 'Inserta en la hoja raiz' },
      { cmd: 'SET banana fruta', explain: 'Se inserta ordenada en la misma pagina' },
      { cmd: 'SET cereza fruta', explain: 'Tercera key en la pagina' },
    ],
    observe: 'El panel derecho muestra una sola pagina (la raiz) con las keys ordenadas. La barra de utilizacion muestra cuanto espacio queda en la pagina. Cada pagina tiene espacio para maximo 4 keys.',
  },
  {
    title: '15. Split: cuando la pagina se desborda',
    theory: `Cada pagina tiene un limite de 4 keys (en este demo — en PostgreSQL son cientos). Cuando insertas la 5ta key, la pagina se DESBORDA y ocurre un SPLIT:

1. La pagina se divide en dos mitades
2. La key del medio sube al padre
3. Se crea una nueva pagina para la mitad derecha

Si el padre tambien se desborda, el split se propaga hacia arriba. Si la raiz se desborda, se crea una nueva raiz y el arbol crece en altura.

Inserta dos keys mas para provocar el primer split:`,
    commands: [
      { cmd: 'SET durazno fruta', explain: 'Cuarta key — pagina llena al 100%' },
      { cmd: 'SET elote vegetal', explain: 'QUINTA key — overflow! Se provoca un split' },
      { cmd: 'DBSIZE', explain: 'Verifica que las 5 keys existen' },
    ],
    observe: 'El arbol ahora tiene 2 niveles: una raiz interna con la key que subio, y dos hojas con las keys repartidas. Mira los punteros (→N) que conectan la raiz con sus hijos. El contador de "Splits" aumento.',
  },
  {
    title: '16. Lectura: siempre O(log n)',
    theory: `La ventaja principal del B-Tree sobre el LSM-Tree: lecturas PREDECIBLES.

Para leer cualquier key:
1. Empieza en la raiz
2. Busca binariamente cual hijo seguir
3. Baja un nivel
4. Repite hasta llegar a una hoja
5. Busca la key en la hoja

El numero de paginas que lee = la altura del arbol. Con altura 2, siempre lee 2 paginas. Con altura 3, siempre 3. No importa cuantas keys tengas.

Un B-Tree con millones de keys tiene tipicamente altura 3-4 (porque cada nodo real tiene ~300 keys, no 4).`,
    commands: [
      { cmd: 'GET manzana', explain: 'Raiz → hoja izquierda → encontrada' },
      { cmd: 'GET elote', explain: 'Raiz → hoja derecha → encontrada' },
      { cmd: 'GET zzzz', explain: 'Raiz → hoja derecha → no encontrada (pero mismos 2 pasos)' },
      { cmd: 'GET aaa', explain: 'Raiz → hoja izquierda → no encontrada (mismos 2 pasos)' },
    ],
    observe: 'Todas las lecturas toman el mismo camino: raiz → hoja (2 paginas). No importa si la key existe o no, si esta al principio o al final. Siempre es predecible. Compara con el LSM-Tree donde puede buscar en memtable + varios SSTables.',
  },
  {
    title: '17. Escritura: el costo del B-Tree',
    theory: `Cada vez que haces SET, el B-Tree reescribe una PAGINA COMPLETA de 4 KB aunque solo cambies un byte. Si un split ocurre, reescribe 2-3 paginas.

Esto se llama WRITE AMPLIFICATION: el dato real puede ser 20 bytes, pero el engine escribe 4096 bytes (la pagina entera).

Ademas, cada escritura es un ACCESO ALEATORIO al disco (seek a la pagina correcta), mientras que el LSM-Tree solo hace escrituras SECUENCIALES (append al final).

Sigue insertando para ver mas splits y el arbol crecer en altura:`,
    commands: [
      { cmd: 'SET fresa fruta', explain: 'Inserta en una hoja' },
      { cmd: 'SET guayaba fruta', explain: 'Puede provocar otro split' },
      { cmd: 'SET higo fruta', explain: 'El arbol sigue creciendo' },
      { cmd: 'SET kiwi fruta', explain: 'Mas inserciones, mas splits posibles' },
      { cmd: 'SET limon fruta', explain: 'Observa la altura y los splits' },
    ],
    observe: 'Mira como cambian la altura, el numero de paginas, y los splits. Cada split reescribe 2-3 paginas de 4 KB cada una. El archivo en disco crece en multiplos de 4 KB. La ventaja: nunca necesita compaction como el LSM-Tree.',
  },
  {
    title: '18. B-Tree vs LSM-Tree: el trade-off central',
    theory: `Este es el concepto mas importante del Capitulo 3 de DDIA:

B-TREE (PostgreSQL, MySQL, SQLite):
✅ Lecturas predecibles — siempre O(log n)
✅ Sin compaction — no hay trabajo en segundo plano
✅ Cada key existe en UN solo lugar
❌ Write amplification — reescribe pagina completa de 4 KB
❌ Acceso aleatorio a disco (seeks)
❌ Splits son caros

LSM-TREE (Cassandra, RocksDB, LevelDB):
✅ Escrituras rapidas — siempre secuenciales (append)
✅ Mejor compresion — SSTables ordenados se comprimen bien
❌ Lecturas pueden tocar multiples SSTables
❌ Compaction consume CPU y I/O en segundo plano
❌ Space amplification — misma key en multiples archivos

¿Cual es mejor? DEPENDE del caso de uso:
- Muchas lecturas, pocas escrituras → B-Tree
- Muchas escrituras, pocas lecturas → LSM-Tree

Compara ambos backends:`,
    commands: [
      { cmd: 'DBSIZE', explain: 'Cuantas keys en el B-Tree' },
      { cmd: 'DEBUG BACKEND lsm-tree', explain: 'Cambia al LSM-Tree' },
      { cmd: 'DBSIZE', explain: 'Cuantas keys en el LSM-Tree (independiente)' },
      { cmd: 'DEBUG BACKEND b-tree', explain: 'Vuelve al B-Tree' },
    ],
    observe: 'Cada backend mantiene sus datos por separado. El B-Tree usa paginas fijas, el LSM-Tree usa memtable + SSTables. Distintas estructuras, mismo objetivo: almacenar y recuperar datos eficientemente. El trade-off es donde pones el costo: en las lecturas o en las escrituras.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonGuide({ onRunCommand, currentBackend }: LessonGuideProps) {
  return (
    <LessonGuideShell
      steps={STEPS}
      colors={COLORS}
      renderAction={(stepIndex) => {
        const step = STEPS[stepIndex];
        return (
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
                    <span className="text-j-accent font-mono text-[11px] shrink-0">{'>'}</span>
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
        );
      }}
    />
  );
}
