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

로컬 환경 변수는 `.env.example`을 참고해 `.env.local`에 설정합니다.

| 변수                     | 용도                                      | 비밀값 여부 |
| ------------------------ | ----------------------------------------- | ----------- |
| `BACKEND_API_BASE_URL`   | 백엔드 API 기본 주소                      | 아니요      |
| `NEXT_PUBLIC_SENTRY_DSN` | 브라우저와 서버의 Sentry 이벤트 전송 주소 | 아니요      |
| `SENTRY_DSN`             | 서버에서 공개 DSN 대신 사용할 선택 값     | 아니요      |
| `SENTRY_ORG`             | Sentry 조직 slug                          | 아니요      |
| `SENTRY_PROJECT`         | Sentry 프로젝트 slug                      | 아니요      |
| `SENTRY_AUTH_TOKEN`      | 프로덕션 빌드의 소스맵 업로드 인증        | 예          |
| `SENTRY_RELEASE`         | 오류와 소스맵을 연결할 릴리스 식별자      | 아니요      |

로컬 개발에서 오류 수집만 확인할 때는 `NEXT_PUBLIC_SENTRY_DSN`만 필요합니다. 소스맵 업로드까지 확인하려면 Sentry 조직, 프로젝트, 인증 토큰도 설정한 뒤 프로덕션 빌드를 실행합니다. 인증 토큰은 저장소에 커밋하지 않습니다.

프로덕션 Docker 이미지는 GitHub Actions에서 다음 Repository 설정을 사용합니다.

- Secret: `SENTRY_AUTH_TOKEN`
- Variables: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`

인증 토큰은 Docker BuildKit secret으로 빌드 단계에만 전달되며 이미지 환경 변수나 레이어에 저장하지 않습니다. GitHub 커밋 SHA는 `SENTRY_RELEASE`로 자동 전달됩니다.

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
