/**
 * Preloaded (`node --import`) into every harness process that runs app code:
 * the seed tool, `next build` and `next start`. It replaces outbound network
 * with three answers:
 *
 *   - loopback (the local Supabase stack, the app itself): passes through;
 *   - the model providers the app calls server-side (DeepSeek, Gemini token
 *     minting, Gemini transcription, DeepL): a canned answer, never the provider;
 *   - YouTube thumbnails (next/image's optimizer): a placeholder PNG;
 *   - Google Fonts (next/font at build time): passes through, read-only GETs;
 *   - anything else, the hosted Supabase project included: refused (throws).
 *
 * Every non-loopback request is appended to $E2E_NET_LOG as one JSON line, so
 * a report can say which server calls a flow made and what answered them.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { EventEmitter } from 'node:events';
import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';
import { deepseekReply } from '../mocks/deepseek.mjs';

const LOG = process.env.E2E_NET_LOG;
if (LOG) mkdirSync(dirname(LOG), { recursive: true });

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]', '0.0.0.0']);
const PASS_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
/** YouTube thumbnails the image optimizer (next/image) fetches: a 1x1 grey PNG instead. */
const THUMB_HOSTS = new Set(['img.youtube.com', 'i.ytimg.com']);
const PLACEHOLDER_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

/** A ClientRequest stand-in that answers with the placeholder PNG (what Next's image optimizer reads: statusCode, headers, body stream). */
function placeholderRequest(callback) {
  const req = new EventEmitter();
  req.write = () => true;
  req.setTimeout = () => req;
  req.destroy = () => req;
  req.abort = () => {};
  req.end = () => {
    const res = Readable.from([PLACEHOLDER_PNG]);
    res.statusCode = 200;
    res.headers = { 'content-type': 'image/png', 'content-length': String(PLACEHOLDER_PNG.length), 'cache-control': 'public, max-age=3600' };
    process.nextTick(() => {
      if (typeof callback === 'function') callback(res);
      req.emit('response', res);
    });
    return req;
  };
  return req;
}

function log(entry) {
  if (!LOG) return;
  try {
    appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), pid: process.pid, ...entry }) + '\n');
  } catch {
    /* logging must never break the app */
  }
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

async function bodyText(input, init) {
  if (init?.body && typeof init.body === 'string') return init.body;
  if (input instanceof Request) return input.clone().text().catch(() => '');
  return '';
}

const realFetch = globalThis.fetch;

async function guardedFetch(input, init) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const host = hostOf(url);
  if (LOOPBACK.has(host)) return realFetch(input, init);
  if (PASS_HOSTS.has(host)) {
    log({ host, url, decision: 'pass' });
    return realFetch(input, init);
  }

  if (host === 'api.deepseek.com') {
    const body = JSON.parse((await bodyText(input, init)) || '{}');
    const { rule, content } = deepseekReply(body.messages ?? []);
    log({ host, url, decision: 'mock', rule, promptHead: String(body.messages?.[0]?.content ?? '').slice(0, 160) });
    return json({
      id: 'e2e-mock',
      choices: [{ message: { role: 'assistant', content: typeof content === 'string' ? content : JSON.stringify(content) }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    });
  }

  if (host === 'generativelanguage.googleapis.com' && /auth_?[tT]okens/.test(url)) {
    log({ host, url, decision: 'mock', rule: 'gemini-live-token' });
    const expire = new Date(Date.now() + 30 * 60_000).toISOString();
    return json({ name: 'auth_tokens/e2e-fake-live-token', expireTime: expire, newSessionExpireTime: expire });
  }

  // The drills' server recognizer (/api/practice/transcribe): every take "says" one line.
  if (host === 'generativelanguage.googleapis.com' && /:generateContent\b/.test(url)) {
    const text = process.env.E2E_TRANSCRIPT ?? 'data integrity means the record is complete consistent and accurate';
    log({ host, url, decision: 'mock', rule: 'gemini-transcribe' });
    return json({
      candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 12, totalTokenCount: 212 },
    });
  }

  if (host === 'api.deepl.com' || host === 'api-free.deepl.com') {
    const raw = await bodyText(input, init);
    let texts = [];
    try {
      texts = JSON.parse(raw).text ?? [];
    } catch {
      texts = new URLSearchParams(raw).getAll('text');
    }
    log({ host, url, decision: 'mock', rule: 'deepl-echo' });
    return json({ translations: texts.map((text) => ({ detected_source_language: 'EN', text })) });
  }

  log({ host, url, decision: 'blocked' });
  throw new TypeError(`e2e net-guard: blocked outbound request to ${host || url}`);
}

globalThis.fetch = guardedFetch;

// Libraries that skip fetch: refuse non-loopback http(s) sockets too.
for (const mod of [http, https]) {
  for (const name of ['request', 'get']) {
    const original = mod[name];
    mod[name] = function guarded(...args) {
      const first = args[0];
      const host = typeof first === 'string' || first instanceof URL ? hostOf(String(first)) : (first?.hostname ?? first?.host ?? '').replace(/:\d+$/, '');
      if (THUMB_HOSTS.has(host)) {
        log({ host, decision: 'mock', rule: 'thumbnail-placeholder', via: `node:${mod === http ? 'http' : 'https'}.${name}` });
        return placeholderRequest(args.find((a) => typeof a === 'function'));
      }
      if (host && !LOOPBACK.has(host) && !PASS_HOSTS.has(host)) {
        log({ host, decision: 'blocked', via: `node:${mod === http ? 'http' : 'https'}.${name}` });
        throw new Error(`e2e net-guard: blocked outbound ${mod === http ? 'http' : 'https'} request to ${host}`);
      }
      return original.apply(this, args);
    };
  }
}
