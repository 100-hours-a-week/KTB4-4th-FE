// 로그인 세션 API 응답 타입과 런타임 검증 함수

export const LOGIN_SESSION_USER_ID_HEADER = "x-needu-user-id";

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
    Boolean(user) &&
    typeof user === "object" &&
    typeof user.id === "number" &&
    Number.isSafeInteger(user.id) &&
    user.id > 0 &&
    typeof user.nickname === "string" &&
    (typeof user.profileImageUrl === "string" || user.profileImageUrl === null) &&
    typeof user.onboardingCompleted === "boolean" &&
    (birthday === undefined || birthday === null || typeof birthday === "string")
  );
}
