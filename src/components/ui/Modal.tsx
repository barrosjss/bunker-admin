"use client";

import { Fragment, ReactNode } from "react";
import { cn } from "@/lib/utils/formatting";
import { X } from "lucide-react";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full bg-surface border border-border rounded-2xl shadow-xl",
            "max-h-[90vh] overflow-y-auto",
            sizes[size]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-4 border-b border-border">
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-text-primary"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 -mr-2 -mt-1"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </Fragment>
  );
};

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

const ModalFooter = ({ children, className }: ModalFooterProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 pt-4 border-t border-border -mx-4 px-4 -mb-4 pb-4 mt-4",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Modal, ModalFooter };
