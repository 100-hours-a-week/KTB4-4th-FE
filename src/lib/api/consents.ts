// 개인정보 활용 동의 내용 조회를 위한 서버 API 요청과 응답 타입
import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { serverApiRequest } from "@/lib/api/serverClient";

export interface ConsentItem {
  id: number;
  title: string;
  content: string;
  required: boolean;
  version: string;
  agreed: boolean;
  agreedAt: string | null;
}

interface ConsentsResponse {
  message: string;
  data: {
    consents: ConsentItem[];
  };
}

export async function getConsents() {
  const { data } = await serverApiRequest<ConsentsResponse>(API_ENDPOINTS.users.consents, {
    method: "GET",
    fallbackErrorMessage: "개인정보 활용 동의 내용을 불러오지 못했습니다.",
  });

  return data.consents;
}
