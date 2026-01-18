"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, Badge, Avatar, EmptyState, Spinner } from "@/components/ui";
import { useTodaySessions } from "@/hooks/useTraining";
import { formatRelative } from "@/lib/utils/dates";
import { Dumbbell, ChevronRight, Calendar } from "lucide-react";

export function RecentActivity() {
  const { sessions, loading } = useTodaySessions();

  if (loading) {
    return (
      <Card padding="none">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Actividad de hoy
          </CardTitle>
        </CardHeader>
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Actividad de hoy
        </CardTitle>
        {sessions.length > 0 && (
          <Badge variant="primary">{sessions.length}</Badge>
        )}
      </CardHeader>

      {sessions.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Dumbbell}
            title="Sin actividad"
            description="No hay entrenamientos registrados hoy."
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sessions.slice(0, 5).map((session) => (
            <Link
              key={session.id}
              href={`/training/session/${session.id}`}
              className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors"
            >
              <Avatar
                src={session.members?.photo_url}
                name={session.members?.name || ""}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">
                  {session.members?.name}
                </p>
                <p className="text-sm text-text-secondary">
                  {session.session_exercises?.length || 0} ejercicios
                </p>
              </div>
              <span className="text-xs text-text-secondary">
                {formatRelative(session.created_at)}
              </span>
              <ChevronRight className="h-5 w-5 text-text-secondary" />
            </Link>
          ))}

          {sessions.length > 5 && (
            <Link
              href="/training"
              className="flex items-center justify-center p-4 text-sm text-primary hover:bg-surface-elevated transition-colors"
            >
              Ver todos ({sessions.length})
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
