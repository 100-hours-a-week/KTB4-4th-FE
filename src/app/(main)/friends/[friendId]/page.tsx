// 선택한 친구의 상세 정보를 표시하는 페이지

import { redirect } from "next/navigation";

import FriendDetailContent from "@/components/friends/FriendDetailContent";

type FriendDetailPageProps = {
  params: Promise<{ friendId: string }>;
};

export default async function FriendDetailPage({ params }: FriendDetailPageProps) {
  const { friendId } = await params;
  const userId = Number(friendId);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    redirect("/error");
  }

  return (
    <main aria-label="친구 상세" className="page-content flex flex-1 flex-col bg-background">
      <FriendDetailContent userId={userId} />
    </main>
  );
}
