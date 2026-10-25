// 알림 설정, 정책 모달별 동의 내용, 쿼리로 처음부터 열 정책 모달을 전달하는 사용자 설정 화면의 서버 컴포넌트 진입점

import { redirect } from "next/navigation";

import SettingsContent, {
  type PolicyConsents,
  type PolicyModalType,
} from "@/components/settings/SettingsContent";
import { type ConsentContent, type ConsentItem, getConsents } from "@/lib/api/consents";
import { getNotificationSettings } from "@/lib/api/getNotificationSettings";
import type {
  NotificationSetting,
  NotificationSettingType,
} from "@/lib/api/notificationSettingTypes";
import { ServerApiError } from "@/lib/api/serverClient";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "설정",
};

const notificationSettingTypes = [
  "FRIEND_BIRTHDAY",
  "FRIEND_JOINED",
  "PURCHASE_FEEDBACK",
] as const satisfies readonly NotificationSettingType[];

function createInitialNotificationSettings(settings: NotificationSetting[]) {
  const settingsByType = new Map(settings.map((setting) => [setting.type, setting]));

  return Object.fromEntries(
    notificationSettingTypes.map((settingType) => {
      const setting = settingsByType.get(settingType);

      if (!setting) {
        throw new Error(`알림 설정 응답에 ${settingType} 항목이 없습니다.`);
      }

      return [settingType, setting.enabled];
    }),
  ) as Record<NotificationSettingType, boolean>;
}

async function getInitialNotificationSettingsOrRedirect() {
  try {
    const { settings } = await getNotificationSettings();
    return createInitialNotificationSettings(settings);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      redirect("/login");
    }

    redirect("/error");
  }
}

// 동의 항목 응답에 종류를 구분하는 필드가 없어 각 정책 모달에 보여줄 항목은 제목으로만 구분함
// 백엔드 제목이 바뀌면 이 값도 함께 바꿔야 함
const policyConsentTitles: Record<PolicyModalType, readonly string[]> = {
  aiConsent: ["AI 대화 정보 활용 동의"],
  privacyPolicy: ["친구에게 취향 정보 공개 동의", "상품 이용 기록 활용 동의"],
  terms: ["개인정보 수집 및 이용 동의"],
};

// 일부 항목만 보여주면 정책 내용이 빠진 채 보이므로 하나라도 없으면 null 반환
function pickConsentContents(consents: ConsentItem[], titles: readonly string[]) {
  const contents: ConsentContent[] = [];

  for (const title of titles) {
    const consent = consents.find((item) => item.title === title);

    if (!consent) return null;

    contents.push({ title: consent.title, content: consent.content });
  }

  return contents;
}

// 동의 내용은 모달 안내용이라 불러오지 못해도 설정 화면은 그대로 보여주고 모달에서 대체 안내문을 표시함
async function getPolicyConsents(): Promise<PolicyConsents> {
  const consents = await getConsents().catch(() => null);

  return {
    aiConsent: consents && pickConsentContents(consents, policyConsentTitles.aiConsent),
    privacyPolicy: consents && pickConsentContents(consents, policyConsentTitles.privacyPolicy),
    terms: consents && pickConsentContents(consents, policyConsentTitles.terms),
  };
}

type SettingsPageProps = {
  searchParams: Promise<{
    modal?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [initialNotificationSettings, policyConsents, { modal }] = await Promise.all([
    getInitialNotificationSettingsOrRedirect(),
    getPolicyConsents(),
    searchParams,
  ]);

  return (
    <SettingsContent
      initialNotificationSettings={initialNotificationSettings}
      initialPolicyModal={modal === "aiConsent" ? "aiConsent" : null}
      policyConsents={policyConsents}
    />
  );
}
