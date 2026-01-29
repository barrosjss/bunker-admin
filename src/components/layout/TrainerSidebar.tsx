"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/formatting";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  BookOpen,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PanelSwitcher } from "./PanelSwitcher";

const navigation = [
  { name: "Dashboard", href: "/trainer", icon: LayoutDashboard },
  { name: "Entrenamientos", href: "/trainer/training", icon: Dumbbell },
  { name: "Miembros", href: "/trainer/members", icon: Users },
  { name: "Ejercicios", href: "/trainer/exercises", icon: ClipboardList },
  { name: "Rutinas", href: "/trainer/routines", icon: BookOpen },
];

export function TrainerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/trainer") {
      return pathname === "/trainer";
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
            <Users className="h-3 w-3 text-success" />
            <p className="text-xs text-success font-medium">Entrenador</p>
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

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <PanelSwitcher />

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
