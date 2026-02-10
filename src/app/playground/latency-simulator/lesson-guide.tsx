'use client';

import { useState } from 'react';
import type { SimulationConfig } from './latency-playground';

interface LessonStep {
  title: string;
  theory: string;
  preset: string;
  observe: string;
}

interface LessonGuideProps {
  onApplyPreset: (preset: string) => void;
  currentConfig: SimulationConfig;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. Latencia vs Throughput',
    theory: `Latencia = cuanto TARDA un request. Throughput = cuantos requests PROCESAS por segundo. Son independientes: puedes tener baja latencia y bajo throughput (un request rapido pero uno a la vez), o alta latencia y alto throughput (muchos requests lentos en paralelo).

En sistemas reales, te importan las dos. Un sistema con latencia de 1ms pero throughput de 10 req/s solo sirve para 10 usuarios. Un sistema con latencia de 500ms y throughput de 10000 req/s sirve para muchos usuarios, pero cada uno espera medio segundo.`,
    preset: 'baseline',
    observe: 'El histograma muestra la distribucion de latencias. La mayoria estan cerca de 50ms. El throughput se mantiene estable en ~10 req/s. Mira como la curva tiene forma de campana (distribucion normal).',
  },
  {
    title: '2. Distribuciones: Normal vs Real',
    theory: `La distribucion normal (campana) es un modelo ideal. En la realidad, las latencias siguen una distribucion log-normal: la cola derecha es mucho mas larga. Esto significa que los requests lentos son MUCHO mas lentos que el promedio.

La diferencia importa cuando defines SLOs. Con distribucion normal, p99 esta relativamente cerca de la media. Con log-normal, p99 puede ser 3-5x la media. Los sistemas reales tienen GC pauses, contention de I/O, cache misses — todos crean colas largas.`,
    preset: 'lognormal',
    observe: 'Compara el histograma: la distribucion log-normal tiene una cola larga hacia la derecha. Algunos requests tardan 3-5x mas que la media. Mira como p99 se aleja mucho mas del promedio comparado con la distribucion normal.',
  },
  {
    title: '3. Percentiles: por que el promedio miente',
    theory: `Si 99 requests tardan 10ms y 1 tarda 1000ms, el promedio es 20ms — parece rapido. Pero 1 de cada 100 usuarios espera 1 segundo. Por eso usamos percentiles: p50 (mediana), p95 (el 5% mas lento), p99 (el 1% mas lento), p999 (el 0.1% mas lento).

Amazon descubrio que un aumento de 100ms en p99.9 reduce ventas 1%. Los usuarios que experimentan las peores latencias suelen ser los que tienen MAS datos — tus mejores clientes.`,
    preset: 'bimodal-5',
    observe: 'Mira la diferencia entre p50 y p99 en el panel derecho. El promedio no refleja la experiencia del usuario mas lento. La distribucion bimodal simula un sistema donde el 5% de los requests son dramaticamente mas lentos.',
  },
  {
    title: '4. SLOs: definir lo aceptable',
    theory: `Un SLO (Service Level Objective) es una promesa: "p95 < 200ms". No dice "siempre rapido" — dice "el 95% de los requests tardan menos de 200ms". La linea roja en el chart es tu SLO.

Cuando p95 cruza esa linea, estas violando tu SLO. Los SLOs se miden sobre ventanas de tiempo (dias, semanas). Un SLO demasiado estricto te obliga a sobre-invertir en infraestructura. Uno demasiado laxo no protege al usuario.`,
    preset: 'slo-lognormal',
    observe: 'La linea SLO aparece en el histograma y el timeline. Con SLO en 100ms y distribucion log-normal, es probable que estes violando el SLO. Ajusta la latencia base y mira cuando empiezas a cumplir.',
  },
  {
    title: '5. Tail Latency Amplification',
    theory: `Imagina que tu pagina web hace 3 requests en paralelo a 3 servicios. El usuario espera al MAS LENTO. Si cada servicio tiene p99 = 500ms, la probabilidad de que AL MENOS UNO sea lento es 1-(0.99^3) = 3%.

Con 5 servicios, sube al 5%. Con 10, al 10%. Tu p99 efectivo es mucho peor que el p99 individual. Esto es "tail latency amplification" — el concepto mas importante del capitulo 1 de DDIA.`,
    preset: 'fanout',
    observe: 'Activa fan-out y mira como suben los percentiles. p99 sube dramaticamente porque siempre esperas al mas lento de los 3 servicios. Compara con el baseline sin fan-out.',
  },
  {
    title: '6. Carga: requests por segundo',
    theory: `Un sistema puede manejar N requests por segundo. Mas alla de eso, los requests empiezan a hacer cola y la latencia sube exponencialmente. Esto se llama "saturation point".

En este simulador, la latencia no depende de la carga (es una simplificacion), pero en sistemas reales, la cola crece con la carga. La ley de Little dice: L = lambda * W (requests en cola = tasa de llegada * tiempo de espera). Mas carga = mas cola = mas latencia.`,
    preset: 'highload',
    observe: 'Mas requests = mas datos en el histograma. El throughput sube a ~50 req/s. En un sistema real, la latencia subiria no-linealmente al acercarte al limite de capacidad.',
  },
  {
    title: '7. GC Pauses y spikes',
    theory: `Los lenguajes con garbage collection (Java, Go, C#) tienen pausas periodicas donde el sistema se congela. Esto crea una distribucion bimodal: la mayoria de requests son rapidos, pero cada cierto tiempo hay un spike de latencia (10-100ms o mas).

Esto afecta los percentiles altos dramaticamente. Un GC pause de 200ms cada 10 segundos puede parecer irrelevante, pero si tu throughput es 1000 req/s, son 200 requests afectados por cada pause.`,
    preset: 'gc-pauses',
    observe: 'El histograma muestra dos "montanas" (bimodal). Los spikes periodicos disparan p99 y p999. El 10% de requests tardan ~10x mas que la mayoria.',
  },
  {
    title: '8. Escalabilidad vertical vs horizontal',
    theory: `Vertical = maquina mas grande (mas CPU, mas RAM). Tiene un techo fisico. Horizontal = mas maquinas. No tiene techo pero introduce complejidad (coordinacion, balanceo de carga).

En este simulador, puedes pensar en "request rate" como la carga y en "base latency" como la capacidad de la maquina. Una maquina mas rapida baja la latencia base. Mas maquinas aumentan el throughput maximo. El trade-off: vertical es simple pero limitado, horizontal es ilimitado pero complejo.`,
    preset: 'rate-100',
    observe: 'Con rate alto, generas muchos datos rapido. El throughput sube a 100 req/s. En un sistema real, necesitarias escalar horizontalmente para mantener latencia baja a esta carga.',
  },
  {
    title: '9. Cascading slowness',
    theory: `Fan-out + un downstream lento = cascada. Si uno de tus servicios empieza a responder lento, TODOS tus requests se vuelven lentos (porque esperas al mas lento). Y si otros servicios dependen de ti, ELLOS tambien se vuelven lentos.

Una sola degradacion se propaga por todo el sistema. Por eso los circuit breakers son criticos: cortar la conexion con un servicio lento para evitar que la lentitud se propague.`,
    preset: 'cascade',
    observe: 'Combina fan-out (4 servicios) con distribucion log-normal. Los percentiles altos se disparan. Imagina que esto le pasa a un servicio del que otros 10 dependen — la cascada afecta a todo el sistema.',
  },
  {
    title: '10. Error budgets',
    theory: `Si tu SLO es p95 < 200ms, tienes un "error budget" del 5%: puedes tener 5 de cada 100 requests lentos. Cuando tu error budget se agota (demasiados requests lentos), debes dejar de hacer deployments hasta recuperar.

Google usa este modelo: el SRE team tiene autoridad para bloquear releases si el error budget se agoto. Esto alinea incentivos: los developers quieren features rapido, pero si rompen el SLO, se quedan sin budget para deployar.`,
    preset: 'error-budget',
    observe: 'Mira el contador de violaciones SLO en el panel derecho. Con SLO en 100ms y distribucion bimodal, el error budget se consume rapidamente. El porcentaje muestra cuanto budget has gastado.',
  },
];

export function LessonGuide({ onApplyPreset, currentConfig }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = LESSONS[currentStep];

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
        {/* Step title */}
        <h2 className="font-mono text-sm text-j-text font-medium mb-4">
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

        {/* Apply preset button */}
        <div className="mb-5">
          <button
            onClick={() => onApplyPreset(step.preset)}
            className="w-full text-left group"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-[#d97706] hover:bg-[#b45309] transition-colors">
              <span className="text-white font-mono text-[11px] font-medium">
                Aplicar preset
              </span>
              <span className="ml-auto text-white/60 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                click
              </span>
            </div>
            <p className="text-[11px] text-[#999] mt-1 pl-1">
              {describePreset(step.preset, currentConfig)}
            </p>
          </button>
        </div>

        {/* What to observe */}
        <div className="bg-[#fef3c7]/40 px-4 py-3 border-l-2 border-[#d97706]">
          <p className="font-mono text-[10px] text-[#92400e] uppercase tracking-wider mb-1">
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
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                  ? 'bg-[#d97706]'
                  : i < currentStep
                    ? 'bg-[#92400e]'
                    : 'bg-[#ddd]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentStep(s => Math.min(LESSONS.length - 1, s + 1))}
          disabled={currentStep === LESSONS.length - 1}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function describePreset(presetName: string, config: SimulationConfig): string {
  const descriptions: Record<string, string> = {
    baseline: 'Normal, 10 req/s, 50ms base, sin fan-out',
    lognormal: 'Log-normal, 10 req/s, 50ms base — cola larga',
    bimodal: 'Bimodal 10% lento x10, 10 req/s',
    fanout: 'Normal + 3 downstream services (tail amplification)',
    highload: 'Normal, 50 req/s — carga alta',
    cascade: 'Log-normal + 4 downstream — cascada',
    'slo-lognormal': 'Log-normal, SLO estricto: 100ms',
    'bimodal-5': 'Bimodal 5% lento x10 — percentiles vs promedio',
    'gc-pauses': 'Bimodal 10% lento x10 — simula GC pauses',
    'rate-100': 'Normal, 100 req/s — maxima carga',
    'error-budget': 'Bimodal 5% lento, SLO 100ms — error budget',
  };

  return descriptions[presetName] ?? presetName;
}
