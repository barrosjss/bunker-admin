"use client";

import { useMemo } from "react";
import Link from "next/link";
import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Dumbbell,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard";
import { Header } from "@/components/layout";
import { Avatar, Badge, Button, Card, EmptyState } from "@/components/ui";
import { useMembers } from "@/hooks/useMembers";
import { useExercises } from "@/hooks/useExercises";
import { useRoutines } from "@/hooks/useRoutines";
import { useTodaySessions } from "@/hooks/useTraining";
import { usePersonalTraining } from "@/hooks/usePersonalTraining";
import { usePhysicalEvaluations } from "@/hooks/usePhysicalEvaluations";
import { getServiceStatus } from "@/lib/utils/serviceStatus";
import { calculateBodyFat, formatPercentage } from "@/lib/utils/anthropometry";
import { formatDate } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/formatting";

export default function TrainerDashboardPage() {
  const { members } = useMembers();
  const { sessions: todaySessions } = useTodaySessions();
  const { exercises } = useExercises();
  const { routines } = useRoutines();
  const { clients, subscriptions } = usePersonalTraining();
  const { evaluations } = usePhysicalEvaluations();

  const today = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });
  const activeMembers = members.filter((m) => m.status === "active").length;

  const rows = useMemo(
    () => clients.map((client) => ({ client, status: getServiceStatus(client.current_subscription) })),
    [clients]
  );

  const stats = useMemo(() => {
    const monthInterval = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
    return {
      active: rows.filter((r) => r.status.status === "active").length,
      expiring: rows.filter((r) => r.status.status === "expiring").length,
      expired: rows.filter((r) => r.status.status === "expired").length,
      collected: subscriptions
        .filter((s) => isWithinInterval(parseISO(s.created_at), monthInterval))
        .reduce((sum, s) => sum + Number(s.amount_paid || 0), 0),
    };
  }, [rows, subscriptions]);

  /** Lo accionable: primero los vencidos, después los que están por vencer. */
  const pendingCharges = useMemo(() => {
    return rows
      .filter((r) => r.status.status === "expired" || r.status.status === "expiring")
      .sort((a, b) => (a.status.diffDays ?? 0) - (b.status.diffDays ?? 0))
      .slice(0, 5);
  }, [rows]);

  const recentEvaluations = evaluations.slice(0, 4);

  return (
    <div>
      <Header title="Panel Entrenador" showSearch={false} />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Bienvenido al Panel de Entrenador
          </h1>
          <p className="text-text-secondary capitalize">{today}</p>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link href="/trainer/evaluaciones/nueva">
            <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
              Nueva evaluación
            </Button>
          </Link>
          <Link href="/trainer/personalizados">
            <Button variant="secondary" leftIcon={<UserCheck className="h-5 w-5" />}>
              Cobrar personalizado
            </Button>
          </Link>
          <Link href="/trainer/training">
            <Button variant="ghost" leftIcon={<Dumbbell className="h-5 w-5" />}>
              Nueva sesión
            </Button>
          </Link>
        </div>

        {/* Estado del negocio de personalizados */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Personalizados al día"
            value={stats.active}
            icon={UserCheck}
            variant="success"
          />
          <StatsCard
            title="Por vencer"
            value={stats.expiring}
            icon={UserCheck}
            variant={stats.expiring > 0 ? "warning" : "default"}
          />
          <StatsCard
            title="Vencidos"
            value={stats.expired}
            icon={UserCheck}
            variant={stats.expired > 0 ? "danger" : "default"}
          />
          <StatsCard
            title="Cobrado este mes"
            value={formatCurrency(stats.collected)}
            icon={ClipboardList}
            variant="default"
          />
        </div>

        {/* Cobros pendientes */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Cobros pendientes</h2>
            <Link href="/trainer/personalizados">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>

          {pendingCharges.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary">
                {clients.length === 0
                  ? "Todavía no tienes personalizados."
                  : "Todos tus personalizados están al día."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingCharges.map(({ client, status }) => (
                <Link
                  key={client.id}
                  href="/trainer/personalizados"
                  className="flex items-center gap-4 py-3 hover:bg-surface-elevated transition-colors -mx-4 px-4"
                >
                  <Avatar src={client.photo_url} name={client.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{client.name}</p>
                    {client.current_subscription?.end_date && (
                      <p className="text-sm text-text-secondary">
                        Venció el {formatDate(client.current_subscription.end_date, "d MMM yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Últimas evaluaciones */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Últimas evaluaciones</h2>
            <Link href="/trainer/evaluaciones">
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </div>

          {recentEvaluations.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Sin evaluaciones todavía"
              description="Registra la primera y queda el histórico para comparar la evolución."
              action={
                <Link href="/trainer/evaluaciones/nueva">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="h-5 w-5" />}>
                    Nueva evaluación
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {recentEvaluations.map((evaluation) => {
                const bodyFat = calculateBodyFat(
                  evaluation,
                  evaluation.members,
                  evaluation.evaluated_on
                );
                return (
                  <Link
                    key={evaluation.id}
                    href={`/trainer/evaluaciones/${evaluation.id}`}
                    className="flex items-center gap-4 py-3 hover:bg-surface-elevated transition-colors -mx-4 px-4"
                  >
                    <Avatar
                      src={evaluation.members?.photo_url}
                      name={evaluation.members?.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {evaluation.members?.name || "Miembro eliminado"}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {formatDate(evaluation.evaluated_on, "d MMM yyyy")}
                      </p>
                    </div>
                    {bodyFat.ok && (
                      <Badge variant={bodyFat.result.variant}>
                        {formatPercentage(bodyFat.result.percentage)}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Acceso rápido */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Acceso rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link href="/trainer/personalizados">
              <Card hoverable className="text-center py-6 h-full">
                <UserCheck className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-text-primary">Personalizados</p>
                <p className="text-sm text-text-secondary">{clients.length} en total</p>
              </Card>
            </Link>
            <Link href="/trainer/evaluaciones">
              <Card hoverable className="text-center py-6 h-full">
                <ClipboardCheck className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-text-primary">Evaluaciones</p>
                <p className="text-sm text-text-secondary">{evaluations.length} registradas</p>
              </Card>
            </Link>
            <Link href="/trainer/training">
              <Card hoverable className="text-center py-6 h-full">
                <Dumbbell className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-text-primary">Entrenamientos</p>
                <p className="text-sm text-text-secondary">{todaySessions.length} hoy</p>
              </Card>
            </Link>
            <Link href="/trainer/members">
              <Card hoverable className="text-center py-6 h-full">
                <Users className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-text-primary">Miembros</p>
                <p className="text-sm text-text-secondary">{activeMembers} activos</p>
              </Card>
            </Link>
            <Link href="/trainer/exercises">
              <Card hoverable className="text-center py-6 h-full">
                <ClipboardList className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                <p className="font-medium text-text-primary">Ejercicios</p>
                <p className="text-sm text-text-secondary">{exercises.length} disponibles</p>
              </Card>
            </Link>
            <Link href="/trainer/routines">
              <Card hoverable className="text-center py-6 h-full">
                <BookOpen className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                <p className="font-medium text-text-primary">Rutinas</p>
                <p className="text-sm text-text-secondary">{routines.length} plantillas</p>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
