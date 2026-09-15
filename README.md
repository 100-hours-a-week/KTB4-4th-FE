# Need U 프런트엔드

React와 Next.js App Router 기반 모바일 웹 프로젝트입니다.

## 로컬 실행

Node.js 20.9 이상과 npm이 필요합니다. 현재 개발 환경에서는 Node.js 24를 사용합니다.

```bash
npm ci
npm run dev
```

개발 서버가 준비되면 macOS 브라우저에서 <http://localhost:3000>이 자동으로 열립니다. 포트를 바꾸려면 `PORT=3100 npm run dev`처럼 실행합니다.

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
