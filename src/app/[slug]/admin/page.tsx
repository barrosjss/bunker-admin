import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CreditCard, AlertTriangle, XCircle } from "lucide-react";
import { Card } from "@/components/ui";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminDashboardPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");
  const in7Days = format(addDays(new Date(), 7), "yyyy-MM-dd");

  // Stats en paralelo
  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: expiringSoon },
    { count: expired },
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("end_date", today),
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", in7Days),
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .lt("end_date", today),
  ]);

  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });
  const base = `/${slug}/admin`;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Panel de Administración</h1>
        <p className="text-text-secondary capitalize">{todayLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href={`${base}/members`}>
          <Card hoverable className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total miembros</span>
            </div>
            <p className="text-3xl font-bold text-text-primary">{totalMembers ?? 0}</p>
          </Card>
        </Link>

        <Link href={`${base}/members?filter=active`}>
          <Card hoverable className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Membresías activas</span>
            </div>
            <p className="text-3xl font-bold text-success">{activeMembers ?? 0}</p>
          </Card>
        </Link>

        <Link href={`${base}/members?filter=expiring`}>
          <Card hoverable className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Por vencer (7d)</span>
            </div>
            <p className="text-3xl font-bold text-warning">{expiringSoon ?? 0}</p>
          </Card>
        </Link>

        <Link href={`${base}/members?filter=expired`}>
          <Card hoverable className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Membresías vencidas</span>
            </div>
            <p className="text-3xl font-bold text-danger">{expired ?? 0}</p>
          </Card>
        </Link>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <Link href={`${base}/members`}>
            <Card hoverable className="flex items-center gap-4 py-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Ver miembros</p>
                <p className="text-sm text-text-secondary">Gestionar y activar membresías</p>
              </div>
            </Card>
          </Link>

          <Link href={`${base}/members?filter=expiring`}>
            <Card hoverable className="flex items-center gap-4 py-4">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Por vencer</p>
                <p className="text-sm text-text-secondary">Enviar recordatorios</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
