// 익명대화 상대 프로필과 표시 이미지 경로 결정 타입

export type AnonymousChatProfileType = "USER" | "ANONYMOUS";

export interface AnonymousChatAvatar {
  animal: string;
  color: string;
}

export interface AnonymousChatProfile {
  type: AnonymousChatProfileType;
  profileImageUrl: string | null;
  avatar: AnonymousChatAvatar | null;
}

export const DEFAULT_ANONYMOUS_CHAT_PROFILE_IMAGE = "/icons/icon-user.svg";
const ANONYMOUS_CHAT_PROFILE_IMAGE_VERSION = "2";

export function getAnonymousChatProfileImageSource(profile: AnonymousChatProfile) {
  if (profile.type === "ANONYMOUS" && profile.avatar) {
    const animal = encodeURIComponent(profile.avatar.animal);
    const color = encodeURIComponent(profile.avatar.color);

    return `/icons/anonymous-profiles/${animal}-${color}.svg?v=${ANONYMOUS_CHAT_PROFILE_IMAGE_VERSION}`;
  }

  if (profile.type === "USER" && profile.profileImageUrl) {
    return profile.profileImageUrl;
  }

  return DEFAULT_ANONYMOUS_CHAT_PROFILE_IMAGE;
}
