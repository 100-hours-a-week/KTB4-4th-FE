// 취향 데이터가 있는 사용자의 메인 페이지 콘텐츠 (맞춤 상품 영역은 서버에서 별도로 조회해 전달)

import PageIntro from "@/components/common/PageIntro";
import MainCalendar from "@/components/home/MainCalendar";

import type { ReactNode } from "react";

type PersonalizedHomeProps = {
  title: string;
  description: string;
  products: ReactNode;
};

export default function PersonalizedHome({ title, description, products }: PersonalizedHomeProps) {
  return (
    <>
      <PageIntro title={title} description={description} />

      {products}

      <div className="mt-8">
        <MainCalendar />
      </div>
    </>
  );
}
