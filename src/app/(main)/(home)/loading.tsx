// 메인 화면 데이터 서버 조회 중 표시하는 로딩 화면 (라우트 그룹으로 다른 하위 경로에는 적용되지 않음)

export default function HomeLoading() {
  return (
    <main
      aria-busy="true"
      className="page-content flex flex-1 items-center justify-center bg-background text-foreground"
    >
      <p role="status" className="text-body text-foreground-secondary">
        메인 정보를 불러오는 중이에요.
      </p>
    </main>
  );
}
