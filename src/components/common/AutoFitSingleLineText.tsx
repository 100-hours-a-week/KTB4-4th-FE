// 컨테이너 너비에 맞춰 글자 크기를 줄이는 한 줄 텍스트 컴포넌트

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import type { AriaRole, ReactNode } from "react";

type AutoFitSingleLineTextProps = {
  children: ReactNode;
  className?: string;
  role?: AriaRole;
};

const FITTING_SAFETY_RATIO = 0.99;

export default function AutoFitSingleLineText({
  children,
  className,
  role,
}: AutoFitSingleLineTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const fitText = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) return;

    text.style.visibility = "hidden";
    text.style.fontSize = "";

    const availableWidth = container.clientWidth;
    const naturalWidth = text.getBoundingClientRect().width;

    if (availableWidth <= 0) return;

    if (naturalWidth <= availableWidth) {
      text.style.visibility = "visible";
      return;
    }

    const baseFontSize = Number.parseFloat(window.getComputedStyle(text).fontSize);
    const fittedFontSize = baseFontSize * (availableWidth / naturalWidth) * FITTING_SAFETY_RATIO;

    text.style.fontSize = `${fittedFontSize}px`;
    text.style.visibility = "visible";
  }, []);

  useLayoutEffect(() => {
    fitText();
  }, [children, fitText]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const resizeObserver = new ResizeObserver(fitText);
    resizeObserver.observe(container);

    let isActive = true;

    void document.fonts.ready.then(() => {
      if (isActive) fitText();
    });

    return () => {
      isActive = false;
      resizeObserver.disconnect();
    };
  }, [fitText]);

  return (
    <p ref={containerRef} role={role} className={`overflow-hidden ${className ?? ""}`}>
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap"
        style={{ visibility: "hidden" }}
      >
        {children}
      </span>
    </p>
  );
}
