// 개인정보 활용 동의 내용을 안내하는 온보딩 페이지
"use client";

import { useState } from "react";

import ActionButton from "@/components/common/ActionButton";

// TODO: 개인정보 활용 동의 원문 API 구현 후 항목 내용을 교체하고, 원문이 2줄을 초과하면 각 본문에 개별 스크롤 적용
const consentItems = [
  {
    id: "collection",
    title: "무엇을 수집하나요",
    description:
      "AI와 나눈 대화에서 추출한 취향 정보(관심 카테고리, 선호·비선호 항목, 예산대)를 수집합니다. 대화 원문은 저장하지 않습니다.",
  },
  {
    id: "purpose",
    title: "어디에 사용하나요",
    description:
      "선물 추천의 정확도를 높이는 데에만 사용합니다. 광고 및 마케팅 목적으로는 사용하지 않습니다.",
  },
  {
    id: "visibility",
    title: "누구에게 보이나요",
    description:
      "내가 허용한 친구에게만 요약된 취향 정보가 보입니다. 제3자에게 제공하거나 판매하지 않습니다.",
  },
  {
    id: "retention",
    title: "얼마나 보관하나요",
    description: "동의를 유지하는 동안 보관하며, 회원 탈퇴 시 모두 삭제합니다.",
  },
  {
    id: "withdrawal",
    title: "동의를 철회할 수 있나요",
    description: "설정에서 언제든지 철회할 수 있습니다. 철회하면 새로운 취향 분석이 중단됩니다.",
  },
] as const;

type ConsentId = (typeof consentItems)[number]["id"];

const initialConsentState: Record<ConsentId, boolean> = {
  collection: false,
  purpose: false,
  visibility: false,
  retention: false,
  withdrawal: false,
};

export default function PrivacyConsentPage() {
  const [consents, setConsents] = useState(initialConsentState);
  const allAgreed = Object.values(consents).every(Boolean);

  const handleConsentChange = (id: ConsentId) => {
    setConsents((currentConsents) => ({
      ...currentConsents,
      [id]: !currentConsents[id],
    }));
  };

  const handleNext = () => {
    // TODO: 개인정보 활용 동의 API 연동 후 동의 내역을 저장하고, 아직 미구현된 후속 온보딩 페이지로 이동 처리
  };

  return (
    <main className="page-content flex min-h-0 flex-1 flex-col overflow-hidden bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <header className="shrink-0 pt-6">
        <h1 className="text-[24px] leading-[30px] font-bold text-foreground">
          개인정보 활용에 관한
          <br />
          동의 절차예요.
        </h1>
        <p className="mt-3 break-keep text-body-sm text-muted">
          위 내용은 설정에서 다시 볼 수 있어요.
        </p>
      </header>

      <section
        aria-label="개인정보 활용 동의 항목"
        className="mt-5 flex min-h-0 flex-1 flex-col gap-1"
      >
        {consentItems.map(({ id, title, description }, index) => (
          <article key={id}>
            <h2 className="text-body-lg font-bold">
              {index + 1}. {title}
            </h2>
            <p className="mt-1 break-keep text-body text-muted">{description}</p>

            <label className="mt-1 ml-auto flex min-h-11 w-fit cursor-pointer items-center gap-2 text-body text-foreground">
              <span>동의합니다</span>
              <input
                type="checkbox"
                name={id}
                checked={consents[id]}
                onChange={() => handleConsentChange(id)}
                aria-label={`${title} 동의`}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-transparent text-transparent transition-colors peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground"
              >
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                  <path
                    d="m3.25 8.25 3 3 6.5-6.5"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </label>
          </article>
        ))}
      </section>

      <div className="shrink-0 pt-4">
        <ActionButton disabled={!allAgreed} onClick={handleNext} className="font-bold">
          다음
        </ActionButton>
      </div>
    </main>
  );
}
