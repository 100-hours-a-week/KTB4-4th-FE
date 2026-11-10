// 익명대화 상대 유형에 맞는 사용자 사진 또는 동물 아바타 이미지
"use client";

import Image from "next/image";
import { useState } from "react";

import {
  DEFAULT_ANONYMOUS_CHAT_PROFILE_IMAGE,
  getAnonymousChatProfileImageSource,
  type AnonymousChatProfile,
} from "@/types/anonymousChatProfile";

type AnonymousChatProfileImageProps = {
  profile: AnonymousChatProfile;
  alt: string;
  size: number;
  className: string;
  priority?: boolean;
};

export default function AnonymousChatProfileImage({
  profile,
  alt,
  size,
  className,
  priority = false,
}: AnonymousChatProfileImageProps) {
  const profileImageSource = getAnonymousChatProfileImageSource(profile);
  const [failedImageSource, setFailedImageSource] = useState<string | null>(null);
  const imageSource =
    failedImageSource === profileImageSource
      ? DEFAULT_ANONYMOUS_CHAT_PROFILE_IMAGE
      : profileImageSource;
  const isDefaultImage = imageSource === DEFAULT_ANONYMOUS_CHAT_PROFILE_IMAGE;

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-[35%] bg-background-subtle ${className}`}
    >
      <Image
        src={imageSource}
        alt={alt}
        fill
        sizes={`${size}px`}
        className={isDefaultImage ? "object-contain p-2 opacity-40" : "object-cover"}
        priority={priority}
        onError={() => {
          if (!isDefaultImage) setFailedImageSource(profileImageSource);
        }}
      />
    </span>
  );
}
