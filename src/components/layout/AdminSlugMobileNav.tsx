"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/formatting";
import {
  LayoutDashboard,
  Users,
  Tag,
  Ticket,
} from "lucide-react";

interface Props {
  slug: string;
}

export function AdminSlugMobileNav({ slug }: Props) {
  const pathname = usePathname();
  const base = `/${slug}/admin`;

  const navigation = [
    { name: "Inicio", href: base, icon: LayoutDashboard, exact: true },
    { name: "Miembros", href: `${base}/members`, icon: Users },
    { name: "Planes", href: `${base}/plans`, icon: Tag },
    { name: "Cupones", href: `${base}/coupons`, icon: Ticket },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border lg:hidden">
      <div className="flex items-center justify-around px-2 pb-safe">
        {navigation.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-lg min-w-[64px] transition-all",
                active ? "text-primary" : "text-text-secondary"
              )}
            >
              <item.icon className={cn("h-5 w-5", active ? "text-primary" : "text-text-secondary")} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
