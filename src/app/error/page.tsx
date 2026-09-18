import ErrorPage from "@/components/common/ErrorPage";

export default function ErrorRoute() {
  return (
    <ErrorPage
      title="잠시 연결이 원활하지 않아요."
      description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
    />
  );
}
