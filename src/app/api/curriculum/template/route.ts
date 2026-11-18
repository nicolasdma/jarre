import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import {
  auditCurriculumTemplate,
  buildCoreCurriculumTemplate,
} from '@/lib/curriculum/template';
import { createLogger } from '@/lib/logger';

const log = createLogger('CurriculumTemplate');

/**
 * GET /api/curriculum/template[?includeAudit=1]
 *
 * The core curriculum as a template (~250 kB, several queries). Behind the
 * allow-list like every data route, and cached privately in the browser for
 * five minutes: it only changes when lessons are seeded.
 */
export const GET = withAuth(async (request, { supabase }) => {
  try {
    const url = new URL(request.url);
    const includeAudit = url.searchParams.get('includeAudit') === '1';

    const template = await buildCoreCurriculumTemplate(supabase);
    const headers = { 'Cache-Control': 'private, max-age=300' };

    if (!includeAudit) {
      return NextResponse.json(template, { headers });
    }

    const audit = auditCurriculumTemplate(template);
    return NextResponse.json({ template, audit }, { headers });
  } catch (error) {
    log.error('Failed to build curriculum template:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to build curriculum template' }, { status: 500 });
  }
});
