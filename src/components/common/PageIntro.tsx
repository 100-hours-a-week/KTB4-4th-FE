// 여러 페이지에서 제목과 설명을 표시하는 공통 인트로 컴포넌트

type PageIntroProps = {
  title: string;
  description: string;
};

export default function PageIntro({ title, description }: PageIntroProps) {
  return (
    <div className="px-1 pt-4">
      <h1 className="text-[24px] leading-[30px] font-bold text-foreground">{title}</h1>
      <p className="mt-3 text-body-sm text-muted">{description}</p>
    </div>
  );
}
