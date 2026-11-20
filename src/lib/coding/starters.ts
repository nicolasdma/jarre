/**
 * The starting file of each pad language, derived from the problem's
 * TypeScript starter (see ./languages.ts for why): JavaScript by stripping
 * the types, Python as a stub generated from the signature.
 */

import type { CodingProblem } from './format';
import type { CodeLanguage } from './languages';
import { tsToJs } from './to-js';

/** The file the editor opens with in this language, or null when the problem is not offered in it. */
export function starterFor(problem: Pick<CodingProblem, 'starter' | 'starters'>, language: CodeLanguage): string | null {
  if (language === 'typescript') return problem.starter;
  if (language === 'javascript') return problem.starters?.javascript ?? tsToJs(problem.starter);
  return problem.starters?.python ?? pythonStub(problem.starter);
}

// ---------------------------------------------------------------------------
// TypeScript signature → Python stub
// ---------------------------------------------------------------------------

/** Split at top-level commas (not inside <>, [], (), {}). */
function splitTop(s: string, sep = ','): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if ('<[({'.includes(ch)) depth++;
    else if ('>])}'.includes(ch)) depth--;
    if (ch === sep && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim());
}

/** A TypeScript type as a Python annotation, or null when there is no faithful one. */
export function pyType(ts: string): string | null {
  const t = ts.trim();
  const union = splitTop(t, '|');
  if (union.length > 1) {
    if (union.every((u) => /^(['"]).*\1$/.test(u))) return 'str';
    const parts = union.map(pyType);
    if (parts.some((p) => p === null)) return null;
    return [...new Set(parts)].join(' | ');
  }
  if (t.endsWith('[]')) {
    const inner = pyType(t.slice(0, -2));
    return inner && `list[${inner}]`;
  }
  const generic = /^(\w+)<(.+)>$/.exec(t);
  if (generic) {
    const args = splitTop(generic[2]).map(pyType);
    if (args.some((a) => a === null)) return null;
    if (generic[1] === 'Array' && args.length === 1) return `list[${args[0]}]`;
    if (generic[1] === 'Set' && args.length === 1) return `set[${args[0]}]`;
    if ((generic[1] === 'Map' || generic[1] === 'Record') && args.length === 2) return `dict[${args[0]}, ${args[1]}]`;
    return null;
  }
  const tuple = /^\[(.*)\]$/.exec(t);
  if (tuple) {
    const items = splitTop(tuple[1]).map(pyType);
    return items.length && items.every((i) => i !== null) ? `tuple[${items.join(', ')}]` : null;
  }
  const simple: Record<string, string> = { number: 'int', string: 'str', boolean: 'bool', void: 'None', null: 'None', undefined: 'None' };
  return simple[t] ?? null;
}

function pyParams(params: string): string[] | null {
  const out: string[] = [];
  for (const p of splitTop(params)) {
    const m = /^(\w+)\??\s*(?::\s*(.+))?$/.exec(p);
    if (!m) return null;
    const type = m[2] ? pyType(m[2]) : null;
    out.push(type ? `${m[1]}: ${type}` : m[1]);
  }
  return out;
}

/** `return -1;`, `return [];`, `return [-1, -1];`, `return false;`, `return '';`… */
const PLACEHOLDER_RETURN = /^return(\s+(-?\d+(\.\d+)?|true|false|null|undefined|''|""|\{\s*\}|\[\s*(-?\d+(\s*,\s*-?\d+)*)?\s*\]))?\s*;?$/;

/** A body that only waits for code: comments, blank lines and a placeholder return. Returns its comments, or null. */
function placeholderComments(body: string): string[] | null {
  const comments: string[] = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('//')) {
      const text = line.replace(/^\/\/\s?/, '');
      if (text) comments.push(text);
      continue;
    }
    if (PLACEHOLDER_RETURN.test(line)) continue;
    return null;
  }
  return comments;
}

/** The text of a `{ … }` block starting at `open` (the brace), and the index after it. */
function block(src: string, open: number): { body: string; end: number } | null {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return { body: src.slice(open + 1, i), end: i + 1 };
  }
  return null;
}

function defLines(name: string, params: string[], ret: string | null, comments: string[], indent: string): string[] {
  const sig = `${indent}def ${name}(${params.join(', ')})${ret && ret !== 'None' ? ` -> ${ret}` : ''}:`;
  return [sig, ...comments.map((c) => `${indent}    # ${c}`), `${indent}    pass`];
}

/**
 * A Python stub for a TypeScript starter that is only a signature: one
 * exported function or one exported class with methods, each with an empty
 * body. Anything else (helpers, types, code to debug) returns null.
 */
export function pythonStub(tsStarter: string): string | null {
  const src = tsStarter.replace(/\r\n/g, '\n');
  const header: string[] = [];
  let rest = src;
  // Leading comment lines become the header.
  for (;;) {
    const m = /^\s*\/\/ ?(.*)\n/.exec(rest);
    if (!m) break;
    header.push(m[1].trimEnd());
    rest = rest.slice(m[0].length);
  }
  rest = rest.trim();
  const out: string[] = header.map((h) => (h ? `# ${h}` : '#'));
  if (out.length) out.push('');

  const fn = /^export\s+function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+?))?\s*\{/.exec(rest);
  if (fn) {
    const b = block(rest, fn[0].length - 1);
    if (!b || rest.slice(b.end).trim()) return null;
    const params = pyParams(fn[2]);
    const comments = placeholderComments(b.body);
    if (!params || !comments) return null;
    out.push(...defLines(fn[1], params, fn[3] ? pyType(fn[3]) : null, comments, ''));
    return `${out.join('\n')}\n`;
  }

  const cls = /^export\s+class\s+(\w+)\s*\{/.exec(rest);
  if (cls) {
    const b = block(rest, cls[0].length - 1);
    if (!b || rest.slice(b.end).trim()) return null;
    out.push(`class ${cls[1]}:`);
    let body = b.body;
    let methods = 0;
    for (;;) {
      body = body.replace(/^\s+/, '');
      if (!body) break;
      const m = /^(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+?))?\s*\{/.exec(body);
      if (!m) return null;
      const mb = block(body, m[0].length - 1);
      if (!mb) return null;
      const params = pyParams(m[2]);
      const comments = placeholderComments(mb.body);
      if (!params || !comments) return null;
      if (methods > 0) out.push('');
      const isInit = m[1] === 'constructor';
      out.push(...defLines(isInit ? '__init__' : m[1], ['self', ...params], isInit ? null : m[3] ? pyType(m[3]) : null, comments, '    '));
      methods++;
      body = body.slice(mb.end);
    }
    return methods ? `${out.join('\n')}\n` : null;
  }
  return null;
}
