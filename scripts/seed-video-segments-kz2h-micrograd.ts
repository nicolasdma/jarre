/**
 * Seed video segments for kz2h-micrograd (Karpathy: Micrograd — backprop from scratch).
 *
 * Maps 39 transcript parts (YouTube: VMj-3S1tku0, ~2h26m) to the 5 resegmented
 * pedagogical sections, positioned after bold headings in the content_markdown.
 *
 * Flow per heading: video segment → text explanation → quiz (if any).
 *
 * Usage: npx tsx scripts/seed-video-segments-kz2h-micrograd.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = 'kz2h-micrograd';
const YOUTUBE_VIDEO_ID = 'VMj-3S1tku0';

interface VideoSegmentDef {
  sectionTitle: string;
  positionAfterHeading: string;
  sortOrder: number;
  startSeconds: number;
  endSeconds: number;
  label: string;
}

// Rigorous mapping verified by cross-referencing transcript content_original with
// section content_markdown under each bold heading. Timestamps from the 39-part
// transcript in scripts/output/youtube-VMj-3S1tku0-sections.json.
//
// Methodology: for each bold heading, read what the text explains, then find which
// transcript part(s) cover the SAME topic. Where a heading is purely editorial
// (no video equivalent), we skip it — no forced mapping.
//
// Note: the resegmented sections reorganize content THEMATICALLY, not chronologically.
// So timestamps may jump around the video timeline.

const SEGMENTS: VideoSegmentDef[] = [
  // ────────────────────────────────────────────────
  // Section 0: Qué es ML — La Fábrica que Aprende Sola
  // Bold headings: El cambio de paradigma, Los ingredientes del ML,
  //   La fábrica con perillas, Micrograd y la clase Value, De micrograd a PyTorch
  //
  // NOTE: "El cambio de paradigma", "Los ingredientes del ML" and "La fábrica con
  // perillas" are editorial/synthetic — Karpathy never discusses "paradigm shift",
  // "3 ingredients of ML", or the "factory with knobs" analogy. Only "Micrograd y la
  // clase Value" and "De micrograd a PyTorch" map directly to video content.
  // ────────────────────────────────────────────────
  // SKIP: "El cambio de paradigma" — editorial, no video equivalent
  // SKIP: "Los ingredientes del ML" — editorial, no video equivalent
  // SKIP: "La fábrica con perillas" — editorial, no video equivalent
  {
    // Heading text: what is micrograd, autograd engine, backpropagation, Value object,
    // expression graph, forward pass, backward pass, ~100 lines of code.
    // Video: Parts 1-3 (0:00-10:09) cover this intro + "everything else is efficiency"
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Micrograd y la clase Value',
    sortOrder: 0,
    startSeconds: 0,
    endSeconds: 609,
    label: 'Intro: qué es micrograd, Value y expression graphs',
  },
  {
    // Heading text: comparison table micrograd vs PyTorch, scalars vs tensors,
    // "none of the math changes, purely for efficiency"
    // Video: Part 2 (3:23-6:44) explains scalar vs tensor + efficiency argument
    // + Parts 27-28 (1:39:44-1:46:41) show PyTorch API equivalence
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'De micrograd a PyTorch',
    sortOrder: 0,
    startSeconds: 5984,
    endSeconds: 6401,
    label: 'Demo PyTorch: mismos resultados que micrograd',
  },

  // ────────────────────────────────────────────────
  // Section 1: Value — Un Número con Memoria
  // Bold headings: Construyendo Value, El DAG, El gradiente
  // ────────────────────────────────────────────────
  {
    // Heading text: Step-by-step Value class: skeleton, __add__, __mul__,
    // _children/_prev, _op, label.
    // Video: Parts 6-8 (16:57-28:07) — implements Value, add, mul, _prev, _op, label
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Construyendo Value',
    sortOrder: 0,
    startSeconds: 1017,
    endSeconds: 1687,
    label: 'Clase Value: __add__, __mul__, _prev, _op, label',
  },
  {
    // Heading text: DAG explanation, graphviz visualization, draw_dot, adding depth
    // Video: Parts 8-9 (24:06-31:57) — drawdot, graphviz, expression graph, adds f and L
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'El DAG',
    sortOrder: 0,
    startSeconds: 1446,
    endSeconds: 1917,
    label: 'El DAG: visualización con Graphviz y draw_dot',
  },
  {
    // Heading text: self.grad = 0.0, derivative of L w.r.t. L is 1, why "gradient" not "derivative"
    // Video: Part 9 (28:05-31:57) — introduces self.grad, "zero means no effect", visualizes grad
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'El gradiente',
    sortOrder: 0,
    startSeconds: 1685,
    endSeconds: 1917,
    label: 'El atributo .grad y el caso base dL/dL = 1',
  },

  // ────────────────────────────────────────────────
  // Section 2: La Derivada Parcial — El Momento Eureka
  // Bold headings: PARA. QUE. ES. ESTO., La multiplicación como amplificador,
  //   La retropropagación manual, Verificación de gradientes
  // ────────────────────────────────────────────────
  {
    // Heading text: formal name "partial derivative", limit definition, numerical evaluation
    // Video: Parts 3-4 (6:42-12:56) — definition of derivative, f(x+h)-f(x)/h, slope at x=3 is 14
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'PARA. QUE. ES. ESTO.',
    sortOrder: 0,
    startSeconds: 402,
    endSeconds: 776,
    label: 'La derivada: definición, límite y evaluación numérica',
  },
  {
    // Heading text: d(a*b)/da = b, the multiplication "crosses" variables, sum passes gradient directly
    // Video: Parts 5-6 (12:54-20:54) — multi-variable expression d=a*b+c, derivatives of a,b,c
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La multiplicación como amplificador',
    sortOrder: 0,
    startSeconds: 774,
    endSeconds: 1254,
    label: 'Derivadas con múltiples variables: d=a*b+c',
  },
  {
    // Heading text: full graph L=d*f, backprop step by step, dL/dL=1, dL/dd=f, dL/df=d,
    // chain rule for dL/dc and dL/de, Wikipedia chain rule, car/bicycle/walker analogy
    // Video: Parts 10-14 (31:55-51:21) — manual backprop through entire expression graph
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La retropropagación manual',
    sortOrder: 0,
    startSeconds: 1915,
    endSeconds: 3081,
    label: 'Backprop manual paso a paso + chain rule',
  },
  {
    // Heading text: gradient check pattern, lol() function, bump variable by h, compare
    // Video: Part 10 (31:55-35:46) — first numerical verification with lol()
    // + Part 14 (47:03-51:21) — verification of a.grad=6 and b.grad=-4
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'Verificación de gradientes',
    sortOrder: 0,
    startSeconds: 2823,
    endSeconds: 3081,
    label: 'Verificación numérica: gradient checking',
  },

  // ────────────────────────────────────────────────
  // Section 3: Backpropagation y la Chain Rule
  // Bold headings: Forward y backward a mano, Gradientes de la suma `z = xw + b`:,
  //   Gradientes de la multiplicación `xw = x * w`:, El training step,
  //   Backprop con tanh, El patrón _backward, El método backward(), El bug del +=
  // ────────────────────────────────────────────────
  {
    // Heading text: minimal neuron x=2, w=-3, b=1, forward pass trivial
    // Video: Parts 15-16 (51:19-58:59) — introduces neuron with inputs/weights/bias, builds expression
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Forward y backward a mano',
    sortOrder: 0,
    startSeconds: 3079,
    endSeconds: 3539,
    label: 'Neurona: inputs, weights, bias y forward pass',
  },
  {
    // Heading text: in a sum, both gradients are 1, "distributor of gradients"
    // Video: Part 18 (1:03:07-1:07:22) — "a plus is just a distributor of gradient... 0.5 will flow to both"
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Gradientes de la suma `z = xw + b`:',
    sortOrder: 0,
    startSeconds: 3787,
    endSeconds: 4042,
    label: 'La suma distribuye el gradiente sin amplificar',
  },
  {
    // Heading text: local derivative of x is w, of w is x, chain rule application
    // Video: Parts 18-19 (1:03:07-1:11:45) — backprop through * node: x2.grad=w2*grad, w2.grad=x2*grad
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Gradientes de la multiplicación `xw = x * w`:',
    sortOrder: 0,
    startSeconds: 4040,
    endSeconds: 4305,
    label: 'La multiplicación cruza: grad_x = w, grad_w = x',
  },
  {
    // Heading text: w -= lr * grad, learning rate, why subtract (gradient points to increase)
    // Video: Parts 32-33 (1:57:59-2:06:55) — gradient descent step, "opposite direction", negative sign
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El training step',
    sortOrder: 0,
    startSeconds: 7079,
    endSeconds: 7615,
    label: 'Gradient descent: w -= lr * grad',
  },
  {
    // Heading text: tanh activation, math.exp implementation, derivative 1-tanh²(x),
    // full backprop through neuron with tanh
    // Video: Parts 16-19 (55:08-1:11:45) — implements tanh, derivative, full manual backprop
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backprop con tanh',
    sortOrder: 0,
    startSeconds: 3308,
    endSeconds: 4305,
    label: 'Implementando tanh y backprop completo de una neurona',
  },
  {
    // Heading text: _backward closures for +, *, tanh
    // Video: Parts 19-21 (1:07:20-1:21:13) — introduces _backward, implements for add/mul/tanh
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El patrón _backward',
    sortOrder: 0,
    startSeconds: 4040,
    endSeconds: 4873,
    label: 'Closures _backward: automatizando gradientes por operación',
  },
  {
    // Heading text: topological sort + self.grad=1 + reversed iteration
    // Video: Parts 21-22 (1:16:45-1:25:34) — build_topo, reversed, backward() method in Value
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El método backward()',
    sortOrder: 0,
    startSeconds: 4605,
    endSeconds: 5134,
    label: 'Orden topológico y backward() automático',
  },
  {
    // Heading text: a+a gives grad=1 instead of 2, multipath contributions, += vs =, zero_grad
    // Also covers: rmul, exp, pow, sub, neg, division, tanh decomposition
    // Video: Parts 22-26 (1:21:11-1:39:46) — bug discovery, fix with +=, new ops, tanh decomposed
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El bug del +=',
    sortOrder: 0,
    startSeconds: 4871,
    endSeconds: 5986,
    label: 'El bug de acumular gradientes + operaciones adicionales',
  },

  // ────────────────────────────────────────────────
  // Section 4: De una Neurona a un MLP
  // Bold headings: La clase Neuron, La clase MLP, El bucle de entrenamiento,
  //   Las capas ocultas, Micrograd vs PyTorch
  // ────────────────────────────────────────────────
  {
    // Heading text: Neuron class with __init__ (random weights, bias), __call__ (w·x+b+tanh), parameters()
    // Video: Parts 28-29 (1:42:51-1:50:28) — class Neuron, __init__, __call__, forward pass
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'La clase Neuron',
    sortOrder: 0,
    startSeconds: 6171,
    endSeconds: 6628,
    label: 'Clase Neuron: pesos, bias, forward y parameters()',
  },
  {
    // Heading text: Layer = list of Neurons, MLP chains Layers, 3→4→4→1 architecture
    // Video: Parts 29-30 (1:46:41-1:54:17) — class Layer, class MLP, n(x) produces huge graph
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'La clase MLP',
    sortOrder: 0,
    startSeconds: 6401,
    endSeconds: 6857,
    label: 'Layer y MLP: capas encadenadas secuencialmente',
  },
  {
    // Heading text: dataset, MSE loss, forward+backward+update, learning rate, zero_grad bug
    // Video: Parts 30-35 (1:50:25-2:15:06) — dataset, loss, backward, gradient descent, training loop, zero_grad bug
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'El bucle de entrenamiento',
    sortOrder: 0,
    startSeconds: 6625,
    endSeconds: 8106,
    label: 'Training loop completo: dataset → loss → backprop → update',
  },
  {
    // Heading text: hidden layers, emergent properties, connection to GPT
    // Video: Part 36 (2:15:04-2:18:31) — "massive blob", emergent properties, GPT same principles
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'Las capas ocultas',
    sortOrder: 0,
    startSeconds: 8104,
    endSeconds: 8311,
    label: 'Capas ocultas: propiedades emergentes y conexión con GPT',
  },
  {
    // Heading text: torch.autograd.Function, micrograd code walkthrough, tanh in PyTorch source
    // Video: Parts 36-38 (2:15:04-2:25:31) — engine.py/nn.py walkthrough, demo.ipynb, PyTorch source
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'Micrograd vs PyTorch',
    sortOrder: 0,
    startSeconds: 8309,
    endSeconds: 8731,
    label: 'Código de micrograd, búsqueda en PyTorch y cierre',
  },
];

async function main() {
  console.log('Fetching resource sections for', RESOURCE_ID);

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', RESOURCE_ID)
    .order('sort_order');

  if (sectionsError || !sections?.length) {
    console.error('Failed to fetch sections:', sectionsError);
    process.exit(1);
  }

  console.log(`Found ${sections.length} sections`);

  // Build section title → id map
  const sectionMap = new Map<string, string>();
  for (const s of sections) {
    sectionMap.set(s.section_title, s.id);
  }

  // Delete existing video segments for this resource's sections
  const sectionIds = sections.map((s) => s.id);
  const { error: deleteError } = await supabase
    .from('video_segments')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Failed to delete existing segments:', deleteError);
    process.exit(1);
  }

  console.log('Cleared existing video segments');

  // Insert new segments
  const rows = SEGMENTS.map((seg) => {
    const sectionId = sectionMap.get(seg.sectionTitle);
    if (!sectionId) {
      throw new Error(`Section not found: "${seg.sectionTitle}"`);
    }
    return {
      section_id: sectionId,
      position_after_heading: seg.positionAfterHeading,
      sort_order: seg.sortOrder,
      youtube_video_id: YOUTUBE_VIDEO_ID,
      start_seconds: seg.startSeconds,
      end_seconds: seg.endSeconds,
      label: seg.label,
    };
  });

  const { error: insertError } = await supabase
    .from('video_segments')
    .insert(rows);

  if (insertError) {
    console.error('Failed to insert video segments:', insertError);
    process.exit(1);
  }

  console.log(`Inserted ${rows.length} video segments across ${sections.length} sections`);
  process.exit(0);
}

main();
