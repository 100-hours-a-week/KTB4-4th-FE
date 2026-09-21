// 백엔드 API를 동일 출처로 중계하는 Next.js 설정
import type { NextConfig } from "next";

const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
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

export default nextConfig;
