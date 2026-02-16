'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = '#6366f1';
const D_MODEL = 6; // embedding dimension (small for visualization)
const NUM_HEADS = 4;
const D_HEAD = 3; // D_MODEL / 2 for simplicity
const DEFAULT_SENTENCE = 'The cat sat on the mat';

const HEAD_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];
const HEAD_LABELS = ['Head 0 (syntax)', 'Head 1 (proximity)', 'Head 2 (semantic)', 'Head 3 (global)'];

type View = 'embedding' | 'qkv' | 'attention' | 'multihead' | 'positional';

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/** Seeded pseudo-random number generator for reproducible weights */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s / 2147483647) * 2 - 1; // range [-1, 1]
  };
}

function generateMatrix(rows: number, cols: number, seed: number): number[][] {
  const rng = seededRandom(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.round(rng() * 100) / 100)
  );
}

function matMul(a: number[][], b: number[][]): number[][] {
  const rows = a.length;
  const cols = b[0].length;
  const inner = b.length;
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      let sum = 0;
      for (let k = 0; k < inner; k++) sum += a[i][k] * b[k][j];
      return Math.round(sum * 100) / 100;
    })
  );
}

function transpose(m: number[][]): number[][] {
  const rows = m.length;
  const cols = m[0].length;
  return Array.from({ length: cols }, (_, j) =>
    Array.from({ length: rows }, (_, i) => m[i][j])
  );
}

function softmaxRows(m: number[][]): number[][] {
  return m.map((row) => {
    const max = Math.max(...row);
    const exps = row.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => Math.round((e / sum) * 1000) / 1000);
  });
}

function scaleMatrix(m: number[][], factor: number): number[][] {
  return m.map((row) => row.map((v) => Math.round((v / factor) * 100) / 100));
}

function positionalEncoding(seqLen: number, dModel: number): number[][] {
  return Array.from({ length: seqLen }, (_, pos) =>
    Array.from({ length: dModel }, (_, i) => {
      const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
      return Math.round((i % 2 === 0 ? Math.sin(angle) : Math.cos(angle)) * 100) / 100;
    })
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MatrixDisplay({
  data,
  rowLabels,
  colLabels,
  title,
  colorScale,
  highlightRow,
  highlightCol,
  compact,
}: {
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  title: string;
  colorScale: (v: number) => string;
  highlightRow?: number;
  highlightCol?: number;
  compact?: boolean;
}) {
  const cellSize = compact ? 'w-8 h-7 text-[9px]' : 'w-10 h-8 text-[10px]';

  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] text-[#888] tracking-wider uppercase mb-2">
        {title}
      </span>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          {colLabels && (
            <thead>
              <tr>
                {rowLabels && <th className="w-14" />}
                {colLabels.map((l, i) => (
                  <th
                    key={i}
                    className={`font-mono text-[9px] text-[#aaa] font-normal px-0.5 pb-1 ${
                      highlightCol === i ? 'text-j-text' : ''
                    }`}
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {rowLabels && (
                  <td
                    className={`font-mono text-[9px] pr-2 text-right ${
                      highlightRow === i ? 'text-j-text font-medium' : 'text-[#aaa]'
                    }`}
                  >
                    {rowLabels[i]}
                  </td>
                )}
                {row.map((val, j) => {
                  const isHighlighted =
                    (highlightRow !== undefined && highlightRow === i) ||
                    (highlightCol !== undefined && highlightCol === j);
                  return (
                    <td
                      key={j}
                      className={`${cellSize} text-center font-mono border border-[#1a1a1a]/5 transition-all duration-300 ${
                        isHighlighted ? 'ring-1 ring-[#6366f1]/50' : ''
                      }`}
                      style={{ backgroundColor: colorScale(val) }}
                      title={`${val}`}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeatmapCell({
  value,
  maxValue,
  color,
  label,
  size = 'normal',
}: {
  value: number;
  maxValue: number;
  color: string;
  label?: string;
  size?: 'normal' | 'small';
}) {
  const opacity = maxValue > 0 ? value / maxValue : 0;
  const dim = size === 'small' ? 'w-9 h-9' : 'w-12 h-12';
  const textSize = size === 'small' ? 'text-[8px]' : 'text-[10px]';

  return (
    <div
      className={`${dim} flex items-center justify-center font-mono ${textSize} border border-[#1a1a1a]/5 transition-all duration-300`}
      style={{ backgroundColor: color, opacity: 0.15 + opacity * 0.85 }}
      title={label ? `${label}: ${value}` : `${value}`}
    >
      {value.toFixed(2)}
    </div>
  );
}

function AttentionHeatmap({
  weights,
  tokens,
  title,
  color,
  compact,
}: {
  weights: number[][];
  tokens: string[];
  title: string;
  color: string;
  compact?: boolean;
}) {
  const max = Math.max(...weights.flat());
  const cellSize = compact ? 'small' as const : 'normal' as const;

  return (
    <div>
      <span className="font-mono text-[10px] tracking-wider uppercase mb-2 block" style={{ color }}>
        {title}
      </span>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-12" />
              {tokens.map((t, i) => (
                <th
                  key={i}
                  className="font-mono text-[9px] text-[#aaa] font-normal px-0.5 pb-1"
                  style={{ writingMode: compact ? 'vertical-rl' : undefined }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weights.map((row, i) => (
              <tr key={i}>
                <td className="font-mono text-[9px] text-[#aaa] pr-2 text-right">
                  {tokens[i]}
                </td>
                {row.map((val, j) => (
                  <td key={j}>
                    <HeatmapCell value={val} maxValue={max} color={color} size={cellSize} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PositionalEncodingViz({ seqLen, dModel }: { seqLen: number; dModel: number }) {
  const pe = useMemo(() => positionalEncoding(seqLen, dModel), [seqLen, dModel]);

  return (
    <div>
      <span className="font-mono text-[10px] text-[#888] tracking-wider uppercase mb-3 block">
        Positional Encoding (sinusoidal)
      </span>
      <div className="flex gap-4 flex-wrap">
        {/* Waveform view */}
        <div className="flex-1 min-w-[280px]">
          <svg viewBox={`0 0 ${dModel * 40} ${seqLen * 24 + 20}`} className="w-full">
            {/* Dimension labels */}
            {Array.from({ length: dModel }, (_, d) => (
              <text
                key={`dim-${d}`}
                x={d * 40 + 20}
                y={12}
                textAnchor="middle"
                className="fill-[#aaa]"
                style={{ fontSize: 9, fontFamily: 'monospace' }}
              >
                d{d}
              </text>
            ))}
            {/* Cells */}
            {pe.map((row, pos) =>
              row.map((val, dim) => {
                const normalized = (val + 1) / 2;
                const hue = dim % 2 === 0 ? 240 : 270;
                return (
                  <rect
                    key={`${pos}-${dim}`}
                    x={dim * 40 + 2}
                    y={pos * 24 + 18}
                    width={36}
                    height={20}
                    rx={2}
                    fill={`hsla(${hue}, 70%, 50%, ${0.1 + normalized * 0.8})`}
                  />
                );
              })
            )}
            {/* Position labels */}
            {pe.map((_, pos) => (
              <text
                key={`pos-${pos}`}
                x={-2}
                y={pos * 24 + 32}
                textAnchor="end"
                className="fill-[#aaa]"
                style={{ fontSize: 9, fontFamily: 'monospace' }}
              >
                p{pos}
              </text>
            ))}
            {/* Values */}
            {pe.map((row, pos) =>
              row.map((val, dim) => (
                <text
                  key={`v-${pos}-${dim}`}
                  x={dim * 40 + 20}
                  y={pos * 24 + 32}
                  textAnchor="middle"
                  className="fill-j-text"
                  style={{ fontSize: 8, fontFamily: 'monospace' }}
                >
                  {val.toFixed(2)}
                </text>
              ))
            )}
          </svg>
        </div>

        {/* Sine wave preview per dimension */}
        <div className="w-48 shrink-0">
          <span className="font-mono text-[9px] text-[#888] block mb-2">
            Frecuencia por dimension
          </span>
          {Array.from({ length: Math.min(dModel, 4) }, (_, d) => {
            const points = Array.from({ length: 20 }, (__, p) => {
              const angle = p / Math.pow(10000, (2 * Math.floor(d / 2)) / dModel);
              const y = d % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
              return `${p * 9},${20 - y * 16}`;
            }).join(' ');
            return (
              <div key={d} className="mb-1">
                <span className="font-mono text-[8px] text-[#aaa]">
                  d{d} ({d % 2 === 0 ? 'sin' : 'cos'})
                </span>
                <svg viewBox="0 0 180 40" className="w-full h-6">
                  <polyline
                    points={points}
                    fill="none"
                    stroke={d % 2 === 0 ? '#6366f1' : '#a78bfa'}
                    strokeWidth={1.5}
                  />
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DotProductAnimation({
  queryRow,
  keyRows,
  tokens,
  animatingPair,
}: {
  queryRow: number[];
  keyRows: number[][];
  tokens: string[];
  animatingPair: { q: number; k: number } | null;
}) {
  if (!animatingPair) return null;

  const { q, k } = animatingPair;
  const keyRow = keyRows[k];
  const products = queryRow.map((qv, i) => ({
    q: qv,
    k: keyRow[i],
    product: Math.round(qv * keyRow[i] * 100) / 100,
  }));
  const dotProduct = products.reduce((sum, p) => sum + p.product, 0);

  return (
    <div className="bg-[#fafafa] border border-j-border rounded p-4">
      <span className="font-mono text-[10px] text-[#888] tracking-wider uppercase block mb-3">
        Dot Product: Q[{tokens[q]}] . K[{tokens[k]}]
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {products.map((p, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-[#6366f1]">{p.q.toFixed(2)}</span>
            <span className="font-mono text-[9px] text-[#aaa]">x</span>
            <span className="font-mono text-[10px] text-[#f59e0b]">{p.k.toFixed(2)}</span>
            <span className="font-mono text-[9px] text-[#aaa]">=</span>
            <span className="font-mono text-[10px] text-j-text font-medium">{p.product.toFixed(2)}</span>
            {i < products.length - 1 && (
              <span className="font-mono text-[9px] text-[#aaa] ml-1">+</span>
            )}
          </div>
        ))}
        <span className="font-mono text-[9px] text-[#aaa] ml-2">=</span>
        <span className="font-mono text-[12px] text-j-text font-bold ml-1">
          {dotProduct.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color scales
// ---------------------------------------------------------------------------

function embeddingColor(v: number): string {
  const normalized = (v + 1) / 2;
  const lightness = 95 - normalized * 45;
  return `hsl(240, 60%, ${lightness}%)`;
}

function attentionColor(v: number): string {
  const lightness = 97 - v * 55;
  return `hsl(250, 65%, ${lightness}%)`;
}

// ---------------------------------------------------------------------------
// Attention engine
// ---------------------------------------------------------------------------

interface AttentionState {
  tokens: string[];
  embeddings: number[][];
  pe: number[][];
  inputWithPE: number[][];
  heads: {
    Wq: number[][];
    Wk: number[][];
    Wv: number[][];
    Q: number[][];
    K: number[][];
    V: number[][];
    scores: number[][];
    scaledScores: number[][];
    weights: number[][];
    output: number[][];
  }[];
}

function computeAttention(tokens: string[]): AttentionState {
  const seqLen = tokens.length;

  // Generate stable embeddings based on token content
  const embeddings = tokens.map((token, i) => {
    const seed = token.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 0) + i;
    const rng = seededRandom(Math.abs(seed) + 1);
    return Array.from({ length: D_MODEL }, () => Math.round(rng() * 100) / 100);
  });

  const pe = positionalEncoding(seqLen, D_MODEL);
  const inputWithPE = embeddings.map((row, i) =>
    row.map((v, j) => Math.round((v + pe[i][j]) * 100) / 100)
  );

  // Multi-head attention
  const heads = Array.from({ length: NUM_HEADS }, (_, h) => {
    const baseSeed = (h + 1) * 1000;
    const Wq = generateMatrix(D_MODEL, D_HEAD, baseSeed + 1);
    const Wk = generateMatrix(D_MODEL, D_HEAD, baseSeed + 2);
    const Wv = generateMatrix(D_MODEL, D_HEAD, baseSeed + 3);

    const Q = matMul(inputWithPE, Wq);
    const K = matMul(inputWithPE, Wk);
    const V = matMul(inputWithPE, Wv);

    const scores = matMul(Q, transpose(K));
    const scaledScores = scaleMatrix(scores, Math.sqrt(D_HEAD));
    const weights = softmaxRows(scaledScores);
    const output = matMul(weights, V);

    return { Wq, Wk, Wv, Q, K, V, scores, scaledScores, weights, output };
  });

  return { tokens, embeddings, pe, inputWithPE, heads };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AttentionPlayground() {
  const [sentence, setSentence] = useState(DEFAULT_SENTENCE);
  const [inputDraft, setInputDraft] = useState(DEFAULT_SENTENCE);
  const [activeHead, setActiveHead] = useState(0);
  const [showMultiHead, setShowMultiHead] = useState(false);
  const [showPositional, setShowPositional] = useState(false);
  const [activeView, setActiveView] = useState<View>('attention');
  const [animatingPair, setAnimatingPair] = useState<{ q: number; k: number } | null>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const state = useMemo(() => {
    const tokens = sentence.trim().split(/\s+/);
    return computeAttention(tokens);
  }, [sentence]);

  const handleSubmitSentence = useCallback(() => {
    const trimmed = inputDraft.trim();
    if (trimmed.length > 0) {
      setSentence(trimmed);
      setAnimatingPair(null);
    }
  }, [inputDraft]);

  const handleChangeInput = useCallback((s: string) => {
    setInputDraft(s);
    setSentence(s);
  }, []);

  const handleAnimate = useCallback(() => {
    setActiveView('attention');
    // Animate through dot product pairs
    const pairs: { q: number; k: number }[] = [];
    for (let q = 0; q < state.tokens.length; q++) {
      for (let k = 0; k < state.tokens.length; k++) {
        pairs.push({ q, k });
      }
    }
    let idx = 0;
    const step = () => {
      if (idx >= pairs.length) {
        setAnimatingPair(null);
        return;
      }
      setAnimatingPair(pairs[idx]);
      idx++;
      animationRef.current = setTimeout(step, 400);
    };
    if (animationRef.current) clearTimeout(animationRef.current);
    step();
  }, [state.tokens.length]);

  const handleToggleMultiHead = useCallback(() => {
    setShowMultiHead((prev) => !prev);
    if (!showMultiHead) setActiveView('multihead');
  }, [showMultiHead]);

  const handleTogglePositional = useCallback(() => {
    setShowPositional((prev) => !prev);
    if (!showPositional) setActiveView('positional');
  }, [showPositional]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  const head = state.heads[activeHead];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PlaygroundLayout
      accentColor={ACCENT}
      disableTutor
      lessons={
        <LessonGuide
          onChangeInput={handleChangeInput}
          onSelectHead={(h) => setActiveHead(h)}
          onToggleMultiHead={handleToggleMultiHead}
          onTogglePositional={handleTogglePositional}
          onAnimate={handleAnimate}
        />
      }
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Controls bar */}
        <div className="shrink-0 border-b border-j-border px-6 py-3 flex items-center gap-4 flex-wrap">
          {/* Sentence input */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label className="font-mono text-[10px] text-[#888] uppercase tracking-wider shrink-0">
              Input
            </label>
            <input
              type="text"
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitSentence()}
              className="flex-1 bg-[#fafafa] border border-j-border rounded px-3 py-1.5 font-mono text-[12px] text-j-text focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40"
              placeholder="Enter a sentence..."
            />
            <button
              onClick={handleSubmitSentence}
              className="px-3 py-1.5 text-white font-mono text-[10px] uppercase tracking-wider rounded transition-colors"
              style={{ backgroundColor: ACCENT }}
            >
              Parse
            </button>
          </div>

          {/* View tabs */}
          <div className="flex gap-1">
            {(
              [
                { key: 'embedding', label: 'Embed' },
                { key: 'qkv', label: 'Q K V' },
                { key: 'attention', label: 'Attention' },
                { key: 'multihead', label: 'Multi-Head' },
                { key: 'positional', label: 'PE' },
              ] as { key: View; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveView(key);
                  if (key === 'multihead') setShowMultiHead(true);
                  if (key === 'positional') setShowPositional(true);
                }}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider rounded transition-colors ${
                  activeView === key
                    ? 'text-white'
                    : 'text-[#888] hover:text-j-text bg-[#fafafa] border border-j-border'
                }`}
                style={activeView === key ? { backgroundColor: ACCENT } : undefined}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Head selector (visible when on attention or qkv view) */}
          {(activeView === 'attention' || activeView === 'qkv') && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">
                Head
              </span>
              {Array.from({ length: NUM_HEADS }, (_, h) => (
                <button
                  key={h}
                  onClick={() => setActiveHead(h)}
                  className={`w-6 h-6 rounded text-[10px] font-mono font-medium transition-colors ${
                    activeHead === h ? 'text-white' : 'text-[#888] border border-j-border'
                  }`}
                  style={activeHead === h ? { backgroundColor: HEAD_COLORS[h] } : undefined}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Token bar */}
        <div className="shrink-0 border-b border-j-border px-6 py-2 flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider mr-2">
            Tokens ({state.tokens.length})
          </span>
          {state.tokens.map((t, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded font-mono text-[11px] border transition-colors"
              style={{
                borderColor: ACCENT + '40',
                backgroundColor:
                  animatingPair && (animatingPair.q === i || animatingPair.k === i)
                    ? ACCENT + '20'
                    : 'transparent',
              }}
            >
              {t}
              <span className="text-[8px] text-[#aaa] ml-1">[{i}]</span>
            </span>
          ))}
        </div>

        {/* Visualization area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Embedding view */}
          {activeView === 'embedding' && (
            <div className="space-y-6">
              <div className="flex items-start gap-8 flex-wrap">
                <MatrixDisplay
                  data={state.embeddings}
                  rowLabels={state.tokens}
                  colLabels={Array.from({ length: D_MODEL }, (_, i) => `d${i}`)}
                  title="Token Embeddings (X)"
                  colorScale={embeddingColor}
                />
                {showPositional && (
                  <>
                    <div className="flex items-center self-center">
                      <span className="font-mono text-lg text-[#aaa]">+</span>
                    </div>
                    <MatrixDisplay
                      data={state.pe}
                      rowLabels={state.tokens.map((_, i) => `pos ${i}`)}
                      colLabels={Array.from({ length: D_MODEL }, (_, i) => `d${i}`)}
                      title="Positional Encoding (PE)"
                      colorScale={embeddingColor}
                    />
                    <div className="flex items-center self-center">
                      <span className="font-mono text-lg text-[#aaa]">=</span>
                    </div>
                    <MatrixDisplay
                      data={state.inputWithPE}
                      rowLabels={state.tokens}
                      colLabels={Array.from({ length: D_MODEL }, (_, i) => `d${i}`)}
                      title="Input + PE"
                      colorScale={embeddingColor}
                    />
                  </>
                )}
              </div>

              {/* Explanation */}
              <div className="bg-[#fafafa] border border-j-border rounded p-4 max-w-xl">
                <p className="font-mono text-[11px] text-[#555] leading-relaxed">
                  Cada fila es el embedding de un token. Las {D_MODEL} dimensiones capturan
                  propiedades semanticas del token. En un transformer real, estos embeddings
                  se aprenden durante el entrenamiento (dim=512 en el paper original).
                </p>
              </div>
            </div>
          )}

          {/* Q, K, V view */}
          {activeView === 'qkv' && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 flex-wrap">
                {/* Input */}
                <MatrixDisplay
                  data={state.inputWithPE}
                  rowLabels={state.tokens}
                  colLabels={Array.from({ length: D_MODEL }, (_, i) => `d${i}`)}
                  title={`Input (${state.tokens.length} x ${D_MODEL})`}
                  colorScale={embeddingColor}
                  compact
                />

                {/* Arrow */}
                <div className="flex flex-col items-center self-center gap-1">
                  <span className="font-mono text-[9px] text-[#aaa]">x Wq,Wk,Wv</span>
                  <span className="text-[#aaa]">&rarr;</span>
                </div>

                {/* Q, K, V */}
                <div className="flex gap-4">
                  <MatrixDisplay
                    data={head.Q}
                    rowLabels={state.tokens}
                    colLabels={Array.from({ length: D_HEAD }, (_, i) => `q${i}`)}
                    title={`Query (${HEAD_LABELS[activeHead]})`}
                    colorScale={(v) => {
                      const n = (v + 2) / 4;
                      return `hsla(240, 70%, 50%, ${Math.max(0.05, Math.min(1, n))})`;
                    }}
                    compact
                  />
                  <MatrixDisplay
                    data={head.K}
                    rowLabels={state.tokens}
                    colLabels={Array.from({ length: D_HEAD }, (_, i) => `k${i}`)}
                    title={`Key (${HEAD_LABELS[activeHead]})`}
                    colorScale={(v) => {
                      const n = (v + 2) / 4;
                      return `hsla(40, 80%, 50%, ${Math.max(0.05, Math.min(1, n))})`;
                    }}
                    compact
                  />
                  <MatrixDisplay
                    data={head.V}
                    rowLabels={state.tokens}
                    colLabels={Array.from({ length: D_HEAD }, (_, i) => `v${i}`)}
                    title={`Value (${HEAD_LABELS[activeHead]})`}
                    colorScale={(v) => {
                      const n = (v + 2) / 4;
                      return `hsla(150, 60%, 45%, ${Math.max(0.05, Math.min(1, n))})`;
                    }}
                    compact
                  />
                </div>
              </div>

              {/* Formula */}
              <div className="bg-[#fafafa] border border-j-border rounded p-4 max-w-2xl">
                <p className="font-mono text-[11px] text-[#555] leading-relaxed mb-2">
                  Q = Input x Wq &nbsp;&nbsp; K = Input x Wk &nbsp;&nbsp; V = Input x Wv
                </p>
                <p className="font-mono text-[10px] text-[#888] leading-relaxed">
                  Cada head tiene sus propias matrices de pesos (Wq, Wk, Wv) de dimension
                  ({D_MODEL}x{D_HEAD}). La proyeccion reduce de {D_MODEL} a {D_HEAD} dimensiones.
                  Head {activeHead} esta seleccionada. Cambia de head para ver como cada una
                  extrae representaciones diferentes del mismo input.
                </p>
              </div>
            </div>
          )}

          {/* Attention view */}
          {activeView === 'attention' && (
            <div className="space-y-6">
              {/* Attention heatmap */}
              <AttentionHeatmap
                weights={head.weights}
                tokens={state.tokens}
                title={`Attention Weights - ${HEAD_LABELS[activeHead]}`}
                color={HEAD_COLORS[activeHead]}
              />

              {/* Dot product animation */}
              <DotProductAnimation
                queryRow={animatingPair ? head.Q[animatingPair.q] : []}
                keyRows={head.K}
                tokens={state.tokens}
                animatingPair={animatingPair}
              />

              {/* Formula + controls */}
              <div className="flex items-start gap-6 flex-wrap">
                <div className="bg-[#fafafa] border border-j-border rounded p-4 max-w-lg">
                  <p className="font-mono text-[11px] text-[#555] leading-relaxed mb-2">
                    Attention(Q,K,V) = softmax(QK<sup>T</sup> / sqrt(d<sub>k</sub>)) x V
                  </p>
                  <p className="font-mono text-[10px] text-[#888] leading-relaxed">
                    Cada celda (i,j) indica cuanta atencion el token i presta al token j.
                    Las filas suman 1 (softmax). d_k = {D_HEAD}.
                  </p>
                </div>

                <button
                  onClick={handleAnimate}
                  className="px-4 py-2 text-white font-mono text-[10px] uppercase tracking-wider rounded transition-colors"
                  style={{ backgroundColor: ACCENT }}
                >
                  Animar Dot Products
                </button>
              </div>

              {/* Raw scores for context */}
              <div className="flex gap-6 flex-wrap">
                <MatrixDisplay
                  data={head.scores}
                  rowLabels={state.tokens}
                  colLabels={state.tokens}
                  title="Raw Scores (QK^T)"
                  colorScale={attentionColor}
                  highlightRow={animatingPair?.q}
                  highlightCol={animatingPair?.k}
                  compact
                />
                <MatrixDisplay
                  data={head.scaledScores}
                  rowLabels={state.tokens}
                  colLabels={state.tokens}
                  title={`Scaled (/sqrt(${D_HEAD}))`}
                  colorScale={attentionColor}
                  highlightRow={animatingPair?.q}
                  highlightCol={animatingPair?.k}
                  compact
                />
              </div>
            </div>
          )}

          {/* Multi-head view */}
          {activeView === 'multihead' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {state.heads.map((h, i) => (
                  <AttentionHeatmap
                    key={i}
                    weights={h.weights}
                    tokens={state.tokens}
                    title={HEAD_LABELS[i]}
                    color={HEAD_COLORS[i]}
                    compact
                  />
                ))}
              </div>

              {/* Explanation */}
              <div className="bg-[#fafafa] border border-j-border rounded p-4 max-w-2xl">
                <p className="font-mono text-[11px] text-[#555] leading-relaxed mb-2">
                  Multi-Head Attention: {NUM_HEADS} cabezas en paralelo, cada una con sus propios pesos.
                </p>
                <p className="font-mono text-[10px] text-[#888] leading-relaxed">
                  Observa como cada cabeza desarrolla un patron distinto. En el paper original
                  (8 cabezas), algunas aprenden dependencias sintacticas, otras relaciones
                  coreferentes, otras atienden a tokens cercanos. La diversidad de patrones
                  es lo que le da al transformer su poder expresivo.
                </p>
                <p className="font-mono text-[10px] text-[#888] leading-relaxed mt-2">
                  MultiHead(Q,K,V) = Concat(head_0, ..., head_{NUM_HEADS - 1}) x Wo
                </p>
              </div>
            </div>
          )}

          {/* Positional encoding view */}
          {activeView === 'positional' && (
            <div className="space-y-6">
              <PositionalEncodingViz seqLen={state.tokens.length} dModel={D_MODEL} />

              <div className="bg-[#fafafa] border border-j-border rounded p-4 max-w-2xl">
                <p className="font-mono text-[11px] text-[#555] leading-relaxed mb-2">
                  PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
                  <br />
                  PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
                </p>
                <p className="font-mono text-[10px] text-[#888] leading-relaxed">
                  Las dimensiones pares usan seno, las impares coseno. Cada dimension
                  tiene una frecuencia diferente: las dimensiones bajas oscilan rapido (capturan
                  posiciones cercanas), las altas oscilan lento (capturan estructura global).
                  Los autores eligieron sinusoidales porque permiten al modelo aprender a
                  atender posiciones relativas (PE(pos+k) se puede expresar como funcion lineal
                  de PE(pos)).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PlaygroundLayout>
  );
}
