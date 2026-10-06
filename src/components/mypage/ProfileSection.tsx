// 마이페이지의 사용자 이미지와 닉네임을 표시하는 프로필 영역

import Image from "next/image";

import type { MyPageProfile } from "@/types/mypage";

type ProfileSectionProps = {
  profile: MyPageProfile;
};

export default function ProfileSection({ profile }: ProfileSectionProps) {
  return (
    <section aria-labelledby="profile-heading" className="flex items-center gap-5 pt-5">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-background-subtle shadow-sm">
        {profile.profileImageUrl ? (
          <Image
            src={profile.profileImageUrl}
            alt={`${profile.nickname}님의 프로필 이미지`}
            fill
            sizes="96px"
            className="object-cover"
            priority
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-heading-1 font-bold text-muted"
          >
            {profile.nickname.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h2
          id="profile-heading"
          className="line-clamp-2 break-words text-heading-2 font-bold text-foreground"
        >
          {profile.nickname}
        </h2>
        <p className="mt-1 text-body-sm text-muted">{profile.birthday}</p>
      </div>
    </section>
  );
}
