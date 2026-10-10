// 온보딩 시작 전 개인정보 활용 동의를 받는 단계 컴포넌트
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ActionButton from "@/components/common/ActionButton";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { ApiRequestError } from "@/lib/api/client";
import type { ConsentItem } from "@/lib/api/consents";
import { saveConsents } from "@/lib/api/saveConsents";

interface PrivacyConsentStepProps {
  consents: ConsentItem[];
}

export default function PrivacyConsentStep({ consents }: PrivacyConsentStepProps) {
  const router = useRouter();
  const { completePrivacyConsent } = useOnboarding();
  const [agreedConsentIds, setAgreedConsentIds] = useState<Set<number>>(() => new Set());
  const [isSaving, setIsSaving] = useState(false);
  const allRequiredConsentsAgreed = consents.every(
    ({ id, required }) => !required || agreedConsentIds.has(id),
  );

  const toggleConsent = (id: number) => {
    setAgreedConsentIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      return nextIds;
    });
  };

  const handleSubmit = async () => {
    if (!allRequiredConsentsAgreed || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await saveConsents({
        consents: consents.map(({ id }) => ({
          id,
          agreed: agreedConsentIds.has(id),
        })),
      });
      completePrivacyConsent();
    } catch (error) {
      router.replace(
        error instanceof ApiRequestError && error.status === 401 ? "/login" : "/error",
      );
    } finally {
      setIsSaving(false);
    }
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
        {consents.map(({ id, title, content }, index) => (
          <article key={id}>
            <h2 className="text-body-lg font-bold">
              {index + 1}. {title} (필수)
            </h2>
            <p className="mt-1 max-h-[calc(2*1.5em)] overflow-y-auto whitespace-pre-wrap break-keep text-body text-muted">
              {content}
            </p>

            <label className="mt-1 ml-auto flex min-h-11 w-fit cursor-pointer items-center gap-2 text-body text-foreground">
              <span>동의합니다</span>
              <input
                type="checkbox"
                name={`consent-${id}`}
                checked={agreedConsentIds.has(id)}
                onChange={() => toggleConsent(id)}
                disabled={isSaving}
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
        <ActionButton
          disabled={!allRequiredConsentsAgreed}
          isLoading={isSaving}
          loadingText="저장 중..."
          onClick={handleSubmit}
          className="font-bold"
        >
          다음
        </ActionButton>
      </div>
    </main>
  );
}
