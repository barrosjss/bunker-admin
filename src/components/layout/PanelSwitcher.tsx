"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils/formatting";

interface PanelSwitcherProps {
  className?: string;
}

export function PanelSwitcher({ className }: PanelSwitcherProps) {
  const router = useRouter();

  const handleSwitchPanel = () => {
    // Clear the saved panel preference
    document.cookie = "bunker_current_panel=; path=/; max-age=0";
    router.push("/");
  };

  return (
    <button
      onClick={handleSwitchPanel}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 min-h-touch w-full",
        "text-text-secondary hover:text-primary hover:bg-primary/10",
        className
      )}
    >
      <ArrowLeftRight className="h-5 w-5 flex-shrink-0" />
      Cambiar panel
    </button>
  );
}
