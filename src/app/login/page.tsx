import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="page-content flex min-h-0 flex-1 flex-col overflow-y-auto bg-background pt-[88px] pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <div className="text-center">
        {/** TODO: 서비스 로고 이미지가 확정되면 텍스트 로고를 이미지로 교체합니다. */}
        <h1 className="text-[28px] leading-tight font-bold">Need U</h1>
        <p className="mt-2 text-[12px] leading-normal font-medium">
          대화를 통해 취향을 발견하고 선물을 찾아보세요.
        </p>
      </div>

      <div
        role="img"
        aria-label="서비스 이미지 준비 중"
        className="mt-12 flex h-[307px] shrink-0 items-center justify-center border border-foreground-secondary bg-[#e9e9e9] text-[12px] font-medium"
      >
        이미지 영역
      </div>

      <button
        type="button"
        aria-label="카카오로 로그인"
        className="mt-3 block w-full max-w-[332px] self-center border-0 bg-transparent p-0"
      >
        <Image
          src="/images/kakao_login_large_wide.png"
          alt="카카오 로그인"
          width={600}
          height={90}
          className="h-auto w-full"
          priority
        />
      </button>
    </main>
  );
}
