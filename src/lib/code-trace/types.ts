/**
 * The data behind a step-by-step trace of a coding solution ("Ver paso a paso").
 *
 * A trace is a list of steps. Each step points at one line of the solution,
 * says one thing in plain Spanish, and carries a snapshot of the state drawn
 * as a few visual primitives (an array with named pointers, a hash map, a
 * stack, a grid, a tree…). Steps are produced by a small per-problem trace
 * generator (src/lib/code-trace/problems/*), never by running the learner's
 * code, and src/lib/code-trace/__tests__ checks that every generator ends in
 * the same result as the real solution and walks the lines in an order the
 * real solution actually executes them.
 *
 * Everything here is plain JSON-able data so a step is cheap to keep and to
 * render, and a snapshot is a full picture (no diffs to replay).
 */

export type Cell = number | string | boolean | null;

/**
 * How an element is emphasised. One meaning per tone, used the same way by
 * every primitive:
 * - focus: what this step is looking at
 * - found: the answer, or a check that succeeded
 * - add: just written (a new map entry, a push); flashes once
 * - drop: just removed or rejected
 * - visited: already processed, kept for context
 * - muted: out of play (outside the window, already popped)
 */
export type Tone = 'focus' | 'found' | 'add' | 'drop' | 'visited' | 'muted';

export interface Pointer {
  name: string;
  index: number;
}

export interface Mark {
  index: number;
  tone: Tone;
}

/** A row of boxes with indices and named pointers (i, j, left, right…). */
export interface ArrayViz {
  kind: 'array';
  label: string;
  items: Cell[];
  pointers?: Pointer[];
  /** A highlighted contiguous range, inclusive on both ends (sliding window, binary search range). */
  window?: { from: number; to: number; label?: string };
  marks?: Mark[];
  /** Show the indices under the boxes (default true). */
  indices?: boolean;
}

/** A hash map (or a counting map) as a two-column table. */
export interface MapViz {
  kind: 'map';
  label: string;
  keyLabel?: string;
  valueLabel?: string;
  entries: { key: Cell; value: Cell | Cell[] }[];
  /** The entry just written. */
  flash?: Cell;
  /** The entry a lookup just found. */
  hit?: Cell;
  /** A lookup in progress: the key asked for and whether it was there. */
  probe?: { key: Cell; found: boolean };
  /** An entry just removed (shown struck through for this step only). */
  dropped?: Cell;
}

/** A set as chips. */
export interface SetViz {
  kind: 'set';
  label: string;
  items: Cell[];
  flash?: Cell;
  hit?: Cell;
  probe?: { key: Cell; found: boolean };
}

/** A stack drawn vertically, top first. */
export interface StackViz {
  kind: 'stack';
  label: string;
  items: Cell[];
  /** The value just pushed (top) or just popped (shown leaving). */
  pushed?: boolean;
  popped?: Cell;
}

/** A queue drawn horizontally; items before `head` already left. */
export interface QueueViz {
  kind: 'queue';
  label: string;
  items: Cell[];
  head?: number;
  pushed?: boolean;
}

/** Named scalar variables; `changed` marks the ones this step wrote. */
export interface VarsViz {
  kind: 'vars';
  vars: { name: string; value: Cell; changed?: boolean; tone?: Tone }[];
}

/** Intervals on a number line, one or more rows (input, result). */
export interface IntervalsViz {
  kind: 'intervals';
  rows: { label: string; items: { start: number; end: number; tone?: Tone }[] }[];
}

/** A 2D grid of cells (a map of islands, a DP table). */
export interface GridViz {
  kind: 'grid';
  label: string;
  cells: Cell[][];
  marks?: { r: number; c: number; tone: Tone }[];
  rowLabels?: Cell[];
  colLabels?: Cell[];
}

/** A binary tree. */
export interface TreeViz {
  kind: 'tree';
  label: string;
  nodes: { id: string; value: Cell; left: string | null; right: string | null }[];
  root: string | null;
  marks?: { id: string; tone: Tone }[];
  /** A note next to a node (the value a recursive call returned, a bound). */
  notes?: { id: string; text: string }[];
}

/** A small graph with a fixed circular layout. */
export interface GraphViz {
  kind: 'graph';
  label: string;
  nodes: { id: string; label: string }[];
  edges: { from: string; to: string; directed?: boolean; tone?: Tone }[];
  marks?: { id: string; tone: Tone }[];
}

/** A singly linked list with named pointers. */
export interface ListViz {
  kind: 'list';
  label: string;
  nodes: { id: string; value: Cell }[];
  /** node id → next node id (null = the end). */
  next: Record<string, string | null>;
  pointers: { name: string; id: string | null }[];
  marks?: { id: string; tone: Tone }[];
}

/** A binary heap: the array and the tree it encodes. */
export interface HeapViz {
  kind: 'heap';
  label: string;
  items: number[];
  marks?: Mark[];
}

/** A line of text (a partial result, a built string). */
export interface TextViz {
  kind: 'text';
  label: string;
  value: string;
  tone?: Tone;
}

export type Viz =
  | ArrayViz
  | MapViz
  | SetViz
  | StackViz
  | QueueViz
  | VarsViz
  | IntervalsViz
  | GridViz
  | TreeViz
  | GraphViz
  | ListViz
  | HeapViz
  | TextViz;

/** One step of a trace, with its line resolved. */
export interface TraceStep {
  /** 1-based line of the TypeScript solution, or null for an intro step that points at no executed line. */
  line: number | null;
  caption: string;
  viz: Viz[];
  /** Intro steps set the scene (the input, a top-level constant) before the call runs. */
  intro?: boolean;
}

export interface BuiltTrace {
  steps: TraceStep[];
  /** What the generator returned. */
  result: unknown;
}
