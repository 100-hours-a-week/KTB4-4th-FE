"use client";

import { useId } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type ModalFormFieldsProps = {
  selectLabel: string;
  selectOptions: SelectOption[];
  selectValue: string;
  onSelectChange: (value: string) => void;
  selectPlaceholder?: string;
  selectRequired?: boolean;
  textareaLabel: string;
  textareaValue: string;
  onTextareaChange: (value: string) => void;
  textareaPlaceholder?: string;
  maxLength?: number;
  errorMessage?: string;
};

export default function ModalFormFields({
  selectLabel,
  selectOptions,
  selectValue,
  onSelectChange,
  selectPlaceholder,
  selectRequired = false,
  textareaLabel,
  textareaValue,
  onTextareaChange,
  textareaPlaceholder,
  maxLength = 500,
  errorMessage,
}: ModalFormFieldsProps) {
  const selectId = useId();
  const textareaId = useId();
  const errorId = useId();

  return (
    <div className="space-y-4 text-left text-xs">
      <div>
        <label htmlFor={selectId} className="mb-2 block font-semibold">
          {selectLabel}
        </label>
        <select
          id={selectId}
          required={selectRequired}
          value={selectValue}
          onChange={(event) => onSelectChange(event.target.value)}
          className="w-full rounded-[4px] border border-border-strong bg-surface px-3 text-foreground"
        >
          {selectPlaceholder && (
            <option value="" disabled>
              {selectPlaceholder}
            </option>
          )}
          {selectOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={textareaId} className="mb-2 block font-semibold">
          {textareaLabel}
        </label>
        <textarea
          id={textareaId}
          value={textareaValue}
          onChange={(event) => onTextareaChange(event.target.value)}
          maxLength={maxLength}
          placeholder={textareaPlaceholder}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? errorId : undefined}
          className="block h-[96px] w-full resize-none rounded-[2px] border border-border-strong bg-surface p-3 align-top text-foreground placeholder:text-muted"
        />
        <p className="mt-1 text-right text-[10px] text-muted">
          {textareaValue.length} / {maxLength}
        </p>
        {errorMessage && (
          <p id={errorId} role="alert" className="mt-2 text-danger">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
