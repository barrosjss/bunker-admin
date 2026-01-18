"use client";

import Link from "next/link";
import { useMembers } from "@/hooks/useMembers";
import { useMemberships, useExpiringMemberships } from "@/hooks/useMemberships";
import { useTodaySessions } from "@/hooks/useTraining";
import { StatsCard, ExpiringMemberships, RecentActivity } from "@/components/dashboard";
import { Header } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import {
  Users,
  CreditCard,
  Dumbbell,
  TrendingUp,
  UserPlus,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatting";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
  const { members } = useMembers();
  const { memberships } = useMemberships();
  const { memberships: expiringMemberships } = useExpiringMemberships(7);
  const { sessions: todaySessions } = useTodaySessions();

  // Calculate stats
  const activeMembers = members.filter((m) => m.status === "active").length;
  const activeMemberships = memberships.filter((m) => m.status === "active").length;
  const membersWithMembership = members.filter((m) => m.current_membership).length;

  // Calculate this month's revenue
  const currentMonth = format(new Date(), "yyyy-MM");
  const thisMonthRevenue = memberships
    .filter((m) => m.created_at.startsWith(currentMonth))
    .reduce((sum, m) => sum + m.amount_paid, 0);

  // Today's date
  const today = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <div>
      <Header title="Dashboard" showSearch={false} />

      <div className="p-6">
        {/* Welcome message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Bienvenido a Bunker Admin
          </h1>
          <p className="text-text-secondary capitalize">{today}</p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link href="/members/new">
            <Button variant="primary" leftIcon={<UserPlus className="h-5 w-5" />}>
              Nuevo miembro
            </Button>
          </Link>
          <Link href="/memberships">
            <Button variant="secondary" leftIcon={<DollarSign className="h-5 w-5" />}>
              Registrar pago
            </Button>
          </Link>
          <Link href="/training">
            <Button variant="secondary" leftIcon={<Dumbbell className="h-5 w-5" />}>
              Nueva sesión
            </Button>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Miembros activos"
            value={activeMembers}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Membresías activas"
            value={activeMemberships}
            icon={CreditCard}
            variant="success"
          />
          <StatsCard
            title="Entrenamientos hoy"
            value={todaySessions.length}
            icon={Dumbbell}
            variant="warning"
          />
          <StatsCard
            title="Ingresos del mes"
            value={formatCurrency(thisMonthRevenue)}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <p className="text-sm text-text-secondary">Total miembros</p>
            <p className="text-2xl font-bold text-text-primary">{members.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Con membresía</p>
            <p className="text-2xl font-bold text-success">{membersWithMembership}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Sin membresía</p>
            <p className="text-2xl font-bold text-warning">
              {members.length - membersWithMembership}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Por vencer (7d)</p>
            <p className="text-2xl font-bold text-danger">{expiringMemberships.length}</p>
          </Card>
        </div>

        {/* Activity sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpiringMemberships />
          <RecentActivity />
        </div>

        {/* Quick links */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/members">
              <Card hoverable className="text-center py-6">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-medium text-text-primary">Ver miembros</p>
                <p className="text-sm text-text-secondary">{members.length} registrados</p>
              </Card>
            </Link>
            <Link href="/memberships/expiring">
              <Card hoverable className="text-center py-6">
                <CreditCard className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="font-medium text-text-primary">Por vencer</p>
                <p className="text-sm text-text-secondary">{expiringMemberships.length} membresías</p>
              </Card>
            </Link>
            <Link href="/exercises">
              <Card hoverable className="text-center py-6">
                <Dumbbell className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-text-primary">Ejercicios</p>
                <p className="text-sm text-text-secondary">Catálogo</p>
              </Card>
            </Link>
            <Link href="/routines">
              <Card hoverable className="text-center py-6">
                <TrendingUp className="h-8 w-8 text-danger mx-auto mb-2" />
                <p className="font-medium text-text-primary">Rutinas</p>
                <p className="text-sm text-text-secondary">Plantillas</p>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
