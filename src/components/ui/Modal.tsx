"use client";

import { Fragment, ReactNode } from "react";
import { Drawer } from "hiraki";
import { cn } from "@/lib/utils/formatting";
import { X } from "lucide-react";
import { Button } from "./Button";
import { useIsMobile } from "@/hooks/useIsMobile";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

const Modal = (props: ModalProps) => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileSheet {...props} /> : <DesktopDialog {...props} />;
};

// ─── Desktop: dialogo centrado (comportamiento original, sin cambios) ─────────
function DesktopDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <Fragment>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full bg-surface border border-border rounded-2xl shadow-xl",
            "max-h-[90vh] overflow-y-auto",
            SIZES[size]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          <ModalHeader
            title={title}
            description={description}
            showCloseButton={showCloseButton}
            onClose={onClose}
          />
          <div className="p-4">{children}</div>
        </div>
      </div>
    </Fragment>
  );
}

// ─── Mobile: bottom sheet estilo iOS via Hiraki ───────────────────────────────
function MobileSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  showCloseButton = true,
}: ModalProps) {
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="bottom"
      dismissible
      rubberBand
      inertia
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col",
            "max-h-[92vh] bg-surface border-t border-border rounded-t-2xl shadow-xl",
            "pb-[env(safe-area-inset-bottom)]"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          <Drawer.Handle className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border" />
          <ModalHeader
            title={title}
            description={description}
            showCloseButton={showCloseButton}
            onClose={onClose}
          />
          <Drawer.ScrollArea className="overflow-y-auto p-4">
            {children}
          </Drawer.ScrollArea>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ─── Header compartido (título + descripción + botón cerrar) ─────────────────
function ModalHeader({
  title,
  description,
  showCloseButton,
  onClose,
}: {
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  onClose: () => void;
}) {
  if (!title && !showCloseButton) return null;

  return (
    <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
      <div>
        {title && (
          <h2 id="modal-title" className="text-lg font-semibold text-text-primary">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
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
  );
}

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
