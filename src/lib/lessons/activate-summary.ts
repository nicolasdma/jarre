import { z } from 'zod';

/**
 * The overview a lesson brings for its first screen: `activate` in the lesson
 * JSON, stored as resources.activate_data by scripts/seed-lesson.ts and by
 * the pipeline (write-to-db.ts). Only what the learn view shows is read.
 */
const ActivateSummarySchema = z.object({
  summary: z.string().trim().min(1),
  sections: z
    .array(z.object({ number: z.number().int(), title: z.string(), description: z.string() }))
    .optional(),
});

export type ActivateSummary = z.infer<typeof ActivateSummarySchema>;

/** The stored overview, or null when there is none or it is not the expected shape. */
export function activateSummaryOf(raw: unknown): ActivateSummary | null {
  const parsed = ActivateSummarySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
