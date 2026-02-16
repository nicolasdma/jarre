'use client';

import { useState } from 'react';

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  observe: string;
}

interface LessonGuideProps {
  onRunScenario: () => void;
  onSetScenario: (scenario: 'dirty_read' | 'read_skew' | 'lost_update' | 'write_skew') => void;
  onSetIsolation: (level: 'read_committed' | 'snapshot' | 'serializable') => void;
  onReset: () => void;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. Read Skew: la inconsistencia temporal',
    theory: `El ejemplo mas claro del capitulo: Alice tiene $500 en cuenta A y $500 en cuenta B. Una transferencia mueve $100 de A a B. Si Alice lee cuenta A antes de la transferencia ($500) y cuenta B despues ($600), ve un total de $1100. Ambas lecturas son de datos commiteados (Read Committed las permite), pero son de diferentes puntos en el tiempo. Esto es read skew. Snapshot isolation lo previene porque Alice veria ambas cuentas en el estado del inicio de su transaccion.`,
    action: 'Ejecutar Read Skew',
    observe:
      'Con Read Committed, Alice ve $1100. Cambia a Snapshot Isolation y ejecuta de nuevo: Alice ve $1000 correctamente.',
  },
  {
    title: '2. Lost Update: read-modify-write',
    theory: `Dos transacciones leen un contador (42), le suman 1, y escriben 43. El resultado deberia ser 44, pero ambas escribieron 43: una actualizacion se perdio. Esto ocurre incluso con Snapshot Isolation porque cada transaccion lee su propio snapshot (ambas ven 42). La solucion mas simple: usar UPDATE counter = counter + 1 (operacion atomica). Alternativas: SELECT FOR UPDATE, deteccion automatica, o compare-and-set.`,
    action: 'Ejecutar Lost Update',
    observe:
      'Con Read Committed y Snapshot Isolation, el contador termina en 43 (deberia ser 44). Con Serializable, la DB detecta el conflicto.',
  },
  {
    title: '3. Write Skew: el invariante invisible',
    theory: `Dos doctores de guardia quieren retirarse. Ambos verifican: "hay 2 de guardia, puedo irme". Ambos se retiran. Resultado: 0 doctores. Cada transaccion escribio un objeto DIFERENTE (su propio registro), pero basandose en datos que la otra invalido. Ni Read Committed ni Snapshot Isolation detectan esto. Solo Serializable puede prevenirlo, ya sea con locks (2PL) o deteccion optimista (SSI).`,
    action: 'Ejecutar Write Skew',
    observe:
      'Con Read Committed y Snapshot Isolation: ambos se retiran (invariante violado). Con Serializable: SSI aborta una transaccion.',
  },
  {
    title: '4. El espectro de aislamiento',
    theory: `Los niveles de aislamiento forman un espectro de correctness vs rendimiento:\n\n• Read Committed: previene dirty reads/writes. Permite read skew, lost updates, write skew.\n• Snapshot Isolation: previene read skew. Permite lost updates (algunos DBs los detectan), write skew.\n• Serializable: previene TODO. Costo: 2PL (locks, deadlocks), Serial (un solo thread), o SSI (aborts en conflicto).\n\nLa mayoria de apps usan Read Committed o Snapshot Isolation y aceptan las anomalias restantes. Solo operaciones criticas necesitan Serializable.`,
    action: 'Experimentar libremente',
    observe:
      'Prueba cada combinacion de anomalia + nivel de aislamiento. Nota el patron: cada nivel agrega proteccion pero el costo sube. La pregunta para tu sistema: que anomalias puedes tolerar?',
  },
];

export function LessonGuide({ onRunScenario, onSetScenario, onSetIsolation, onReset }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleAction = () => {
    switch (currentStep) {
      case 0:
        onSetScenario('read_skew');
        onSetIsolation('read_committed');
        onRunScenario();
        break;
      case 1:
        onSetScenario('lost_update');
        onSetIsolation('read_committed');
        onRunScenario();
        break;
      case 2:
        onSetScenario('write_skew');
        onSetIsolation('read_committed');
        onRunScenario();
        break;
      case 3:
        onReset();
        break;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Step indicator */}
      <div className="flex gap-1 mb-4">
        {LESSONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`h-1 flex-1 transition-colors ${
              i === currentStep ? 'bg-[#991b1b]' : i < currentStep ? 'bg-[#991b1b]/40' : 'bg-j-border'
            }`}
          />
        ))}
      </div>

      {/* Current lesson */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <h3 className="font-mono text-sm text-j-text font-medium">
          {LESSONS[currentStep].title}
        </h3>

        <p className="text-sm text-j-text-secondary leading-relaxed whitespace-pre-line">
          {LESSONS[currentStep].theory}
        </p>

        <div className="border-l-2 border-[#991b1b] pl-4 py-1">
          <p className="font-mono text-[10px] tracking-wider text-[#991b1b] uppercase mb-1">Observa</p>
          <p className="text-xs text-j-text-secondary">{LESSONS[currentStep].observe}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleAction}
          className="w-full py-2 bg-[#991b1b] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#7f1d1d] transition-colors"
        >
          {LESSONS[currentStep].action}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex-1 py-2 border border-j-border font-mono text-[10px] tracking-wider text-j-text-tertiary hover:text-j-text disabled:opacity-30 transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(LESSONS.length - 1, currentStep + 1))}
            disabled={currentStep === LESSONS.length - 1}
            className="flex-1 py-2 border border-j-border font-mono text-[10px] tracking-wider text-j-text-tertiary hover:text-j-text disabled:opacity-30 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
