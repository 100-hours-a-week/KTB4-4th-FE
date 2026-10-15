// 선택한 친구의 상세 정보를 표시하는 페이지

import { notFound, redirect } from "next/navigation";

import FriendDetailContent from "@/components/friends/FriendDetailContent";
import { getServerFriendDetail } from "@/lib/api/friendDetail";
import { ServerApiError } from "@/lib/api/serverClient";

type FriendDetailPageProps = {
  params: Promise<{ friendId: string }>;
};

async function getFriendDetailOrRedirect(userId: number) {
  try {
    return await getServerFriendDetail(userId);
  } catch (error) {
    if (error instanceof ServerApiError) {
      if (error.status === 401) {
        redirect("/login");
      }

      if (error.status === 404) {
        notFound();
      }
    }

    redirect("/error");
  }
}

export default async function FriendDetailPage({ params }: FriendDetailPageProps) {
  const { friendId } = await params;
  const userId = Number(friendId);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    notFound();
  }

  const friend = await getFriendDetailOrRedirect(userId);

  return (
    <main aria-label="친구 상세" className="page-content flex flex-1 flex-col bg-background">
      <FriendDetailContent userId={userId} initialFriend={friend} />
    </main>
  );
}
