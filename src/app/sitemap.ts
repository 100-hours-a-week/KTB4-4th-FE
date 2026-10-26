// 검색엔진에 공개 페이지 목록을 알리는 sitemap.xml 생성 파일
import { SITE_URL } from "@/lib/site";

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // 인증 없이 접근 가능한 공개 페이지만 등록
  return [
    {
      url: `${SITE_URL}/login`,
    },
  ];
}
