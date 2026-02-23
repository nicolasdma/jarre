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

// Timestamps based on official YouTube chapters from the video description:
//
// 00:00:00 intro
// 00:00:25 micrograd overview
// 00:08:08 derivative of a simple function with one input
// 00:14:12 derivative of a function with multiple inputs
// 00:19:09 starting the core Value object and its visualization
// 00:32:10 manual backpropagation example #1: simple expression
// 00:51:10 preview of a single optimization step
// 00:52:52 manual backpropagation example #2: a neuron
// 01:09:02 implementing the backward function for each operation
// 01:17:32 implementing the backward function for a whole expression graph
// 01:22:28 fixing a backprop bug when one node is used multiple times
// 01:27:05 breaking up a tanh, exercising with more operations
// 01:39:31 doing the same thing but in PyTorch: comparison
// 01:43:55 building out a neural net library (MLP) in micrograd
// 01:51:04 creating a tiny dataset, writing the loss function
// 01:57:56 collecting all of the parameters of the neural net
// 02:01:12 doing gradient descent optimization manually, training the network
// 02:14:03 summary of what we learned, how to go towards modern neural nets
// 02:16:46 walkthrough of the full code of micrograd on github
// 02:21:10 real stuff: diving into PyTorch, finding backward pass for tanh
// 02:24:39 conclusion
// 02:25:20 outtakes
//
// Note: the resegmented sections reorganize content THEMATICALLY, not chronologically.
// Editorial headings (no video equivalent) are skipped.

const SEGMENTS: VideoSegmentDef[] = [
  // ────────────────────────────────────────────────
  // Section 0: Qué es ML — La Fábrica que Aprende Sola
  // SKIP: "El cambio de paradigma" — editorial, no video equivalent
  // SKIP: "Los ingredientes del ML" — editorial, no video equivalent
  // SKIP: "La fábrica con perillas" — editorial, no video equivalent
  // ────────────────────────────────────────────────
  {
    // Chapters: "intro" + "micrograd overview" (00:00:00 → 00:08:08)
    // Covers: what is micrograd, autograd, backpropagation, Value object, expression graph,
    // "everything else is just efficiency", engine.py + nn.py = ~150 lines
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Micrograd y la clase Value',
    sortOrder: 0,
    startSeconds: 0,       // 00:00:00 intro
    endSeconds: 488,       // 00:08:08 next chapter starts
    label: 'Intro: qué es micrograd, Value y expression graphs',
  },
  {
    // Chapter: "doing the same thing but in PyTorch: comparison" (01:39:31 → 01:43:55)
    // Covers: PyTorch API comparison, torch.Tensor, requires_grad, identical results
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'De micrograd a PyTorch',
    sortOrder: 0,
    startSeconds: 5971,    // 01:39:31
    endSeconds: 6235,      // 01:43:55 next chapter starts
    label: 'Demo PyTorch: mismos resultados que micrograd',
  },

  // ────────────────────────────────────────────────
  // Section 1: Value — Un Número con Memoria
  // ────────────────────────────────────────────────
  {
    // Chapter: "starting the core Value object and its visualization" (00:19:09 → 00:32:10)
    // Covers: Value class step-by-step, __add__, __mul__, _prev, _op, label, graphviz
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Construyendo Value',
    sortOrder: 0,
    startSeconds: 1149,    // 00:19:09
    endSeconds: 1930,      // 00:32:10 next chapter starts
    label: 'Clase Value: __add__, __mul__, _prev, _op, visualización',
  },
  {
    // Same chapter tail — graphviz visualization and DAG structure covered within
    // "starting the core Value object" chapter (from ~24:00 when drawdot is introduced)
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'El DAG',
    sortOrder: 0,
    startSeconds: 1440,    // ~24:00 drawdot introduced (within chapter)
    endSeconds: 1930,      // 00:32:10 next chapter starts
    label: 'El DAG: visualización con Graphviz y draw_dot',
  },
  {
    // Chapter: "manual backpropagation example #1" start (00:32:10)
    // The grad attribute (self.grad = 0.0) and dL/dL = 1 are set up at the START of this chapter
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'El gradiente',
    sortOrder: 0,
    startSeconds: 1930,    // 00:32:10
    endSeconds: 2100,      // ~35:00 after grad is introduced and dL/dL=1 established
    label: 'El atributo .grad y el caso base dL/dL = 1',
  },

  // ────────────────────────────────────────────────
  // Section 2: La Derivada Parcial — El Momento Eureka
  // ────────────────────────────────────────────────
  {
    // Chapter: "derivative of a simple function with one input" (00:08:08 → 00:14:12)
    // Covers: definition of derivative, limit, f(x+h)-f(x)/h, slope at x=3
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'PARA. QUE. ES. ESTO.',
    sortOrder: 0,
    startSeconds: 488,     // 00:08:08
    endSeconds: 852,       // 00:14:12 next chapter starts
    label: 'La derivada: definición, límite y evaluación numérica',
  },
  {
    // Chapter: "derivative of a function with multiple inputs" (00:14:12 → 00:19:09)
    // Covers: d=a*b+c, derivative of a is b, b is a, c is 1
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La multiplicación como amplificador',
    sortOrder: 0,
    startSeconds: 852,     // 00:14:12
    endSeconds: 1149,      // 00:19:09 next chapter starts
    label: 'Derivadas con múltiples variables: d=a*b+c',
  },
  {
    // Chapter: "manual backpropagation example #1: simple expression" (00:32:10 → 00:51:10)
    // Covers: full manual backprop through L=d*f, chain rule, Wikipedia, verification
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La retropropagación manual',
    sortOrder: 0,
    startSeconds: 1930,    // 00:32:10
    endSeconds: 3070,      // 00:51:10 next chapter starts
    label: 'Backprop manual paso a paso + chain rule',
  },
  {
    // Within chapter "manual backprop example #1" — numerical verification with lol()
    // Karpathy verifies gradients numerically throughout this section
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'Verificación de gradientes',
    sortOrder: 0,
    startSeconds: 2820,    // ~47:00 final verification of a.grad=6 and b.grad=-4
    endSeconds: 3070,      // 00:51:10 next chapter
    label: 'Verificación numérica: gradient checking',
  },

  // ────────────────────────────────────────────────
  // Section 3: Backpropagation y la Chain Rule
  // ────────────────────────────────────────────────
  {
    // Chapters: "preview of optimization step" + "manual backprop #2: a neuron" (00:51:10 → 01:09:02)
    // Covers: neuron with inputs/weights/bias, tanh, forward pass, manual backprop of neuron
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Forward y backward a mano',
    sortOrder: 0,
    startSeconds: 3070,    // 00:51:10 preview of optimization step
    endSeconds: 4142,      // 01:09:02 next chapter starts
    label: 'Neurona con tanh: forward pass y backprop manual',
  },
  {
    // Within "manual backprop #2" — sum gradients are 1, "distributor of gradients"
    // Karpathy explains this around 1:03-1:07 in the video
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Gradientes de la suma `z = xw + b`:',
    sortOrder: 0,
    startSeconds: 3780,    // ~01:03:00 "a plus is just a distributor of gradient"
    endSeconds: 4020,      // ~01:07:00
    label: 'La suma distribuye el gradiente sin amplificar',
  },
  {
    // Within "manual backprop #2" — multiplication gradients cross variables
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Gradientes de la multiplicación `xw = x * w`:',
    sortOrder: 0,
    startSeconds: 4020,    // ~01:07:00 backprop through * nodes
    endSeconds: 4142,      // 01:09:02 next chapter
    label: 'La multiplicación cruza: grad_x = w, grad_w = x',
  },
  {
    // Chapters: "doing gradient descent" + part of "collecting parameters" (01:57:56 → 02:14:03)
    // Covers: w -= lr * grad, learning rate, why subtract, training loop
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El training step',
    sortOrder: 0,
    startSeconds: 7076,    // 01:57:56 collecting parameters
    endSeconds: 8043,      // 02:14:03 summary
    label: 'Gradient descent: parámetros, actualización y training loop',
  },
  {
    // Chapter: "manual backpropagation example #2: a neuron" (00:52:52 → 01:09:02)
    // Covers: tanh implementation, derivative 1-tanh²(x), complete neuron backprop
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backprop con tanh',
    sortOrder: 0,
    startSeconds: 3172,    // 00:52:52
    endSeconds: 4142,      // 01:09:02 next chapter starts
    label: 'Implementando tanh y backprop completo de una neurona',
  },
  {
    // Chapter: "implementing backward function for each operation" (01:09:02 → 01:17:32)
    // Covers: _backward closures for +, *, tanh
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El patrón _backward',
    sortOrder: 0,
    startSeconds: 4142,    // 01:09:02
    endSeconds: 4652,      // 01:17:32 next chapter starts
    label: 'Closures _backward: automatizando gradientes por operación',
  },
  {
    // Chapter: "implementing backward for a whole expression graph" (01:17:32 → 01:22:28)
    // Covers: topological sort, self.grad=1, reversed iteration, backward() method
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El método backward()',
    sortOrder: 0,
    startSeconds: 4652,    // 01:17:32
    endSeconds: 4948,      // 01:22:28 next chapter starts
    label: 'Orden topológico y backward() automático',
  },
  {
    // Chapters: "fixing backprop bug" + "breaking up tanh" (01:22:28 → 01:39:31)
    // Covers: += vs = bug, multipath gradients, exp, pow, rmul, sub, neg, division, tanh decomposed
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El bug del +=',
    sortOrder: 0,
    startSeconds: 4948,    // 01:22:28
    endSeconds: 5971,      // 01:39:31 next chapter starts
    label: 'El bug de acumular gradientes + operaciones adicionales',
  },

  // ────────────────────────────────────────────────
  // Section 4: De una Neurona a un MLP
  // ────────────────────────────────────────────────
  {
    // Chapter: "building out a neural net library (MLP)" (01:43:55 → 01:51:04)
    // Covers: Neuron class, Layer, MLP, 3→4→4→1 architecture
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'La clase Neuron',
    sortOrder: 0,
    startSeconds: 6235,    // 01:43:55
    endSeconds: 6664,      // 01:51:04 next chapter starts
    label: 'Clase Neuron, Layer y MLP',
  },
  {
    // Same chapter — Layer and MLP are built right after Neuron within this chapter
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'La clase MLP',
    sortOrder: 0,
    startSeconds: 6420,    // ~01:47:00 Layer/MLP portion of the chapter
    endSeconds: 6664,      // 01:51:04 next chapter starts
    label: 'Layer y MLP: capas encadenadas secuencialmente',
  },
  {
    // Chapters: "creating dataset/loss" + "collecting parameters" + "gradient descent" (01:51:04 → 02:14:03)
    // Covers: dataset, MSE loss, forward+backward+update, learning rate, zero_grad bug
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'El bucle de entrenamiento',
    sortOrder: 0,
    startSeconds: 6664,    // 01:51:04
    endSeconds: 8043,      // 02:14:03 next chapter starts
    label: 'Training loop: dataset → loss → backprop → update',
  },
  {
    // Chapter: "summary of what we learned" (02:14:03 → 02:16:46)
    // Covers: hidden layers, emergent properties, connection to GPT, modern neural nets
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'Las capas ocultas',
    sortOrder: 0,
    startSeconds: 8043,    // 02:14:03
    endSeconds: 8206,      // 02:16:46 next chapter starts
    label: 'Resumen: capas ocultas, emergencia y conexión con GPT',
  },
  {
    // Chapters: "walkthrough of micrograd" + "diving into PyTorch" + "conclusion" (02:16:46 → 02:24:39)
    // Covers: engine.py/nn.py walkthrough, tanh in PyTorch source, torch.autograd.Function
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'Micrograd vs PyTorch',
    sortOrder: 0,
    startSeconds: 8206,    // 02:16:46
    endSeconds: 8679,      // 02:24:39 conclusion
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
