"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMembers } from "@/hooks/useMembers";
import { Button, Input, Spinner, EmptyState, Select, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui";
import { PaymentModal } from "@/components/members";
import { Header } from "@/components/layout";
import { Plus, Search, Users, Mail, Phone, MessageCircle } from "lucide-react";
import { format, differenceInDays, startOfDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminMembersPage() {
  const router = useRouter();
  const { members, loading, error } = useMembers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<string | undefined>();

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone?.includes(searchQuery);

      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch (e) {
      return "-";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "default";
      case "suspended":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "inactive":
        return "Inactivo";
      case "suspended":
        return "Suspendido";
      default:
        return "Desconocido";
    }
  };

  const getMembershipStatus = (endDateString?: string) => {
    if (!endDateString) return { status: "none", label: "Sin membresía", variant: "default" as const, diffDays: null };
    
    // Parse date ensuring we only compare the start of the day
    const today = startOfDay(new Date());
    const endDate = startOfDay(parseISO(endDateString));
    const diffDays = differenceInDays(endDate, today);
    
    if (diffDays < 0) {
      return { status: "expired", label: "Vencida", variant: "danger" as const, diffDays };
    } else if (diffDays <= 5) {
      return { status: "expiring", label: "Por vencer", variant: "warning" as const, diffDays };
    } else {
      return { status: "active", label: "Activa", variant: "success" as const, diffDays };
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent, member: any, statusObj: any) => {
    e.stopPropagation();
    if (!member.phone || statusObj.status === "none" || statusObj.status === "active") return;
    
    let phone = member.phone.replace(/\D/g, "");
    if (!phone.startsWith("57") && phone.length === 10) {
      // Assuming Colombia default if 10 digits
      phone = "57" + phone;
    }
    
    let message = "";
    const endDateFormatted = formatDate(member.current_membership?.end_date);

    if (statusObj.status === "expiring") {
      message = `Hola ${member.name}, te recordamos que tu membresía en Bunker Gym está por vencer el ${endDateFormatted}. ¡Te esperamos para renovar!`;
    } else if (statusObj.status === "expired") {
      message = `Hola ${member.name}, tu membresía ha vencido el ${endDateFormatted}. Te recordamos que si no se realiza el pago en los próximos 5 días, el acceso al gimnasio será suspendido. ¡Renueva pronto para no perder el progreso!`;
    }
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div>
      <Header title="Miembros" showSearch={false} />

      <div className="p-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Buscar por nombre, email o teléfono..."
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
                  { value: "all", label: "Todos" },
                  { value: "active", label: "Activos" },
                  { value: "inactive", label: "Inactivos" },
                  { value: "suspended", label: "Suspendidos" },
                ]}
              />
            </div>
          </div>
          <Link href="/admin/members/new">
            <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
              Nuevo miembro
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-text-secondary">Total</p>
            <p className="text-2xl font-bold text-text-primary">
              {members.length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Activos</p>
            <p className="text-2xl font-bold text-success">
              {members.filter((m) => m.status === "active").length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Con membresía</p>
            <p className="text-2xl font-bold text-primary">
              {members.filter((m) => !!m.current_membership).length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Sin membresía</p>
            <p className="text-2xl font-bold text-warning">
              {members.filter((m) => !m.current_membership).length}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-danger">{error}</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "Sin resultados" : "Sin miembros"}
            description={
              searchQuery
                ? "No se encontraron miembros con esos criterios de búsqueda."
                : "Comienza agregando tu primer miembro al sistema."
            }
            action={
              !searchQuery && (
                <Link href="/admin/members/new">
                  <Button
                    variant="primary"
                    leftIcon={<Plus className="h-5 w-5" />}
                  >
                    Agregar miembro
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Membresía</TableHead>
                  <TableHead>Activación</TableHead>
                  <TableHead>Desactivación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const hasMembership = !!member.current_membership;
                  const membershipStatus = getMembershipStatus(member.current_membership?.end_date);
                  
                  return (
                    <TableRow 
                      key={member.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/admin/members/${member.id}`)}
                    >
                      {/* Member Name & Status */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-text-primary group-hover:text-primary transition-colors">
                            {member.name}
                          </p>
                          <div>
                            <Badge variant={getStatusBadgeVariant(member.status)}>
                              {getStatusLabel(member.status)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                        {/* Contact Info */}
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-text-secondary">
                            {member.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            {member.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{member.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Membership Status Badge */}
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {hasMembership ? (
                              <>
                                <span className="text-sm font-medium text-text-primary">
                                  {member.current_membership?.membership_plans?.name || 'Membresía Activa'}
                                </span>
                                <Badge variant={membershipStatus.variant}>
                                  {membershipStatus.label}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="default">Sin membresía</Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Activation Date */}
                        <TableCell>
                          {hasMembership ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-text-primary">
                                {formatDate(member.current_membership?.start_date)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">-</span>
                          )}
                        </TableCell>

                        {/* Deactivation Date */}
                        <TableCell>
                          {hasMembership ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-text-primary">
                                {formatDate(member.current_membership?.end_date)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">-</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {(membershipStatus.status === "expiring" || membershipStatus.status === "expired") && member.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2"
                                onClick={(e) => handleWhatsAppClick(e, member, membershipStatus)}
                                title="Enviar recordatorio por WhatsApp"
                                type="button"
                              >
                                <MessageCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMemberForPayment(member.id);
                                setIsPaymentModalOpen(true);
                              }}
                            >
                              {hasMembership ? "Renovar membresía" : "Activar membresía"}
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
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedMemberForPayment(undefined);
        }}
        preselectedMemberId={selectedMemberForPayment}
      />
    </div>
  );
}
