// 친구 상세 API 응답 타입과 화면 모델 변환 함수
export interface FriendDetail {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  tasteAnalysisCompleted: boolean;
  birthDate: string | null;
  tasteKeywords: string[];
  interestKeywords: string[];
  interestSummary: string;
  isFavorite: boolean;
}

export interface FriendDetailData {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  tasteAnalysisCompleted: boolean;
  birthDate: string | null;
  tasteKeywords: string[];
  interestKeywords: string[];
  interestSummary: string;
  isFavorite: boolean;
}

export interface FriendDetailResponse {
  message: string;
  data: FriendDetailData;
}

export function mapFriendDetail(data: FriendDetailData): FriendDetail {
  return {
    id: data.userId,
    nickname: data.name,
    profileImageUrl: data.profileImageUrl,
    tasteAnalysisCompleted: data.tasteAnalysisCompleted,
    birthDate: data.birthDate,
    tasteKeywords: data.tasteKeywords,
    interestKeywords: data.interestKeywords,
    interestSummary: data.interestSummary,
    isFavorite: data.isFavorite,
  };
}
