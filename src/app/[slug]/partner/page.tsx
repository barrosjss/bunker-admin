"use client";

import Link from "next/link";
import { useMemberSessions } from "@/hooks/useTraining";
import { usePartnerMemberId } from "@/hooks/usePartner";
import { StatsCard } from "@/components/dashboard";
import { Header } from "@/components/layout";
import { Button, Card, Spinner } from "@/components/ui";
import { Dumbbell, Calendar, Plus, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useParams } from "next/navigation";

export default function PartnerDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { memberId, name: partnerName, loading: loadingProfile } = usePartnerMemberId();
  const { sessions, loading: loadingSessions } = useMemberSessions(memberId || "");

  // Stats
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const sessionsToday = sessions.filter((s) => s.date === today);
  const sessionsThisMonth = sessions.filter(
    (s) => s.date >= monthStart && s.date <= monthEnd
  );
  const recentSessions = sessions.slice(0, 5);

  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }


  return (
    <div>
      <Header title="Mi Panel" showSearch={false} />

      <div className="p-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Bienvenido{partnerName ? `, ${partnerName}` : ""}
          </h1>
          <p className="text-text-secondary capitalize">{todayFormatted}</p>
        </div>

        {/* Quick action */}
        <div className="mb-6">
          <Link href={`/${slug}/partner/training`}>
            <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
              Nueva sesión de entrenamiento
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Sesiones hoy"
            value={sessionsToday.length}
            icon={Dumbbell}
            variant="success"
          />
          <StatsCard
            title="Sesiones este mes"
            value={sessionsThisMonth.length}
            icon={Calendar}
            variant="success"
          />
          <StatsCard
            title="Total sesiones"
            value={sessions.length}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Recent sessions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Sesiones recientes
            </h2>
            <Link href={`/${slug}/partner/training`}>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </div>

          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary mb-4">
                No tienes sesiones registradas aún
              </p>
              <Link href={`/${slug}/partner/training`}>
                <Button variant="primary" size="sm">
                  Crear primera sesión
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/${slug}/partner/training/session/${session.id}`}
                  className="flex items-center gap-4 py-4 hover:bg-surface-elevated transition-colors -mx-4 px-4"
                >
                  <div className="p-2 rounded-lg bg-success/10">
                    <Dumbbell className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary">
                      {format(new Date(session.date + "T12:00:00"), "d MMM yyyy", { locale: es })}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {session.session_exercises?.length || 0} ejercicios
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
