// 알림 설정, AI 대화 정보 활용 동의 내용, 쿼리로 처음부터 열 정책 모달을 전달하는 사용자 설정 화면의 서버 컴포넌트 진입점

import { redirect } from "next/navigation";

import SettingsContent from "@/components/settings/SettingsContent";
import { AI_CONSENT_TITLE, type AiConsentContent, getConsents } from "@/lib/api/consents";
import { getNotificationSettings } from "@/lib/api/getNotificationSettings";
import type {
  NotificationSetting,
  NotificationSettingType,
} from "@/lib/api/notificationSettingTypes";
import { ServerApiError } from "@/lib/api/serverClient";

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

// 동의 내용은 모달 안내용이라 불러오지 못해도 설정 화면은 그대로 보여주고 모달에서 대체 안내문을 표시함
async function getAiConsentOrNull(): Promise<AiConsentContent | null> {
  try {
    const consents = await getConsents();
    const aiConsent = consents.find(({ title }) => title === AI_CONSENT_TITLE);

    return aiConsent ? { title: aiConsent.title, content: aiConsent.content } : null;
  } catch {
    return null;
  }
}

type SettingsPageProps = {
  searchParams: Promise<{
    modal?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [initialNotificationSettings, aiConsent, { modal }] = await Promise.all([
    getInitialNotificationSettingsOrRedirect(),
    getAiConsentOrNull(),
    searchParams,
  ]);

  return (
    <SettingsContent
      initialNotificationSettings={initialNotificationSettings}
      initialPolicyModal={modal === "aiConsent" ? "aiConsent" : null}
      aiConsent={aiConsent}
    />
  );
}
