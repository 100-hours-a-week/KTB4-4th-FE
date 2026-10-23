// 로그인 세션 API 응답 타입과 런타임 검증 함수

export const LOGIN_SESSION_USER_ID_HEADER = "x-needu-user-id";
// 서버 컴포넌트가 백엔드 재조회 없이 로그인 사용자 정보를 읽도록 proxy가 전달하는 요청 헤더
export const LOGIN_SESSION_USER_HEADER = "x-needu-user";

export interface LoginUser {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  onboardingCompleted: boolean;
}

export interface LoginSessionData {
  user: LoginUser;
  birthday?: string | null;
}

export interface LoginSessionResponse {
  message: string;
  data: LoginSessionData;
}

export function isLoginUser(value: unknown): value is LoginUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<LoginUser>;

  return (
    typeof user.id === "number" &&
    Number.isSafeInteger(user.id) &&
    user.id > 0 &&
    typeof user.nickname === "string" &&
    (typeof user.profileImageUrl === "string" || user.profileImageUrl === null) &&
    typeof user.onboardingCompleted === "boolean"
  );
}

export function isLoginSessionResponse(value: unknown): value is LoginSessionResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<LoginSessionResponse>;

  if (typeof response.message !== "string" || !response.data || typeof response.data !== "object") {
    return false;
  }

  const { user, birthday } = response.data as Partial<LoginSessionData>;

  return (
    isLoginUser(user) &&
    (birthday === undefined || birthday === null || typeof birthday === "string")
  );
}
