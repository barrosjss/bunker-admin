"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/formatting";
import { LayoutDashboard, Dumbbell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PartnerSidebarProps {
  slug: string;
}

export function PartnerSidebar({ slug }: PartnerSidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  const navigation = [
    { name: "Dashboard", href: `/${slug}/partner`, icon: LayoutDashboard },
    { name: "Mis entrenamientos", href: `/${slug}/partner/training`, icon: Dumbbell },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === `/${slug}/partner`) {
      return pathname === `/${slug}/partner`;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen sidebar-width bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="h-10 w-10 rounded-xl bg-success flex items-center justify-center">
          <Dumbbell className="h-6 w-6 text-background" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-text-primary">Bunker</h1>
          <div className="flex items-center gap-1.5">
            <Dumbbell className="h-3 w-3 text-success" />
            <p className="text-xs text-success font-medium">Partner</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 min-h-touch",
                active
                  ? "bg-success/10 text-success"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  active ? "text-success" : "text-text-secondary"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 min-h-touch w-full text-text-secondary hover:text-danger hover:bg-danger/10"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
