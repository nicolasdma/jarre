'use client';

import { useState } from 'react';

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  observe: string;
}

interface LessonGuideProps {
  onSelectView: (view: 'parameters' | 'data' | 'compute' | 'optimal' | 'budget') => void;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. Power Laws: la geometria del scaling',
    theory: `Las scaling laws de Kaplan et al. (2020) descubrieron que la loss de un language model sigue power laws con respecto a tres ejes: parametros (N), datos (D) y compute (C). Una power law tiene la forma L(x) = (x_c / x)^alpha + L_inf, donde alpha es el exponente y L_inf es la loss irreducible (entropia del lenguaje natural). En un grafico log-log, una power law es una LINEA RECTA. La pendiente de esa linea es el exponente alpha, y es lo que determina cuan rapido mejora el modelo al escalar ese eje.`,
    action: 'Explorar Loss vs Parameters',
    observe:
      'La curva Loss vs Parameters es una linea recta en escala log-log. La pendiente es alpha_N = 0.076. Mueve el slider de parametros y observa como la loss baja suavemente — no hay "saltos" ni umbrales magicos.',
  },
  {
    title: '2. Los tres exponentes',
    theory: `Cada eje tiene su propio exponente: alpha_N = 0.076 (parametros), alpha_D = 0.095 (datos), alpha_C = 0.050 (compute). El exponente MAS GRANDE significa que escalar ese eje reduce la loss mas rapido. Dato clave: alpha_D > alpha_N > alpha_C. Esto significa que agregar datos es mas "eficiente" que agregar parametros, y ambos son mas eficientes que simplemente meter mas compute. Pero ojo: estos exponentes asumen que los otros ejes no son el cuello de botella.`,
    action: 'Comparar los tres ejes',
    observe:
      'Cambia entre las vistas de Parameters, Data y Compute. La curva de Data tiene mayor pendiente que la de Parameters, que a su vez tiene mayor pendiente que Compute. Esto refleja los exponentes alpha.',
  },
  {
    title: '3. Compute-optimal allocation (Kaplan)',
    theory: `Dado un presupuesto fijo de compute C (medido en FLOPs), ¿como lo repartes entre modelo grande (N) y mas datos (D)? Kaplan encontro que C ~ 6ND (aproximacion). La conclusion del paper original fue que la mayoria del compute deberia ir a modelos MAS GRANDES, entrenados con relativamente MENOS datos. La split optima de Kaplan asigna ~N^0.73 al modelo. Esto significaba que un modelo de 10B deberia entrenarse con ~200B tokens, no con 1T.`,
    action: 'Ver allocation optima',
    observe:
      'En la vista Optimal Allocation, mueve el slider de compute. Observa como Kaplan recomienda modelos grandes con pocos tokens. La barra muestra la proporcion N vs D.',
  },
  {
    title: '4. Chinchilla: la correccion',
    theory: `En 2022, Hoffmann et al. (Chinchilla) demostraron que Kaplan subestimo la importancia de los datos. La relacion optima de Chinchilla es ~20 tokens por parametro (no los ~5 que Kaplan sugeria). Esto significa que GPT-3 (175B params, 300B tokens) estaba UNDER-TRAINED — deberia haber visto ~3.5T tokens. LLaMA (65B params, 1.4T tokens) siguio esta intuicion y logro rendimiento comparable con un modelo mucho mas pequeno. Chinchilla cambio toda la industria: modelos mas pequenos, entrenados con muchos mas datos.`,
    action: 'Comparar Kaplan vs Chinchilla',
    observe:
      'Observa como para el mismo compute, Chinchilla recomienda modelos MAS PEQUENOS con MAS datos. La diferencia es dramatica en presupuestos grandes. Los modelos "Chinchilla-optimal" logran mejor loss.',
  },
  {
    title: '5. De la teoria al presupuesto',
    theory: `¿Como se conecta esto con la realidad? Un GPU-hour en un A100 produce ~3.12e17 FLOPs (312 TFLOPS). Si un GPU-hour cuesta $2, puedes calcular cuanto compute puedes comprar con un presupuesto dado. Con C FLOPs y la relacion C ~ 6ND, puedes derivar el modelo optimo. Ejemplo: con $1M y A100s a $2/hora, tienes ~500K GPU-hours = ~1.56e23 FLOPs. Kaplan diria: modelo de ~50B params con ~500B tokens. Chinchilla diria: modelo de ~13B params con ~2T tokens. Esta es la diferencia practica entre las dos filosofias.`,
    action: 'Usar calculadora de presupuesto',
    observe:
      'Ajusta el presupuesto en dolares y el costo por GPU-hour. Observa como las recomendaciones de Kaplan y Chinchilla divergen. Para presupuestos grandes, Chinchilla es significativamente mas eficiente.',
  },
];

const VIEW_MAP: Record<number, 'parameters' | 'data' | 'compute' | 'optimal' | 'budget'> = {
  0: 'parameters',
  1: 'parameters',
  2: 'optimal',
  3: 'optimal',
  4: 'budget',
};

export function LessonGuide({ onSelectView }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = LESSONS[currentStep];

  const handleAction = () => {
    const view = VIEW_MAP[currentStep];
    if (view) onSelectView(view);
  };

  return (
    <div className="h-full flex flex-col bg-j-bg">
      {/* Header */}
      <div className="px-5 py-3 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Guia
        </span>
        <span className="font-mono text-[10px] text-[#a0a090]">
          {currentStep + 1} / {LESSONS.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        <h2 className="font-mono text-sm text-j-text font-medium mb-4">
          {step.title}
        </h2>

        <div className="mb-5">
          {step.theory.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="text-[13px] text-[#444] leading-relaxed mb-2 last:mb-0"
            >
              {para}
            </p>
          ))}
        </div>

        <div className="mb-5">
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
            Accion
          </p>
          <button
            onClick={handleAction}
            className="w-full text-left px-4 py-2.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-mono text-[12px] tracking-wider transition-colors rounded"
          >
            {step.action}
          </button>
        </div>

        <div className="bg-[#eff6ff] px-4 py-3 border-l-2 border-[#1e40af] rounded-r">
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-1">
            Que observar
          </p>
          <p className="text-[12px] text-[#555] leading-relaxed">
            {step.observe}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-j-border flex items-center justify-between shrink-0">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <div className="flex gap-1.5">
          {LESSONS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-[#1e40af]'
                  : i < currentStep
                    ? 'bg-[#bfdbfe]'
                    : 'bg-[#ddd]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentStep((s) => Math.min(LESSONS.length - 1, s + 1))
          }
          disabled={currentStep === LESSONS.length - 1}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
