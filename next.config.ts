// 보안·정적 자원 캐시 응답 헤더, 렌더링 차단 CSS 인라인, 로컬 개발용 백엔드 API·WebSocket 중계, 성능 측정 계측 플래그 기본값을 관리하는 Next.js 설정
import { withSentryConfig } from "@sentry/nextjs/config";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import type { NextConfig } from "next";

function getDevelopmentApiDestination() {
  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";

  return new URL("/api/v1/:path*", backendApiBaseUrl).toString();
}

function getDevelopmentWebSocketDestination() {
  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";

  return new URL("/ws/:path*", backendApiBaseUrl).toString();
}

function createNextConfig(phase: string): NextConfig {
  const isDevelopmentServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    poweredByHeader: false,
    env: {
      // 값을 지정하지 않은 빌드에서도 false로 코드에 들어가 성능 측정용 계측 코드가 번들에서 제거되도록 기본값 지정
      NEXT_PUBLIC_PERF_INSTRUMENT: process.env.NEXT_PUBLIC_PERF_INSTRUMENT ?? "false",
    },
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
    experimental: {
      inlineCss: true,
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
        // 수정하지 않는 정적 아이콘의 재검증 요청 제거 (아이콘 변경 시 파일명 변경 필수)
        {
          source: "/icons/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        // 수정하지 않는 웹폰트의 재검증 요청 제거 (폰트 변경 시 파일명의 버전 변경 필수)
        {
          source: "/fonts/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        // 파일 내용 해시가 주소에 붙는 파비콘의 재요청을 캐시로 처리
        {
          source: "/:file(icon|apple-icon).png",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
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
        {
          source: "/ws/:path*",
          destination: getDevelopmentWebSocketDestination(),
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
