/**
 * Exercise grading — client-side, no LLM calls.
 *
 * Each exercise type has a pure function that returns a 0-100 score.
 */

/**
 * Kendall-tau distance normalized to 0-100.
 * Measures how far the user's order is from the correct order.
 */
export function gradeSequence(userOrder: string[], correctOrder: string[]): number {
  if (userOrder.length !== correctOrder.length) return 0;
  const n = correctOrder.length;
  if (n <= 1) return userOrder[0] === correctOrder[0] ? 100 : 0;

  // Count pairwise inversions
  let inversions = 0;
  const maxInversions = (n * (n - 1)) / 2;

  // Build position map for correct order
  const correctPos = new Map<string, number>();
  correctOrder.forEach((id, i) => correctPos.set(id, i));

  // Map user order to correct positions
  const mapped = userOrder.map((id) => correctPos.get(id) ?? -1);
  if (mapped.includes(-1)) return 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (mapped[i] > mapped[j]) inversions++;
    }
  }

  return Math.round((1 - inversions / maxInversions) * 100);
}

/**
 * Label grading: correct placements / total zones * 100.
 */
export function gradeLabel(
  placements: Record<string, string>,
  zones: { id: string; correctLabel: string }[]
): number {
  if (zones.length === 0) return 0;

  let correct = 0;
  for (const zone of zones) {
    if (placements[zone.id] === zone.correctLabel) correct++;
  }

  return Math.round((correct / zones.length) * 100);
}

/**
 * Connection grading: correct connections / expected connections * 100.
 * A connection [a,b] matches if [a,b] or [b,a] is in the expected set.
 */
export function gradeConnect(
  userConnections: [string, string][],
  correctConnections: [string, string][]
): number {
  if (correctConnections.length === 0) return 0;

  const normalize = (a: string, b: string): string =>
    a < b ? `${a}->${b}` : `${b}->${a}`;

  const expectedSet = new Set(correctConnections.map(([a, b]) => normalize(a, b)));
  const userSet = new Set(userConnections.map(([a, b]) => normalize(a, b)));

  let correctCount = 0;
  for (const conn of userSet) {
    if (expectedSet.has(conn)) correctCount++;
  }

  // Penalize extra connections
  const extraCount = Math.max(0, userSet.size - expectedSet.size);
  const penalizedScore = Math.max(0, correctCount - extraCount * 0.5);

  return Math.round((penalizedScore / expectedSet.size) * 100);
}
