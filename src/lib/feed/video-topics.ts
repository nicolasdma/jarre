/**
 * The closed taxonomy of video topics for the feed, and which lesson concept
 * each topic serves. A YouTube video enters a lesson's feed only when the
 * classifier (video-classifier.ts) names one of these topics in its title, a
 * chapter, or (for a short) its tags plus description, and the lesson maps
 * that topic to a concept. Nothing outside this list reaches the feed.
 *
 * - `problem`: one LeetCode problem, named by its title or its number.
 * - `idea`: a technique or a piece of interview craft (Big-O, sliding window,
 *   how to approach the round). A video that names a problem is about that
 *   problem, so idea topics only count when no problem topic matched.
 *
 * Patterns run on normalized text (lowercase, no accents, see normalizeText),
 * so they are written lowercase and without accents.
 *
 * `query` / `queryEs` are what scripts/feed-videos/build-index.ts searches
 * (search.list, 1 call each from the 100/day bucket). Spanish only where
 * Spanish content on the idea exists.
 */

export type TopicKind = 'problem' | 'idea';

export interface VideoTopic {
  id: string;
  kind: TopicKind;
  /** Any of these naming the topic is a hit. */
  names: RegExp[];
  /** A title that matches any of these is NOT this topic (a sibling problem). */
  not?: RegExp[];
  /** The LeetCode number: "leetcode 1", "lc 1", "#1". */
  lc?: number;
  /** English search query (shorts first, see the build script). */
  query: string;
  /** Spanish search query, when there is Spanish content on it. */
  queryEs?: string;
}

/** A phrase as a word-bounded pattern: spaces match space, dash or nothing. */
export function ph(phrase: string): RegExp {
  const body = phrase
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\s\\-_]*');
  return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`);
}

function problem(id: string, lc: number, names: (string | RegExp)[], not: (string | RegExp)[] = []): VideoTopic {
  const rx = names.map((n) => (typeof n === 'string' ? ph(n) : n));
  const first = typeof names[0] === 'string' ? names[0] : id.replace(/-/g, ' ');
  return { id, kind: 'problem', lc, names: rx, not: not.map((n) => (typeof n === 'string' ? ph(n) : n)), query: `${first} leetcode ${lc}` };
}

function idea(id: string, names: (string | RegExp)[], query: string, queryEs?: string, not: (string | RegExp)[] = []): VideoTopic {
  return {
    id,
    kind: 'idea',
    names: names.map((n) => (typeof n === 'string' ? ph(n) : n)),
    not: not.map((n) => (typeof n === 'string' ? ph(n) : n)),
    query,
    queryEs,
  };
}

export const VIDEO_TOPICS: VideoTopic[] = [
  // ---- Problems ------------------------------------------------------------
  problem('two-sum', 1, [/(?<![a-z0-9])(two|2)[\s-]?sum(?![a-z0-9])/], [/(two|2)[\s-]?sum[\s-]*(ii|2|iii|3|iv|4|less|closest|bst)\b/, 'sorted', '3sum', '4sum', 'k sum', 'three sum']),
  problem('valid-parentheses', 20, ['valid parentheses', 'balanced parentheses', 'balanced brackets'], ['longest valid', 'generate parentheses']),
  problem('longest-substring', 3, ['longest substring without repeating', 'longest substring without repeating characters'], ['k distinct', 'at most']),
  problem('number-of-islands', 200, ['number of islands'], ['distinct islands', 'ii']),
  problem('merge-intervals', 56, ['merge intervals', 'merge overlapping intervals'], []),
  problem('group-anagrams', 49, ['group anagrams'], []),
  problem('top-k-frequent', 347, ['top k frequent elements', 'top k frequent'], ['words']),
  problem('product-except-self', 238, ['product of array except self', 'product except self'], []),
  problem('three-sum', 15, [/(?<![a-z0-9])(3|three)[\s-]?sum(?![a-z0-9])/], ['closest', 'smaller', 'multiplicity', '4sum']),
  problem('search-rotated', 33, ['search in rotated sorted array'], ['minimum', 'ii']),
  problem('coin-change', 322, ['coin change'], ['coin change 2', 'coin change ii']),
  problem('lru-cache', 146, ['lru cache', 'least recently used cache'], ['lfu']),
  problem('contains-duplicate', 217, ['contains duplicate'], ['contains duplicate ii', 'contains duplicate iii', 'contains duplicate 2']),
  problem('valid-anagram', 242, ['valid anagram'], []),
  problem('longest-consecutive', 128, ['longest consecutive sequence'], []),
  problem('majority-element', 169, ['majority element', 'boyer moore voting', 'moore voting'], ['majority element ii', 'majority element 2']),
  problem('encode-decode-strings', 271, ['encode and decode strings'], ['tinyurl']),
  problem('first-unique-char', 387, ['first unique character'], []),
  problem('valid-palindrome', 125, ['valid palindrome'], ['valid palindrome ii', 'valid palindrome 2']),
  problem('two-sum-sorted', 167, [/(two|2)[\s-]?sum[\s-]*(ii|2)(?![a-z0-9])/, 'two sum input array is sorted'], ['bst']),
  problem('container-with-most-water', 11, ['container with most water'], []),
  problem('move-zeroes', 283, ['move zeroes', 'move zeros'], []),
  problem('remove-duplicates-sorted', 26, ['remove duplicates from sorted array'], ['ii', 'list']),
  problem('trapping-rain-water', 42, ['trapping rain water', 'trapping rainwater', 'trap rain water'], ['ii']),
  problem('merge-sorted-array', 88, ['merge sorted array'], []),
  problem('best-time-stock', 121, ['best time to buy and sell stock', 'buy and sell stock'], [/stock[\s-]*(ii|iii|iv|2|3|4|with)/, 'cooldown', 'transaction fee']),
  problem('min-size-subarray-sum', 209, ['minimum size subarray sum'], []),
  problem('longest-repeating-char-replacement', 424, ['longest repeating character replacement'], []),
  problem('permutation-in-string', 567, ['permutation in string'], []),
  problem('minimum-window-substring', 76, ['minimum window substring'], []),
  problem('subarray-sum-equals-k', 560, ['subarray sum equals k'], []),
  problem('range-sum-query', 303, ['range sum query'], ['2d', 'mutable']),
  problem('pivot-index', 724, ['find pivot index', 'pivot index'], []),
  problem('min-stack', 155, ['min stack'], []),
  problem('daily-temperatures', 739, ['daily temperatures'], []),
  problem('evaluate-rpn', 150, ['evaluate reverse polish notation', 'reverse polish notation'], []),
  problem('next-greater-element', 496, ['next greater element'], ['ii', 'iii']),
  problem('binary-search', 704, [/binary search[\s-]*[-|:][\s-]*leet\s*code[\s-]*704/], []),
  problem('search-insert-position', 35, ['search insert position'], []),
  problem('find-min-rotated', 153, ['find minimum in rotated sorted array'], ['ii']),
  problem('koko-eating-bananas', 875, ['koko eating bananas'], []),
  problem('search-2d-matrix', 74, ['search a 2d matrix', 'search 2d matrix'], ['ii']),
  problem('reverse-linked-list', 206, ['reverse linked list', 'reverse a linked list'], ['ii', 'k group', 'k-group']),
  problem('merge-two-sorted-lists', 21, ['merge two sorted lists', 'merge 2 sorted lists'], []),
  problem('linked-list-cycle', 141, ['linked list cycle', 'detect cycle in a linked list'], ['ii']),
  problem('remove-nth-from-end', 19, ['remove nth node from end'], []),
  problem('middle-of-linked-list', 876, ['middle of the linked list', 'middle of linked list'], []),
  problem('max-depth-binary-tree', 104, ['maximum depth of binary tree', 'max depth of binary tree'], ['minimum depth']),
  problem('invert-binary-tree', 226, ['invert binary tree'], []),
  problem('level-order-traversal', 102, ['binary tree level order traversal', 'level order traversal'], ['zigzag', 'ii']),
  problem('validate-bst', 98, ['validate binary search tree'], []),
  problem('lca-bst', 235, ['lowest common ancestor of a binary search tree', 'lowest common ancestor of a bst', 'lowest common ancestor in a bst'], []),
  problem('diameter-binary-tree', 543, ['diameter of binary tree', 'diameter of a binary tree'], []),
  problem('kth-smallest-bst', 230, ['kth smallest element in a bst', 'kth smallest element in bst'], []),
  problem('rotting-oranges', 994, ['rotting oranges'], []),
  problem('course-schedule', 207, ['course schedule'], ['course schedule ii', 'course schedule 2', 'iii', 'iv']),
  problem('number-of-provinces', 547, ['number of provinces', 'friend circles'], []),
  problem('shortest-path-binary-matrix', 1091, ['shortest path in binary matrix'], []),
  problem('kth-largest-element', 215, ['kth largest element in an array', 'kth largest element'], ['stream']),
  problem('k-closest-points', 973, ['k closest points to origin'], []),
  problem('merge-k-sorted-lists', 23, ['merge k sorted lists'], []),
  problem('insert-interval', 57, ['insert interval'], []),
  problem('non-overlapping-intervals', 435, ['non overlapping intervals', 'non-overlapping intervals'], []),
  problem('meeting-rooms-ii', 253, [/meeting rooms[\s-]*(ii|2)(?![a-z0-9])/], []),
  problem('jump-game', 55, ['jump game'], [/jump game[\s-]*(ii|2|iii|3|iv|vi|vii)/]),
  problem('maximum-subarray', 53, ['maximum subarray', "kadane's algorithm", 'kadanes algorithm', 'kadane algorithm'], ['product', 'circular']),
  problem('subsets', 78, [/(?<![a-z0-9])subsets(?![a-z0-9])[\s-]*[-|:]/, 'subsets leetcode', 'power set'], ['subsets ii', 'partition']),
  problem('permutations', 46, [/(?<![a-z0-9])permutations(?![a-z0-9])[\s-]*[-|:]/, 'permutations leetcode'], ['permutations ii', 'in string', 'next permutation', 'letter case']),
  problem('combination-sum', 39, ['combination sum'], ['ii', 'iii', 'iv']),
  problem('generate-parentheses', 22, ['generate parentheses'], []),
  problem('climbing-stairs', 70, ['climbing stairs'], ['min cost']),
  problem('house-robber', 198, ['house robber'], ['ii', 'iii']),
  problem('unique-paths', 62, ['unique paths'], ['ii', 'iii']),
  problem('longest-increasing-subsequence', 300, ['longest increasing subsequence'], []),
  problem('longest-common-subsequence', 1143, ['longest common subsequence'], []),
  problem('word-break', 139, ['word break'], ['ii']),
  problem('implement-trie', 208, ['implement trie', 'trie data structure', 'prefix tree'], []),
  problem('single-number', 136, ['single number'], ['ii', 'iii']),
  problem('counting-bits', 338, ['counting bits'], []),
  problem('power-of-two', 231, ['power of two', 'power of 2'], []),
  problem('longest-common-prefix', 14, ['longest common prefix'], []),
  problem('reverse-words', 151, ['reverse words in a string'], ['iii']),
  problem('is-subsequence', 392, ['is subsequence'], []),

  // ---- Ideas ---------------------------------------------------------------
  idea('big-o', ['big o', 'big o notation', 'time complexity', 'space complexity', 'notacion big o', 'complejidad algoritmica', 'complejidad temporal'], 'big o notation explained', 'notacion big o explicada'),
  idea('log-n', [/(?<![a-z0-9])o\s*\(\s*log\s*n\s*\)/, 'logarithmic time', 'log n complexity', 'logarithms in programming'], 'why is binary search log n', undefined, ['n log n']),
  idea('amortized', ['amortized analysis', 'amortized time', 'amortized complexity', 'dynamic array'], 'amortized analysis dynamic array'),
  idea('sorting-cost', [/n\s*log\s*n.*sort|sort.*n\s*log\s*n/, 'merge sort', 'comparison sort'], 'why sorting is n log n', 'merge sort explicado'),
  idea('recursion-space', ['call stack', 'recursion stack', 'stack overflow recursion', 'space complexity of recursion', 'pila de llamadas'], 'recursion call stack space complexity', 'recursion pila de llamadas'),
  idea('iterative-vs-recursive', ['recursion vs iteration', 'iterative vs recursive', 'iteration vs recursion', 'recursive vs iterative'], 'recursion vs iteration'),
  idea('hash-table', ['hash table', 'hash tables', 'hash map', 'hashmap', 'hashing', 'tabla hash', 'tablas hash'], 'hash table time complexity collisions', 'tabla hash explicada'),
  idea('two-pointers', ['two pointers', 'two pointer', 'two pointer technique', 'dos punteros'], 'two pointers technique', 'tecnica dos punteros'),
  idea('binary-search-idea', ['binary search', 'busqueda binaria'], 'binary search explained', 'busqueda binaria explicada', ['binary search tree', 'binary search trees', 'bst', 'arbol binario de busqueda', 'arboles binarios de busqueda']),
  idea('sliding-window', ['sliding window', 'ventana deslizante'], 'sliding window technique', 'ventana deslizante algoritmo'),
  idea('prefix-sum', ['prefix sum', 'prefix sums', 'suma de prefijos'], 'prefix sum technique'),
  idea('monotonic-stack', ['monotonic stack', 'monotonic stacks', 'pila monotona'], 'monotonic stack explained'),
  idea('bfs', ['breadth first search', 'breadth-first search', 'bfs algorithm', 'bfs on a grid', 'busqueda en anchura'], 'breadth first search grid'),
  idea('union-find', ['union find', 'disjoint set union', 'disjoint set'], 'union find path compression'),
  idea('topological-sort', ['topological sort', 'topological sorting', "kahn's algorithm", 'kahns algorithm'], 'topological sort kahn algorithm'),
  idea('heap', ['priority queue', 'min heap', 'max heap', 'heap data structure', 'heaps'], 'heap priority queue explained', 'heap estructura de datos', ['distributed', 'system design', 'scaled', 'heap memory', 'stack vs heap', 'stack and heap']),
  idea('backtracking', ['backtracking'], 'backtracking explained', 'backtracking algoritmo'),
  idea('dynamic-programming', ['dynamic programming', 'programacion dinamica', 'memoization', 'tabulation'], 'dynamic programming explained', 'programacion dinamica explicada'),
  idea('floyd-cycle', ["floyd's cycle", 'floyd cycle', 'tortoise and hare', 'tortoise and the hare', 'fast and slow pointers', 'fast and slow pointer'], 'fast and slow pointers floyd cycle'),
  idea('bit-manipulation', ['bit manipulation', 'bitwise operators', 'bitwise', 'xor trick', 'xor'], 'bit manipulation tricks'),
  idea('greedy', ['greedy algorithm', 'greedy algorithms'], 'greedy algorithms explained'),
  idea('interview-approach', [/coding interview.*(approach|framework|steps|strategy|tips|how to|plan)|(approach|framework|steps|strategy|tips|how to).*coding interview/, 'how to solve any coding problem', 'how to approach a coding problem', /entrevistas? tecnicas?.*(resolver|codigo|algoritm|leetcode|en vivo|live coding|problema)|(resolver|codigo|algoritm|leetcode|problema).*entrevistas? tecnicas?/], 'how to approach a coding interview', 'como resolver una entrevista tecnica de programacion'),
  idea('clarifying-questions', ['clarifying questions'], 'clarifying questions coding interview'),
  idea('think-out-loud', ['think out loud', 'thinking out loud', 'communicate in a coding interview', 'communication in coding interviews'], 'think out loud coding interview'),
  idea('interview-stuck', [/stuck (on|in|during) a? ?(coding|leetcode|technical)/, 'when you get stuck'], 'what to do when stuck in a coding interview'),
  idea('brute-force-first', [/brute force (to|then|first).*(optimal|optimi)/, 'brute force vs optimal', 'brute force first'], 'brute force to optimal solution interview'),
  idea('edge-cases', ['edge cases', 'test cases coding interview', 'dry run'], 'edge cases coding interview'),
  idea('constraints-complexity', [/constraints.*(complexity|big o)|(complexity|big o).*constraints/, 'input size'], 'leetcode constraints time complexity'),
  idea('immutable-strings', ['immutable strings', 'strings are immutable', 'string immutability', 'string builder'], 'strings are immutable javascript'),
  idea('js-sort', [/(javascript|js).*\bsort\b|\bsort\(\).*(numbers|compare)/, 'array sort javascript', 'sort numbers javascript'], 'javascript sort numbers comparator'),
  idea('js-falsy', ['falsy', 'truthy and falsy', 'truthy'], 'javascript truthy falsy'),
  idea('js-map-vs-object', ['map vs object', 'maps vs objects', 'map and set javascript'], 'javascript map vs object'),
  idea('js-bigint', ['bigint', 'max safe integer', 'number max safe integer'], 'javascript bigint max safe integer'),
  idea('js-for-in-of', [/for\W*in\W*(vs|and)\W*for\W*of|for\W*of\W*(vs|and)\W*for\W*in/], 'for in vs for of javascript'),
  idea('typescript-live', ['typescript in 100 seconds', 'typescript tips', 'typescript tuples', 'typescript generics'], 'typescript tips'),
  idea('out-of-memory', ['external sorting', 'external sort', 'streaming algorithm', 'reservoir sampling', 'does not fit in memory'], 'external sort data does not fit in memory'),
];

export const TOPIC_BY_ID: Record<string, VideoTopic> = Object.fromEntries(VIDEO_TOPICS.map((t) => [t.id, t]));

/**
 * Per lesson: topic → the concepts it serves. The concept ids are the lesson
 * JSON's (the same ids seeded into the database, scripts/seed-lesson.ts).
 */
export const LESSON_VIDEO_TOPICS: Record<string, Record<string, string[]>> = {
  '3y-health-tecnica-v2': {
    'interview-approach': ['3yt-v2-metodo'],
    'think-out-loud': ['3yt-v2-metodo'],
    'clarifying-questions': ['3yt-v2-metodo'],
    'big-o': ['3yt-v2-big-o'],
    'two-sum': ['3yt-v2-two-sum'],
    'valid-parentheses': ['3yt-v2-valid-parentheses'],
    'longest-substring': ['3yt-v2-longest-substring'],
    'sliding-window': ['3yt-v2-longest-substring'],
    'number-of-islands': ['3yt-v2-number-of-islands'],
    bfs: ['3yt-v2-number-of-islands'],
    'merge-intervals': ['3yt-v2-merge-intervals'],
    'edge-cases': ['3yt-v2-debug-remaining-units'],
    'group-anagrams': ['3yt-v2-group-anagrams'],
    'top-k-frequent': ['3yt-v2-top-k-frequent'],
    'product-except-self': ['3yt-v2-product-except-self'],
    'prefix-sum': ['3yt-v2-product-except-self'],
    'three-sum': ['3yt-v2-three-sum'],
    'two-pointers': ['3yt-v2-three-sum'],
    'search-rotated': ['3yt-v2-search-rotated'],
    'binary-search-idea': ['3yt-v2-search-rotated'],
    'coin-change': ['3yt-v2-coin-change'],
    'dynamic-programming': ['3yt-v2-coin-change'],
    'lru-cache': ['3yt-v2-lru-cache'],
  },
  '3y-health-tecnica-repaso': {
    'interview-approach': ['3yr-plan-de-30-minutos'],
    'clarifying-questions': ['3yr-aclarar'],
    'brute-force-first': ['3yr-fuerza-bruta-primero'],
    'think-out-loud': ['3yr-narrar-mientras-codeas'],
    'edge-cases': ['3yr-probar-en-voz-alta', '3yr-bordes-checklist', '3yr-como-lo-testearias'],
    'big-o': ['3yr-leer-big-o', '3yr-cerrar-con-big-o'],
    'interview-stuck': ['3yr-cuando-te-trabas'],
    'log-n': ['3yr-log-n-por-que'],
    amortized: ['3yr-amortizado'],
    'sorting-cost': ['3yr-costo-de-ordenar'],
    'recursion-space': ['3yr-espacio-de-la-recursion'],
    'hash-table': ['3yr-hash-promedio-vs-peor'],
    'constraints-complexity': ['3yr-restricciones-a-complejidad'],
    'immutable-strings': ['3yr-strings-inmutables'],
    'two-pointers': ['3yr-si-esta-ordenado'],
    'binary-search-idea': ['3yr-si-esta-ordenado', '3yr-binary-search'],
    'out-of-memory': ['3yr-no-entra-en-memoria'],
    'iterative-vs-recursive': ['3yr-iterativo-o-recursivo'],
    'contains-duplicate': ['3yr-contains-duplicate'],
    'valid-anagram': ['3yr-valid-anagram'],
    'longest-consecutive': ['3yr-longest-consecutive'],
    'majority-element': ['3yr-majority-element'],
    'encode-decode-strings': ['3yr-encode-decode-strings'],
    'first-unique-char': ['3yr-first-unique-char'],
    'valid-palindrome': ['3yr-valid-palindrome'],
    'two-sum-sorted': ['3yr-two-sum-sorted'],
    'container-with-most-water': ['3yr-container-with-most-water'],
    'move-zeroes': ['3yr-move-zeroes'],
    'remove-duplicates-sorted': ['3yr-remove-duplicates-sorted'],
    'trapping-rain-water': ['3yr-trapping-rain-water'],
    'merge-sorted-array': ['3yr-merge-sorted-array'],
    'best-time-stock': ['3yr-best-time-to-buy-sell-stock'],
    'min-size-subarray-sum': ['3yr-min-size-subarray-sum'],
    'sliding-window': ['3yr-min-size-subarray-sum', '3yr-permutation-in-string'],
    'longest-repeating-char-replacement': ['3yr-longest-repeating-char-replacement'],
    'permutation-in-string': ['3yr-permutation-in-string'],
    'minimum-window-substring': ['3yr-minimum-window-substring'],
    'subarray-sum-equals-k': ['3yr-subarray-sum-equals-k'],
    'prefix-sum': ['3yr-range-sum-query', '3yr-subarray-sum-equals-k'],
    'range-sum-query': ['3yr-range-sum-query'],
    'pivot-index': ['3yr-pivot-index'],
    'min-stack': ['3yr-min-stack'],
    'daily-temperatures': ['3yr-daily-temperatures'],
    'monotonic-stack': ['3yr-daily-temperatures', '3yr-next-greater-element'],
    'evaluate-rpn': ['3yr-evaluate-rpn'],
    'next-greater-element': ['3yr-next-greater-element'],
    'binary-search': ['3yr-binary-search'],
    'search-insert-position': ['3yr-search-insert-position'],
    'find-min-rotated': ['3yr-find-min-rotated'],
    'koko-eating-bananas': ['3yr-koko-eating-bananas'],
    'search-2d-matrix': ['3yr-search-2d-matrix'],
    'reverse-linked-list': ['3yr-reverse-linked-list'],
    'merge-two-sorted-lists': ['3yr-merge-two-sorted-lists'],
    'linked-list-cycle': ['3yr-linked-list-cycle'],
    'floyd-cycle': ['3yr-linked-list-cycle', '3yr-middle-of-linked-list'],
    'remove-nth-from-end': ['3yr-remove-nth-from-end'],
    'middle-of-linked-list': ['3yr-middle-of-linked-list'],
    'max-depth-binary-tree': ['3yr-max-depth-binary-tree'],
    'invert-binary-tree': ['3yr-invert-binary-tree'],
    'level-order-traversal': ['3yr-level-order-traversal'],
    bfs: ['3yr-level-order-traversal', '3yr-rotting-oranges', '3yr-shortest-path-binary-matrix'],
    'validate-bst': ['3yr-validate-bst'],
    'lca-bst': ['3yr-lowest-common-ancestor-bst'],
    'diameter-binary-tree': ['3yr-diameter-of-binary-tree'],
    'kth-smallest-bst': ['3yr-kth-smallest-in-bst'],
    'rotting-oranges': ['3yr-rotting-oranges'],
    'course-schedule': ['3yr-course-schedule'],
    'topological-sort': ['3yr-course-schedule'],
    'number-of-provinces': ['3yr-number-of-provinces'],
    'union-find': ['3yr-number-of-provinces'],
    'shortest-path-binary-matrix': ['3yr-shortest-path-binary-matrix'],
    'kth-largest-element': ['3yr-kth-largest-element'],
    heap: ['3yr-kth-largest-element', '3yr-k-closest-points', '3yr-merge-k-sorted-lists'],
    'k-closest-points': ['3yr-k-closest-points'],
    'merge-k-sorted-lists': ['3yr-merge-k-sorted-lists'],
    'insert-interval': ['3yr-insert-interval'],
    'non-overlapping-intervals': ['3yr-non-overlapping-intervals'],
    'meeting-rooms-ii': ['3yr-meeting-rooms-ii'],
    greedy: ['3yr-jump-game', '3yr-non-overlapping-intervals'],
    'jump-game': ['3yr-jump-game'],
    'maximum-subarray': ['3yr-maximum-subarray'],
    subsets: ['3yr-subsets'],
    backtracking: ['3yr-subsets', '3yr-permutations', '3yr-combination-sum', '3yr-generate-parentheses'],
    permutations: ['3yr-permutations'],
    'combination-sum': ['3yr-combination-sum'],
    'generate-parentheses': ['3yr-generate-parentheses'],
    'climbing-stairs': ['3yr-climbing-stairs'],
    'dynamic-programming': ['3yr-climbing-stairs', '3yr-house-robber', '3yr-unique-paths', '3yr-word-break'],
    'house-robber': ['3yr-house-robber'],
    'unique-paths': ['3yr-unique-paths'],
    'longest-increasing-subsequence': ['3yr-longest-increasing-subsequence'],
    'longest-common-subsequence': ['3yr-longest-common-subsequence'],
    'word-break': ['3yr-word-break'],
    'implement-trie': ['3yr-implement-trie'],
    'single-number': ['3yr-single-number'],
    'bit-manipulation': ['3yr-single-number', '3yr-counting-bits', '3yr-power-of-two'],
    'counting-bits': ['3yr-counting-bits'],
    'power-of-two': ['3yr-power-of-two'],
    'longest-common-prefix': ['3yr-longest-common-prefix'],
    'reverse-words': ['3yr-reverse-words'],
    'is-subsequence': ['3yr-is-subsequence'],
    'js-sort': ['3yr-sort-sin-comparador'],
    'js-falsy': ['3yr-cero-es-falsy'],
    'js-map-vs-object': ['3yr-map-vs-objeto'],
    'js-bigint': ['3yr-enteros-seguros'],
    'js-for-in-of': ['3yr-for-in-vs-for-of'],
    'typescript-live': ['3yr-typescript-en-vivo'],
  },
};
