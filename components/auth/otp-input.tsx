"use client";

import React, { useRef, useEffect } from "react";
import { toEnglishDigits } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
  hasError?: boolean;
  className?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  onComplete,
  hasError = false,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // تبدیل مقدار رشته‌ای به آرایه‌ای از ارقام با طول مشخص
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  // فوکوس خودکار روی اولین باکس
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanVal = toEnglishDigits(rawVal).replace(/\D/g, "");

    if (!cleanVal) {
      // پاک شدن کاراکتر
      const newDigits = [...digits];
      newDigits[index] = "";
      const newValue = newDigits.join("");
      onChange(newValue);
      return;
    }

    // اگر کاربر بیش از ۱ کاراکتر وارد کرده بود (مثلاً اتوفیل مرورگر)
    if (cleanVal.length > 1) {
      handlePastedText(cleanVal, index);
      return;
    }

    const singleDigit = cleanVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    const newValue = newDigits.join("");
    onChange(newValue);

    // انتقال خودکار فوکوس به باکس بعدی
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    // بررسی تکمیل شدن تمامی ارقام
    if (newValue.length === length) {
      onComplete?.(newValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // اگر باکس فعلی خالی بود، فوکوس و حذف باکس قبلی
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        const newValue = newDigits.join("");
        onChange(newValue);
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index]) {
        // اگر باکس فعلی پر بود، پاکش کن
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index] = "";
        const newValue = newDigits.join("");
        onChange(newValue);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }
    }
  };

  const handlePastedText = (pastedText: string, startIndex = 0) => {
    const cleanNumbers = toEnglishDigits(pastedText).replace(/\D/g, "");
    if (!cleanNumbers) return;

    const newDigits = [...digits];
    for (let i = 0; i < cleanNumbers.length && startIndex + i < length; i++) {
      newDigits[startIndex + i] = cleanNumbers[i];
    }

    const newValue = newDigits.join("");
    onChange(newValue);

    const nextIndex = Math.min(startIndex + cleanNumbers.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
    inputRefs.current[nextIndex]?.select();

    if (newValue.length === length) {
      onComplete?.(newValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    handlePastedText(pasted, index);
  };

  return (
    <div
      dir="ltr"
      className={cn("flex items-center justify-center gap-2 sm:gap-3", className)}
    >
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(e, index)}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-11 h-13 sm:w-13 sm:h-14 rounded-xl text-center font-mono text-xl sm:text-2xl font-bold transition-all outline-none",
              "border bg-background shadow-xs",
              isFilled
                ? "border-primary/70 text-foreground bg-primary/5 ring-1 ring-primary/20"
                : "border-border text-foreground hover:border-border/80",
              "focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-background",
              hasError && "border-destructive text-destructive ring-1 ring-destructive/30",
              disabled && "opacity-50 cursor-not-allowed bg-muted/40"
            )}
          />
        );
      })}
    </div>
  );
}

