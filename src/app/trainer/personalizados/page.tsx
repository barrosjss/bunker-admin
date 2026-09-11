"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from "date-fns";
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarClock,
  ClipboardList,
  Plus,
  Search,
  Settings2,
  UserPlus,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Spinner,
} from "@/components/ui";
import { ServicePaymentModal, TrainerServicesModal } from "@/components/trainer";
import { useMembers } from "@/hooks/useMembers";
import { usePersonalTraining } from "@/hooks/usePersonalTraining";
import { useTrainerServices } from "@/hooks/useTrainerServices";
import { getServiceStatus, isActivePersonalTraining } from "@/lib/utils/serviceStatus";
import { getMembershipStatus } from "@/lib/utils/membershipStatus";
import { formatDate } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/formatting";
import type { Member } from "@/lib/supabase/types/database";

type StatusFilter = "all" | "active" | "expiring" | "expired";

export default function PersonalizadosPage() {
  const { members: allMembers, loading: membersLoading } = useMembers();
  const {
    clients,
    subscriptions,
    loading: ptLoading,
    error,
    registerPayment,
    suggestedStartDate,
  } = usePersonalTraining();
  const {
    services,
    personalTrainingService,
    loading: servicesLoading,
    updateService,
    ensureBaseServices,
  } = useTrainerServices();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [servicesOpen, setServicesOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [renewMember, setRenewMember] = useState<Member | null>(null);

  // Un entrenador creado después de la migración no tiene los servicios base.
  useEffect(() => {
    if (!servicesLoading) ensureBaseServices();
  }, [servicesLoading, ensureBaseServices]);

  /** La membresía del gym vive aparte: se cruza por id para poder avisar si falta. */
  const membershipByMember = useMemo(() => {
    return new Map(allMembers.map((m) => [m.id, m.current_membership]));
  }, [allMembers]);

  const rows = useMemo(() => {
    return clients.map((client) => {
      const serviceStatus = getServiceStatus(client.current_subscription);
      const membership = membershipByMember.get(client.id);
      return {
        client,
        serviceStatus,
        gymMembership: getMembershipStatus(membership),
      };
    });
  }, [clients, membershipByMember]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(({ client, serviceStatus }) => {
      const matchesSearch =
        !query ||
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && serviceStatus.status === "active") ||
        (statusFilter === "expiring" && serviceStatus.status === "expiring") ||
        (statusFilter === "expired" && serviceStatus.status === "expired");

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const monthInterval = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
    const collectedThisMonth = subscriptions
      .filter((s) => isWithinInterval(parseISO(s.created_at), monthInterval))
      .reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);

    return {
      active: rows.filter((r) => r.serviceStatus.status === "active").length,
      expiring: rows.filter((r) => r.serviceStatus.status === "expiring").length,
      expired: rows.filter((r) => r.serviceStatus.status === "expired").length,
      collectedThisMonth,
    };
  }, [rows, subscriptions]);

  /** Para dar de alta: los que todavía no son personalizados activos. */
  const eligibleMembers = useMemo(() => {
    const activeClientIds = new Set(
      clients.filter((c) => isActivePersonalTraining(c.current_subscription)).map((c) => c.id)
    );
    return allMembers.filter((m) => !activeClientIds.has(m.id));
  }, [allMembers, clients]);

  const loading = ptLoading || membersLoading || servicesLoading;
  const needsPrice = personalTrainingService && Number(personalTrainingService.price) === 0;

  return (
    <div>
      <Header title="Personalizados" showSearch={false} />

      <div className="p-6">
        {/* Acciones */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant="primary"
            leftIcon={<UserPlus className="h-5 w-5" />}
            onClick={() => setNewClientOpen(true)}
            disabled={!personalTrainingService}
          >
            Nuevo personalizado
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Settings2 className="h-5 w-5" />}
            onClick={() => setServicesOpen(true)}
            disabled={services.length === 0}
          >
            Servicios y precios
          </Button>
          <Link href="/trainer/evaluaciones">
            <Button variant="ghost" leftIcon={<ClipboardList className="h-5 w-5" />}>
              Evaluaciones
            </Button>
          </Link>
        </div>

        {needsPrice && (
          <Card className="mb-6 border-warning/30 bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  El personalizado todavía no tiene precio
                </p>
                <p className="text-sm text-text-secondary">
                  Ponle precio y los cobros se precargan solos.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setServicesOpen(true)}>
                Configurar
              </Button>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <p className="text-sm text-text-secondary">Al día</p>
            <p className="text-2xl font-bold text-success">{stats.active}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Por vencer</p>
            <p className="text-2xl font-bold text-warning">{stats.expiring}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Vencidos</p>
            <p className="text-2xl font-bold text-danger">{stats.expired}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Cobrado este mes</p>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(stats.collectedThisMonth)}
            </p>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Buscar personalizado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              options={[
                { value: "all", label: "Todos" },
                { value: "active", label: "Al día" },
                { value: "expiring", label: "Por vencer" },
                { value: "expired", label: "Vencidos" },
              ]}
            />
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-danger">{error}</p>
          </div>
        ) : visibleRows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={clients.length === 0 ? "Todavía no tienes personalizados" : "Sin resultados"}
            description={
              clients.length === 0
                ? "Da de alta al primero y registra su primer mes. La evaluación física les queda incluida."
                : "Ningún personalizado coincide con esos filtros."
            }
            action={
              clients.length === 0 ? (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="h-5 w-5" />}
                  onClick={() => setNewClientOpen(true)}
                  disabled={!personalTrainingService}
                >
                  Nuevo personalizado
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {visibleRows.map(({ client, serviceStatus, gymMembership }) => (
              <Card key={client.id}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Link
                    href={`/trainer/members/${client.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0 group"
                  >
                    <Avatar src={client.photo_url} name={client.name} size="lg" />
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary group-hover:text-primary transition-colors truncate">
                        {client.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {client.current_subscription?.end_date && (
                          <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
                            <CalendarClock className="h-4 w-4" />
                            {formatDate(client.current_subscription.end_date, "d MMM yyyy")}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
                          <BadgeDollarSign className="h-4 w-4" />
                          {formatCurrency(Number(client.current_subscription?.amount_paid || 0))}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {gymMembership.status !== "active" && gymMembership.status !== "expiring" && (
                      <Badge variant="danger" size="sm" title="Membresía del gym">
                        Gym: {gymMembership.label}
                      </Badge>
                    )}
                    <Badge variant={serviceStatus.variant}>{serviceStatus.label}</Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRenewMember(client)}
                      disabled={!personalTrainingService}
                    >
                      Cobrar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Alta de personalizado */}
      <ServicePaymentModal
        isOpen={newClientOpen}
        onClose={() => setNewClientOpen(false)}
        service={personalTrainingService}
        members={eligibleMembers}
        suggestedStartDate={suggestedStartDate}
        title="Nuevo personalizado"
        submitLabel="Dar de alta y cobrar"
        onSubmit={registerPayment}
      />

      {/* Renovación */}
      <ServicePaymentModal
        isOpen={renewMember !== null}
        onClose={() => setRenewMember(null)}
        service={personalTrainingService}
        members={renewMember ? [renewMember] : []}
        preselectedMemberId={renewMember?.id}
        suggestedStartDate={suggestedStartDate}
        title={renewMember ? `Cobrar a ${renewMember.name}` : undefined}
        submitLabel="Registrar cobro"
        onSubmit={registerPayment}
      />

      <TrainerServicesModal
        isOpen={servicesOpen}
        onClose={() => setServicesOpen(false)}
        services={services}
        onSave={updateService}
      />
    </div>
  );
}
