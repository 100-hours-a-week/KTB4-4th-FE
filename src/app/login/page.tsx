// 카카오 로그인을 시작하는 로그인 페이지
import Image from "next/image";

import KakaoLoginButton from "@/components/auth/KakaoLoginButton";

export default function LoginPage() {
  return (
    <main className="page-content flex min-h-0 flex-1 flex-col overflow-y-auto bg-background pt-[88px] pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <div className="mt-12 flex h-[340px] w-full shrink-0 flex-col items-center justify-center">
        <Image
          src="/images/NeedU_logo.png"
          alt="NeedU 서비스 로고"
          width={1005}
          height={261}
          sizes="(max-width: 430px) 100vw, 430px"
          className="h-auto w-[80%] object-contain"
          priority
        />
        <p className="mt-8 text-center text-body-sm leading-normal font-medium">
          대화를 통해 취향을 발견하고 선물을 찾아보세요.
        </p>
      </div>

      <KakaoLoginButton />
    </main>
  );
}
