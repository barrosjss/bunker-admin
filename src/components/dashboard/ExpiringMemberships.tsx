"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, Badge, Avatar, EmptyState, Spinner } from "@/components/ui";
import { useExpiringMemberships } from "@/hooks/useMemberships";
import { formatDate, daysUntilExpiration } from "@/lib/utils/dates";
import { AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";

interface ExpiringMembershipsProps {
  basePath?: string;
}

export function ExpiringMemberships({ basePath = "" }: ExpiringMembershipsProps) {
  const { memberships, loading } = useExpiringMemberships(7);

  if (loading) {
    return (
      <Card padding="none">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Por vencer
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
          <AlertTriangle className="h-5 w-5 text-warning" />
          Membresías por vencer
        </CardTitle>
        {memberships.length > 0 && (
          <Badge variant="warning">{memberships.length}</Badge>
        )}
      </CardHeader>

      {memberships.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={CheckCircle}
            title="Todo en orden"
            description="No hay membresías por vencer esta semana."
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {memberships.slice(0, 5).map((membership) => {
            const daysLeft = daysUntilExpiration(membership.end_date);
            const member = membership.members;

            return (
              <Link
                key={membership.id}
                href={`${basePath}/members/${member?.id}`}
                className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors"
              >
                <Avatar
                  src={member?.photo_url}
                  name={member?.name || ""}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {member?.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Vence: {formatDate(membership.end_date)}
                  </p>
                </div>
                <Badge variant={daysLeft === 0 ? "danger" : "warning"} size="sm">
                  {daysLeft === 0 ? "Hoy" : `${daysLeft}d`}
                </Badge>
                <ChevronRight className="h-5 w-5 text-text-secondary" />
              </Link>
            );
          })}

          {memberships.length > 5 && (
            <Link
              href={`${basePath}/memberships/expiring`}
              className="flex items-center justify-center p-4 text-sm text-primary hover:bg-surface-elevated transition-colors"
            >
              Ver todas ({memberships.length})
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
