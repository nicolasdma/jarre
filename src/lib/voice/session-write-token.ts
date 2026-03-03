import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_SECONDS = 8 * 60 * 60;

export interface VoiceSessionWriteTokenPayload {
  v: 1;
  sid: string;
  uid: string;
  iat: number;
  exp: number;
}

function getSigningSecret(): string {
  const secret =
    process.env.VOICE_SESSION_TOKEN_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    '';

  if (!secret) {
    throw new Error(
      'Missing VOICE_SESSION_TOKEN_SECRET or SUPABASE_SECRET_KEY for voice session token signing',
    );
  }

  return secret;
}

function signPayload(payloadBase64Url: string): Buffer {
  return createHmac('sha256', getSigningSecret()).update(payloadBase64Url).digest();
}

export function issueVoiceSessionWriteToken(params: {
  sessionId: string;
  userId: string;
  ttlSeconds?: number;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(60, params.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const payload: VoiceSessionWriteTokenPayload = {
    v: 1,
    sid: params.sessionId,
    uid: params.userId,
    iat: now,
    exp: now + ttl,
  };

  const payloadBase64Url = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signPayload(payloadBase64Url).toString('base64url');

  return `${payloadBase64Url}.${signature}`;
}

export function verifyVoiceSessionWriteToken(
  token: string,
): VoiceSessionWriteTokenPayload | null {
  const [payloadBase64Url, signatureBase64Url] = token.split('.');
  if (!payloadBase64Url || !signatureBase64Url) return null;

  let givenSignature: Buffer;
  try {
    givenSignature = Buffer.from(signatureBase64Url, 'base64url');
  } catch {
    return null;
  }

  const expectedSignature = signPayload(payloadBase64Url);
  if (givenSignature.length !== expectedSignature.length) return null;
  if (!timingSafeEqual(givenSignature, expectedSignature)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payloadBase64Url, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const payload = parsed as Partial<VoiceSessionWriteTokenPayload>;

  if (payload.v !== 1) return null;
  if (!payload.sid || typeof payload.sid !== 'string') return null;
  if (!payload.uid || typeof payload.uid !== 'string') return null;
  if (!payload.iat || typeof payload.iat !== 'number') return null;
  if (!payload.exp || typeof payload.exp !== 'number') return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;

  return payload as VoiceSessionWriteTokenPayload;
}
