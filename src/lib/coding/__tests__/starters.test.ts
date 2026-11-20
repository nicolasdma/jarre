import { describe, expect, it } from 'vitest';
import { pyType, pythonStub, starterFor } from '../starters';

describe('pyType', () => {
  it.each([
    ['number', 'int'],
    ['string[]', 'list[str]'],
    ['number[][]', 'list[list[int]]'],
    ['[number, number]', 'tuple[int, int]'],
    ['Array<string>', 'list[str]'],
    ['Map<string, number[]>', 'dict[str, list[int]]'],
    ['Record<string, number>', 'dict[str, int]'],
    ['Set<number>', 'set[int]'],
    ['number | null', 'int | None'],
    ["'a' | 'b'", 'str'],
    ['void', 'None'],
  ])('%s → %s', (ts, py) => expect(pyType(ts)).toBe(py));

  it('has no annotation for a type it cannot say faithfully', () => {
    expect(pyType('Session')).toBeNull();
    expect(pyType('Session[]')).toBeNull();
  });
});

describe('pythonStub', () => {
  it('turns a function signature into a def, keeping the comments', () => {
    const ts = `// Two Sum
// Return the indices of the two numbers in \`nums\` that add up to \`target\`.

export function twoSum(nums: number[], target: number): [number, number] {
  // your code
  return [-1, -1];
}`;
    expect(pythonStub(ts)).toBe(`# Two Sum
# Return the indices of the two numbers in \`nums\` that add up to \`target\`.

def twoSum(nums: list[int], target: int) -> tuple[int, int]:
    # your code
    pass
`);
  });

  it('turns a class into a Python class with __init__ and methods', () => {
    const ts = `// LRU Cache

export class LRUCache {
  constructor(capacity: number) {
    // your code
  }

  get(key: number): number {
    // your code
    return -1;
  }

  put(key: number, value: number): void {
    // your code
  }
}`;
    expect(pythonStub(ts)).toBe(`# LRU Cache

class LRUCache:
    def __init__(self, capacity: int):
        # your code
        pass

    def get(self, key: int) -> int:
        # your code
        pass

    def put(self, key: int, value: int):
        # your code
        pass
`);
  });

  it('keeps a parameter without an annotation when its type has no Python form', () => {
    expect(pythonStub('export function f(s: Session, n: number): string {\n  return "";\n}')).toBe('def f(s, n: int) -> str:\n    pass\n');
  });

  it('has no stub for a starter with real code in it (a debugging exercise)', () => {
    const ts = `type Auth = { id: string };
export function remaining(auths: Auth[]) {
  return auths.filter((a) => a.id);
}`;
    expect(pythonStub(ts)).toBeNull();
    expect(pythonStub('export function f(): number {\n  const x = 1;\n  return x;\n}')).toBeNull();
  });
});

describe('starterFor', () => {
  const problem = { starter: 'export function f(n: number): number {\n  return 0;\n}\n' };

  it('derives each language from the TypeScript starter', () => {
    expect(starterFor(problem, 'typescript')).toBe(problem.starter);
    expect(starterFor(problem, 'javascript')).toBe('export function f(n) {\n  return 0;\n}\n');
    expect(starterFor(problem, 'python')).toBe('def f(n: int) -> int:\n    pass\n');
  });

  it("prefers the lesson's own starters", () => {
    expect(starterFor({ ...problem, starters: { python: 'def f(n):\n    return n\n' } }, 'python')).toBe('def f(n):\n    return n\n');
  });
});
