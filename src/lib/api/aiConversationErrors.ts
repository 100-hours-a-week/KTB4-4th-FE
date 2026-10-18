// AI 대화 API 오류 중 정보 활용 동의가 필요한 응답을 구분하는 상수와 판별 함수 모음

import { ApiRequestError } from "@/lib/api/client";

// 백엔드 오류 응답에 코드 필드가 없어 403 중 동의 필요 응답은 문구로만 구분함
// 백엔드 문구가 바뀌면 이 값도 함께 바꿔야 함
export const AI_CONSENT_REQUIRED_MESSAGE = "AI 대화를 이용하려면 정보 활용 동의가 필요합니다.";

export const AI_CONSENT_SETTINGS_PATH = "/settings?modal=aiConsent";

export function isAiConsentRequiredError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 403 &&
    error.message === AI_CONSENT_REQUIRED_MESSAGE
  );
}
