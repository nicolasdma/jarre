import type { NextConfig } from "next";

/**
 * Security headers (audit 2026-11-18, MEDIO-7).
 *
 * Enforced now: the directives that cannot break a feature (no framing, no
 * plugins, no <base> or form hijack) plus nosniff, referrer policy and a
 * permissions policy that keeps the microphone for this origin only.
 *
 * Report-only: the full allow-list of what the app loads. Violations show in
 * the browser console without blocking. Once a few days of real use (lesson,
 * voice tutor, code exercise, PDF, notes canvas, video) show none, move it to
 * `Content-Security-Policy` and drop the enforced subset.
 * - script 'unsafe-inline': Next's inline bootstrap and the theme script
 *   (no nonce yet); 'unsafe-eval': the code runner worker (src/lib/coding/harness.ts).
 * - Supabase over https and wss, Gemini Live over https and wss.
 * - unpkg: the pdf.js worker (src/app/resource/[resourceId]/pdf-viewer.tsx).
 * - YouTube: thumbnails and the embedded player.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
const supabaseWs = supabaseOrigin.replace(/^https:/, "wss:");
const isDev = process.env.NODE_ENV !== "production";

const enforcedCsp = [
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const fullCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com ${supabaseOrigin}`,
  "font-src 'self' data:",
  `media-src 'self' blob: ${supabaseOrigin}`,
  [
    "connect-src 'self'",
    supabaseOrigin,
    supabaseWs,
    "https://generativelanguage.googleapis.com",
    "wss://generativelanguage.googleapis.com",
    "https://unpkg.com",
    isDev ? "ws: http://localhost:*" : "",
  ].filter(Boolean).join(" "),
  "worker-src 'self' blob: https://unpkg.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: enforcedCsp },
  { key: "Content-Security-Policy-Report-Only", value: fullCsp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
