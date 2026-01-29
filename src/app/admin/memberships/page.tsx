"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemberships, useMembershipPlans, useExpiringMemberships } from "@/hooks/useMemberships";
import { useMembers } from "@/hooks/useMembers";
import { Header } from "@/components/layout";
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  ModalFooter,
  Badge,
  Spinner,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
} from "@/components/ui";
import { Plus, Search, CreditCard, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate, calculateEndDate, daysUntilExpiration } from "@/lib/utils/dates";
import {
  formatCurrency,
  getMembershipStatusLabel,
  getPaymentMethodLabel,
} from "@/lib/utils/formatting";
import { MembershipInsert } from "@/lib/types/database";
import { format } from "date-fns";

const paymentSchema = z.object({
  member_id: z.string().min(1, "Selecciona un miembro"),
  plan_id: z.string().min(1, "Selecciona un plan"),
  start_date: z.string().min(1, "Selecciona una fecha de inicio"),
  amount_paid: z.number().min(0, "El monto debe ser mayor a 0"),
  payment_method: z.enum(["cash", "card", "transfer"]),
  notes: z.string().optional(),
});

type PaymentFormData = {
  member_id: string;
  plan_id: string;
  start_date: string;
  amount_paid: number;
  payment_method: "cash" | "card" | "transfer";
  notes?: string;
};

export default function AdminMembershipsPage() {
  const searchParams = useSearchParams();
  const preselectedMember = searchParams.get("member");

  const { memberships, loading, createMembership } = useMemberships();
  const { plans } = useMembershipPlans();
  const { members } = useMembers();
  const { memberships: expiringMemberships } = useExpiringMemberships(7);

  const [isCreating, setIsCreating] = useState(!!preselectedMember);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      member_id: preselectedMember || "",
      plan_id: "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      amount_paid: 0,
      payment_method: "cash",
      notes: "",
    },
  });

  const selectedPlanId = watch("plan_id");
  const startDate = watch("start_date");

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const endDate = selectedPlan
    ? format(calculateEndDate(startDate, selectedPlan.duration_days), "yyyy-MM-dd")
    : null;

  // Auto-fill amount when plan is selected
  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setValue("amount_paid", plan.price);
    }
  };

  const filteredMemberships = useMemo(() => {
    return memberships.filter((membership) => {
      const member = membership.members;
      const matchesSearch =
        member?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || membership.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [memberships, searchQuery, statusFilter]);

  const handleCreateMembership = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      const plan = plans.find((p) => p.id === data.plan_id);
      if (!plan) return;

      const membershipData: MembershipInsert = {
        member_id: data.member_id,
        plan_id: data.plan_id,
        start_date: data.start_date,
        end_date: format(calculateEndDate(data.start_date, plan.duration_days), "yyyy-MM-dd"),
        amount_paid: data.amount_paid,
        payment_method: data.payment_method,
        notes: data.notes || null,
        status: "active",
      };

      await createMembership(membershipData);
      reset();
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating membership:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const activeCount = memberships.filter((m) => m.status === "active").length;
  const totalRevenue = memberships.reduce((sum, m) => sum + m.amount_paid, 0);

  return (
    <div>
      <Header title="Membresías" showSearch={false} />

      <div className="p-6">
        {/* Expiring alert */}
        {expiringMemberships.length > 0 && (
          <Card className="mb-6 border-warning/30 bg-warning/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">
                  Membresías por vencer
                </h3>
                <p className="text-sm text-text-secondary mb-2">
                  {expiringMemberships.length} membresía(s) vencen en los próximos 7 días.
                </p>
                <Link href="/admin/memberships/expiring">
                  <Button variant="secondary" size="sm">
                    Ver detalles
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "Todas" },
                  { value: "active", label: "Activas" },
                  { value: "expired", label: "Vencidas" },
                  { value: "cancelled", label: "Canceladas" },
                ]}
              />
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => setIsCreating(true)}
          >
            Registrar pago
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-text-secondary">Total</p>
            <p className="text-2xl font-bold text-text-primary">
              {memberships.length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Activas</p>
            <p className="text-2xl font-bold text-success">{activeCount}</p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Por vencer</p>
            <p className="text-2xl font-bold text-warning">
              {expiringMemberships.length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Ingresos totales</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredMemberships.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={searchQuery ? "Sin resultados" : "Sin membresías"}
            description={
              searchQuery
                ? "No se encontraron membresías con esos criterios."
                : "Comienza registrando el primer pago de membresía."
            }
            action={
              !searchQuery && (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="h-5 w-5" />}
                  onClick={() => setIsCreating(true)}
                >
                  Registrar pago
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>Miembro</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemberships.map((membership) => {
                const daysLeft = daysUntilExpiration(membership.end_date);
                const statusVariant =
                  membership.status === "active"
                    ? daysLeft <= 7
                      ? "warning"
                      : "success"
                    : membership.status === "expired"
                    ? "danger"
                    : "default";

                return (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={membership.members?.name || ""}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {membership.members?.name}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {membership.members?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{membership.membership_plans?.name}</p>
                      <p className="text-sm text-text-secondary">
                        {membership.membership_plans?.duration_days} días
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm">
                          {formatDate(membership.start_date)} -{" "}
                          {formatDate(membership.end_date)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-text-secondary" />
                        <span>{formatCurrency(membership.amount_paid)}</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {getPaymentMethodLabel(membership.payment_method || "cash")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant}>
                        {getMembershipStatusLabel(membership.status)}
                      </Badge>
                      {membership.status === "active" && daysLeft <= 7 && (
                        <p className="text-xs text-warning mt-1">
                          {daysLeft === 0
                            ? "Vence hoy"
                            : daysLeft < 0
                            ? "Vencida"
                            : `${daysLeft} días`}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create membership modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
          reset();
        }}
        title="Registrar pago de membresía"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleCreateMembership)} className="space-y-4">
          <Select
            label="Miembro *"
            placeholder="Selecciona un miembro"
            options={members.map((m) => ({
              value: m.id,
              label: m.name,
            }))}
            error={errors.member_id?.message}
            {...register("member_id")}
          />

          <Select
            label="Plan de membresía *"
            placeholder="Selecciona un plan"
            options={plans.map((p) => ({
              value: p.id,
              label: `${p.name} - ${formatCurrency(p.price)} (${p.duration_days} días)`,
            }))}
            error={errors.plan_id?.message}
            {...register("plan_id", {
              onChange: (e) => handlePlanChange(e.target.value),
            })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fecha de inicio *"
              error={errors.start_date?.message}
              {...register("start_date")}
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Fecha de vencimiento
              </label>
              <div className="px-4 py-3 bg-surface-elevated border border-border rounded-lg text-text-secondary">
                {endDate ? formatDate(endDate) : "Selecciona un plan"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Monto pagado *"
              step="0.01"
              error={errors.amount_paid?.message}
              {...register("amount_paid")}
            />
            <Select
              label="Método de pago *"
              options={[
                { value: "cash", label: "Efectivo" },
                { value: "card", label: "Tarjeta" },
                { value: "transfer", label: "Transferencia" },
              ]}
              error={errors.payment_method?.message}
              {...register("payment_method")}
            />
          </div>

          <Input
            label="Notas"
            placeholder="Observaciones adicionales..."
            {...register("notes")}
          />

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreating(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Registrar pago
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
