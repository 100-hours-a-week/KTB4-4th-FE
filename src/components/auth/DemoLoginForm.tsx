// 테스트 계정 로그인 입력과 인증 후 이동 흐름을 관리하는 폼
"use client";

import { useEffect, useState, type FormEvent } from "react";

import ActionButton from "@/components/common/ActionButton";
import { ApiRequestError } from "@/lib/api/client";
import { loginWithDemoAccount } from "@/lib/api/demoLogin";
import { checkLoginValidity, clearLoginValidityCache } from "@/lib/api/loginValidity";

const LOGIN_ID_MAX_LENGTH = 50;
const PASSWORD_MAX_LENGTH = 72;

function validateCredentials(loginId: string, password: string) {
  if (!loginId || !password) {
    return "아이디와 비밀번호를 모두 입력해 주세요.";
  }

  if (loginId.length > LOGIN_ID_MAX_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return "아이디 또는 비밀번호의 길이를 확인해 주세요.";
  }

  return null;
}

export default function DemoLoginForm() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [retryAfterSeconds]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validateCredentials(loginId, password);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await loginWithDemoAccount({ loginId, password });
      clearLoginValidityCache();
      const session = await checkLoginValidity();
      window.location.replace(session.user.onboardingCompleted ? "/" : "/onboarding");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message);

        if (error.status === 404) {
          setIsUnavailable(true);
        }

        if (error.status === 429) {
          setRetryAfterSeconds(error.retryAfterSeconds ?? 60);
        }
      } else {
        setErrorMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || isUnavailable || retryAfterSeconds > 0;
  const buttonLabel = retryAfterSeconds > 0 ? `${retryAfterSeconds}초 후 다시 시도` : "로그인";

  return (
    <form className="mt-5 flex flex-col" onSubmit={handleSubmit} noValidate>
      <label className="text-body-lg font-bold" htmlFor="demo-login-id">
        아이디
        <input
          id="demo-login-id"
          name="loginId"
          type="text"
          autoComplete="username"
          maxLength={LOGIN_ID_MAX_LENGTH}
          value={loginId}
          disabled={isUnavailable}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "demo-login-error" : undefined}
          className="mt-3 h-14 w-full appearance-none rounded-md border-0 bg-background-subtle px-5 text-body-lg text-foreground outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-muted"
          placeholder="아이디를 입력해 주세요"
          onChange={(event) => setLoginId(event.target.value)}
        />
      </label>

      <label className="mt-8 text-body-lg font-bold" htmlFor="demo-password">
        비밀번호
        <input
          id="demo-password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={password}
          disabled={isUnavailable}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "demo-login-error" : undefined}
          className="mt-3 h-14 w-full appearance-none rounded-md border-0 bg-background-subtle px-5 font-system-ko text-body-lg text-foreground outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-muted"
          placeholder="비밀번호를 입력해 주세요"
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <div className="mt-2 min-h-5" aria-live="polite">
        {errorMessage && (
          <p id="demo-login-error" className="text-body-sm text-danger" role="alert">
            {errorMessage}
          </p>
        )}
      </div>

      <ActionButton
        type="submit"
        isLoading={isSubmitting}
        loadingText="로그인 중..."
        disabled={isDisabled}
        className="mt-3 shrink-0"
      >
        <strong className="font-bold">{buttonLabel}</strong>
      </ActionButton>
    </form>
  );
}
