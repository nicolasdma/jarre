/**
 * Jarre - Voice Session Token Route
 *
 * Mints a short-lived Gemini Live ephemeral token for the browser. The API key
 * never leaves the server (until 2026-11-18 this route returned it raw). What
 * the token locks and why: src/lib/voice/live-token.ts.
 *
 * POST /api/voice/token  { reason?, sessionType?, model? }
 * Response: { token, model, voiceName, expiresAt, newSessionExpiresAt, remainingSeconds }
 */

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { jsonOk } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';
import { checkTokenBudget, checkVoiceTimeBudget } from '@/lib/api/rate-limit';
import { DEFAULT_LIVE_VOICE, DEFAULT_VOICE_LIVE_MODEL, isLiveVoice, isVoiceLiveModel } from '@/lib/voice/live-models';
import { buildVoiceTokenConfig } from '@/lib/voice/live-token';

const log = createLogger('VoiceToken');

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 40) : 'unspecified';
  const sessionType = typeof body?.sessionType === 'string' ? body.sessionType.slice(0, 40) : 'unknown';
  const model = isVoiceLiveModel(body?.model) ? body.model : DEFAULT_VOICE_LIVE_MODEL;

  const budget = await checkTokenBudget(supabase, user.id, !!byokKeys.deepseek);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: budget.message, reason: budget.reason, used: budget.used, limit: budget.limit },
      { status: 429 },
    );
  }

  const voiceBudget = await checkVoiceTimeBudget(supabase, user.id, !!byokKeys.gemini);
  if (!voiceBudget.allowed) {
    return NextResponse.json(
      { error: voiceBudget.message, reason: voiceBudget.reason, remainingSeconds: 0 },
      { status: 429 },
    );
  }

  // A BYOK key mints its own token; no key is ever echoed back.
  const apiKey = byokKeys.gemini || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    log.error('GEMINI_API_KEY not configured');
    throw new Error('Voice service not configured');
  }

  const voiceName = isLiveVoice(body?.voiceName) ? body.voiceName : DEFAULT_LIVE_VOICE;
  const config = buildVoiceTokenConfig(model, Date.now(), voiceName);
  let tokenName: string | undefined;
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await ai.authTokens.create({ config });
    tokenName = token.name;
  } catch (error) {
    log.error('Failed to mint a Live token:', error instanceof Error ? error.message.slice(0, 300) : error);
    return NextResponse.json({ error: 'Voice service unavailable' }, { status: 502 });
  }
  if (!tokenName) {
    log.error('Live token response had no name');
    return NextResponse.json({ error: 'Voice service unavailable' }, { status: 502 });
  }

  log.info(`Voice token issued (reason=${reason}, sessionType=${sessionType}, model=${model})`);

  const remainingSeconds = Number.isFinite(voiceBudget.remainingSeconds)
    ? voiceBudget.remainingSeconds
    : null;
  return jsonOk({
    token: tokenName,
    model,
    voiceName,
    expiresAt: config.expireTime,
    newSessionExpiresAt: config.newSessionExpireTime,
    remainingSeconds,
  });
});
