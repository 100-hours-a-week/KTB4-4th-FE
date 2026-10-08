// 성능 측정용 친구 목록·상세 임시 데이터

import type { FriendDetail, FriendListItem, FriendsPage } from "@/lib/api/friends";
import { mockDelay } from "@/mocks/config";

const MOCK_FRIEND_COUNT = 45;
const MOCK_FRIEND_ID_START = 900_001;

const mockFriends: FriendListItem[] = Array.from({ length: MOCK_FRIEND_COUNT }, (_, index) => {
  const order = String(index + 1).padStart(2, "0");

  return {
    userId: MOCK_FRIEND_ID_START + index,
    name: `테스트친구${order}`,
    profileImageUrl: `/images/mock/profile-${order}.jpg`,
    birthDate: "2000-01-01",
    isFavorite: false,
  };
});

export function isMockFriendId(userId: number) {
  return userId >= MOCK_FRIEND_ID_START && userId < MOCK_FRIEND_ID_START + MOCK_FRIEND_COUNT;
}

export async function getMockFriendsPage(cursor: string | undefined, size: number) {
  await mockDelay();

  const start = cursor ? Number(cursor) : 0;
  const end = start + size;
  const hasNext = end < mockFriends.length;

  return {
    items: mockFriends.slice(start, end),
    isKakaoFriendSynced: true,
    nextCursor: hasNext ? String(end) : null,
    hasNext,
  } satisfies FriendsPage;
}

export async function getMockFriendDetail(userId: number) {
  await mockDelay();

  const friend = mockFriends.find((item) => item.userId === userId);

  if (!friend) {
    throw new Error("목업 친구를 찾을 수 없습니다.");
  }

  return {
    id: friend.userId,
    nickname: friend.name,
    profileImageUrl: friend.profileImageUrl,
    tasteAnalysisCompleted: true,
    birthDate: friend.birthDate,
  } satisfies FriendDetail;
}
