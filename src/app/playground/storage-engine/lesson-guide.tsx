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
    title: '1. Tu primera base de datos',
    theory: `Estás conectado a un storage engine que escribimos desde cero. Es la parte más baja de cualquier base de datos: donde los bytes tocan el disco.

En tu computadora hay un archivo real: engine/data/engine.log. Cada vez que haces SET, el engine escribe bytes al final de ese archivo. Literalmente: abre el archivo, pone bytes al final, cierra. Eso es todo.

En el panel derecho vas a ver ese archivo representado visualmente: cada bloque es un record binario con su posición en bytes (offset) y su tamaño.`,
    commands: [
      { cmd: 'SET ciudad Madrid', explain: 'Escribe bytes al final del archivo' },
      { cmd: 'SET pais España', explain: 'Más bytes al final' },
      { cmd: 'GET ciudad', explain: 'Recupera el valor' },
    ],
    observe: 'Mira el panel derecho: ves los bloques del archivo real. Cada uno muestra su offset (posición en bytes desde el inicio) y su tamaño. El archivo solo crece, nunca se modifica lo que ya está.',
  },
  {
    title: '2. El problema del O(n)',
    theory: `O(n) significa que el tiempo crece proporcionalmente con la cantidad de datos.

Si tienes 10 records, buscar uno requiere revisar hasta 10. Si tienes 1 millón, hasta 1 millón. Esto es porque el append-log NO tiene índice — para encontrar un key, escanea todo el archivo de atrás hacia adelante.

Esto es lo que DDIA llama "full scan". Es O(1) para escribir (solo agrega al final), pero O(n) para leer.`,
    commands: [
      { cmd: 'SET a 1', explain: 'Agrega record #1' },
      { cmd: 'SET b 2', explain: 'Agrega record #2' },
      { cmd: 'SET c 3', explain: 'Record #3' },
      { cmd: 'SET d 4', explain: 'Record #4...' },
      { cmd: 'GET a', explain: 'Para encontrar "a", escanea TODOS los records' },
    ],
    observe: 'Mira "Total Records" creciendo. GET a tiene que revisar todos esos records para encontrar "a" al principio del archivo. Con más datos, esto se vuelve insostenible.',
  },
  {
    title: '3. Espacio desperdiciado',
    theory: `Otro problema del append-only log: si haces SET del mismo key 10 veces, guardas 10 copias. Solo la última importa, pero las anteriores siguen en disco.

Observa cómo "Total Records" es mayor que "Live Keys". La diferencia es espacio desperdiciado.`,
    commands: [
      { cmd: 'SET nombre version1', explain: 'Primera versión' },
      { cmd: 'SET nombre version2', explain: 'Sobreescribe con v2' },
      { cmd: 'SET nombre version3', explain: 'Sobreescribe con v3' },
      { cmd: 'GET nombre', explain: 'Solo devuelve la última' },
      { cmd: 'DBSIZE', explain: 'Cuenta keys VIVOS (no records)' },
    ],
    observe: 'Live Keys queda igual, pero Total Records sube con cada SET. El "% wasted space" muestra cuánto disco estamos desperdiciando. Esto motiva la "compaction" (futuro).',
  },
  {
    title: '4. La solución: Hash Index',
    theory: `¿Cómo hacer reads en O(1)? Con un índice.

Un hash index es un Map en memoria: para cada key, guarda la posición exacta (offset en bytes) donde está su valor en disco.

SET → escribe al log + actualiza el Map
GET → busca el offset en el Map + lee directo de disco

Un solo seek en lugar de escanear todo. Esto es O(1): el tiempo es constante sin importar cuántos datos tengas.

Este es el modelo "Bitcask" de DDIA — usado en Riak.`,
    commands: [
      { cmd: 'DEBUG BACKEND hash-index', explain: 'Cambia al backend con índice' },
      { cmd: 'SET usuario alice', explain: 'Escribe + actualiza índice' },
      { cmd: 'SET email alice@test.com', explain: 'Otra entrada en el índice' },
      { cmd: 'GET usuario', explain: 'Lee directo del offset — O(1)' },
    ],
    observe: 'Ahora el panel derecho muestra una tabla de índice: cada key tiene su offset y tamaño. GET ya no escanea — va directo a la posición. Compara "Disk Records" vs "Keys in Index".',
  },
  {
    title: '5. Trade-offs del Hash Index',
    theory: `El hash index soluciona los reads, pero tiene limitaciones:

1. Todas las keys deben caber en RAM — el Map vive en memoria. Si tienes más keys que RAM, no funciona.

2. No soporta range queries — puedes buscar "usuario" pero no "todos los keys que empiezan con u". Un hash map no tiene orden.

3. Crash recovery es lento — si el proceso muere, hay que re-escanear todo el log para reconstruir el Map.

Estas limitaciones motivan LSM-Trees y B-Trees (futuras sessions).`,
    commands: [
      { cmd: 'SET x 1', explain: '' },
      { cmd: 'SET x 2', explain: '' },
      { cmd: 'SET x 3', explain: 'Sobreescribe 3 veces' },
      { cmd: 'INSPECT', explain: 'Ve el estado completo en JSON' },
    ],
    observe: 'En INSPECT ves indexEntries con offsets. "x" solo tiene un entry en el índice (el más reciente), pero hay 3 records en disco. El log sigue creciendo — necesitaríamos compaction.',
  },
  {
    title: '6. Write-Ahead Log (WAL)',
    theory: `¿Qué pasa si el proceso muere a mitad de una escritura? Pierdes datos.

La solución: antes de escribir al log principal, escribe primero al WAL (Write-Ahead Log) con un checksum CRC32. Si el proceso muere después del WAL pero antes del log principal, al reiniciar el engine recupera los datos del WAL.

El WAL es la red de seguridad. Cada entrada tiene un CRC32 que detecta corrupción — si el proceso murió a mitad de escritura, el CRC no coincide y esa entrada se descarta.

Esto es lo que hace toda base de datos real: PostgreSQL, MySQL, SQLite... todas usan WAL.`,
    commands: [
      { cmd: 'SET dato_importante valor_critico', explain: 'Escribe normalmente (WAL + log)' },
      { cmd: 'DEBUG WAL INJECT dato_oculto solo_en_wal', explain: 'Escribe SOLO al WAL (simula crash)' },
      { cmd: 'GET dato_oculto', explain: 'No lo encuentra — no está en el log principal' },
      { cmd: 'DEBUG WAL STATUS', explain: 'Ve el WAL con la entrada pendiente' },
    ],
    observe: 'dato_oculto está en el WAL pero no en el índice. Ahora reinicia el engine (npm run engine) y haz GET dato_oculto — lo va a encontrar. El WAL lo recuperó.',
  },
  {
    title: '7. Compara tú mismo',
    theory: `Ahora puedes alternar entre backends y sentir la diferencia.

Con append-log: GET escanea todo.
Con hash-index: GET hace un seek directo + WAL para durabilidad.

Con pocos datos no hay diferencia perceptible. Pero piensa en millones de keys — el append-log sería inutilizable.

Este es el fundamento de DDIA Capítulo 3: los storage engines existen porque la forma más simple (append-log) no escala para reads. Y el WAL existe porque la durabilidad no es opcional.`,
    commands: [
      { cmd: 'DEBUG BACKEND append-log', explain: 'Vuelve al log sin índice' },
      { cmd: 'DBSIZE', explain: 'Ve cuántos keys hay' },
      { cmd: 'DEBUG BACKEND hash-index', explain: 'Ahora con índice + WAL' },
      { cmd: 'DBSIZE', explain: 'Misma data, distinta estructura' },
    ],
    observe: 'Los datos son los mismos. Lo que cambia es la estructura de acceso y la garantía de durabilidad. Esa es la esencia de los storage engines.',
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
            Ejecuta en la terminal
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
                    click to run
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
            Observa
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
