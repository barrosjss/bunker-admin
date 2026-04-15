"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMembers } from "@/hooks/useMembers";
import {
  Button, Input, Spinner, EmptyState, Select,
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge,
} from "@/components/ui";
import { PaymentModal, EditMembershipModal } from "@/components/members";
import { Header } from "@/components/layout";
import { Search, Users, Mail, Phone, MessageCircle, Pencil } from "lucide-react";
import { format, differenceInDays, startOfDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { MemberWithMembership } from "@/lib/supabase/types/database";

type MembershipStatusKey = "none" | "active" | "expiring" | "expired";

function getMembershipStatus(endDateString?: string | null) {
  if (!endDateString) return { status: "none" as MembershipStatusKey, label: "Sin membresía", variant: "default" as const, diffDays: null };
  const today = startOfDay(new Date());
  const endDate = startOfDay(parseISO(endDateString));
  const diffDays = differenceInDays(endDate, today);
  if (diffDays < 0) return { status: "expired" as MembershipStatusKey, label: "Vencida", variant: "danger" as const, diffDays };
  if (diffDays <= 7) return { status: "expiring" as MembershipStatusKey, label: `Vence en ${diffDays}d`, variant: "warning" as const, diffDays };
  return { status: "active" as MembershipStatusKey, label: "Activa", variant: "success" as const, diffDays };
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  try { return format(new Date(dateString), "dd MMM yyyy", { locale: es }); }
  catch { return "-"; }
}

function MembersContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";

  const { members, loading, error, refetch } = useMembers();
  const [search, setSearch] = useState("");
  const [membershipFilter, setMembershipFilter] = useState(initialFilter);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();
  const [editingMember, setEditingMember] = useState<MemberWithMembership | null>(null);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.phone?.includes(search);

      const ms = getMembershipStatus(m.current_membership?.end_date);

      const matchesMembership =
        membershipFilter === "all" ? true :
        membershipFilter === "active" ? ms.status === "active" :
        membershipFilter === "expiring" ? ms.status === "expiring" :
        membershipFilter === "expired" ? ms.status === "expired" :
        membershipFilter === "none" ? ms.status === "none" :
        true;

      return matchesSearch && matchesMembership;
    });
  }, [members, search, membershipFilter]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => getMembershipStatus(m.current_membership?.end_date).status === "active").length,
    expiring: members.filter((m) => getMembershipStatus(m.current_membership?.end_date).status === "expiring").length,
    expired: members.filter((m) => getMembershipStatus(m.current_membership?.end_date).status === "expired").length,
    none: members.filter((m) => !m.current_membership).length,
  }), [members]);

  const handleWhatsApp = (
    e: React.MouseEvent,
    member: MemberWithMembership,
    ms: { status: MembershipStatusKey; diffDays: number | null }
  ) => {
    e.stopPropagation();
    if (!member.phone || ms.status === "none" || ms.status === "active") return;
    let phone = member.phone.replace(/\D/g, "");
    if (!phone.startsWith("57") && phone.length === 10) phone = "57" + phone;

    const endFormatted = formatDate(member.current_membership?.end_date);
    const msg = ms.status === "expiring"
      ? `Hola ${member.name}, te recordamos que tu membresía vence el ${endFormatted}. ¡Te esperamos para renovar! 💪`
      : `Hola ${member.name}, tu membresía venció el ${endFormatted}. Renuévala pronto para seguir entrenando. ¡Te esperamos! 🏋️`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const openPayment = (e: React.MouseEvent, member: MemberWithMembership) => {
    e.stopPropagation();
    setSelectedMemberId(member.id);
    setSelectedPlanId(member.current_membership?.plan_id ?? undefined);
    setIsPaymentModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, member: MemberWithMembership) => {
    e.stopPropagation();
    setEditingMember(member);
  };

  return (
    <div>
      <Header title="Miembros" showSearch={false} />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-text-primary", filter: "all" },
            { label: "Activos", value: stats.active, color: "text-success", filter: "active" },
            { label: "Por vencer", value: stats.expiring, color: "text-warning", filter: "expiring" },
            { label: "Vencidos", value: stats.expired, color: "text-danger", filter: "expired" },
          ].map((s) => (
            <button
              key={s.filter}
              onClick={() => setMembershipFilter(s.filter)}
              className={`card text-left transition-all ${membershipFilter === s.filter ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}
            >
              <p className="text-sm text-text-secondary">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="w-44">
            <Select
              value={membershipFilter}
              onChange={(e) => setMembershipFilter(e.target.value)}
              options={[
                { value: "all", label: "Todos" },
                { value: "active", label: "Activos" },
                { value: "expiring", label: "Por vencer" },
                { value: "expired", label: "Vencidos" },
                { value: "none", label: "Sin membresía" },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <p className="text-center py-12 text-danger">{error}</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin miembros"
            description={search ? "No hay resultados para esa búsqueda." : "Aún no hay miembros registrados."}
          />
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Membresía</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => {
                  const ms = getMembershipStatus(member.current_membership?.end_date);
                  const hasMembership = !!member.current_membership;

                  return (
                    <TableRow key={member.id}>
                      {/* Nombre */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-text-primary">{member.name}</p>
                          {member.birth_date && (
                            <p className="text-xs text-text-secondary">
                              {formatDate(member.birth_date)}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Contacto */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-text-secondary">
                          {member.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span>{member.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Estado membresía */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {hasMembership ? (
                            <>
                              <span className="text-sm font-medium text-text-primary">
                                {member.current_membership?.membership_plans?.name || "Plan activo"}
                              </span>
                              <Badge variant={ms.variant}>{ms.label}</Badge>
                            </>
                          ) : (
                            <Badge variant="default">Sin membresía</Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Fecha inicio */}
                      <TableCell>
                        <span className="text-sm text-text-primary">
                          {formatDate(member.current_membership?.start_date)}
                        </span>
                      </TableCell>

                      {/* Fecha vencimiento */}
                      <TableCell>
                        <span className={`text-sm font-medium ${
                          ms.status === "expired" ? "text-danger" :
                          ms.status === "expiring" ? "text-warning" :
                          "text-text-primary"
                        }`}>
                          {formatDate(member.current_membership?.end_date)}
                        </span>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(ms.status === "expiring" || ms.status === "expired") && member.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              title="Enviar recordatorio por WhatsApp"
                              onClick={(e) => handleWhatsApp(e, member, ms)}
                            >
                              <MessageCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          {hasMembership && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              title="Editar membresía"
                              onClick={(e) => openEdit(e, member)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant={hasMembership ? "secondary" : "primary"}
                            size="sm"
                            onClick={(e) => openPayment(e, member)}
                          >
                            {hasMembership ? "Renovar" : "Activar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedMemberId(undefined); setSelectedPlanId(undefined); }}
        preselectedMemberId={selectedMemberId}
        preselectedPlanId={selectedPlanId}
        onSuccess={() => { setIsPaymentModalOpen(false); setSelectedMemberId(undefined); setSelectedPlanId(undefined); refetch(); }}
      />

      {editingMember && (
        <EditMembershipModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          onSuccess={() => { setEditingMember(null); refetch(); }}
        />
      )}
    </div>
  );
}

export default function AdminMembersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    }>
      <MembersContent />
    </Suspense>
  );
}
