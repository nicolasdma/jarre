import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  auditCurriculumTemplate,
  buildCoreCurriculumTemplate,
} from '@/lib/curriculum/template';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeAudit = url.searchParams.get('includeAudit') === '1';

    const supabase = await createClient();
    const template = await buildCoreCurriculumTemplate(supabase);

    if (!includeAudit) {
      return NextResponse.json(template);
    }

    const audit = auditCurriculumTemplate(template);
    return NextResponse.json({ template, audit });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to build curriculum template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
