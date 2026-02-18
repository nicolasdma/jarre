'use client';

import { useState } from 'react';

interface LessonGuideProps {
  onSetPrior: (mu0: number, tau2: number) => void;
  onGenerate: (n: number) => void;
  onReset: () => void;
  onSetTrueMu: (mu: number) => void;
}

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  observe: string;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. Prior: tu creencia inicial sobre mu',
    theory: `El prior representa lo que crees sobre el parametro mu ANTES de ver datos. Usamos un prior Gaussiano: mu ~ N(mu_0, tau^2).

mu_0 es tu "mejor guess" inicial. tau^2 controla que tan seguro estas de ese guess. tau^2 grande = mucha incertidumbre, la curva es ancha. tau^2 pequeno = mucha confianza, la curva es estrecha.

En machine learning, elegir un prior Gaussiano centrado en 0 equivale a L2 regularization (Ridge). La fuerza de regularizacion es lambda = 1/(2*tau^2): un prior mas estrecho (tau^2 pequeno) penaliza mas los pesos grandes.`,
    action: 'Configurar prior N(0, 1)',
    observe:
      'Con N(0, 1) la curva esta centrada en 0 con spread moderado. Tu creencia inicial dice: "mu probablemente esta cerca de 0, pero podria estar entre -3 y 3".',
  },
  {
    title: '2. Datos: observaciones de la distribucion',
    theory: `Cada muestra x_i viene de N(mu_real, 1) donde mu_real es el valor verdadero que queremos estimar. Nosotros conocemos sigma^2=1 pero no mu_real.

Cada nueva observacion contiene informacion sobre mu_real. Con mas muestras, la media muestral x_bar converge al valor real (Ley de Grandes Numeros).

El MLE es simplemente x_bar: el valor que maximiza la probabilidad de haber observado estos datos, sin considerar ningun prior.`,
    action: 'Generar 5 muestras',
    observe:
      'Observa como el posterior (linea solida) se desplaza hacia los datos. Con solo 5 muestras, el prior todavia tiene influencia: el MAP no coincide exactamente con el MLE.',
  },
  {
    title: '3. Posterior = Prior x Likelihood',
    theory: `La magia de la conjugacion Gaussiana: si el prior es N(mu_0, tau^2) y los datos son N(mu, sigma^2), el posterior es tambien Gaussiano:

sigma^2_post = 1 / (1/tau^2 + n/sigma^2)
mu_post = sigma^2_post * (mu_0/tau^2 + n*x_bar/sigma^2)

El posterior es una media ponderada por las precisiones (inverso de varianzas). La precision del prior (1/tau^2) compite con la precision de los datos (n/sigma^2).

Con mas datos, n/sigma^2 domina y el posterior converge al MLE. El prior se vuelve irrelevante.`,
    action: 'Generar 5 muestras mas',
    observe:
      'Con 10 muestras totales, la curva posterior es mas estrecha (mayor precision) y esta mas cerca de x_bar. La precision posterior = precision_prior + n * precision_datos.',
  },
  {
    title: '4. MLE vs MAP: el efecto del prior',
    theory: `Con pocos datos, MLE y MAP difieren significativamente:
- MLE = x_bar, solo depende de los datos.
- MAP = mu_post, es un compromiso entre prior y datos.

Con un prior fuerte (tau^2 = 0.1), el MAP se "resiste" a moverse lejos del prior. Necesitas muchos datos para convencerlo.

Esto es EXACTAMENTE lo que hace la regularizacion L2 en machine learning: penaliza parametros que se alejan mucho de 0, evitando overfitting cuando tienes pocos datos.

El tradeoff bias-variance: prior fuerte = mas bias, menos variance. Prior debil = menos bias, mas variance.`,
    action: 'Prior fuerte N(0, 0.1)',
    observe:
      'Con tau^2 = 0.1 (lambda = 5), el prior es muy estrecho. Genera muestras y observa como el MAP se resiste a moverse, mientras el MLE salta libremente. Esto es regularizacion en accion.',
  },
  {
    title: '5. Regularizacion = Prior',
    theory: `La conexion profunda entre inferencia bayesiana y regularizacion:

- L2 regularization (Ridge) = Prior Gaussiano N(0, tau^2), lambda = 1/(2*tau^2)
- L1 regularization (Lasso) = Prior Laplaciano
- Dropout = Aproximacion a un modelo bayesiano
- Weight decay = Gaussian prior sobre los pesos

MAP estimation con prior Gaussiano minimiza:
  Loss(theta) = -log P(datos|theta) + lambda * ||theta||^2

El primer termino es la likelihood (fit a los datos). El segundo es el prior (penalizacion). Lambda controla el balance.

Cuando entrenas una red neuronal con weight decay, ESTAS haciendo inferencia bayesiana con un prior Gaussiano, aunque no lo sepas.`,
    action: 'Resetear y experimentar',
    observe:
      'Experimenta con diferentes combinaciones de prior y datos. Observa como con tau^2 grande (lambda pequeno), MLE y MAP convergen rapido. Con tau^2 pequeno (lambda grande), el MAP se resiste. Este es el mismo tradeoff que ajustas en cualquier modelo de ML.',
  },
];

export function LessonGuide({ onSetPrior, onGenerate, onReset, onSetTrueMu }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleAction = () => {
    switch (currentStep) {
      case 0:
        onSetTrueMu(3.0);
        onSetPrior(0, 1);
        break;
      case 1:
        onGenerate(5);
        break;
      case 2:
        onGenerate(5);
        break;
      case 3:
        onSetPrior(0, 0.1);
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
        {LESSONS.map((lesson, i) => (
          <button
            key={lesson.title}
            onClick={() => setCurrentStep(i)}
            className={`h-1 flex-1 transition-colors ${
              i === currentStep ? 'bg-[#059669]' : i < currentStep ? 'bg-[#6ee7b7]' : 'bg-j-border'
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

        <div className="border-l-2 border-[#059669] pl-4 py-1">
          <p className="font-mono text-[10px] tracking-wider text-[#059669] uppercase mb-1">Observa</p>
          <p className="text-xs text-j-text-secondary">{LESSONS[currentStep].observe}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleAction}
          className="w-full py-2 bg-[#059669] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#047857] transition-colors"
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
