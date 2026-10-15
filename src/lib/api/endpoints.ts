// 백엔드 API 버전 접두사와 인증 endpoint 경로 모음
const API_V1_PREFIX = "/api/v1";

export const API_ENDPOINTS = {
  ai: {
    conversations: `${API_V1_PREFIX}/ai/conversations`,
    conversationMessages: (conversationId: number) =>
      `${API_V1_PREFIX}/ai/conversations/${conversationId}/messages`,
    conversationStream: (conversationId: number) =>
      `${API_V1_PREFIX}/ai/conversations/${conversationId}/stream`,
    conversationAnalysis: (conversationId: number) =>
      `${API_V1_PREFIX}/ai/conversations/${conversationId}/analysis`,
    conversationConfirmation: (conversationId: number) =>
      `${API_V1_PREFIX}/ai/conversations/${conversationId}/confirm`,
  },
  analytics: {
    productLinkClicks: `${API_V1_PREFIX}/analytics/product-link-clicks`,
  },
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
    favorite: (userId: number) => `${API_V1_PREFIX}/friends/${userId}/favorite`,
    pokes: (userId: number) => `${API_V1_PREFIX}/friends/${userId}/pokes`,
    kakaoAuthorize: `${API_V1_PREFIX}/friends/kakao/authorize`,
  },
  guidance: `${API_V1_PREFIX}/guidance`,
  notifications: {
    list: `${API_V1_PREFIX}/notifications`,
    stream: `${API_V1_PREFIX}/notifications/stream`,
    summary: `${API_V1_PREFIX}/notifications/summary`,
    detail: (notificationId: number) => `${API_V1_PREFIX}/notifications/${notificationId}`,
    readAll: `${API_V1_PREFIX}/notifications/read-all`,
  },
  personalRecommendations: `${API_V1_PREFIX}/users/me/personal-recommendations`,
  productCategories: `${API_V1_PREFIX}/products/categories`,
  purchaseCheck: (purchaseCheckId: number) => `${API_V1_PREFIX}/purchase-checks/${purchaseCheckId}`,
  productDetail: (productId: number) => `${API_V1_PREFIX}/products/${productId}`,
  productFeedback: (productId: number) => `${API_V1_PREFIX}/products/${productId}/feedback`,
  users: {
    me: `${API_V1_PREFIX}/users/me`,
    consents: `${API_V1_PREFIX}/users/me/consents`,
    giftRecommendations: `${API_V1_PREFIX}/users/me/gift-recommendations`,
    giftPreferences: `${API_V1_PREFIX}/users/me/gift-preferences`,
    notificationSettings: `${API_V1_PREFIX}/users/me/settings/notifications`,
    notificationSetting: (settingType: string) =>
      `${API_V1_PREFIX}/users/me/settings/notifications/${settingType}`,
    onboarding: `${API_V1_PREFIX}/users/me/onboarding`,
  },
  friendGiftRecommendations: (userId: number) =>
    `${API_V1_PREFIX}/users/${userId}/gift-recommendations`,
} as const;
