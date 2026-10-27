// 사용자 메시지 입력과 비동기 전송을 담당하는 입력창 컴포넌트

"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./ChatComposer.module.css";

import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";

type ChatComposerProps = {
  onSend: (content: string) => Promise<void>;
  // 대화를 더 이어갈 수 없어 입력 자체를 막는 상태
  isDisabled?: boolean;
  // 응답 생성 중처럼 잠시 전송만 막는 상태이며 입력창 포커스와 작성 중인 내용은 유지함
  isSubmitLocked?: boolean;
  placeholder?: string;
  variant?: ComposerVariant;
};

type ComposerVariant = "ai" | "anonymous";

const VARIANT_CLASS_NAMES: Record<ComposerVariant, { form: string; textarea: string }> = {
  ai: {
    form: "rounded-md border border-border-strong bg-surface p-1",
    textarea: "rounded-md bg-surface",
  },
  anonymous: {
    form: "rounded-[22px] bg-surface py-1 pr-1 pl-2",
    textarea: "bg-transparent",
  },
};

const MIN_TEXTAREA_HEIGHT = 36;
const MAX_TEXTAREA_HEIGHT = 108;

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
  textarea.style.height = `${Math.max(
    MIN_TEXTAREA_HEIGHT,
    Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT),
  )}px`;
  textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
}

export default function ChatComposer({
  onSend,
  isDisabled = false,
  isSubmitLocked = false,
  placeholder = "메시지 입력",
  variant = "ai",
}: ChatComposerProps) {
  const variantClassNames = VARIANT_CLASS_NAMES[variant];
  const [draftMessage, setDraftMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const normalizedMessage = draftMessage.trim();
  const isSubmitDisabled = isDisabled || isSubmitLocked || isSending || !normalizedMessage;

  useEffect(() => {
    if (textareaRef.current) {
      resizeTextarea(textareaRef.current);
    }
  }, [draftMessage]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraftMessage(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.repeat || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setIsSending(true);
    setDraftMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      textareaRef.current.style.overflowY = "hidden";
      textareaRef.current.focus();
    }

    try {
      await onSend(normalizedMessage);
    } catch {
      setDraftMessage(normalizedMessage);
      return;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      aria-label="메시지 전송"
      aria-busy={isSending || undefined}
      onSubmit={handleSubmit}
      className={`flex shrink-0 items-center gap-2 ${variantClassNames.form}`}
    >
      <label htmlFor="chat-message" className="sr-only">
        메시지 입력
      </label>
      <textarea
        ref={textareaRef}
        id="chat-message"
        rows={1}
        value={draftMessage}
        disabled={isDisabled}
        readOnly={isSending}
        maxLength={500}
        placeholder={placeholder}
        autoComplete="off"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`${styles.messageInput} min-w-0 flex-1 border-0 text-body text-foreground placeholder:text-muted ${variantClassNames.textarea}`}
      />
      {variant === "anonymous" ? (
        <button
          type="submit"
          aria-label="메시지 보내기"
          disabled={isSubmitDisabled}
          className="group touch-target flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed"
        >
          <span className="rounded-full bg-primary px-4 py-2 text-body-sm leading-none font-bold text-on-primary transition-colors group-hover:bg-primary-hover group-disabled:bg-disabled group-disabled:text-muted">
            보내기
          </span>
        </button>
      ) : (
        <button
          type="submit"
          aria-label="메시지 보내기"
          disabled={isSubmitDisabled}
          className={`${styles.sendButton} flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-primary text-sm leading-none font-bold text-on-primary disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted`}
        >
          ↑
        </button>
      )}
    </form>
  );
}
