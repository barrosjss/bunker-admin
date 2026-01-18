"use client";

import { Card } from "@/components/ui";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/formatting";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    label: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  variant = "default",
}: StatsCardProps) {
  const variants = {
    default: "bg-surface-elevated text-text-secondary",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          {change && (
            <p
              className={cn(
                "text-sm mt-2",
                change.value >= 0 ? "text-success" : "text-danger"
              )}
            >
              {change.value >= 0 ? "+" : ""}
              {change.value}% {change.label}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", variants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
