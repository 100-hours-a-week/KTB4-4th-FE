// 백엔드 API 버전 접두사와 인증 endpoint 경로 모음
const API_V1_PREFIX = "/api/v1";

export const API_ENDPOINTS = {
  auth: {
    kakaoAuthorize: `${API_V1_PREFIX}/auth/kakao/authorize`,
    csrf: `${API_V1_PREFIX}/auth/csrf`,
    refresh: `${API_V1_PREFIX}/auth/refresh`,
    loginValidity: `${API_V1_PREFIX}/auth/session`,
  },
  errorReports: `${API_V1_PREFIX}/error-reports`,
  friends: {
    list: `${API_V1_PREFIX}/friends`,
    detail: (userId: number) => `${API_V1_PREFIX}/friends/${userId}`,
    kakaoAuthorize: `${API_V1_PREFIX}/friends/kakao/authorize`,
  },
  guidance: `${API_V1_PREFIX}/guidance`,
  personalRecommendations: `${API_V1_PREFIX}/users/me/personal-recommendations`,
} as const;
