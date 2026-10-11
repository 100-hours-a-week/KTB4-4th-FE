// 나이대와 성별을 입력하는 두 번째 온보딩 단계 컴포넌트
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import ActionButton from "@/components/common/ActionButton";
import PageIntro from "@/components/common/PageIntro";
import { useOnboarding, type Gender } from "@/contexts/OnboardingContext";

const formatBirthDate = (digits: string) => {
  const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean);

  return parts.join(".");
};

const padSingleDigitMonth = (value: string) => value.replace(/^(\d{4})\.([2-9])$/, "$1.0$2");

const isValidBirthDate = (digits: string) => {
  if (digits.length !== 8) {
    return false;
  }

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    year > 0 &&
    birthDate.getFullYear() === year &&
    birthDate.getMonth() === month - 1 &&
    birthDate.getDate() === day &&
    birthDate < today
  );
};

export default function OnboardingProfileStep() {
  const { state, setGender, setBirthDate, goToStep } = useOnboarding();
  const { gender, birthDateDigits } = state.formData;
  const [birthDateInput, setBirthDateInput] = useState(() => formatBirthDate(birthDateDigits));
  const isBirthDateValid = isValidBirthDate(birthDateDigits);
  const showBirthDateError = birthDateDigits.length === 8 && !isBirthDateValid;
  const isFormValid = gender !== null && isBirthDateValid;

  const handleBirthDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const isValidPartialFormat = /^\d{0,4}$|^\d{4}\.\d{0,2}$|^\d{4}\.\d{2}\.\d{0,2}$/.test(
      inputValue,
    );
    const digits = inputValue.replace(/\D/g, "").slice(0, 8);
    const formattedInputValue = isValidPartialFormat ? inputValue : formatBirthDate(digits);
    const nextInputValue = padSingleDigitMonth(formattedInputValue);

    setBirthDateInput(nextInputValue);
    setBirthDate(nextInputValue.replace(/\D/g, ""));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    goToStep(3);
  };

  return (
    <main className="page-content flex min-h-full flex-1 flex-col overflow-y-auto bg-background pb-[max(16px,env(safe-area-inset-bottom))] text-foreground">
      <header className="flex shrink-0 justify-end pt-6">
        <p className="text-body-sm font-bold" aria-label="온보딩 4단계 중 2단계">
          2 / 4
        </p>
      </header>

      <div className="mt-5">
        <PageIntro
          title={
            <>
              나이대와 성별을
              <br />
              먼저 알려주세요.
            </>
          }
          description="추천 상품 후보를 좁히는 가장 기본이 되는 정보예요."
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col">
        <fieldset>
          <legend className="text-body-lg font-bold">성별</legend>
          <div className="mt-3 flex gap-3">
            {[
              { value: "male", label: "남성" },
              { value: "female", label: "여성" },
            ].map(({ value, label }) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={gender === value}
                  onChange={() => setGender(value as Gender)}
                  className="peer sr-only"
                />
                <span className="flex min-h-12 min-w-20 items-center justify-center rounded-full border border-border-strong bg-background px-5 text-body-lg transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-8">
          <label htmlFor="birth-date" className="text-body-lg font-bold">
            생년월일
          </label>
          <div className="relative mt-3">
            <input
              id="birth-date"
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              value={birthDateInput}
              onChange={handleBirthDateChange}
              placeholder="YYYY.MM.DD"
              maxLength={10}
              aria-invalid={showBirthDateError}
              aria-describedby={`birth-date-example birth-date-notice${showBirthDateError ? " birth-date-error" : ""}`}
              className="h-14 w-full appearance-none rounded-md border-0 bg-background-subtle px-5 pr-32 text-body-lg text-foreground outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            />
            <span
              id="birth-date-example"
              className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-body text-muted"
            >
              예) 1995.03.15
            </span>
          </div>

          {showBirthDateError && (
            <p id="birth-date-error" role="alert" className="mt-2 text-body text-danger">
              유효하지 않은 생년월일입니다. 입력한 날짜를 확인해 주세요.
            </p>
          )}
        </div>

        <ActionButton disabled={!isFormValid} type="submit" className="mt-5 shrink-0">
          <strong className="font-bold">다음</strong>
        </ActionButton>

        <p id="birth-date-notice" className="mt-3 text-center text-body text-info">
          생일은 친구 선물 알림에도 함께 쓰여요.
        </p>
      </form>
    </main>
  );
}
