"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMember } from "@/hooks/useMembers";
import { useMemberSessions } from "@/hooks/useTraining";
import { useMemberEvaluations } from "@/hooks/usePhysicalEvaluations";
import { usePersonalTraining } from "@/hooks/usePersonalTraining";
import { useTrainerServices } from "@/hooks/useTrainerServices";
import { MembershipStatus } from "@/components/members";
import { ServicePaymentModal } from "@/components/trainer";
import { getServiceStatus } from "@/lib/utils/serviceStatus";
import {
  calculateBmi,
  calculateBodyFat,
  formatPercentage,
} from "@/lib/utils/anthropometry";
import { formatCurrency } from "@/lib/utils/formatting";
import { Header } from "@/components/layout";
import {
  Card,
  Button,
  Avatar,
  Badge,
  Spinner,
  EmptyState,
} from "@/components/ui";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  ClipboardCheck,
  Dumbbell,
  ClipboardList,
  Plus,
  UserCheck,
} from "lucide-react";
import { formatDate, formatRelative } from "@/lib/utils/dates";
import { getMemberStatusLabel } from "@/lib/utils/formatting";
import Link from "next/link";

export default function TrainerMemberDetailPage() {
  const params = useParams();
  const memberId = params.id as string;

  const { member, loading, error } = useMember(memberId);
  const { sessions, loading: sessionsLoading } = useMemberSessions(memberId);
  const { evaluations, loading: evaluationsLoading, refetch: refetchEvaluations } =
    useMemberEvaluations(memberId);
  const { clients, registerPayment, suggestedStartDate, refetch: refetchPersonalTraining } =
    usePersonalTraining();
  const { personalTrainingService } = useTrainerServices();
  const [chargeOpen, setChargeOpen] = useState(false);

  const client = useMemo(() => clients.find((c) => c.id === memberId), [clients, memberId]);
  const ptStatus = getServiceStatus(client?.current_subscription);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="h-12 w-12 text-danger mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Miembro no encontrado
        </h2>
        <p className="text-text-secondary mb-4">
          {error || "El miembro que buscas no existe."}
        </p>
        <Link href="/trainer/members">
          <Button variant="secondary">Volver a miembros</Button>
        </Link>
      </div>
    );
  }

  const statusVariants: Record<string, "success" | "warning" | "danger"> = {
    active: "success",
    inactive: "warning",
    suspended: "danger",
  };

  return (
    <div>
      <Header title="" showSearch={false} />

      <div className="p-6">
        {/* Back button */}
        <Link
          href="/trainer/members"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a miembros
        </Link>

        {/* Member header */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar
              src={member.photo_url}
              name={member.name}
              size="xl"
              className="h-24 w-24 text-2xl"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary mb-1">
                    {member.name}
                  </h1>
                  <Badge variant={statusVariants[member.status]}>
                    {getMemberStatusLabel(member.status)}
                  </Badge>
                </div>
                <Link href={`/trainer/training?member=${memberId}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Nueva sesión
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {member.phone && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Phone className="h-4 w-4" />
                    {member.phone}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                )}
                {member.birth_date && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar className="h-4 w-4" />
                    {formatDate(member.birth_date)}
                  </div>
                )}
              </div>

              {member.notes && (
                <p className="mt-4 text-sm text-text-secondary bg-surface-elevated p-3 rounded-lg">
                  {member.notes}
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Membership status (read-only) */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Membresía
            </h2>
            <MembershipStatus
              membership={member.current_membership as never}
              showRenewButton={false}
            />
          </div>

          {/* Recent sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Entrenamientos recientes
              </h2>
              <Link href={`/trainer/training/${memberId}`}>
                <Button variant="ghost" size="sm">
                  Ver historial
                </Button>
              </Link>
            </div>

            <Card padding="none">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : sessions.length === 0 ? (
                <EmptyState
                  icon={Dumbbell}
                  title="Sin entrenamientos"
                  description="Este miembro aún no tiene sesiones registradas."
                  action={
                    <Link href={`/trainer/training?member=${memberId}`}>
                      <Button variant="primary" size="sm">
                        Registrar sesión
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y divide-border">
                  {sessions.slice(0, 5).map((session) => (
                    <Link
                      key={session.id}
                      href={`/trainer/training/session/${session.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-success/10">
                        <ClipboardList className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary">
                          {formatDate(session.date)}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {session.session_exercises?.length || 0} ejercicios
                        </p>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {formatRelative(session.created_at)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Personalizado y evaluaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Personalizado */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Personalizado
            </h2>
            <Card>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <UserCheck className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <Badge variant={ptStatus.variant}>{ptStatus.label}</Badge>
                    {client?.current_subscription?.end_date && (
                      <p className="text-sm text-text-secondary mt-1">
                        Hasta el{" "}
                        {formatDate(client.current_subscription.end_date, "d MMM yyyy")}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setChargeOpen(true)}
                  disabled={!personalTrainingService}
                >
                  {client ? "Cobrar" : "Dar de alta"}
                </Button>
              </div>

              {client && client.subscriptions.length > 0 ? (
                <div className="divide-y divide-border border-t border-border -mx-4 px-4">
                  {client.subscriptions.slice(0, 4).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm text-text-primary">
                          {formatDate(sub.start_date, "d MMM yyyy")}
                          {sub.end_date && ` → ${formatDate(sub.end_date, "d MMM yyyy")}`}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {sub.trainer_services?.name}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {formatCurrency(Number(sub.amount_paid || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  No es personalizado. Al darlo de alta, la evaluación física le queda
                  incluida.
                </p>
              )}
            </Card>
          </div>

          {/* Evaluaciones físicas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Evaluaciones físicas
              </h2>
              <Link href={`/trainer/evaluaciones/nueva?member=${memberId}`}>
                <Button variant="ghost" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                  Nueva
                </Button>
              </Link>
            </div>

            <Card padding="none">
              {evaluationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : evaluations.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="Sin evaluaciones"
                  description="Registra la primera para empezar a seguir su evolución."
                  action={
                    <Link href={`/trainer/evaluaciones/nueva?member=${memberId}`}>
                      <Button variant="primary" size="sm">
                        Nueva evaluación
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y divide-border">
                  {evaluations.slice(0, 5).map((evaluation) => {
                    const bmi = calculateBmi(evaluation.weight_kg, evaluation.height_cm);
                    const bodyFat = calculateBodyFat(
                      evaluation,
                      member,
                      evaluation.evaluated_on
                    );
                    return (
                      <Link
                        key={evaluation.id}
                        href={`/trainer/evaluaciones/${evaluation.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-success/10">
                          <ClipboardCheck className="h-5 w-5 text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary">
                            {formatDate(evaluation.evaluated_on, "d MMM yyyy")}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {evaluation.weight_kg !== null && `${evaluation.weight_kg} kg`}
                            {bmi && ` · IMC ${bmi.value.toFixed(1)}`}
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
          </div>
        </div>
      </div>

      <ServicePaymentModal
        isOpen={chargeOpen}
        onClose={() => setChargeOpen(false)}
        service={personalTrainingService}
        members={[member]}
        preselectedMemberId={memberId}
        suggestedStartDate={suggestedStartDate}
        title={`Cobrar personalizado a ${member.name}`}
        submitLabel={client ? "Registrar cobro" : "Dar de alta y cobrar"}
        onSubmit={registerPayment}
        onSuccess={() => {
          refetchPersonalTraining();
          refetchEvaluations();
        }}
      />
    </div>
  );
}
