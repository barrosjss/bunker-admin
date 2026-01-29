"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/formatting";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardList,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Inicio", href: "/admin", icon: LayoutDashboard },
  { name: "Miembros", href: "/admin/members", icon: Users },
  { name: "Pagos", href: "/admin/memberships", icon: CreditCard },
  { name: "Ejercicios", href: "/admin/exercises", icon: ClipboardList },
  { name: "Ajustes", href: "/admin/settings", icon: Settings },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg min-w-[60px] transition-all",
                active
                  ? "text-primary"
                  : "text-text-secondary"
              )}
            >
              <item.icon
                className={cn(
                  "h-6 w-6",
                  active ? "text-primary" : "text-text-secondary"
                )}
              />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
