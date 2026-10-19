// 메인 레이아웃 내부의 존재하지 않는 경로에 표시하는 404 페이지

import ErrorPage from "@/components/common/ErrorPage";

export default function MainNotFound() {
  return (
    <ErrorPage
      title="페이지를 찾을 수 없어요."
      description="요청하신 페이지가 존재하지 않거나 이동되었어요."
      showHeader={false}
    />
  );
}
