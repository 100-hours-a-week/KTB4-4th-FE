// 서버 측 백엔드 요청의 API 경로별 Service 기본 주소 선택 유틸
type BackendService = "auth" | "recommendation" | "social";

interface BackendServiceRoute {
  path: string;
  service: BackendService;
  // true면 하위 경로까지 포함하고, false면 경로가 정확히 일치할 때만 적용
  includesSubpaths: boolean;
}

// 번들러가 환경 변수를 인식하도록 동적 키 대신 변수명을 직접 참조
const BACKEND_SERVICE_BASE_URL_READERS: Record<BackendService, () => string | undefined> = {
  auth: () => process.env.BACKEND_AUTH_API_BASE_URL,
  recommendation: () => process.env.BACKEND_RECOMMENDATION_API_BASE_URL,
  social: () => process.env.BACKEND_SOCIAL_API_BASE_URL,
};

// 하위 경로마다 담당 Service가 다른 /users/me는 경로별로 등록
const BACKEND_SERVICE_ROUTES: readonly BackendServiceRoute[] = [
  { path: "/api/v1/auth", service: "auth", includesSubpaths: true },
  { path: "/api/v1/guidance", service: "auth", includesSubpaths: false },
  { path: "/api/v1/users/me", service: "auth", includesSubpaths: false },
  { path: "/api/v1/users/me/consents", service: "auth", includesSubpaths: false },
  { path: "/api/v1/products", service: "recommendation", includesSubpaths: true },
  {
    path: "/api/v1/users/me/personal-recommendations",
    service: "recommendation",
    includesSubpaths: false,
  },
  { path: "/api/v1/users/me/gift-preferences", service: "recommendation", includesSubpaths: false },
  { path: "/api/v1/friends", service: "social", includesSubpaths: true },
  { path: "/api/v1/users/me/settings/notifications", service: "social", includesSubpaths: false },
];

function findBackendService(pathname: string) {
  return BACKEND_SERVICE_ROUTES.find(
    ({ path, includesSubpaths }) =>
      pathname === path || (includesSubpaths && pathname.startsWith(`${path}/`)),
  )?.service;
}

function normalizeBaseUrl(baseUrl: string, variableName: string) {
  const normalizedBaseUrl = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  if (!new Set(["http:", "https:"]).has(normalizedBaseUrl.protocol)) {
    throw new Error(`${variableName}은 HTTP 또는 HTTPS 주소여야 합니다.`);
  }

  return normalizedBaseUrl;
}

// 담당 Service가 없거나 Service 주소가 없는 경우 BACKEND_API_BASE_URL을 대체 주소로 사용
export function getBackendApiBaseUrl(endpoint: string) {
  const [pathname] = endpoint.split("?", 1);
  const service = findBackendService(pathname);
  const serviceBaseUrl = service ? BACKEND_SERVICE_BASE_URL_READERS[service]()?.trim() : undefined;

  if (serviceBaseUrl) {
    return normalizeBaseUrl(serviceBaseUrl, `${service} Service 기본 주소`);
  }

  const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL?.trim();

  if (!backendApiBaseUrl) {
    throw new Error("BACKEND_API_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  return normalizeBaseUrl(backendApiBaseUrl, "BACKEND_API_BASE_URL");
}
