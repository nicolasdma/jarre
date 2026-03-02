import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { FREE_VOICE_MINUTES } from '@/lib/constants';

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  const status = profile?.subscription_status || 'free';

  // Voice minutes used this month (free tier only)
  let voiceMinutesUsed = 0;
  const voiceMinutesLimit = status === 'active' ? Infinity : FREE_VOICE_MINUTES;

  if (status !== 'active') {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const { data: voiceRows } = await supabase
      .from(TABLES.voiceSessions)
      .select('duration_seconds')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString());

    const totalSeconds = (voiceRows || []).reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    voiceMinutesUsed = Math.round(totalSeconds / 60 * 10) / 10; // 1 decimal
  }

  return NextResponse.json({
    status,
    isActive: status === 'active',
    voiceMinutesUsed,
    voiceMinutesLimit,
  });
});
