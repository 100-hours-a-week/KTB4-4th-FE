// 화면 코드에서 기록하는 성능 측정 지표 이름 모음

export const PERF_METRIC = {
  // 페이지 문서 로드 시작부터 상품 목록 첫 페이지가 DOM에 반영될 때까지
  // 서버 선조회로 목록이 HTML에 포함된 경우 목록 표시 시점이 아닌 하이드레이션 시점을 기록함
  productListPageLoad: "product-list:page-load",
  // 카테고리·예산 변경부터 바뀐 조건의 상품 목록 첫 페이지가 DOM에 반영될 때까지
  productListFilterChange: "product-list:filter-change",
} as const;
