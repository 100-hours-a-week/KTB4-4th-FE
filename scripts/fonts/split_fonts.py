# 카카오 작은글씨 공식 TTF를 글자 범위별 woff2 조각으로 나누고, 조각별 @font-face CSS를 생성하는 스크립트

import argparse
import hashlib
import io
import json
import subprocess
import urllib.request
from multiprocessing import Pool
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
RANGES_PATH = Path(__file__).resolve().parent / "ranges" / "google-notosanskr.json"
FONTS_DIR = ROOT / "public" / "fonts"
# 공식 저장소의 고정 커밋 (폰트 버전 v2.002)
FONT_VERSION = "v2.002"
# 화면 표시를 막지 않도록 공통 CSS와 분리해 제공하는 폰트 정의 CSS (src/app/fonts.ts의 경로와 일치 필요)
CSS_PATH = FONTS_DIR / f"kakao-small-sans-{FONT_VERSION}.css"
SOURCE_COMMIT = "a1786bb0b7b21a8273e42fdd94d94eed09b34fce"
SOURCE_URL = (
    "https://raw.githubusercontent.com/kakao/kakao-font/"
    f"{SOURCE_COMMIT}/Kakao-Small-Sans/fonts/KakaoSmallSans-{{weight}}.ttf"
)
SOURCE_SHA256 = {
    "Regular": "8a88877006a18f92bc41af86b363481eaa51d97a61c197dda8a7840de2bbb831",
    "Bold": "53e001712497480a53c2897375a73d3542b6e8928d2d8effd2d442b41dbc6c77",
}
CSS_WEIGHTS = {"Regular": 400, "Bold": 700}


def download_source(weight):
    data = urllib.request.urlopen(SOURCE_URL.format(weight=weight), timeout=60).read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != SOURCE_SHA256[weight]:
        raise SystemExit(f"{weight} 원본 폰트 해시 불일치: {digest}")
    return data


def build_slices(cmap, google_slices):
    # 폰트에 있는 글자만 남기고, 기준 범위에 없는 글자는 마지막 조각으로 묶음
    slices = [sorted(cmap & group) for group in google_slices if cmap & group]
    rest = sorted(cmap - set().union(*google_slices))
    if rest:
        slices.append(rest)
    return slices


def slice_file_name(weight, index):
    return f"KakaoSmallSans-{weight}-{FONT_VERSION}.{index}.woff2"


def write_slice(job):
    weight, index, codepoints, source = job
    font = TTFont(io.BytesIO(source))
    options = subset.Options()
    options.name_IDs = ["*"]  # 저작권·라이선스 정보 유지 (OFL 조건)
    options.name_languages = ["*"]
    options.name_legacy = True
    options.notdef_outline = True
    options.flavor = "woff2"
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    subset.save_font(font, str(FONTS_DIR / slice_file_name(weight, index)), options)


def verify(weight, cmap, slices):
    covered = set()
    for index in range(len(slices)):
        font = TTFont(str(FONTS_DIR / slice_file_name(weight, index)))
        covered.update(font.getBestCmap())
        name_ids = {record.nameID for record in font["name"].names}
        if not {0, 13} <= name_ids:
            raise SystemExit(f"{slice_file_name(weight, index)}에 저작권·라이선스 정보 없음")
    if covered != cmap:
        raise SystemExit(f"{weight} 조각 글자 합계가 원본과 다름")


def to_unicode_range(codepoints):
    ranges, start, prev = [], None, None
    for codepoint in codepoints:
        if start is None:
            start = prev = codepoint
        elif codepoint == prev + 1:
            prev = codepoint
        else:
            ranges.append((start, prev))
            start = prev = codepoint
    ranges.append((start, prev))
    return ", ".join(f"U+{a:x}" if a == b else f"U+{a:x}-{b:x}" for a, b in ranges)


def write_css(manifest):
    lines = [
        "/* 애플리케이션 전역에서 사용하는 카카오 작은글씨 웹폰트의 글자 범위별 조각 정의 "
        "(scripts/fonts/split_fonts.py로 생성, SIL OFL 1.1, /fonts/OFL.txt) */",
        "",
    ]
    for weight, slices in manifest.items():
        for index, codepoints in enumerate(slices):
            lines += [
                "@font-face {",
                '  font-family: "Kakao Small Sans";',
                f'  src: url("/fonts/{slice_file_name(weight, index)}") format("woff2");',
                f"  font-weight: {CSS_WEIGHTS[weight]};",
                "  font-style: normal;",
                "  font-display: swap;",
                f"  unicode-range: {to_unicode_range(codepoints)};",
                "}",
                "",
            ]
    CSS_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    # 프로젝트 Prettier 규칙에 맞게 생성 CSS 정리
    subprocess.run(["npx", "prettier", "--write", str(CSS_PATH)], cwd=ROOT, check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--css-only", action="store_true", help="조각 파일은 그대로 두고 폰트 정의 CSS만 다시 생성")
    args = parser.parse_args()
    google_slices = [set(group) for group in json.loads(RANGES_PATH.read_text())["slices"]]

    manifest, jobs, cmaps = {}, [], {}
    for weight in CSS_WEIGHTS:
        source = download_source(weight)
        cmap = set(TTFont(io.BytesIO(source)).getBestCmap())
        slices = build_slices(cmap, google_slices)
        manifest[weight], cmaps[weight] = slices, cmap
        jobs += [(weight, index, codepoints, source) for index, codepoints in enumerate(slices)]

    if not args.css_only:
        # 같은 버전의 이전 조각 파일만 정리
        for old in FONTS_DIR.glob(f"KakaoSmallSans-*-{FONT_VERSION}.*.woff2"):
            old.unlink()
        with Pool() as pool:
            pool.map(write_slice, jobs)

    for weight, slices in manifest.items():
        verify(weight, cmaps[weight], slices)
    write_css(manifest)
    slices_result = "기존 조각 유지" if args.css_only else f"조각 {len(jobs)}개 생성"
    print(f"{slices_result} → {FONTS_DIR.relative_to(ROOT)}, CSS → {CSS_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
