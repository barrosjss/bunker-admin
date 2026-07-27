"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/formatting";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 cursor-pointer select-none min-h-touch"
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={cn(
              "h-5 w-5 shrink-0 rounded border-border bg-surface-elevated",
              "text-primary focus:outline-none focus:ring-2 focus:ring-primary",
              error && "border-danger",
              className
            )}
            {...props}
          />
          {label && (
            <span className="text-sm font-medium text-text-primary">{label}</span>
          )}
        </label>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
