# Need U FrontEnd

React와 Next.js App Router 기반 모바일 웹 프로젝트입니다.

## 로컬 실행

Node.js 20.9 이상과 npm이 필요합니다. 현재 개발 환경에서는 Node.js 24를 사용합니다.

```bash
npm ci
npm run dev
```

개발 서버가 준비되면 macOS 브라우저에서 <http://localhost:3000>이 자동으로 열립니다. 포트를 바꾸려면 `PORT=3100 npm run dev`처럼 실행합니다.

## 환경 변수

로컬 환경 변수는 `.env.example`을 참고해 `.env.local`에 설정합니다. `NEXT_PUBLIC_` 접두사가 있는 값은 브라우저 번들에 포함되어 빌드 후 변경할 수 없습니다.

| 변수                        | 용도                                      | 주입 시점 | 환경별 구분 | 비밀값 여부 |
| --------------------------- | ----------------------------------------- | --------- | ----------- | ----------- |
| `BACKEND_API_BASE_URL`      | Next.js 서버의 백엔드 인증 API 기본 주소  | 실행      | 필요        | 아니요      |
| `SENTRY_ENVIRONMENT`        | 서버와 Edge의 Sentry 환경 이름            | 실행      | 필요        | 아니요      |
| `NEXT_PUBLIC_SENTRY_DSN`    | 브라우저와 서버의 Sentry 이벤트 전송 주소 | 빌드      | 불필요      | 아니요      |
| `NEXT_PUBLIC_USE_MOCK_DATA` | 친구·추천 상품 목업 데이터 사용 여부      | 빌드      | 불필요      | 아니요      |
| `SENTRY_DSN`                | 서버에서 공개 DSN 대신 사용할 선택 값     | 실행      | 선택        | 아니요      |
| `SENTRY_ORG`                | Sentry 조직 slug                          | 빌드      | 불필요      | 아니요      |
| `SENTRY_PROJECT`            | Sentry 프로젝트 slug                      | 빌드      | 불필요      | 아니요      |
| `SENTRY_AUTH_TOKEN`         | 프로덕션 빌드의 소스맵 업로드 인증        | 빌드      | 불필요      | 예          |
| `SENTRY_RELEASE`            | 오류와 소스맵을 연결할 릴리스 식별자      | 빌드      | 불필요      | 아니요      |

로컬 개발에서는 Next.js가 브라우저의 `/api/v1/*` 요청을 `BACKEND_API_BASE_URL`로 중계합니다. 배포 환경에서는 이 rewrite를 생성하지 않으며 ALB Listener Rule이 `/api/v1/*` 요청을 Backend Target Group으로 전달합니다. 보호 페이지 인증을 담당하는 `src/proxy.ts`는 배포 환경에서도 백엔드 API를 직접 호출하므로 `BACKEND_API_BASE_URL`을 컨테이너 실행 시 주입해야 합니다.

| 환경 | `BACKEND_API_BASE_URL`       | `SENTRY_ENVIRONMENT` |
| ---- | ---------------------------- | -------------------- |
| Dev  | `https://dev.needu.gift/api` | `development`        |
| Prod | `https://needu.gift/api`     | `production`         |

로컬 개발에서 오류 수집만 확인할 때는 `NEXT_PUBLIC_SENTRY_DSN`만 필요합니다. 브라우저 Sentry 환경은 `needu.gift`에서 `production`, 그 외 hostname에서 `development`로 설정됩니다. 서버와 Edge는 `SENTRY_ENVIRONMENT`를 사용합니다. `NEXT_PUBLIC_USE_MOCK_DATA`는 로컬 성능 측정이 필요할 때만 `true`로 설정하며 공통 배포 이미지에서는 `false`를 유지합니다.

GitHub Actions는 `/needu/common/frontend-build`에서 `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`을 조회합니다. 인증 토큰은 Docker BuildKit secret으로 빌드 단계에만 전달되며 이미지 환경 변수나 레이어에 저장하지 않습니다. GitHub 커밋 SHA는 `SENTRY_RELEASE`로 자동 전달됩니다.

## 검증

```bash
npm run lint
npm run build
```

프로젝트는 TypeScript strict, Tailwind CSS, ESLint를 사용합니다. 의존성 버전은 `package-lock.json`에 기록되어 있습니다.

## 릴리스

커밋 메시지는 `type: 작업 제목 (#이슈번호)` 형식을 사용합니다. `feat`는 minor, `fix`와 `perf`는 patch, `BREAKING CHANGE`는 major 릴리스를 생성하며 `chore`와 `docs`는 릴리스를 생성하지 않습니다.

`main` 브랜치에 변경 사항이 반영되면 GitHub Actions가 Git 태그와 GitHub Release를 자동으로 생성합니다. 로컬에서는 다음 명령으로 게시 없이 설정을 확인할 수 있습니다.

```bash
npm run release:dry-run
```
