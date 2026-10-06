// 마이페이지에서 표시하는 사용자 프로필과 취향 분석 데이터 타입

export interface MyPageProfile {
  userId: number;
  nickname: string;
  birthday: string;
  profileImageUrl: string | null;
}

export interface MyPageData {
  profile: MyPageProfile;
  tasteKeywords: string[];
  interestKeywords: string[];
  aiSummary: string;
}
