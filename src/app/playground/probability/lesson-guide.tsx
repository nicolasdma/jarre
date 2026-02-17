'use client';

import { useState } from 'react';

interface LessonGuideProps {
  onSetPrior: (alpha: number, beta: number) => void;
  onObserve: (outcome: 'success' | 'failure') => void;
  onBulkObserve: (successes: number, failures: number) => void;
  onReset: () => void;
}

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  observe: string;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. Prior: tu creencia antes de ver datos',
    theory: `La distribucion prior representa lo que crees ANTES de observar datos. En el caso de una moneda, el parametro θ es la probabilidad de "cara".

La distribucion Beta(α, β) es el prior conjugado para datos binomiales. α-1 se puede interpretar como "caras previas imaginarias" y β-1 como "cruces previas imaginarias".

Beta(1,1) = uniforme: no sabes nada, cualquier θ es igualmente probable. Beta(10,10) = prior fuerte centrado en 0.5: crees que la moneda es justa. Beta(2,5) = crees que las caras son poco probables.

El prior es subjetivo, y eso esta bien. La ventaja bayesiana es que puedes incorporar conocimiento previo explicitamente.`,
    action: 'Configurar prior uniforme',
    observe:
      'Con Beta(1,1) la curva es plana: total incertidumbre. La entropia es maxima. Observa como cambia al ajustar α y β.',
  },
  {
    title: '2. Likelihood: qué tan probable son los datos',
    theory: `La likelihood P(datos|θ) mide que tan probables son los datos observados bajo cada valor posible de θ.

Si lanzas una moneda 10 veces y salen 7 caras, la likelihood es maxima en θ=0.7. Pero la likelihood sola no es una distribucion de probabilidad (no integra a 1 sobre θ).

El MLE (Maximum Likelihood Estimator) es el valor de θ que maximiza la likelihood: MLE = caras / total_lanzamientos. Es el "mejor guess" sin considerar el prior.`,
    action: 'Observar 5 éxitos',
    observe:
      'Despues de observar 5 exitos seguidos, el posterior se desplaza hacia θ=1. El MLE es exactamente 1.0 (todos exitos). Pero el MAP y la media bayesiana son mas conservadores gracias al prior.',
  },
  {
    title: '3. Posterior = Prior × Likelihood',
    theory: `El teorema de Bayes: P(θ|datos) ∝ P(datos|θ) · P(θ). El posterior es proporcional al producto de la likelihood por el prior.

Con un prior Beta(α,β) y datos binomiales (k exitos, n-k fracasos), el posterior es Beta(α+k, β+n-k). Esta actualizacion es elegante: simplemente sumas los conteos.

El posterior de hoy se convierte en el prior de manana. Es un proceso iterativo: cada nueva observacion actualiza tu creencia. Con suficientes datos, el prior inicial importa cada vez menos.`,
    action: 'Observar 3 fracasos',
    observe:
      'El posterior se ajusta hacia la izquierda. Nota como cada observacion "tira" de la distribucion. Con pocas observaciones, el prior tiene mucho peso. Con muchas, los datos dominan.',
  },
  {
    title: '4. MLE vs MAP: point estimates vs distribución',
    theory: `Tres formas de resumir tu creencia sobre θ:

MLE = argmax P(datos|θ) = k/n. Ignora el prior completamente.
MAP = argmax P(θ|datos) = (α+k-1)/(α+β+n-2). Incorpora el prior.
Media bayesiana = E[θ|datos] = (α+k)/(α+β+n). El promedio del posterior.

Con pocos datos, difieren mucho. Con muchos datos, convergen. La ventaja del enfoque bayesiano completo es que mantienes la DISTRIBUCION, no solo un punto. Sabes no solo "que valor es probable" sino "que tan seguro estoy".`,
    action: 'Configurar prior fuerte',
    observe:
      'Con un prior fuerte Beta(20,20), se necesitan muchas observaciones para mover el posterior. Compara las tres lineas verticales: MLE, MAP, y media bayesiana. Con pocas observaciones, MAP y la media "resisten" al MLE extremo.',
  },
  {
    title: '5. Entropía: cómo medir tu incertidumbre',
    theory: `La entropia H mide la incertidumbre de una distribucion. Entropia alta = mucha incertidumbre, entropia baja = confianza.

La KL divergence D_KL(posterior||prior) mide cuanta informacion ganaste al observar los datos. Es la "distancia" entre tu creencia anterior y la actual (no es simetrica).

En machine learning, la cross-entropy loss ES una divergencia KL + la entropia de la distribucion real. Minimizar cross-entropy = hacer que tu modelo se acerque a los datos.

A medida que observas mas datos, la entropia del posterior baja: te vuelves mas seguro. Pero nunca llega a 0 (certeza total) con una distribucion continua.`,
    action: 'Resetear y experimentar',
    observe:
      'Observa la entropia: empieza alta con el prior uniforme, baja con cada observacion. La KL divergence mide cuanto cambio tu creencia. Mas datos = mas informacion = menor entropia.',
  },
];

export function LessonGuide({ onSetPrior, onObserve, onBulkObserve, onReset }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleAction = () => {
    switch (currentStep) {
      case 0:
        onSetPrior(1, 1);
        break;
      case 1:
        onBulkObserve(5, 0);
        break;
      case 2:
        onBulkObserve(0, 3);
        break;
      case 3:
        onSetPrior(20, 20);
        break;
      case 4:
        onReset();
        break;
    }
  };

  return (
    <div className="h-full flex flex-col px-5 py-4">
      {/* Step indicator */}
      <div className="flex gap-1 mb-4">
        {LESSONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`h-1 flex-1 transition-colors ${
              i === currentStep ? 'bg-[#7c3aed]' : i < currentStep ? 'bg-[#c4b5fd]' : 'bg-j-border'
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

        <div className="border-l-2 border-[#7c3aed] pl-4 py-1">
          <p className="font-mono text-[10px] tracking-wider text-[#7c3aed] uppercase mb-1">Observa</p>
          <p className="text-xs text-j-text-secondary">{LESSONS[currentStep].observe}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleAction}
          className="w-full py-2 bg-[#7c3aed] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#6d28d9] transition-colors"
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
            onClick={onReset}
            className="py-2 px-4 border border-j-border font-mono text-[10px] tracking-wider text-j-text-tertiary hover:text-j-text transition-colors"
          >
            Reset
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
