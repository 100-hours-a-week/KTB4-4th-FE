// 보안 응답 헤더와 로컬 개발용 백엔드 API 중계를 관리하는 Next.js 설정
import { withSentryConfig } from "@sentry/nextjs/config";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import type { NextConfig } from "next";

function getDevelopmentApiDestination() {
  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";

  return new URL("/api/v1/:path*", backendApiBaseUrl).toString();
}

function createNextConfig(phase: string): NextConfig {
  const isDevelopmentServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    poweredByHeader: false,
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
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains",
            },
          ],
        },
      ];
    },
    async rewrites() {
      if (!isDevelopmentServer) {
        return [];
      }

      return [
        {
          source: "/api/v1/:path*",
          destination: getDevelopmentApiDestination(),
        },
      ];
    },
  };
}

export default function nextConfig(phase: string) {
  return withSentryConfig(createNextConfig(phase), {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },
    suppressOnRouterTransitionStartWarning: true,
  });
}
