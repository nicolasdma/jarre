'use client';

import { useState } from 'react';

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  observe: string;
}

interface LessonGuideProps {
  onToggleField: () => void;
  onSelectFormat: (format: 'json' | 'msgpack' | 'protobuf' | 'avro') => void;
  onReset: () => void;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. El costo de la legibilidad',
    theory: `JSON es el formato universal para APIs web. Es legible por humanos, flexible, y no requiere schema. Pero tiene un costo: cada registro incluye los nombres de campo completos ("userName", "favoriteNumber"). En un solo documento, esto parece trivial. Pero si transmites millones de mensajes por segundo, esos bytes extra se acumulan. El ejemplo de DDIA: un documento JSON simple ocupa 81 bytes. Los nombres de campo y la sintaxis ({, ", :) consumen mas de la mitad.`,
    action: 'Observar la barra de JSON',
    observe:
      'Nota como los "nombres de campo" (rojo) y la "sintaxis" (gris) dominan el tamano. Los valores reales son una fraccion del total.',
  },
  {
    title: '2. MessagePack: binario sin schema',
    theory: `MessagePack es una codificacion binaria de JSON. Elimina las comillas, los dos puntos, y codifica los tipos de forma mas compacta. Pero los nombres de campo SIGUEN incluidos en los datos. El ahorro es modesto: ~18% menos que JSON texto. Para muchos casos, este ahorro no justifica perder la legibilidad. La leccion: el verdadero ahorro viene de eliminar los nombres de campo, no de comprimir la sintaxis.`,
    action: 'Seleccionar MessagePack',
    observe:
      'Compara el tamano con JSON. Los nombres de campo siguen siendo una parte significativa. El ahorro es real pero limitado.',
  },
  {
    title: '3. Protocol Buffers: field tags',
    theory: `Protocol Buffers reemplaza los nombres de campo por field tags — numeros asignados en el schema (1, 2, 3...). Cada tag ocupa 1-2 bytes vs ~10 bytes para un nombre. El ahorro es dramatico: ~60% menos que JSON. Ademas, los field tags habilitan schema evolution: si el decodificador encuentra un tag que no conoce, lo ignora (forward compatibility). Los nombres pueden cambiar sin romper nada porque nunca se codifican.`,
    action: 'Seleccionar Protocol Buffers',
    observe:
      'Los "field tags" (rojo) ocupan minimos bytes. Casi todo el tamano es datos reales. Nota las features: forward compatibility habilitada.',
  },
  {
    title: '4. Avro: maxima compacidad',
    theory: `Avro elimina incluso los field tags. Solo concatena los valores en el orden del schema. El decodificador necesita tanto el writer's schema (con que se escribio) como el reader's schema (que espera). Avro los compara por nombre de campo y resuelve las diferencias. Esto lo hace el mas compacto, pero requiere que el schema este disponible al decodificar. Ideal para archivos grandes (Hadoop) donde el schema se incluye una vez al inicio.`,
    action: 'Seleccionar Avro',
    observe:
      'No hay overhead de identificacion de campo. Todo son datos puros. Es el formato mas compacto posible sin compresion.',
  },
  {
    title: '5. Schema evolution en accion',
    theory: `Agrega un campo nuevo y observa como cambia cada formato. En JSON, el campo simplemente aparece. En Protobuf, se agrega con un nuevo tag. En Avro, se agrega por nombre. La pregunta clave: si codigo viejo lee datos con el campo nuevo, que pasa? JSON: depende de la aplicacion. Protobuf: ignora tags desconocidos automaticamente. Avro: ignora campos desconocidos y rellena campos faltantes con defaults. Esta es la esencia de forward/backward compatibility.`,
    action: 'Agregar campo email',
    observe:
      'Nota cuanto crece cada formato con un campo adicional. JSON crece mas (nombre del campo + valor). Protobuf crece poco (tag de 1 byte + valor). Avro crece lo minimo (solo el valor).',
  },
];

export function LessonGuide({ onToggleField, onSelectFormat, onReset }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleAction = () => {
    switch (currentStep) {
      case 0:
        onSelectFormat('json');
        break;
      case 1:
        onSelectFormat('msgpack');
        break;
      case 2:
        onSelectFormat('protobuf');
        break;
      case 3:
        onSelectFormat('avro');
        break;
      case 4:
        onToggleField();
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

        <p className="text-sm text-j-text-secondary leading-relaxed">
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
