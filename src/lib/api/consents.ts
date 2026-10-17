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

// 설정 화면의 AI 대화 정보 활용 동의 모달에 보여줄 항목 내용
export type AiConsentContent = Pick<ConsentItem, "title" | "content">;

// 동의 항목 응답에 종류를 구분하는 필드가 없어 AI 대화 항목은 제목으로만 구분함
// 백엔드 제목이 바뀌면 이 값도 함께 바꿔야 함
export const AI_CONSENT_TITLE = "AI 대화 정보 활용 동의";

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
