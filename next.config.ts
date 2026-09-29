// 백엔드 API를 동일 출처로 중계하는 Next.js 설정
import { withSentryConfig } from "@sentry/nextjs/config";

import type { NextConfig } from "next";

const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "**.kakaocdn.net",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendApiBaseUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  suppressOnRouterTransitionStartWarning: true,
});
