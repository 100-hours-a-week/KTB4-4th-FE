// 친구 페이지의 제목과 설명을 표시하는 화면

import PageIntro from "@/components/common/PageIntro";

export default function FriendsPage() {
  return (
    <main aria-label="친구" className="page-content flex flex-1 flex-col bg-background pt-4">
      <PageIntro
        title="누구에게 선물할까요?"
        description="친구의 취향이 반영된 선물을 추천해드려요."
      />
    </main>
  );
}
