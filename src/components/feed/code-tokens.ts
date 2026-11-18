/**
 * A few regexes that color TypeScript/JavaScript for the code-image cards:
 * enough to read as code, no parser. Pure, so it is tested in node.
 */

export type Tok = { t: string; k: 'kw' | 'str' | 'com' | 'num' | 'fn' | 'txt' };

const TOKEN = /(\/\/.*$|\/\*.*?\*\/)|('(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\\.|[^`])*`)|\b(\d+(?:\.\d+)?)\b|\b(const|let|var|function|return|for|of|in|if|else|while|new|export|import|from|type|interface|class|extends|true|false|null|undefined|break|continue|this|async|await|throw)\b|\b([A-Za-z_$][\w$]*)(?=\s*\()/g;

/** Split one line into colored tokens. Pure. */
export function tokenizeLine(line: string): Tok[] {
  const out: Tok[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: line.slice(last, i), k: 'txt' });
    const k: Tok['k'] = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'num' : m[4] ? 'kw' : 'fn';
    out.push({ t: m[0], k });
    last = i + m[0].length;
  }
  if (last < line.length) out.push({ t: line.slice(last), k: 'txt' });
  return out;
}
