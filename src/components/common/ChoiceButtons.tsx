/** 선택지 버튼 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Choice = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: ReactNode;
};

type ChoiceButtonsProps = {
  first?: Choice;
  second: Choice;
  className?: string;
};

export default function ChoiceButtons({ first, second, className = "" }: ChoiceButtonsProps) {
  const choices = [
    first ? { choice: first, isPrimary: false } : null,
    { choice: second, isPrimary: true },
  ].filter((item): item is { choice: Choice; isPrimary: boolean } => item !== null);

  return (
    <div className={`flex w-full gap-2 ${className}`}>
      {choices.map(
        ({
          choice: { label, className: buttonClassName = "", type = "button", ...props },
          isPrimary,
        }) => (
          <button
            key={isPrimary ? "primary" : "secondary"}
            {...props}
            type={type}
            className={`flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[6px] border-0 px-2 text-center text-[15px] leading-[48px] font-normal disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted ${
              isPrimary ? "bg-primary text-on-primary" : "bg-foreground text-background"
            } ${buttonClassName}`}
          >
            {label}
          </button>
        ),
      )}
    </div>
  );
}
