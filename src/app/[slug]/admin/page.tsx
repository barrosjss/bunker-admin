import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CreditCard, AlertTriangle, XCircle, Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui";
import { format, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  params: Promise<{ slug: string }>;
}

function DaysChip({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
        Venció hace {Math.abs(days)}d
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
        Vence hoy
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
      Vence en {days}d
    </span>
  );
}

export default async function AdminDashboardPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");
  const in7Days = format(addDays(new Date(), 7), "yyyy-MM-dd");

  // Fetch raw data — los counts se calculan por miembro único (no por fila)
  const [
    { count: totalMembers },
    { data: activeMembershipsRaw },
    { data: expiringRaw },
    { data: expiredRaw },
    { data: overdueList },
    { data: expiringList },
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase
      .from("memberships")
      .select("member_id")
      .eq("status", "active")
      .gt("end_date", in7Days),
    supabase
      .from("memberships")
      .select("member_id")
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", in7Days),
    supabase
      .from("memberships")
      .select("member_id")
      .eq("status", "active")
      .lt("end_date", today),
    // Membresías vencidas (mora) — más antiguas primero
    supabase
      .from("memberships")
      .select("id, end_date, member_id, members(id, name, phone)")
      .eq("status", "active")
      .lt("end_date", today)
      .order("end_date", { ascending: true })
      .limit(50),
    // Membresías por vencer en 7 días — las más próximas primero
    supabase
      .from("memberships")
      .select("id, end_date, member_id, members(id, name, phone)")
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", in7Days)
      .order("end_date", { ascending: true })
      .limit(50),
  ]);

  // Contar miembros únicos (no filas de membresía)
  const activeMembers = new Set(activeMembershipsRaw?.map((m) => m.member_id) ?? []).size;
  const expiringSoon = new Set(expiringRaw?.map((m) => m.member_id) ?? []).size;
  const expired = new Set(expiredRaw?.map((m) => m.member_id) ?? []).size;

  // Deduplicar por miembro (un mismo miembro puede tener varias membresías de prueba)
  function dedup<T extends { member_id: string }>(list: T[]): T[] {
    const seen = new Set<string>();
    return list.filter((m) => {
      if (seen.has(m.member_id)) return false;
      seen.add(m.member_id);
      return true;
    }).slice(0, 8);
  }

  const uniqueOverdue = overdueList ? dedup(overdueList) : [];
  const uniqueExpiring = expiringList ? dedup(expiringList) : [];

  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });
  const base = `/${slug}/admin`;

  const todayDate = parseISO(today);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-1">Panel de Administración</h1>
        <p className="text-text-secondary capitalize text-sm">{todayLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Link href={`${base}/members`}>
          <Card hoverable className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <Users className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Total miembros</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-text-primary">{totalMembers ?? 0}</p>
          </Card>
        </Link>

        <Link href={`${base}/members?filter=active`}>
          <Card hoverable className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Activas</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-success">{activeMembers ?? 0}</p>
          </Card>
        </Link>

        <Link href={`${base}/members?filter=expiring`}>
          <Card hoverable className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Por vencer (7d)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-warning">{expiringSoon ?? 0}</p>
          </Card>
        </Link>

        <Link href={`${base}/members?filter=expired`}>
          <Card hoverable className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <XCircle className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">En mora</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-danger">{expired ?? 0}</p>
          </Card>
        </Link>
      </div>

      {/* Prioridad 1: Miembros en mora */}
      {uniqueOverdue.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-danger" />
              <h2 className="text-sm font-semibold text-text-primary">En mora</h2>
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-danger text-white text-xs font-bold">
                {expired ?? uniqueOverdue.length}
              </span>
            </div>
            <Link href={`${base}/members?filter=expired`} className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-2">
            {uniqueOverdue.map((m) => {
              const member = Array.isArray(m.members) ? m.members[0] : m.members;
              const endDate = parseISO(m.end_date);
              const diffDays = Math.floor((endDate.getTime() - todayDate.getTime()) / 86400000);
              const phone = member?.phone?.replace(/\D/g, "");
              const phoneForWA = phone && phone.length === 10 ? "57" + phone : phone;
              const waMsg = encodeURIComponent(
                `Hola ${member?.name}, tu membresía venció el ${format(endDate, "d 'de' MMMM", { locale: es })}. ¡Renuévala pronto para seguir entrenando! 🏋️`
              );
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 bg-surface rounded-xl border border-danger/20 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">{member?.name ?? "—"}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <DaysChip days={diffDays} />
                      {member?.phone && (
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Phone className="h-3 w-3" />{member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  {member?.phone && phoneForWA && (
                    <a
                      href={`https://wa.me/${phoneForWA}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 rounded-lg hover:bg-surface-elevated text-green-500 transition-colors"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Prioridad 2: Por vencerse */}
      {uniqueExpiring.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold text-text-primary">Por vencerse (7 días)</h2>
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-warning text-background text-xs font-bold">
                {expiringSoon ?? uniqueExpiring.length}
              </span>
            </div>
            <Link href={`${base}/members?filter=expiring`} className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-2">
            {uniqueExpiring.map((m) => {
              const member = Array.isArray(m.members) ? m.members[0] : m.members;
              const endDate = parseISO(m.end_date);
              const diffDays = Math.floor((endDate.getTime() - todayDate.getTime()) / 86400000);
              const phone = member?.phone?.replace(/\D/g, "");
              const phoneForWA = phone && phone.length === 10 ? "57" + phone : phone;
              const waMsg = encodeURIComponent(
                `Hola ${member?.name}, te recordamos que tu membresía vence el ${format(endDate, "d 'de' MMMM", { locale: es })}. ¡Te esperamos para renovar! 💪`
              );
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 bg-surface rounded-xl border border-warning/20 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">{member?.name ?? "—"}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <DaysChip days={diffDays} />
                      {member?.phone && (
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Phone className="h-3 w-3" />{member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  {member?.phone && phoneForWA && (
                    <a
                      href={`https://wa.me/${phoneForWA}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 rounded-lg hover:bg-surface-elevated text-green-500 transition-colors"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`${base}/members`}>
            <Card hoverable className="flex items-center gap-3 py-3 px-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-text-primary text-sm">Miembros</p>
                <p className="text-xs text-text-secondary truncate">Gestionar</p>
              </div>
            </Card>
          </Link>

          <Link href={`${base}/plans`}>
            <Card hoverable className="flex items-center gap-3 py-3 px-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-text-primary text-sm">Planes</p>
                <p className="text-xs text-text-secondary truncate">Gestionar</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
