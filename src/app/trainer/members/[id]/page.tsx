"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  Mail,
  Phone,
  Plus,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useMember } from "@/hooks/useMembers";
import { useMemberEvaluations } from "@/hooks/usePhysicalEvaluations";
import { usePersonalTraining } from "@/hooks/usePersonalTraining";
import { useTrainerServices } from "@/hooks/useTrainerServices";
import { MembershipStatus } from "@/components/members";
import { ServicePaymentModal, TrainerServicesModal } from "@/components/trainer";
import { Header } from "@/components/layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  ModalFooter,
  Spinner,
} from "@/components/ui";
import { getServiceStatus } from "@/lib/utils/serviceStatus";
import { formatDate } from "@/lib/utils/dates";
import {
  calculateBmi,
  calculateBodyFat,
  formatPercentage,
} from "@/lib/utils/anthropometry";
import {
  formatCurrency,
  getMemberStatusLabel,
  getPaymentMethodLabel,
} from "@/lib/utils/formatting";

export default function TrainerMemberDetailPage() {
  const params = useParams();
  const memberId = params.id as string;

  const { member, loading, error } = useMember(memberId);
  const { evaluations, loading: evaluationsLoading } = useMemberEvaluations(memberId);
  const {
    subscriptions,
    clients,
    registerPayment,
    cancelSubscription,
    suggestedStartDate,
    refetch: refetchPersonalTraining,
  } = usePersonalTraining();
  const { services, personalTrainingService, updateService } = useTrainerServices();

  const [chargeOpen, setChargeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const client = useMemo(() => clients.find((c) => c.id === memberId), [clients, memberId]);
  const current = client?.current_subscription ?? null;
  const ptStatus = getServiceStatus(current);
  const isCancelled = current?.status === "cancelled";
  const isActive = !!current && !isCancelled;
  const ptPrice = Number(personalTrainingService?.price ?? 0);

  /**
   * Toda la plata que este miembro le pagó al entrenador: personalizado y
   * servicios sueltos. `clients` solo trae el personalizado, así que para la
   * vista financiera se filtran las suscripciones crudas por miembro.
   */
  const payments = useMemo(
    () => subscriptions.filter((s) => s.member_id === memberId),
    [subscriptions, memberId]
  );

  const finance = useMemo(() => {
    const monthInterval = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
    return {
      total: payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0),
      thisMonth: payments
        .filter((p) => isWithinInterval(parseISO(p.created_at), monthInterval))
        .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0),
      last: payments[0] ?? null,
    };
  }, [payments]);

  const handleCancel = async () => {
    if (!current) return;
    setCancelling(true);
    try {
      await cancelSubscription(current.id);
      setCancelOpen(false);
    } finally {
      setCancelling(false);
    }
  };

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
        <h2 className="text-xl font-semibold text-text-primary mb-2">Miembro no encontrado</h2>
        <p className="text-text-secondary mb-4">{error || "El miembro que buscas no existe."}</p>
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

  // El acento del bloque de personalizado sigue al estado de cobro, para que
  // "vencido" se lea de un vistazo sin tener que buscar el badge.
  const accent =
    ptStatus.status === "expired"
      ? { bg: "bg-danger/10", fg: "text-danger" }
      : ptStatus.status === "expiring"
        ? { bg: "bg-warning/10", fg: "text-warning" }
        : ptStatus.status === "none"
          ? { bg: "bg-surface-elevated", fg: "text-text-secondary" }
          : { bg: "bg-success/10", fg: "text-success" };

  return (
    <div>
      <Header title="" showSearch={false} />

      <div className="p-6">
        <Link
          href="/trainer/members"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a miembros
        </Link>

        {/* Ficha del miembro */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar
              src={member.photo_url}
              name={member.name}
              size="xl"
              className="h-24 w-24 text-2xl"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary mb-1">{member.name}</h1>
              <Badge variant={statusVariants[member.status]} className="mb-4">
                {getMemberStatusLabel(member.status)}
              </Badge>

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

        {/* Resumen de lo que este miembro le pagó al entrenador */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <p className="text-sm text-text-secondary">Total cobrado</p>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(finance.total)}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {payments.length} {payments.length === 1 ? "cobro" : "cobros"}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Este mes</p>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(finance.thisMonth)}
            </p>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <p className="text-sm text-text-secondary">Último cobro</p>
            {finance.last ? (
              <>
                <p className="text-lg font-semibold text-text-primary truncate">
                  {finance.last.concept || finance.last.trainer_services?.name}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {formatDate(finance.last.created_at, "d MMM yyyy")} ·{" "}
                  {formatCurrency(Number(finance.last.amount_paid || 0))}
                </p>
              </>
            ) : (
              <p className="text-lg text-text-secondary">Sin cobros</p>
            )}
          </Card>
        </div>

        {/* Membresía del gym — informativa; la cobra y renueva el admin */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Membresía del gym</h2>
            <span className="text-sm text-text-secondary">Solo lectura</span>
          </div>
          <MembershipStatus
            membership={member.current_membership as never}
            showRenewButton={false}
          />
        </div>

        {/* Personalizado */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Personalizado</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setServicesOpen(true)}
              disabled={services.length === 0}
            >
              Servicios y precios
            </Button>
          </div>

          <Card>
            {isActive && current ? (
              /* Activo: período vigente y acciones sobre él */
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${accent.bg}`}>
                    <UserCheck className={`h-6 w-6 ${accent.fg}`} />
                  </div>

                  <div className="min-w-0">
                    <Badge variant={ptStatus.variant}>{ptStatus.label}</Badge>
                    <div className="mt-2 space-y-1">
                      <p className="inline-flex items-center gap-2 text-sm text-text-secondary">
                        <CalendarClock className="h-4 w-4" />
                        {formatDate(current.start_date, "d MMM yyyy")}
                        {current.end_date && ` → ${formatDate(current.end_date, "d MMM yyyy")}`}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {current.concept || current.trainer_services?.name}
                        {" · "}
                        {formatCurrency(Number(current.amount_paid || 0))}
                        {current.payment_method &&
                          ` · ${getPaymentMethodLabel(current.payment_method)}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<UserMinus className="h-4 w-4" />}
                    onClick={() => setCancelOpen(true)}
                  >
                    Dar de baja
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setChargeOpen(true)}
                    disabled={!personalTrainingService}
                  >
                    Registrar pago
                  </Button>
                </div>
              </div>
            ) : (
              /* Inactivo: qué se cobra y qué pasa al activar, antes de apretar */
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-surface-elevated flex-shrink-0">
                    <UserCheck className="h-6 w-6 text-text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <Badge variant="default">
                      {isCancelled ? "Dado de baja" : "Sin personalizado"}
                    </Badge>
                    <p className="mt-2 text-sm text-text-secondary">
                      El personalizado se cobra aparte de la membresía del gym, y le incluye la
                      evaluación física sin costo.
                    </p>
                  </div>
                </div>

                {personalTrainingService && (
                  <div className="rounded-lg bg-surface-elevated border border-border p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-text-primary">
                        {personalTrainingService.name}
                      </span>
                      <span className="text-lg font-bold text-text-primary">
                        {ptPrice > 0 ? formatCurrency(ptPrice) : "Sin precio"}
                        {personalTrainingService.duration_days && (
                          <span className="text-sm font-normal text-text-secondary">
                            {" / "}
                            {personalTrainingService.duration_days} días
                          </span>
                        )}
                      </span>
                    </div>

                    {ptPrice === 0 && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-warning">
                          Sin precio configurado, el cobro se registra en $0.
                        </p>
                        <Button variant="secondary" size="sm" onClick={() => setServicesOpen(true)}>
                          Ponerle precio
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <p className="text-sm text-text-secondary">
                    Al activarlo queda registrado el primer pago.
                  </p>
                  <Button
                    variant="primary"
                    leftIcon={<UserCheck className="h-5 w-5" />}
                    onClick={() => setChargeOpen(true)}
                    disabled={!personalTrainingService}
                  >
                    Activar y registrar pago
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Evaluaciones físicas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Evaluaciones físicas</h2>
            <Link href={`/trainer/members/${memberId}/evaluaciones/nueva`}>
              <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Nueva evaluación
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
                  <Link href={`/trainer/members/${memberId}/evaluaciones/nueva`}>
                    <Button variant="primary" size="sm">
                      Nueva evaluación
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {evaluations.map((evaluation) => {
                  const bmi = calculateBmi(evaluation.weight_kg, evaluation.height_cm);
                  const bodyFat = calculateBodyFat(evaluation, member, evaluation.evaluated_on);
                  return (
                    <Link
                      key={evaluation.id}
                      href={`/trainer/members/${memberId}/evaluaciones/${evaluation.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-success/10 flex-shrink-0">
                        <ClipboardCheck className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary">
                          {formatDate(evaluation.evaluated_on, "d 'de' MMMM yyyy")}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {evaluation.weight_kg !== null && `${evaluation.weight_kg} kg`}
                          {bmi && ` · IMC ${bmi.value.toFixed(1)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {bodyFat.ok && (
                          <Badge variant={bodyFat.result.variant}>
                            {formatPercentage(bodyFat.result.percentage)}
                          </Badge>
                        )}
                        <Badge variant={evaluation.payment_id ? "default" : "success"} size="sm">
                          {evaluation.payment_id ? "Cobrada" : "Incluida"}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Historial de pagos — personalizado y servicios sueltos juntos */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Historial de pagos</h2>

          <Card padding="none">
            {payments.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="Sin cobros registrados"
                description="Los cobros del personalizado y de las evaluaciones aparecen acá."
              />
            ) : (
              <div className="divide-y divide-border">
                {payments.map((sub) => {
                  const subStatus = getServiceStatus(sub);
                  return (
                    <div key={sub.id} className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {sub.concept || sub.trainer_services?.name || "Cobro"}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {formatDate(sub.start_date, "d MMM yyyy")}
                          {sub.end_date && ` → ${formatDate(sub.end_date, "d MMM yyyy")}`}
                          {" · "}
                          {sub.payment_method
                            ? getPaymentMethodLabel(sub.payment_method)
                            : "Sin método"}
                          {sub.notes && ` · ${sub.notes}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {sub.trainer_services?.kind === "personal_training" && (
                          <Badge variant={subStatus.variant} size="sm">
                            {subStatus.label}
                          </Badge>
                        )}
                        <span className="text-sm font-medium text-text-primary tabular-nums">
                          {formatCurrency(Number(sub.amount_paid || 0))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ServicePaymentModal
        isOpen={chargeOpen}
        onClose={() => setChargeOpen(false)}
        service={personalTrainingService}
        members={[member]}
        preselectedMemberId={memberId}
        suggestedStartDate={suggestedStartDate}
        title={
          isActive
            ? `Registrar pago de ${member.name}`
            : `Activar personalizado — ${member.name}`
        }
        submitLabel={isActive ? "Registrar pago" : "Activar y registrar pago"}
        onSubmit={registerPayment}
        onSuccess={refetchPersonalTraining}
      />

      <TrainerServicesModal
        isOpen={servicesOpen}
        onClose={() => setServicesOpen(false)}
        services={services}
        onSave={updateService}
      />

      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Dar de baja el personalizado"
        size="sm"
      >
        <p className="text-text-secondary">
          {member.name} deja de ser personalizado. El historial de pagos se conserva y podés
          volver a darlo de alta cuando quieras.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCancelOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" isLoading={cancelling} onClick={handleCancel}>
            Dar de baja
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
