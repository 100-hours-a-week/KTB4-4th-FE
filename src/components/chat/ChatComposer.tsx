// 사용자 메시지 입력과 비동기 전송을 담당하는 입력창 컴포넌트

"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./ChatComposer.module.css";

import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";

type ChatComposerProps = {
  onSend: (content: string) => Promise<void>;
  isDisabled?: boolean;
  placeholder?: string;
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
  placeholder = "메시지 입력",
}: ChatComposerProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const normalizedMessage = draftMessage.trim();
  const isSubmitDisabled = isDisabled || isSending || !normalizedMessage;

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
      className="flex shrink-0 items-center gap-2 rounded-md border border-border-strong bg-surface p-1"
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
        className={`${styles.messageInput} min-w-0 flex-1 rounded-md border-0 bg-surface text-body text-foreground placeholder:text-muted`}
      />
      <button
        type="submit"
        aria-label="메시지 보내기"
        disabled={isSubmitDisabled}
        className={`${styles.sendButton} flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-primary text-sm leading-none font-bold text-on-primary disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted`}
      >
        ↑
      </button>
    </form>
  );
}
