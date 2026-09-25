// 사용자 메시지 입력과 비동기 전송을 담당하는 입력창 컴포넌트

"use client";

import { useRef, useState } from "react";

import styles from "./ChatComposer.module.css";

import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";

type ChatComposerProps = {
  onSend: (content: string) => Promise<void>;
  isDisabled?: boolean;
};

const MIN_TEXTAREA_HEIGHT = 28;
const MAX_TEXTAREA_HEIGHT = 108;

export default function ChatComposer({ onSend, isDisabled = false }: ChatComposerProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const normalizedMessage = draftMessage.trim();
  const isInputDisabled = isDisabled || isSending;

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
    textarea.style.height = `${Math.max(
      MIN_TEXTAREA_HEIGHT,
      Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT),
    )}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraftMessage(event.target.value);
    resizeTextarea(event.target);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isInputDisabled || !normalizedMessage) return;

    setIsSending(true);

    try {
      await onSend(normalizedMessage);
      setDraftMessage("");

      if (textareaRef.current) {
        textareaRef.current.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
        textareaRef.current.style.overflowY = "hidden";
      }
    } catch {
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
      className="mb-[max(0.75rem,env(safe-area-inset-bottom))] flex shrink-0 items-center gap-2 rounded-md border border-border-strong bg-surface p-1"
    >
      <label htmlFor="chat-message" className="sr-only">
        메시지 입력
      </label>
      <textarea
        ref={textareaRef}
        id="chat-message"
        rows={1}
        value={draftMessage}
        disabled={isInputDisabled}
        maxLength={500}
        placeholder="메시지 입력"
        autoComplete="off"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`${styles.messageInput} min-w-0 flex-1 rounded-md border-0 bg-surface text-body text-foreground placeholder:text-muted`}
      />
      <button
        type="submit"
        aria-label="메시지 보내기"
        disabled={isInputDisabled || !normalizedMessage}
        className={`${styles.sendButton} flex shrink-0 cursor-pointer items-center justify-center self-end rounded-full border-0 bg-primary text-sm leading-none font-bold text-on-primary disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted`}
      >
        ↑
      </button>
    </form>
  );
}
