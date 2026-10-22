# 카카오 작은글씨 웹폰트 분할 스크립트

카카오 작은글씨(Kakao Small Sans) 공식 TTF를 글자 범위별 woff2 조각으로 나누고, 조각마다 `unicode-range`를 지정한 `@font-face` CSS를 생성합니다. 브라우저는 화면에 실제로 쓰인 글자가 들어 있는 조각만 내려받습니다.

## 생성 결과

| 결과물                                                   | 내용                                                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/fonts/KakaoSmallSans-{굵기}-{버전}.{번호}.woff2` | 글자 범위별 폰트 조각 (Regular·Bold 각 96개)                                                                                               |
| `public/fonts/kakao-small-sans-{버전}.css`               | 조각별 `@font-face` 정의. 첫 화면 표시를 막지 않도록 공통 CSS와 분리해 `src/components/layout/FontStylesheet.tsx`가 비차단 방식으로 불러옴 |

## 실행 방법

Python 3.10 이상과 프로젝트 의존성(`npm install`)이 필요합니다. 프로젝트 루트에서 실행합니다.

```bash
python3 -m venv scripts/fonts/.venv
scripts/fonts/.venv/bin/pip install -r scripts/fonts/requirements.txt
scripts/fonts/.venv/bin/python scripts/fonts/split_fonts.py
```

조각 파일은 그대로 두고 폰트 정의 CSS만 다시 만들 때는 `--css-only` 옵션을 붙입니다.

스크립트는 다음 순서로 동작합니다.

1. 카카오 공식 저장소의 고정 커밋에서 Regular·Bold TTF를 내려받고 SHA-256 해시를 확인합니다.
2. `ranges/google-notosanskr.json`의 범위로 글자를 나눕니다. 범위에 없는 글자는 마지막 조각으로 묶습니다.
3. 조각을 woff2로 저장하고, 조각을 합친 글자가 원본과 같은지와 저작권·라이선스 정보가 남아 있는지 확인합니다.
4. `public/fonts/kakao-small-sans-{버전}.css`를 다시 생성하고 프로젝트 Prettier 규칙으로 정리합니다.

## 분할 범위

`ranges/google-notosanskr.json`은 Google Fonts가 Noto Sans KR에 사용하는 사용 빈도 기반 분할 범위(124개)입니다. 자주 쓰는 글자가 앞쪽 조각에 모여 있어 한 화면에 필요한 조각 수가 적습니다. 출처 URL과 가져온 날짜는 파일 안에 기록되어 있습니다.

## 폰트를 업데이트할 때

1. `split_fonts.py`의 `FONT_VERSION`, `SOURCE_COMMIT`, `SOURCE_SHA256`을 새 버전에 맞게 수정합니다.
2. `src/app/fonts.ts`의 `KAKAO_SMALL_SANS_STYLESHEET` 경로를 새 CSS 파일명으로 수정합니다.
3. 스크립트를 실행한 뒤 이전 버전의 조각 파일과 CSS 파일을 삭제합니다.

`/fonts` 경로는 1년 동안 변경 없이 캐시되므로(`next.config.ts`), 폰트 내용이나 분할 범위가 바뀌면 반드시 파일명의 버전도 바꿔야 합니다.

## 라이선스

카카오 작은글씨는 [SIL Open Font License 1.1](../../public/fonts/OFL.txt)로 배포됩니다. 예약 폰트 이름이 없어 변환·분할 후 같은 이름으로 배포할 수 있으며, 각 조각에 저작권·라이선스 정보를 유지하고 `public/fonts/OFL.txt`를 함께 배포해야 합니다.
