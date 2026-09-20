// 사용자의 취향 데이터에 맞는 콘텐츠를 제공하는 메인 화면

import PersonalizedHome from "@/components/home/PersonalizedHome";
import { temporaryRecommendedProducts } from "@/mocks/recommendedProducts";

// TODO: 사용자 API 연동 후 로그인 사용자의 정보로 교체
const temporaryUser = {
  id: 0,
  name: "수연",
  birthdayDaysRemaining: 8,
};

export default function Home() {
  return (
    <main className="page-content flex flex-1 flex-col bg-background py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-foreground">
      <PersonalizedHome
        userId={temporaryUser.id}
        userName={temporaryUser.name}
        birthdayDaysRemaining={temporaryUser.birthdayDaysRemaining}
        products={temporaryRecommendedProducts}
      />
    </main>
  );
}
