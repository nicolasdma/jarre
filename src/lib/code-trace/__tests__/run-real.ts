/**
 * Test helper: compile a reference solution (TypeScript) with every statement
 * instrumented to record its line, so a test can run the REAL solution and
 * know the exact order of lines it executed.
 *
 * Instrumented, via the TypeScript compiler API:
 * - every statement in a block, a case clause or the module body: a hit on its first line;
 * - a statement that is the body of an if/else/loop without braces: wrapped in a block with its hit;
 * - `for (;;)` / `while` conditions: a hit each time the condition is checked;
 * - `for…of` / `for…in`: a hit on the header line at the start of each iteration;
 * - arrow functions with an expression body: a hit on the expression's line each call;
 * - `return expr`: a second hit on its line once `expr` is evaluated, so a step
 *   can show a recursive call coming back with its value.
 */

import ts from 'typescript';

export interface RealModule {
  exports: Record<string, unknown>;
  /** Lines executed since the last reset, in order. */
  hits: number[];
  reset: () => void;
}

const HIT = '__hit';
const HIT_VALUE = '__hitv';

function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function instrument(): ts.TransformerFactory<ts.SourceFile> {
  return (ctx) => (sf) => {
    const f = ctx.factory;
    const hitCall = (line: number) => f.createCallExpression(f.createIdentifier(HIT), undefined, [f.createNumericLiteral(line)]);
    const hitStmt = (line: number) => f.createExpressionStatement(hitCall(line));
    const isDecl = (s: ts.Statement) =>
      ts.isFunctionDeclaration(s) ||
      ts.isClassDeclaration(s) ||
      ts.isInterfaceDeclaration(s) ||
      ts.isTypeAliasDeclaration(s) ||
      ts.isImportDeclaration(s) ||
      ts.isExportDeclaration(s) ||
      ts.isEmptyStatement(s);

    const statements = (list: ts.NodeArray<ts.Statement>): ts.Statement[] => {
      const out: ts.Statement[] = [];
      for (const s of list) {
        const v = ts.visitNode(s, visit) as ts.Statement;
        if (isDecl(s)) out.push(v);
        else out.push(hitStmt(lineOf(sf, s)), v);
      }
      return out;
    };
    const embedded = (s: ts.Statement): ts.Statement => {
      if (ts.isBlock(s)) return ts.visitNode(s, visit) as ts.Statement;
      return f.createBlock([hitStmt(lineOf(sf, s)), ts.visitNode(s, visit) as ts.Statement], true);
    };
    const withHit = (line: number, e: ts.Expression) => f.createParenthesizedExpression(f.createCommaListExpression([hitCall(line), e]));

    const visit = (node: ts.Node): ts.Node => {
      if (ts.isReturnStatement(node) && node.expression) {
        const expr = ts.visitNode(node.expression, visit) as ts.Expression;
        return f.updateReturnStatement(node, f.createCallExpression(f.createIdentifier(HIT_VALUE), undefined, [f.createNumericLiteral(lineOf(sf, node)), expr]));
      }
      if (ts.isBlock(node)) return f.updateBlock(node, statements(node.statements));
      if (ts.isCaseClause(node)) return f.updateCaseClause(node, ts.visitNode(node.expression, visit) as ts.Expression, statements(node.statements));
      if (ts.isDefaultClause(node)) return f.updateDefaultClause(node, statements(node.statements));
      if (ts.isIfStatement(node)) {
        return f.updateIfStatement(
          node,
          ts.visitNode(node.expression, visit) as ts.Expression,
          embedded(node.thenStatement),
          node.elseStatement ? embedded(node.elseStatement) : undefined,
        );
      }
      if (ts.isForStatement(node)) {
        const line = lineOf(sf, node);
        const cond = node.condition ? (ts.visitNode(node.condition, visit) as ts.Expression) : f.createTrue();
        const body = embedded(node.statement);
        const bodyWithHit = node.condition ? body : f.createBlock([hitStmt(line), body], true);
        return f.updateForStatement(
          node,
          node.initializer ? (ts.visitNode(node.initializer, visit) as ts.ForInitializer) : undefined,
          withHit(line, cond),
          node.incrementor ? (ts.visitNode(node.incrementor, visit) as ts.Expression) : undefined,
          bodyWithHit,
        );
      }
      if (ts.isWhileStatement(node)) {
        return f.updateWhileStatement(node, withHit(lineOf(sf, node), ts.visitNode(node.expression, visit) as ts.Expression), embedded(node.statement));
      }
      if (ts.isDoStatement(node)) {
        return f.updateDoStatement(node, embedded(node.statement), withHit(lineOf(sf, node.expression), ts.visitNode(node.expression, visit) as ts.Expression));
      }
      if (ts.isForOfStatement(node) || ts.isForInStatement(node)) {
        const line = lineOf(sf, node);
        const body = f.createBlock([hitStmt(line), embedded(node.statement)], true);
        const init = ts.visitNode(node.initializer, visit) as ts.ForInitializer;
        const expr = ts.visitNode(node.expression, visit) as ts.Expression;
        return ts.isForOfStatement(node)
          ? f.updateForOfStatement(node, node.awaitModifier, init, expr, body)
          : f.updateForInStatement(node, init, expr, body);
      }
      if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) {
        const body = ts.visitNode(node.body, visit) as ts.Expression;
        return f.updateArrowFunction(node, node.modifiers, node.typeParameters, node.parameters, node.type, node.equalsGreaterThanToken, withHit(lineOf(sf, node.body), body));
      }
      return ts.visitEachChild(node, visit, ctx);
    };

    return f.updateSourceFile(sf, statements(sf.statements));
  };
}

/** Compile and load a solution. Module-level statements run (and are recorded) once, then the hits reset. */
export function loadReal(code: string): RealModule {
  const out = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    transformers: { before: [instrument()] },
    reportDiagnostics: false,
  });
  const hits: number[] = [];
  const mod = { exports: {} as Record<string, unknown> };
  const fn = new Function('module', 'exports', HIT, HIT_VALUE, out.outputText);
  fn(
    mod,
    mod.exports,
    (line: number) => hits.push(line),
    (line: number, value: unknown) => {
      hits.push(line);
      return value;
    },
  );
  hits.length = 0;
  return { exports: mod.exports, hits, reset: () => (hits.length = 0) };
}

/** Collapse runs of the same line (a line with two statements, a header re-checked at once). */
export function collapse(lines: number[]): number[] {
  const out: number[] = [];
  for (const l of lines) if (out[out.length - 1] !== l) out.push(l);
  return out;
}

/** Index in `seq` where `sub` stops being a subsequence of it, or -1 when it is one. */
export function subsequenceBreak(sub: number[], seq: number[]): number {
  let j = 0;
  for (let i = 0; i < sub.length; i++) {
    while (j < seq.length && seq[j] !== sub[i]) j++;
    if (j === seq.length) return i;
    j++;
  }
  return -1;
}
