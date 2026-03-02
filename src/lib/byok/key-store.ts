/**
 * Jarre - BYOK Key Store
 *
 * Client-side encrypted storage for user-provided API keys.
 * Keys are encrypted with AES-GCM using a key derived from the user's ID (PBKDF2).
 * The userId (stable UUID) is used instead of sessionToken so keys survive re-login.
 * Stored in localStorage, decrypted into an in-memory cache on load.
 */

const STORAGE_KEY = 'jarre-byok-keys';
const PBKDF2_ITERATIONS = 100_000;

export interface ByokKeys {
  deepseek?: string;
  gemini?: string;
}

// In-memory cache for fast synchronous access
let cachedKeys: ByokKeys | null = null;

/**
 * Derive an AES-GCM key from a stable identifier using PBKDF2.
 */
async function deriveKey(material: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(material),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt and store API keys in localStorage.
 */
export async function storeKeys(keys: ByokKeys, userId: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const derivedKey = await deriveKey(userId, salt);

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(keys));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    derivedKey,
    plaintext,
  );

  const payload = {
    salt: arrayToBase64(salt),
    iv: arrayToBase64(iv),
    data: arrayToBase64(new Uint8Array(ciphertext)),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable or full — keys remain in memory only
  }
  cachedKeys = keys;
}

/**
 * Attempt to decrypt the stored payload with the given material.
 */
async function tryDecrypt(raw: string, material: string): Promise<ByokKeys | null> {
  try {
    const { salt, iv, data } = JSON.parse(raw);
    const derivedKey = await deriveKey(material, base64ToArray(salt));

    const ivArr = base64ToArray(iv);
    const dataArr = base64ToArray(data);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArr.buffer as ArrayBuffer },
      derivedKey,
      dataArr.buffer as ArrayBuffer,
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    return null;
  }
}

/**
 * Load and decrypt API keys from localStorage.
 * Uses userId as primary decryption material.
 * Falls back to sessionToken for migration from older encryption, then re-encrypts with userId.
 */
export async function loadKeys(userId: string, sessionToken?: string): Promise<ByokKeys | null> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (incognito, storage disabled, SSR)
    return null;
  }
  if (!raw) return null;

  // Try decrypting with userId (new scheme)
  const keys = await tryDecrypt(raw, userId);
  if (keys) {
    cachedKeys = keys;
    return keys;
  }

  // Migration: try old sessionToken-based encryption
  if (sessionToken) {
    const legacyKeys = await tryDecrypt(raw, sessionToken);
    if (legacyKeys) {
      // Re-encrypt with userId for future logins
      await storeKeys(legacyKeys, userId);
      cachedKeys = legacyKeys;
      return legacyKeys;
    }
  }

  return null;
}

/**
 * Get cached keys synchronously. Returns null if not loaded yet.
 */
export function getStoredKeys(): ByokKeys {
  return cachedKeys || {};
}

/**
 * Clear stored keys from localStorage and memory cache.
 */
export function clearKeys(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
  cachedKeys = null;
}

/**
 * Check if any keys are currently stored.
 */
export function hasStoredKeys(): boolean {
  return cachedKeys !== null && (!!cachedKeys.deepseek || !!cachedKeys.gemini);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function arrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}
