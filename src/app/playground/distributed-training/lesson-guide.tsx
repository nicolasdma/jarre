'use client';

import {
  LessonGuideShell,
  type LessonStep,
  type LessonGuideColors,
} from '@/components/playground/lesson-guide-shell';

interface DistributedStep extends LessonStep {
  action: string;
}

const STEPS: DistributedStep[] = [
  {
    title: '1. Data Parallelism',
    theory: `En Data Parallelism, cada GPU tiene una copia completa del modelo y procesa un fragmento diferente del batch de datos. Despues de calcular gradientes localmente, todas las GPUs sincronizan sus gradientes usando AllReduce.

La limitacion clave: cada GPU necesita memoria suficiente para almacenar el modelo completo. Para GPT-3 (175B params en FP32), eso seria 700 GB — imposible para una sola GPU.

Ring AllReduce distribuye la comunicacion uniformemente: cada GPU envia un fragmento al vecino en un anillo. Despues de 2(N-1) pasos, todas tienen el resultado completo.`,
    action: 'Selecciona Data Parallelism',
    observe:
      'Observa como cada GPU procesa datos diferentes pero necesita sincronizar gradientes. El tiempo de comunicacion crece con el tamaño del modelo.',
  },
  {
    title: '2. Pipeline Parallelism',
    theory: `Pipeline Parallelism divide el modelo en stages (grupos de capas) y asigna cada stage a una GPU diferente. Los microbatches fluyen por el pipeline como en una linea de ensamblaje.

La formula clave: bubble_fraction = (d-1)/(m+d-1), donde d = stages y m = microbatches. Con m=16 y d=4, el overhead es solo ~16%.

GPipe sincroniza al final del batch completo. PipeDream usa 1F1B (one forward, one backward) para mejor utilizacion, pero necesita weight stashing para consistencia.`,
    action: 'Selecciona Pipeline Parallelism',
    observe:
      'Nota las "burbujas" (tiempo muerto) al inicio y final del pipeline. Aumenta el numero de microbatches para reducirlas.',
  },
  {
    title: '3. Tensor Parallelism',
    theory: `Tensor Parallelism divide las operaciones dentro de una capa entre GPUs. Megatron-LM divide las matrices de peso del MLP y del attention block.

Para el MLP: la primera matriz se divide por columnas (GeLU se aplica localmente), la segunda por filas (resultados se suman con AllReduce). Solo 2 AllReduce por capa.

Para attention: se distribuyen los heads entre GPUs — cada GPU computa un subconjunto de heads. Requiere NVLink (300-900 GB/s) por la latencia critica de los AllReduce intra-capa.`,
    action: 'Selecciona Tensor Parallelism',
    observe:
      'Observa como cada GPU computa una porcion de la misma capa. La comunicacion ocurre DENTRO de cada capa, por eso necesita NVLink.',
  },
  {
    title: '4. ZeRO Optimizer',
    theory: `ZeRO elimina la redundancia en Data Parallelism. En DP estandar, CADA GPU almacena una copia identica de: pesos (4B), gradientes (4B), y optimizer states de Adam (8B) = 16 bytes por parametro.

Stage 1: Particiona optimizer states → cada GPU almacena solo 1/N de los states.
Stage 2: + Particiona gradientes → ahorra 2 bytes/param adicionales.
Stage 3: + Particiona parametros → cada GPU almacena solo 16/N bytes por parametro.

Con 64 GPUs y Stage 3: 0.25 bytes/param por GPU. Un modelo de 175B cabe en GPUs de 32 GB.`,
    action: 'Activa ZeRO stages',
    observe:
      'Ve como la memoria por GPU disminuye drasticamente con cada stage de ZeRO. El costo es mas comunicacion (AllGather para reunir parametros).',
  },
  {
    title: '5. Combinando todo (PTD-P)',
    theory: `En la practica, los sistemas grandes combinan multiples formas de paralelismo:

- TP dentro del nodo (8 GPUs con NVLink)
- PP entre nodos (comunicacion moderada via InfiniBand)
- DP entre replicas del pipeline (AllReduce de gradientes)

Para 1T params en 3,072 GPUs: TP=8 x PP=64 x DP=6

La regla de oro: TP primero (necesita maxima bandwidth), PP segundo (bandwidth moderada), DP tercero (tolera latencia alta).`,
    action: 'Configura paralelismo 3D',
    observe:
      'Experimenta con diferentes configuraciones de TP, PP, y DP. Nota como la memoria por GPU y el overhead de comunicacion cambian.',
  },
];

const COLORS: LessonGuideColors = {
  accent: '#991b1b',
  visited: '#fecaca',
  calloutBg: '#fef2f2',
};

export function LessonGuide() {
  return (
    <LessonGuideShell
      steps={STEPS}
      colors={COLORS}
      renderAction={() => null}
    />
  );
}
