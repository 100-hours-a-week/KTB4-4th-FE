// 검색엔진 크롤링 허용 범위를 정의하는 robots.txt 생성 파일
import { SITE_URL } from "@/lib/site";

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // 로그인 외 페이지는 인증이 필요한 개인 화면이므로 공개 페이지와 렌더링 리소스만 허용
      allow: [
        "/login",
        "/_next/static/",
        "/_next/image",
        "/images/",
        "/icons/",
        "/fonts/",
        "/icon.png",
        "/apple-icon.png",
        "/opengraph-image.png",
      ],
      disallow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
