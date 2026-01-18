"use client";

import Link from "next/link";
import { useExpiringMemberships } from "@/hooks/useMemberships";
import { Header } from "@/components/layout";
import {
  Card,
  Button,
  Badge,
  Spinner,
  EmptyState,
  Avatar,
} from "@/components/ui";
import { ArrowLeft, AlertTriangle, Phone, Calendar, CheckCircle } from "lucide-react";
import { formatDate, daysUntilExpiration } from "@/lib/utils/dates";
import { formatPhone } from "@/lib/utils/formatting";

export default function ExpiringMembershipsPage() {
  const { memberships, loading } = useExpiringMemberships(7);

  return (
    <div>
      <Header title="Membresías por vencer" showSearch={false} />

      <div className="p-6">
        {/* Back button */}
        <Link
          href="/memberships"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a membresías
        </Link>

        <Card className="mb-6 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary mb-1">
                Atención requerida
              </h2>
              <p className="text-sm text-text-secondary">
                Las siguientes membresías vencen en los próximos 7 días.
                Contacta a los miembros para renovar.
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : memberships.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Todo en orden"
            description="No hay membresías por vencer en los próximos 7 días."
          />
        ) : (
          <div className="space-y-4">
            {memberships.map((membership) => {
              const daysLeft = daysUntilExpiration(membership.end_date);
              const member = membership.members;

              return (
                <Card key={membership.id} hoverable>
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={member?.photo_url}
                      name={member?.name || ""}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          href={`/members/${member?.id}`}
                          className="font-semibold text-text-primary hover:text-primary transition-colors"
                        >
                          {member?.name}
                        </Link>
                        <Badge
                          variant={daysLeft === 0 ? "danger" : "warning"}
                        >
                          {daysLeft === 0
                            ? "Vence hoy"
                            : `${daysLeft} días restantes`}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                        {member?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <a
                              href={`tel:${member.phone}`}
                              className="hover:text-primary transition-colors"
                            >
                              {formatPhone(member.phone)}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Vence: {formatDate(membership.end_date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="default" size="sm">
                          {membership.membership_plans?.name}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/memberships?member=${member?.id}`}>
                        <Button variant="primary" size="sm">
                          Renovar
                        </Button>
                      </Link>
                      <Link href={`/members/${member?.id}`}>
                        <Button variant="secondary" size="sm">
                          Ver perfil
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
