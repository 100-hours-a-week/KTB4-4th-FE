// 마이페이지 진입 정보 조회 중 표시하는 로딩 화면

export default function MyPageLoading() {
  return (
    <main
      aria-busy="true"
      className="page-content flex flex-1 items-center justify-center bg-background text-foreground"
    >
      <p role="status" className="text-body text-foreground-secondary">
        마이페이지 정보를 불러오는 중이에요.
      </p>
    </main>
  );
}
