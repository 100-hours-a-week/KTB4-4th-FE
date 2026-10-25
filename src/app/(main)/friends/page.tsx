// 선물할 친구 목록을 표시하는 페이지

import FriendsPageContent from "@/components/friends/FriendsPageContent";
import { getInitialFriendsPage } from "@/lib/api/friendsServer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "친구",
};

export default function FriendsPage() {
  // 기다리지 않고 넘겨서 목록 위쪽 화면은 먼저 보내고 목록만 이어서 스트리밍
  const initialFriendsPromise = getInitialFriendsPage();

  return <FriendsPageContent initialFriendsPromise={initialFriendsPromise} />;
}
