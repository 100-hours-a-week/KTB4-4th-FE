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
  anonymousChats: {
    create: `${API_V1_PREFIX}/anonymous-chats`,
    list: `${API_V1_PREFIX}/anonymous-chats`,
    room: (roomId: number) => `${API_V1_PREFIX}/anonymous-chats/${roomId}`,
    messages: (roomId: number) => `${API_V1_PREFIX}/anonymous-chats/${roomId}/messages`,
    report: (roomId: number) => `${API_V1_PREFIX}/anonymous-chats/${roomId}/reports`,
  },
  analytics: {
    productLinkClicks: `${API_V1_PREFIX}/analytics/product-link-clicks`,
  },
  auth: {
    kakaoAuthorize: `${API_V1_PREFIX}/auth/kakao/authorize`,
    csrf: `${API_V1_PREFIX}/auth/csrf`,
    refresh: `${API_V1_PREFIX}/auth/refresh`,
    loginValidity: `${API_V1_PREFIX}/auth/session`,
    logout: `${API_V1_PREFIX}/auth/logout`,
  },
  calendar: {
    events: `${API_V1_PREFIX}/calendar/events`,
    dailyEvents: `${API_V1_PREFIX}/calendar/events/daily`,
    event: (eventId: number) => `${API_V1_PREFIX}/calendar/events/${eventId}`,
  },
  errorReports: `${API_V1_PREFIX}/error-reports`,
  friends: {
    list: `${API_V1_PREFIX}/friends`,
    upcomingEvents: `${API_V1_PREFIX}/friends/upcoming-events`,
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
    webPushPublicKey: `${API_V1_PREFIX}/notifications/web-push/public-key`,
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
    pushSubscriptions: `${API_V1_PREFIX}/users/me/push-subscriptions`,
    pushSubscriptionStatus: `${API_V1_PREFIX}/users/me/push-subscriptions/status`,
  },
  friendGiftRecommendations: (userId: number) =>
    `${API_V1_PREFIX}/users/${userId}/gift-recommendations`,
} as const;
