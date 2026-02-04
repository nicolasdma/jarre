import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { language } = body;

    if (!language || !['es', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ language })
      .eq('id', user.id);

    if (error) {
      console.error('[User] Error updating language:', error);
      return NextResponse.json({ error: 'Failed to update language' }, { status: 500 });
    }

    return NextResponse.json({ success: true, language });
  } catch (error) {
    console.error('[User] Error updating language:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update language' },
      { status: 500 }
    );
  }
}
