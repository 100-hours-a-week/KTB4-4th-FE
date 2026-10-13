// 알림과 개인정보 관련 항목을 관리하는 설정 페이지

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import Modal from "@/components/common/Modal";
import WithdrawalModal from "@/components/settings/WithdrawalModal";
import { ApiRequestError } from "@/lib/api/client";
import {
  type NotificationSettingType,
  updateNotificationSetting,
} from "@/lib/api/notificationSettings";

type PolicyModalType = "aiConsent" | "privacyPolicy" | "terms";
type PrivacyItemType = "preferences" | PolicyModalType;

const notificationItems: { type: NotificationSettingType; label: string }[] = [
  { type: "WEB_PUSH", label: "웹 푸시 알림" },
  { type: "FRIEND_BIRTHDAY", label: "친구 생일 알림" },
  { type: "FRIEND_JOINED", label: "친구 가입 알림" },
  { type: "PURCHASE_FEEDBACK", label: "피드백 알림" },
];
const initialNotificationSettings: Record<NotificationSettingType, boolean> = {
  WEB_PUSH: false,
  FRIEND_BIRTHDAY: true,
  FRIEND_JOINED: true,
  PURCHASE_FEEDBACK: false,
};
const privacyItems: { id: PrivacyItemType; label: string }[] = [
  { id: "preferences", label: "저장된 취향 데이터" },
  { id: "aiConsent", label: "AI 대화 정보 활용 동의" },
  { id: "privacyPolicy", label: "개인정보 처리방침" },
  { id: "terms", label: "이용약관" },
];

// TODO: 각 정책의 최종 원문 확정 후 임시 안내문을 실제 내용으로 교체
const policyModalContent: Record<PolicyModalType, { title: string; body: string }> = {
  aiConsent: {
    title: "AI 대화 정보 활용 동의",
    body: "AI 대화 정보 활용 동의 원문을 준비 중입니다. 확정된 원문은 추후 이 영역에 제공될 예정입니다.",
  },
  privacyPolicy: {
    title: "개인정보 처리방침",
    body: "개인정보 처리방침 원문을 준비 중입니다. 확정된 원문은 추후 이 영역에 제공될 예정입니다.",
  },
  terms: {
    title: "이용약관",
    body: "이용약관 원문을 준비 중입니다. 확정된 원문은 추후 이 영역에 제공될 예정입니다.",
  },
};

const getNotificationErrorMessage = (error: unknown) => {
  if (!(error instanceof ApiRequestError)) {
    return "알림 설정을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (error.status === 429 && error.retryAfterSeconds !== undefined) {
    return `${error.message} ${error.retryAfterSeconds}초 후 다시 시도해 주세요.`;
  }

  return error.message;
};

export default function SettingsPage() {
  const router = useRouter();
  const pendingSettingTypesRef = useRef(new Set<NotificationSettingType>());

  // TODO: 알림 설정 조회 API 연동 후 서버 응답값으로 초기 상태 설정
  const [notificationSettings, setNotificationSettings] = useState<
    Record<NotificationSettingType, boolean>
  >(initialNotificationSettings);
  const [pendingSettingTypes, setPendingSettingTypes] = useState(
    () => new Set<NotificationSettingType>(),
  );
  const [notificationErrors, setNotificationErrors] = useState<
    Partial<Record<NotificationSettingType, string>>
  >({});
  const [openPolicyModal, setOpenPolicyModal] = useState<PolicyModalType | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const activePolicyModal = openPolicyModal ? policyModalContent[openPolicyModal] : null;

  const handleNotificationToggle = async (settingType: NotificationSettingType) => {
    if (pendingSettingTypesRef.current.has(settingType)) {
      return;
    }

    const previousEnabled = notificationSettings[settingType];
    const nextEnabled = !previousEnabled;

    pendingSettingTypesRef.current.add(settingType);
    setPendingSettingTypes(new Set(pendingSettingTypesRef.current));
    setNotificationErrors((currentErrors) => ({
      ...currentErrors,
      [settingType]: "",
    }));
    setNotificationSettings((currentSettings) => ({
      ...currentSettings,
      [settingType]: nextEnabled,
    }));

    try {
      const updatedSetting = await updateNotificationSetting(settingType, nextEnabled);

      setNotificationSettings((currentSettings) => ({
        ...currentSettings,
        [settingType]: updatedSetting.enabled,
      }));
    } catch (error) {
      setNotificationSettings((currentSettings) => ({
        ...currentSettings,
        [settingType]: previousEnabled,
      }));

      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setNotificationErrors((currentErrors) => ({
        ...currentErrors,
        [settingType]: getNotificationErrorMessage(error),
      }));
    } finally {
      pendingSettingTypesRef.current.delete(settingType);
      setPendingSettingTypes(new Set(pendingSettingTypesRef.current));
    }

    // TODO: 웹 푸시 구현 시 WEB_PUSH 설정을 브라우저 알림 권한 요청 및 구독 API와 연동
  };

  const handleWithdrawalClick = () => {
    setIsWithdrawalModalOpen(true);
  };

  const handleWithdrawalConfirm = () => {
    // TODO: 회원 탈퇴 API 연동 후 성공 시 로그아웃 및 로그인 페이지 이동 처리
  };

  const handlePrivacyItemClick = (item: PrivacyItemType) => {
    if (item === "preferences") {
      router.push("/settings/preferences");
      return;
    }

    setOpenPolicyModal(item);
  };

  return (
    <main className="page-content flex flex-1 flex-col bg-background pb-[max(2.5rem,env(safe-area-inset-bottom))] text-foreground">
      <section aria-labelledby="notification-settings-title" className="pt-7">
        <h2 id="notification-settings-title" className="text-heading-3 font-bold">
          알림 설정
        </h2>

        <div className="mt-3">
          <ul className="m-0 list-none p-0">
            {notificationItems.map(({ type, label }) => {
              const isEnabled = notificationSettings[type];
              const isPending = pendingSettingTypes.has(type);
              const errorMessage = notificationErrors[type];

              return (
                <li
                  key={type}
                  className="flex min-h-[64px] items-center justify-between gap-4 border-b border-border py-2 pr-2"
                >
                  <div className="min-w-0">
                    <span id={`${type}-notification-label`} className="text-body-sm">
                      {label}
                    </span>
                    {errorMessage && (
                      <p role="alert" className="mt-1 text-caption text-danger">
                        {errorMessage}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    aria-busy={isPending}
                    aria-labelledby={`${type}-notification-label`}
                    disabled={isPending}
                    className="relative h-touch w-11 shrink-0 border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void handleNotificationToggle(type)}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-1/2 h-5 w-11 -translate-y-1/2 rounded-full transition-colors duration-200 ${
                        isEnabled ? "bg-primary" : "bg-disabled"
                      }`}
                    >
                      <span
                        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface shadow-sm transition-[left] duration-200 ${
                          isEnabled ? "left-[26px]" : "left-0.5"
                        }`}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-labelledby="privacy-settings-title" className="mt-10">
        <h2 id="privacy-settings-title" className="text-heading-3 font-bold">
          AI 및 개인정보
        </h2>

        <div className="mt-3">
          <ul className="m-0 list-none p-0">
            {privacyItems.map(({ id, label }) => (
              <li key={id} className="border-b border-border">
                <button
                  type="button"
                  className="flex h-[72px] w-full items-center justify-between gap-4 border-0 bg-transparent p-0 text-left text-body-sm text-foreground transition-colors active:bg-background-subtle"
                  onClick={() => handlePrivacyItemClick(id)}
                >
                  <span className="text-body-sm">{label}</span>
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0 text-muted"
                  >
                    <path
                      d="M7.5 4L13.5 10L7.5 16"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <button
        type="button"
        className="mt-7 self-start border-0 bg-transparent p-0 text-muted"
        onClick={handleWithdrawalClick}
      >
        <span className="text-caption">탈퇴하기</span>
      </button>

      <Modal
        open={activePolicyModal !== null}
        onClose={() => setOpenPolicyModal(null)}
        title={activePolicyModal?.title ?? ""}
        secondAction={{ label: "확인", onClick: () => setOpenPolicyModal(null) }}
      >
        <p className="m-0 whitespace-pre-wrap text-body-sm leading-relaxed text-foreground-secondary">
          {activePolicyModal?.body}
        </p>
      </Modal>

      <WithdrawalModal
        open={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        onConfirm={handleWithdrawalConfirm}
      />
    </main>
  );
}
