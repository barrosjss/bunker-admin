"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/formatting";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg",
              "text-text-primary placeholder:text-text-secondary",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-all duration-200",
              "min-h-touch",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-danger focus:ring-danger",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {hint && !error && (
          <p className="mt-1 text-sm text-text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
