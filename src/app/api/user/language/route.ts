import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('User/Language');

export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const { language } = body;

    if (!language || !['es', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const { error } = await supabase
      .from(TABLES.userProfiles)
      .update({ language })
      .eq('id', user.id);

    if (error) {
      log.error('Error updating language:', error);
      return NextResponse.json({ error: 'Failed to update language' }, { status: 500 });
    }

    return NextResponse.json({ success: true, language });
  } catch (error) {
    log.error('Error updating language:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update language' },
      { status: 500 }
    );
  }
});
