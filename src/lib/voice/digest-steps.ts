/**
 * Jarre - The steps every voice session digest runs after the prose summary.
 * Imported for its side effect by the routes that run digests.
 */
import { registerDigestStep } from '@/lib/voice/session-digest';
import { evidenceDigestStep } from '@/lib/tutor/evidence-digest';

registerDigestStep(evidenceDigestStep);
