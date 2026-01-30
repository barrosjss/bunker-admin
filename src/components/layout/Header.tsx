"use client";

import { Bell, Search, Menu as MenuIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PanelSwitcher } from "./PanelSwitcher";
import { cn } from "@/lib/utils/formatting";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  onMenuClick?: () => void;
  user?: {
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

export function Header({ title, showSearch = true, onMenuClick, user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
          )}

          {/* Page title */}
          {title && (
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch && (
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-danger rounded-full" />
          </Button>

          {/* User Menu Dropdown (Visible on Mobile/Tablet usually) */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MenuIcon className="h-6 w-6 text-text-primary" />
            </Button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-elevated border border-border rounded-xl shadow-xl p-2 z-50">
                <PanelSwitcher className="w-full justify-start text-sm" />
                <button
                  onClick={handleSignOut}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                    "text-danger hover:bg-danger/10"
                  )}
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          {/* User Profile (Desktop) */}
          {user && (
            <div className="items-center gap-3 pl-3 border-l border-border hidden lg:flex">
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary">
                  {user.name}
                </p>
                <p className="text-xs text-text-secondary">{user.email}</p>
              </div>
              <Avatar
                src={user.avatar_url}
                name={user.name}
                size="md"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
