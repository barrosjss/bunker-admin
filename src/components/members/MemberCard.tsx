"use client";

import Link from "next/link";
import { Card, Avatar, Badge } from "@/components/ui";
import { MemberWithMembership } from "@/lib/types/database";
import { getMemberStatusLabel } from "@/lib/utils/formatting";
import { daysUntilExpiration, formatDate } from "@/lib/utils/dates";
import { Phone, Mail, Calendar } from "lucide-react";

interface MemberCardProps {
  member: MemberWithMembership;
}

export function MemberCard({ member }: MemberCardProps) {
  const membershipDaysLeft = member.current_membership
    ? daysUntilExpiration(member.current_membership.end_date)
    : null;

  const getMembershipBadge = () => {
    if (!member.current_membership) {
      return <Badge variant="danger">Sin membresía</Badge>;
    }

    if (membershipDaysLeft !== null && membershipDaysLeft < 0) {
      return <Badge variant="danger">Vencida</Badge>;
    }

    if (membershipDaysLeft !== null && membershipDaysLeft <= 7) {
      return (
        <Badge variant="warning">
          {membershipDaysLeft === 0
            ? "Vence hoy"
            : `${membershipDaysLeft} días`}
        </Badge>
      );
    }

    return <Badge variant="success">Activa</Badge>;
  };

  const getStatusBadge = () => {
    const variants: Record<string, "success" | "warning" | "danger"> = {
      active: "success",
      inactive: "warning",
      suspended: "danger",
    };

    return (
      <Badge variant={variants[member.status]} size="sm">
        {getMemberStatusLabel(member.status)}
      </Badge>
    );
  };

  return (
    <Link href={`/members/${member.id}`}>
      <Card hoverable className="h-full">
        <div className="flex items-start gap-4">
          <Avatar
            src={member.photo_url}
            name={member.name}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-text-primary truncate">
                {member.name}
              </h3>
              {getStatusBadge()}
            </div>

            <div className="space-y-1">
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{member.phone}</span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Calendar className="h-3 w-3" />
                {member.current_membership
                  ? `Vence: ${formatDate(member.current_membership.end_date)}`
                  : "Sin membresía activa"}
              </div>
              {getMembershipBadge()}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
