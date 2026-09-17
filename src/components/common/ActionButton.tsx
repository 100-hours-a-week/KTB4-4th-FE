import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
};

export default function ActionButton({
  children,
  isLoading = false,
  loadingText = "처리 중...",
  disabled,
  className = "",
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`h-12 w-full cursor-pointer rounded-[6px] border-0 bg-primary px-4 text-center text-[15px] leading-[26px] text-on-primary disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted ${className}`}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
