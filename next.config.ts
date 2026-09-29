import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// React DevTools / stack reconstruction needs eval in development only.
// Production stays without 'unsafe-eval'. HMR websockets need ws:/wss: in dev.
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
const connectSrc = isProd
  ? "connect-src 'self' https://*.supabase.co"
  : "connect-src 'self' ws: wss: https://*.supabase.co";

const securityHeaders: { key: string; value: string }[] = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  // Auth.js + Next.js App Router compatible CSP.
  // 'unsafe-inline' kept for Next.js inline scripts/styles in App Router.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://*.supabase.co https://avatars.githubusercontent.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      scriptSrc,
      connectSrc,
    ].join("; "),
  },
];

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
