/** 에러 페이지 내 버튼 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ErrorPageButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function ErrorPageButton({
  children,
  className = "",
  type = "button",
  ...props
}: ErrorPageButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`ml-[5px] block h-[45px] cursor-pointer rounded-[2px] border-0 bg-[#fde515] px-4 text-base leading-[47px] text-black ${className}`}
    >
      {children}
    </button>
  );
}
