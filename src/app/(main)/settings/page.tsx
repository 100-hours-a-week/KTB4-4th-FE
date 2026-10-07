// 알림과 개인정보 관련 항목을 관리하는 설정 페이지

"use client";

import { useState } from "react";

import Modal from "@/components/common/Modal";
import WithdrawalModal from "@/components/settings/WithdrawalModal";

type NotificationSetting = "webPush" | "birthday" | "friendJoined" | "feedback";
type PolicyModalType = "aiConsent" | "privacyPolicy" | "terms";
type PrivacyItemType = "preferences" | PolicyModalType;

const notificationItems: { id: NotificationSetting; label: string }[] = [
  { id: "webPush", label: "웹 푸시 알림" },
  { id: "birthday", label: "친구 생일 알림" },
  { id: "friendJoined", label: "친구 가입 알림" },
  { id: "feedback", label: "피드백 알림" },
];
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

export default function SettingsPage() {
  // TODO: 알림 설정 조회 API 연동 후 서버 응답값으로 초기 상태 설정
  const [notificationSettings, setNotificationSettings] = useState<
    Record<NotificationSetting, boolean>
  >({
    webPush: false,
    birthday: true,
    friendJoined: true,
    feedback: false,
  });
  const [openPolicyModal, setOpenPolicyModal] = useState<PolicyModalType | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const activePolicyModal = openPolicyModal ? policyModalContent[openPolicyModal] : null;

  const handleNotificationToggle = (setting: NotificationSetting) => {
    setNotificationSettings((currentSettings) => ({
      ...currentSettings,
      [setting]: !currentSettings[setting],
    }));

    // TODO: 웹 푸시 구현 시 webPush 설정을 브라우저 알림 권한 요청 및 구독 API와 연동
    // TODO: 알림 설정 저장 API 연동
  };

  const handleWithdrawalClick = () => {
    setIsWithdrawalModalOpen(true);
  };

  const handleWithdrawalConfirm = () => {
    // TODO: 회원 탈퇴 API 연동 후 성공 시 로그아웃 및 로그인 페이지 이동 처리
  };

  const handlePrivacyItemClick = (item: PrivacyItemType) => {
    if (item === "preferences") {
      // TODO: 온보딩 이후 저장된 취향 데이터 페이지 구현 시 이동 처리
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
            {notificationItems.map(({ id, label }) => {
              const isEnabled = notificationSettings[id];

              return (
                <li
                  key={id}
                  className="flex h-[64px] items-center justify-between gap-4 border-b border-border pr-2"
                >
                  <span id={`${id}-notification-label`} className="text-body-sm">
                    {label}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    aria-labelledby={`${id}-notification-label`}
                    className="relative h-touch w-11 shrink-0 border-0 bg-transparent p-0"
                    onClick={() => handleNotificationToggle(id)}
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
