"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { useState } from "react";

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
              <Menu className="h-6 w-6" />
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

          {/* User */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="hidden md:block text-right">
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
