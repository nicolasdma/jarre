/**
 * Database helper functions — eliminates repeated type conversions.
 */

/**
 * Extract concept name from Supabase join result.
 * Handles both single object and array forms of the join.
 */
export function extractConceptName(
  conceptJoin: unknown,
  fallback: string,
): string {
  if (!conceptJoin) return fallback;

  const obj = conceptJoin as
    | { name: string }
    | { name: string }[]
    | null;

  if (Array.isArray(obj)) {
    return obj[0]?.name || fallback;
  }

  return obj?.name || fallback;
}

/**
 * Extract concept data (name + phase) from Supabase join result.
 */
export function extractConceptData(
  conceptJoin: unknown,
): { name: string; phase: number } | null {
  if (!conceptJoin) return null;

  const obj = conceptJoin as
    | { name: string; phase: number }
    | { name: string; phase: number }[]
    | null;

  if (Array.isArray(obj)) {
    return obj[0] || null;
  }

  return obj || null;
}

/**
 * Parse mastery level from DB string to number.
 * DB stores levels as VARCHAR ('0'-'4'), logic uses numbers.
 */
export function parseMasteryLevel(dbLevel: string | null | undefined): number {
  if (!dbLevel) return 0;
  const parsed = parseInt(dbLevel, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Serialize mastery level from number to DB string.
 */
export function serializeMasteryLevel(level: number): string {
  return level.toString();
}
