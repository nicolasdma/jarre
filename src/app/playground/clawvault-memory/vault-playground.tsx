'use client';

import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VaultFile {
  frontmatter?: {
    title: string;
    priority: string;
    tags: string[];
    updated?: string;
    role?: string;
    contact?: string;
    type?: string;
    due?: string;
    style?: string;
  };
  content: string;
  tokens: number;
  priority: 'critical' | 'warn' | 'low' | null;
}

interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

// ---------------------------------------------------------------------------
// Sample vault data
// ---------------------------------------------------------------------------

const VAULT_FILES: Record<string, VaultFile> = {
  'INDEX.md': {
    content:
      '# Vault Index\n\n' +
      '## Decisions\n' +
      '- decisions/event-driven-pipeline.md — Migración a pipeline asíncrono\n' +
      '- decisions/postgres-over-mongo.md — Elección de DB relacional\n\n' +
      '## People\n' +
      '- people/sarah-cto.md — CTO, decisión-maker\n' +
      '- people/marco-backend.md — Backend lead, Go expert\n\n' +
      '## Lessons\n' +
      '- lessons/never-deploy-friday.md — Incidente post-deploy viernes\n\n' +
      '## Commitments\n' +
      '- commitments/friday-followup.md — Seguimiento prometido\n\n' +
      '## Preferences\n' +
      '- preferences/coding-style.md — Convenciones del equipo',
    tokens: 200,
    priority: null,
  },
  'decisions/event-driven-pipeline.md': {
    frontmatter: {
      title: 'Event-Driven Pipeline',
      priority: '🔴',
      tags: ['architecture', 'backend'],
      updated: '2026-02-10',
    },
    content:
      'El equipo decidió migrar a un pipeline event-driven porque el approach síncrono no escalaba ' +
      'más allá de 10k req/s.\n\n' +
      '## Contexto\n' +
      'El monolito procesaba requests de forma síncrona. Cada request bloqueaba un thread ' +
      'y bajo carga alta (>8k req/s) el p99 se disparaba a 12s.\n\n' +
      '## Decisión\n' +
      'Adoptar Kafka como message broker con consumers en Go.\n\n' +
      'Relacionado: [[sarah-cto]] aprobó esta decisión después de revisar el RFC.\n' +
      'Ver [[postgres-over-mongo]] para la elección de storage asociada.',
    tokens: 450,
    priority: 'critical',
  },
  'decisions/postgres-over-mongo.md': {
    frontmatter: {
      title: 'PostgreSQL over MongoDB',
      priority: '🔴',
      tags: ['database', 'architecture'],
      updated: '2026-01-28',
    },
    content:
      'Elegimos PostgreSQL sobre MongoDB para el storage principal.\n\n' +
      '## Razones\n' +
      '1. Necesitamos transacciones ACID para el billing pipeline\n' +
      '2. Los queries analíticos son más naturales en SQL\n' +
      '3. JSONB nos da flexibilidad schema-less donde la necesitamos\n\n' +
      '## Trade-offs\n' +
      'MongoDB habría sido más fácil para prototyping rápido, pero ' +
      'las garantías de consistencia de Postgres pesan más.\n\n' +
      'Decisión tomada con [[sarah-cto]] y [[marco-backend]].\n' +
      'Influida por [[event-driven-pipeline]] que requiere delivery guarantees.',
    tokens: 400,
    priority: 'critical',
  },
  'people/sarah-cto.md': {
    frontmatter: {
      title: 'Sarah Chen',
      priority: '🟡',
      tags: ['people', 'leadership'],
      role: 'CTO',
      contact: 'sarah@company.com',
    },
    content:
      '# Sarah Chen — CTO\n\n' +
      'Decision-maker principal para arquitectura y tech stack.\n\n' +
      '## Preferencias conocidas\n' +
      '- Prefiere documentación antes de implementación\n' +
      '- Valora métricas sobre opiniones ("show me the data")\n' +
      '- Reuniones cortas, decisiones rápidas\n\n' +
      '## Decisiones recientes\n' +
      '- Aprobó [[event-driven-pipeline]]\n' +
      '- Co-decidió [[postgres-over-mongo]] con [[marco-backend]]\n\n' +
      '## Nota\n' +
      'Seguimiento pendiente: [[friday-followup]]',
    tokens: 350,
    priority: 'warn',
  },
  'people/marco-backend.md': {
    frontmatter: {
      title: 'Marco Ruiz',
      priority: '🟡',
      tags: ['people', 'engineering'],
      role: 'Backend Lead',
      contact: 'marco@company.com',
    },
    content:
      '# Marco Ruiz — Backend Lead\n\n' +
      'Experto en Go y sistemas distribuidos. Lleva 3 años en el equipo.\n\n' +
      '## Expertise\n' +
      '- Go concurrency patterns\n' +
      '- Kafka consumer design\n' +
      '- PostgreSQL performance tuning\n\n' +
      '## Relaciones\n' +
      'Trabaja directamente con [[sarah-cto]] en decisiones técnicas.\n' +
      'Implementó [[event-driven-pipeline]].\n' +
      'Participó en [[postgres-over-mongo]].',
    tokens: 300,
    priority: 'warn',
  },
  'lessons/never-deploy-friday.md': {
    frontmatter: {
      title: 'Never Deploy on Friday',
      priority: '🔴',
      tags: ['lessons', 'ops', 'incident'],
      updated: '2026-02-07',
    },
    content:
      '# Lección: Nunca deployar en viernes\n\n' +
      '## Incidente\n' +
      'Deploy de la v2.3.1 el viernes a las 17:00. El migration script ' +
      'corrompió índices en producción. [[marco-backend]] detectó el problema ' +
      'a las 19:00, rollback completado a las 22:00.\n\n' +
      '## Impacto\n' +
      '- 5 horas de degradación\n' +
      '- 3 ingenieros trabajando el viernes por la noche\n\n' +
      '## Acción\n' +
      '- Freeze de deploys viernes después de las 14:00\n' +
      '- [[sarah-cto]] comunicó la política al equipo\n' +
      '- Seguimiento: [[friday-followup]]',
    tokens: 380,
    priority: 'critical',
  },
  'commitments/friday-followup.md': {
    frontmatter: {
      title: 'Friday Followup',
      priority: '🟡',
      tags: ['commitment', 'ops'],
      type: 'followup',
      due: '2026-02-20',
    },
    content:
      '# Seguimiento: Post-mortem viernes\n\n' +
      'Prometí a [[sarah-cto]] enviar el post-mortem completo antes del ' +
      '20 de febrero.\n\n' +
      '## Pendientes\n' +
      '- [ ] Escribir timeline detallado\n' +
      '- [ ] Agregar métricas de impacto\n' +
      '- [ ] Proponer checklist pre-deploy\n' +
      '- [ ] Revisar con [[marco-backend]]\n\n' +
      'Contexto: [[never-deploy-friday]]',
    tokens: 250,
    priority: 'warn',
  },
  'preferences/coding-style.md': {
    frontmatter: {
      title: 'Coding Style',
      priority: '🟢',
      tags: ['preferences', 'code'],
      style: 'team-convention',
    },
    content:
      '# Preferencias de estilo del equipo\n\n' +
      '## Go\n' +
      '- Nombres cortos para variables de scope pequeño\n' +
      '- Error handling explícito (no panic)\n' +
      '- Table-driven tests\n\n' +
      '## TypeScript\n' +
      '- Strict mode siempre\n' +
      '- Prefer interfaces over types para objetos\n' +
      '- Async/await sobre .then()\n\n' +
      '## General\n' +
      '- PRs pequeños (<300 líneas)\n' +
      '- Commits convencionales\n' +
      '- Code review obligatorio\n\n' +
      'Definido por [[sarah-cto]] y [[marco-backend]].',
    tokens: 280,
    priority: 'low',
  },
};

// ---------------------------------------------------------------------------
// Vault file tree structure
// ---------------------------------------------------------------------------

const FILE_TREE: TreeNode[] = [
  { name: 'INDEX.md', path: 'INDEX.md' },
  {
    name: 'decisions/',
    path: 'decisions',
    children: [
      { name: 'event-driven-pipeline.md', path: 'decisions/event-driven-pipeline.md' },
      { name: 'postgres-over-mongo.md', path: 'decisions/postgres-over-mongo.md' },
    ],
  },
  {
    name: 'people/',
    path: 'people',
    children: [
      { name: 'sarah-cto.md', path: 'people/sarah-cto.md' },
      { name: 'marco-backend.md', path: 'people/marco-backend.md' },
    ],
  },
  {
    name: 'lessons/',
    path: 'lessons',
    children: [
      { name: 'never-deploy-friday.md', path: 'lessons/never-deploy-friday.md' },
    ],
  },
  {
    name: 'commitments/',
    path: 'commitments',
    children: [
      { name: 'friday-followup.md', path: 'commitments/friday-followup.md' },
    ],
  },
  {
    name: 'preferences/',
    path: 'preferences',
    children: [
      { name: 'coding-style.md', path: 'preferences/coding-style.md' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Wiki-link resolution map (slug -> file path)
// ---------------------------------------------------------------------------

const WIKI_LINK_MAP: Record<string, string> = {
  'sarah-cto': 'people/sarah-cto.md',
  'marco-backend': 'people/marco-backend.md',
  'event-driven-pipeline': 'decisions/event-driven-pipeline.md',
  'postgres-over-mongo': 'decisions/postgres-over-mongo.md',
  'never-deploy-friday': 'lessons/never-deploy-friday.md',
  'friday-followup': 'commitments/friday-followup.md',
  'coding-style': 'preferences/coding-style.md',
  'api-migration': '', // unresolved link
};

// ---------------------------------------------------------------------------
// Graph data: derive edges from wiki-links in content
// ---------------------------------------------------------------------------

function extractWikiLinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(2, -2));
}

function buildGraphEdges(): { from: string; to: string }[] {
  const edges: { from: string; to: string }[] = [];
  for (const [path, file] of Object.entries(VAULT_FILES)) {
    const links = extractWikiLinks(file.content);
    for (const slug of links) {
      const target = WIKI_LINK_MAP[slug];
      if (target && VAULT_FILES[target]) {
        edges.push({ from: path, to: target });
      }
    }
  }
  return edges;
}

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

function priorityColor(p: VaultFile['priority']): string {
  switch (p) {
    case 'critical':
      return 'text-red-400';
    case 'warn':
      return 'text-amber-400';
    case 'low':
      return 'text-emerald-400';
    default:
      return 'text-j-text-tertiary';
  }
}

function priorityBgColor(p: VaultFile['priority']): string {
  switch (p) {
    case 'critical':
      return 'bg-red-400/20 border-red-400/40';
    case 'warn':
      return 'bg-amber-400/20 border-amber-400/40';
    case 'low':
      return 'bg-emerald-400/20 border-emerald-400/40';
    default:
      return 'bg-j-bg border-j-border';
  }
}

function priorityEmoji(p: VaultFile['priority']): string {
  switch (p) {
    case 'critical':
      return '🔴';
    case 'warn':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
}

function priorityOrder(p: VaultFile['priority']): number {
  switch (p) {
    case 'critical':
      return 0;
    case 'warn':
      return 1;
    case 'low':
      return 2;
    default:
      return 3;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FileTreeItem({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isDir = !!node.children;
  const isSelected = node.path === selectedPath;
  const file = VAULT_FILES[node.path];

  return (
    <div>
      <button
        onClick={() => {
          if (isDir) {
            setExpanded((e) => !e);
          } else {
            onSelect(node.path);
          }
        }}
        className={`w-full text-left px-2 py-1 flex items-center gap-1.5 hover:bg-j-accent/10 transition-colors rounded ${
          isSelected ? 'bg-j-accent/15 text-j-accent' : 'text-j-text'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isDir ? (
          <span className="text-[10px] text-j-text-tertiary w-3 text-center">
            {expanded ? '▾' : '▸'}
          </span>
        ) : (
          <span className="text-[10px] text-j-text-tertiary w-3 text-center">·</span>
        )}
        <span className="font-mono text-[11px] truncate">{node.name}</span>
        {file?.priority && (
          <span className="text-[9px] ml-auto shrink-0">{priorityEmoji(file.priority)}</span>
        )}
      </button>
      {isDir && expanded && node.children?.map((child) => (
        <FileTreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function WikiLinkedContent({
  text,
  onNavigate,
}: {
  text: string;
  onNavigate: (path: string) => void;
}) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  let textCounter = 0;
  return (
    <>
      {parts.map((part) => {
        const wikiMatch = part.match(/^\[\[([^\]]+)\]\]$/);
        if (wikiMatch) {
          const slug = wikiMatch[1];
          const targetPath = WIKI_LINK_MAP[slug];
          const resolved = targetPath && VAULT_FILES[targetPath];
          return (
            <button
              key={`wiki-${slug}`}
              onClick={() => {
                if (resolved) onNavigate(targetPath);
              }}
              className={`inline font-mono ${
                resolved
                  ? 'text-j-accent hover:underline cursor-pointer'
                  : 'text-red-400/60 line-through cursor-not-allowed'
              }`}
            >
              [[{slug}]]
            </button>
          );
        }
        const key = `text-${++textCounter}`;
        return <span key={key}>{part}</span>;
      })}
    </>
  );
}

function ContentViewer({
  filePath,
  onNavigate,
}: {
  filePath: string;
  onNavigate: (path: string) => void;
}) {
  const file = VAULT_FILES[filePath];
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-j-text-tertiary font-mono text-xs">
        Selecciona un archivo del vault
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* File path bar */}
      <div className="px-4 py-2 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-j-text-tertiary">vault/{filePath}</span>
        <span className="font-mono text-[10px] text-j-text-tertiary">
          {file.tokens} tokens
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Frontmatter */}
        {file.frontmatter && (
          <div className={`border rounded p-3 font-mono text-[11px] space-y-1 ${priorityBgColor(file.priority)}`}>
            <div className="text-j-text-tertiary text-[10px] tracking-[0.15em] uppercase mb-2">
              Frontmatter
            </div>
            {Object.entries(file.frontmatter).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="text-j-text-tertiary shrink-0">{key}:</span>
                <span className={`${key === 'priority' ? priorityColor(file.priority) : 'text-j-text'}`}>
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="font-mono text-[12px] leading-relaxed text-j-text whitespace-pre-wrap">
          <WikiLinkedContent text={file.content} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}

function KnowledgeGraph({
  selectedPath,
  onNavigate,
}: {
  selectedPath: string;
  onNavigate: (path: string) => void;
}) {
  const edges = useMemo(() => buildGraphEdges(), []);
  const filePaths = Object.keys(VAULT_FILES);

  const connectedPaths = useMemo(() => {
    const connected = new Set<string>();
    for (const edge of edges) {
      if (edge.from === selectedPath || edge.to === selectedPath) {
        connected.add(edge.from);
        connected.add(edge.to);
      }
    }
    return connected;
  }, [edges, selectedPath]);

  // Layout nodes in a circle
  const cx = 160;
  const cy = 140;
  const radius = 110;
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    filePaths.forEach((path, i) => {
      const angle = (2 * Math.PI * i) / filePaths.length - Math.PI / 2;
      positions[path] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    return positions;
  }, [filePaths]);

  const getNodeLabel = (path: string): string => {
    const file = VAULT_FILES[path];
    if (file?.frontmatter?.title) return file.frontmatter.title;
    return path.split('/').pop()?.replace('.md', '') ?? path;
  };

  const getNodeFill = (path: string): string => {
    if (path === selectedPath) return '#4ade80';
    if (connectedPaths.has(path)) return '#facc15';
    return '#525252';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-j-border shrink-0">
        <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
          Knowledge Graph
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center p-2">
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-[280px]">
          {/* Edges */}
          {edges.map((edge) => {
            const from = nodePositions[edge.from];
            const to = nodePositions[edge.to];
            if (!from || !to) return null;
            const isHighlighted =
              edge.from === selectedPath || edge.to === selectedPath;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlighted ? '#4ade80' : '#333'}
                strokeWidth={isHighlighted ? 1.5 : 0.5}
                opacity={isHighlighted ? 0.8 : 0.3}
              />
            );
          })}
          {/* Nodes */}
          {filePaths.map((path) => {
            const pos = nodePositions[path];
            if (!pos) return null;
            const isSelected = path === selectedPath;
            return (
              <g
                key={path}
                onClick={() => onNavigate(path)}
                className="cursor-pointer"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 8 : 5}
                  fill={getNodeFill(path)}
                  opacity={connectedPaths.has(path) || isSelected ? 1 : 0.5}
                />
                <text
                  x={pos.x}
                  y={pos.y + (isSelected ? 16 : 14)}
                  textAnchor="middle"
                  fill={isSelected ? '#4ade80' : '#888'}
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {getNodeLabel(path)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function BudgetSimulator() {
  const [budget, setBudget] = useState(4000);

  const sortedFiles = useMemo(() => {
    return Object.entries(VAULT_FILES)
      .map(([path, file]) => ({ path, ...file }))
      .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));
  }, []);

  const { loaded, totalUsed } = useMemo(() => {
    let remaining = budget;
    const loaded: { path: string; tokens: number; priority: VaultFile['priority']; fits: boolean }[] = [];
    for (const file of sortedFiles) {
      const fits = remaining >= file.tokens;
      loaded.push({
        path: file.path,
        tokens: file.tokens,
        priority: file.priority,
        fits,
      });
      if (fits) remaining -= file.tokens;
    }
    return {
      loaded,
      totalUsed: budget - remaining,
    };
  }, [budget, sortedFiles]);

  const usagePercent = Math.min((totalUsed / budget) * 100, 100);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
          Budget Simulator
        </span>
        <span className="font-mono text-[10px] text-j-text-tertiary">
          {totalUsed} / {budget} tokens
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-j-text-tertiary tracking-[0.15em] uppercase">
              Context Window Budget
            </span>
            <span className="font-mono text-[12px] text-j-accent">{budget} tokens</span>
          </div>
          <input
            type="range"
            min={2000}
            max={8000}
            step={500}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-j-border rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between font-mono text-[9px] text-j-text-tertiary">
            <span>2,000</span>
            <span>4,000</span>
            <span>6,000</span>
            <span>8,000</span>
          </div>
        </div>

        {/* Usage bar */}
        <div className="space-y-1">
          <div className="h-3 w-full bg-j-border/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${usagePercent}%`,
                background:
                  usagePercent > 90
                    ? '#ef4444'
                    : usagePercent > 70
                      ? '#f59e0b'
                      : '#4ade80',
              }}
            />
          </div>
          <div className="font-mono text-[9px] text-j-text-tertiary text-right">
            {usagePercent.toFixed(0)}% utilizado
          </div>
        </div>

        {/* File list with fit status */}
        <div className="space-y-1">
          {loaded.map((file) => (
            <div
              key={file.path}
              className={`flex items-center gap-2 px-2 py-1.5 rounded font-mono text-[11px] border transition-all duration-200 ${
                file.fits
                  ? 'border-j-border bg-j-bg text-j-text'
                  : 'border-j-border/30 bg-j-bg/50 text-j-text-tertiary opacity-50'
              }`}
            >
              <span className="text-[9px] shrink-0">{priorityEmoji(file.priority)}</span>
              <span className="truncate flex-1">{file.path}</span>
              <span className="text-[10px] text-j-text-tertiary shrink-0">
                {file.tokens}t
              </span>
              <span className="text-[10px] shrink-0">
                {file.fits ? (
                  <span className="text-emerald-400">loaded</span>
                ) : (
                  <span className="text-red-400/60">skipped</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Playground
// ---------------------------------------------------------------------------

type RightPanel = 'graph' | 'budget';

export function VaultPlayground() {
  const [selectedFile, setSelectedFile] = useState('INDEX.md');
  const [rightPanel, setRightPanel] = useState<RightPanel>('graph');

  const handleNavigate = useCallback((path: string) => {
    if (VAULT_FILES[path]) {
      setSelectedFile(path);
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Panel toggle */}
      <div className="border-b border-j-border px-4 py-1.5 flex items-center gap-1 shrink-0">
        <button
          onClick={() => setRightPanel('graph')}
          className={`px-3 py-1 rounded font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
            rightPanel === 'graph'
              ? 'bg-j-accent/15 text-j-accent'
              : 'text-j-text-tertiary hover:text-j-text'
          }`}
        >
          Graph
        </button>
        <button
          onClick={() => setRightPanel('budget')}
          className={`px-3 py-1 rounded font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
            rightPanel === 'budget'
              ? 'bg-j-accent/15 text-j-accent'
              : 'text-j-text-tertiary hover:text-j-text'
          }`}
        >
          Budget
        </button>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: File tree */}
        <div className="w-56 shrink-0 border-r border-j-border overflow-y-auto py-2">
          <div className="px-3 pb-2">
            <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              vault/
            </span>
          </div>
          {FILE_TREE.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedFile}
              onSelect={handleNavigate}
            />
          ))}
        </div>

        {/* Center: Content viewer */}
        <div className="flex-1 min-w-0 border-r border-j-border">
          <ContentViewer filePath={selectedFile} onNavigate={handleNavigate} />
        </div>

        {/* Right: Graph or Budget */}
        <div className="w-80 shrink-0">
          {rightPanel === 'graph' ? (
            <KnowledgeGraph selectedPath={selectedFile} onNavigate={handleNavigate} />
          ) : (
            <BudgetSimulator />
          )}
        </div>
      </div>
    </div>
  );
}
