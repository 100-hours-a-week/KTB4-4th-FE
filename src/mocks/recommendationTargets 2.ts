// 추천 API 연동 전 친구 추천 문맥을 제공하는 임시 데이터

import type { RecommendationTarget } from "@/types/recommendation";

// TODO: 추천 API 연동 완료 후 이 파일의 Mock 데이터 제거
type TemporaryFriend = RecommendationTarget & {
  birthday: string;
  dDay: number | null;
};

export const temporaryFriends: Record<string, TemporaryFriend> = {
  "1": {
    type: "FRIEND",
    userId: 1,
    name: "토쿠노 유우시",
    profileImageUrl: null,
    tasteKeywords: [],
    interestKeywords: [],
    birthday: "4월 05일",
    dDay: 7,
  },
  "2": {
    type: "FRIEND",
    userId: 2,
    name: "츠키시마 케이",
    profileImageUrl: null,
    tasteKeywords: [],
    interestKeywords: [],
    birthday: "생일 정보 없음",
    dDay: null,
  },
};
