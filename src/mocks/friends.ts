// 성능 측정용 친구 목록·상세 임시 데이터

import type {
  FriendDetail,
  FriendListItem,
  FriendsPage,
  GetFriendsParams,
} from "@/lib/api/friends";
import { mockDelay } from "@/mocks/config";

const MOCK_FRIEND_COUNT = 45;
const MOCK_FRIEND_ID_START = 900_001;

const mockFriends: FriendListItem[] = Array.from({ length: MOCK_FRIEND_COUNT }, (_, index) => {
  const order = String(index + 1).padStart(2, "0");

  return {
    userId: MOCK_FRIEND_ID_START + index,
    name: `테스트친구${order}`,
    profileImageUrl: `/images/mock/profile-${order}.jpg`,
    birthDate:
      index % 7 === 6
        ? null
        : `2000-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`,
    isFavorite: index % 4 === 0,
  };
});

type MockCursor = {
  offset: number;
  favorite: boolean;
  keyword: string;
};

function getUpcomingBirthdayTime(birthDate: string | null) {
  if (!birthDate) {
    return Number.POSITIVE_INFINITY;
  }

  const [, month, day] = birthDate.split("-").map(Number);
  const today = new Date();
  const upcomingBirthday = new Date(today.getFullYear(), month - 1, day);

  if (upcomingBirthday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    upcomingBirthday.setFullYear(today.getFullYear() + 1);
  }

  return upcomingBirthday.getTime();
}

function sortFriends(left: FriendListItem, right: FriendListItem) {
  if (left.isFavorite !== right.isFavorite) {
    return left.isFavorite ? -1 : 1;
  }

  const birthdayDifference =
    getUpcomingBirthdayTime(left.birthDate) - getUpcomingBirthdayTime(right.birthDate);

  if (birthdayDifference !== 0) {
    return birthdayDifference;
  }

  return left.name.localeCompare(right.name, "ko");
}

function parseMockCursor(cursor: string | undefined, favorite: boolean, keyword: string) {
  if (!cursor) {
    return 0;
  }

  const parsedCursor = JSON.parse(cursor) as MockCursor;

  if (parsedCursor.favorite !== favorite || parsedCursor.keyword !== keyword) {
    throw new Error("조회 조건과 일치하지 않는 친구 목록 커서입니다.");
  }

  return parsedCursor.offset;
}

export function isMockFriendId(userId: number) {
  return userId >= MOCK_FRIEND_ID_START && userId < MOCK_FRIEND_ID_START + MOCK_FRIEND_COUNT;
}

export async function getMockFriendsPage({
  cursor,
  size = 20,
  favorite = false,
  keyword = "",
  signal,
}: GetFriendsParams = {}) {
  await mockDelay();

  if (signal?.aborted) {
    throw new DOMException("요청이 취소되었습니다.", "AbortError");
  }

  const normalizedKeyword = keyword.trim();
  const filteredFriends = mockFriends
    .filter((friend) => !favorite || friend.isFavorite)
    .filter((friend) => !normalizedKeyword || friend.name.includes(normalizedKeyword))
    .sort(sortFriends);
  const start = parseMockCursor(cursor, favorite, normalizedKeyword);
  const end = start + size;
  const hasNext = end < filteredFriends.length;

  return {
    items: filteredFriends.slice(start, end),
    isKakaoFriendSynced: true,
    nextCursor: hasNext
      ? JSON.stringify({ offset: end, favorite, keyword: normalizedKeyword } satisfies MockCursor)
      : null,
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
    birthDate: friend.birthDate ?? "2000-01-01",
  } satisfies FriendDetail;
}
