/**
 * Which solutions have a step-by-step trace, found by the code's fingerprint.
 *
 * Tiny on purpose: every code block in a lesson asks `findTrace(code)`, and
 * only the matching generator is loaded, when the learner opens the trace.
 * Adding a trace: write src/lib/code-trace/problems/<id>.ts, add a line here
 * (the test prints the fingerprint to use), and run the code-trace tests.
 */

import { codeFingerprint } from './fingerprint';
import type { TraceDef } from './trace';

export interface TraceIndexEntry {
  id: string;
  fp: string;
  // Generators are typed per problem; the index only hands them to buildTrace.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<{ default: TraceDef<any, any> }>;
}

export const TRACE_INDEX: TraceIndexEntry[] = [
  // 3y-health-tecnica-v2
  { id: 'two-sum', fp: 'bcc9b6f6-389', load: () => import('./problems/two-sum') },
  { id: 'valid-parentheses', fp: '6a659897-426', load: () => import('./problems/valid-parentheses') },
  { id: 'longest-substring', fp: '55626961-564', load: () => import('./problems/longest-substring') },
  { id: 'merge-intervals', fp: 'b0cecffe-533', load: () => import('./problems/merge-intervals') },
  { id: 'number-of-islands', fp: 'd5fe3b33-1198', load: () => import('./problems/number-of-islands') },
  { id: 'debug-remaining-units', fp: 'f9c3843d-838', load: () => import('./problems/debug-remaining-units') },
  { id: 'group-anagrams', fp: 'a66d4f55-332', load: () => import('./problems/group-anagrams') },
  { id: 'top-k-frequent', fp: 'f460ce4f-672', load: () => import('./problems/top-k-frequent') },
  { id: 'product-except-self', fp: '020fe3ee-479', load: () => import('./problems/product-except-self') },
  { id: 'three-sum', fp: '642ca5b5-895', load: () => import('./problems/three-sum') },
  { id: 'search-rotated', fp: '7623dc06-600', load: () => import('./problems/search-rotated') },
  { id: 'coin-change', fp: 'f041f7e4-509', load: () => import('./problems/coin-change') },
  { id: 'lru-cache', fp: '410d5505-1007', load: () => import('./problems/lru-cache') },
  // 3y-health-tecnica-repaso
  { id: 'best-time-to-buy-sell-stock', fp: 'c8dddf96-270', load: () => import('./problems/best-time-to-buy-sell-stock') },
  { id: 'binary-search', fp: 'c0af7b6d-317', load: () => import('./problems/binary-search') },
  { id: 'climbing-stairs', fp: 'e72424f5-237', load: () => import('./problems/climbing-stairs') },
  { id: 'container-with-most-water', fp: '65bf80dd-361', load: () => import('./problems/container-with-most-water') },
  { id: 'contains-duplicate', fp: '5d64423d-218', load: () => import('./problems/contains-duplicate') },
  { id: 'counting-bits', fp: '7f9db99e-179', load: () => import('./problems/counting-bits') },
  { id: 'course-schedule', fp: '23ff8b36-739', load: () => import('./problems/course-schedule') },
  { id: 'daily-temperatures', fp: '882e58c9-441', load: () => import('./problems/daily-temperatures') },
  { id: 'diameter-of-binary-tree', fp: 'fc5710c5-467', load: () => import('./problems/diameter-of-binary-tree') },
  { id: 'evaluate-rpn', fp: '02e8ae98-525', load: () => import('./problems/evaluate-rpn') },
  { id: 'insert-interval', fp: '7816ce62-560', load: () => import('./problems/insert-interval') },
  { id: 'jump-game', fp: '3c040f13-305', load: () => import('./problems/jump-game') },
  { id: 'koko-eating-bananas', fp: '0a36f9ae-419', load: () => import('./problems/koko-eating-bananas') },
  { id: 'kth-largest-element', fp: '201b0fdd-1113', load: () => import('./problems/kth-largest-element') },
  { id: 'level-order-traversal', fp: 'e2428c76-692', load: () => import('./problems/level-order-traversal') },
  { id: 'linked-list-cycle', fp: '666c8682-350', load: () => import('./problems/linked-list-cycle') },
  { id: 'longest-common-prefix', fp: '07361d50-321', load: () => import('./problems/longest-common-prefix') },
  { id: 'longest-common-subsequence', fp: 'a01de359-597', load: () => import('./problems/longest-common-subsequence') },
  { id: 'longest-consecutive', fp: 'bce16e98-296', load: () => import('./problems/longest-consecutive') },
  { id: 'lowest-common-ancestor-bst', fp: 'e489b003-510', load: () => import('./problems/lowest-common-ancestor-bst') },
  { id: 'majority-element', fp: '45df30d5-260', load: () => import('./problems/majority-element') },
  { id: 'max-depth-binary-tree', fp: 'd8dfd710-238', load: () => import('./problems/max-depth-binary-tree') },
  { id: 'maximum-subarray', fp: '0155b44b-310', load: () => import('./problems/maximum-subarray') },
  { id: 'meeting-rooms-ii', fp: '2ec19f0c-430', load: () => import('./problems/meeting-rooms-ii') },
  { id: 'merge-sorted-array', fp: 'c9b765e7-355', load: () => import('./problems/merge-sorted-array') },
  { id: 'merge-two-sorted-lists', fp: '86a5016e-476', load: () => import('./problems/merge-two-sorted-lists') },
  { id: 'min-size-subarray-sum', fp: '984af21f-403', load: () => import('./problems/min-size-subarray-sum') },
  { id: 'min-stack', fp: '5345d0c0-499', load: () => import('./problems/min-stack') },
  { id: 'move-zeroes', fp: 'ef016506-241', load: () => import('./problems/move-zeroes') },
  { id: 'non-overlapping-intervals', fp: 'a7de21cc-394', load: () => import('./problems/non-overlapping-intervals') },
  { id: 'number-of-provinces', fp: '90091b93-885', load: () => import('./problems/number-of-provinces') },
  { id: 'pivot-index', fp: '6fda7716-288', load: () => import('./problems/pivot-index') },
  { id: 'remove-nth-from-end', fp: 'b5b85b17-510', load: () => import('./problems/remove-nth-from-end') },
  { id: 'reverse-linked-list', fp: 'c222b992-355', load: () => import('./problems/reverse-linked-list') },
  { id: 'rotting-oranges', fp: '068b05b0-945', load: () => import('./problems/rotting-oranges') },
  { id: 'search-insert-position', fp: 'b9164870-352', load: () => import('./problems/search-insert-position') },
  { id: 'single-number', fp: 'dc25b578-146', load: () => import('./problems/single-number') },
  { id: 'subarray-sum-equals-k', fp: 'd7f36672-351', load: () => import('./problems/subarray-sum-equals-k') },
  { id: 'subsets', fp: '937ad7fa-392', load: () => import('./problems/subsets') },
  { id: 'unique-paths', fp: '75a90e73-412', load: () => import('./problems/unique-paths') },
  { id: 'valid-anagram', fp: '48a62c03-301', load: () => import('./problems/valid-anagram') },
  { id: 'valid-palindrome', fp: 'd9900bed-512', load: () => import('./problems/valid-palindrome') },
  { id: 'validate-bst', fp: 'bc4cb8fa-476', load: () => import('./problems/validate-bst') },
];

const byFp = new Map(TRACE_INDEX.map((e) => [e.fp, e]));

/** The trace for this exact code, or null. */
export function findTrace(code: string): TraceIndexEntry | null {
  return byFp.get(codeFingerprint(code)) ?? null;
}
