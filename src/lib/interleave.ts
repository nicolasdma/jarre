/**
 * Interleaving utility for spaced repetition sessions.
 *
 * Randomly shuffles items while ensuring no two consecutive share the same conceptId.
 * Uses Fisher-Yates shuffle + greedy interleave constraint.
 */

/** Fisher-Yates in-place shuffle */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function interleaveByConcept<T extends { conceptId: string }>(items: T[]): T[] {
  if (items.length <= 1) return items;

  // Group by concept, shuffle within each group
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const arr = groups.get(item.conceptId) ?? [];
    arr.push(item);
    groups.set(item.conceptId, arr);
  }
  for (const arr of groups.values()) {
    shuffle(arr);
  }

  const result: T[] = [];
  let lastConcept = '';

  while (result.length < items.length) {
    // Shuffle concept keys each iteration for randomness
    const conceptKeys = shuffle([...groups.keys()]);

    let picked = false;

    // Prefer different concept than last
    for (const key of conceptKeys) {
      if (key !== lastConcept) {
        const arr = groups.get(key)!;
        if (arr.length > 0) {
          result.push(arr.shift()!);
          lastConcept = key;
          if (arr.length === 0) groups.delete(key);
          picked = true;
          break;
        }
      }
    }

    // Only one concept group remains — append
    if (!picked) {
      for (const key of conceptKeys) {
        const arr = groups.get(key);
        if (arr && arr.length > 0) {
          result.push(arr.shift()!);
          lastConcept = key;
          if (arr.length === 0) groups.delete(key);
          break;
        }
      }
    }
  }

  return result;
}
