// 마이페이지 API 연동 전 화면 구성을 위한 임시 사용자 데이터

import type { MyPageData } from "@/types/mypage";

// TODO: 마이페이지 API 연동 시 실제 응답 데이터로 교체
export const myPageMock: MyPageData = {
  profile: {
    userId: 1,
    nickname: "김니쥬",
    birthday: "5월 5일",
    profileImageUrl: "/images/Needu_profile.png",
  },
  tasteKeywords: ["실용적인", "감성적인", "새로운"],
  interestKeywords: ["여행", "인테리어", "커피"],
  aiSummary: "최근 여행과 인테리어에 관심이 많고, 새로운 카페를 찾아다니는 것을 좋아해요.",
};
