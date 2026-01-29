"use client";

import Link from "next/link";
import { Card, Badge, Avatar, EmptyState } from "@/components/ui";
import { TrainingSessionWithDetails } from "@/lib/types/database";
import { formatDate, formatRelative } from "@/lib/utils/dates";
import { Dumbbell, ChevronRight, Calendar } from "lucide-react";

interface SessionHistoryProps {
  sessions: TrainingSessionWithDetails[];
  showMember?: boolean;
  basePath?: string;
}

export function SessionHistory({ sessions, showMember = false, basePath = "" }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Sin entrenamientos"
        description="No hay sesiones de entrenamiento registradas."
      />
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Link key={session.id} href={`${basePath}/training/session/${session.id}`}>
          <Card hoverable className="group">
            <div className="flex items-center gap-4">
              {showMember && session.members && (
                <Avatar
                  src={session.members.photo_url}
                  name={session.members.name}
                  size="md"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {showMember && session.members && (
                    <span className="font-medium text-text-primary">
                      {session.members.name}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-sm text-text-secondary">
                    <Calendar className="h-4 w-4" />
                    {formatDate(session.date)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {session.session_exercises?.length || 0} ejercicios
                  </Badge>
                  {session.staff && (
                    <span className="text-xs text-text-secondary">
                      Entrenador: {session.staff.name}
                    </span>
                  )}
                </div>

                {session.notes && (
                  <p className="text-sm text-text-secondary mt-2 truncate">
                    {session.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">
                  {formatRelative(session.created_at)}
                </span>
                <ChevronRight className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
