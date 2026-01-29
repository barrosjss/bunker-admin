"use client";

import Link from "next/link";
import { useMembers } from "@/hooks/useMembers";
import { useTodaySessions } from "@/hooks/useTraining";
import { useExercises } from "@/hooks/useExercises";
import { useRoutines } from "@/hooks/useRoutines";
import { StatsCard } from "@/components/dashboard";
import { Header } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import {
  Users,
  Dumbbell,
  ClipboardList,
  BookOpen,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TrainerDashboardPage() {
  const { members } = useMembers();
  const { sessions: todaySessions } = useTodaySessions();
  const { exercises } = useExercises();
  const { routines } = useRoutines();

  // Calculate stats
  const activeMembers = members.filter((m) => m.status === "active").length;
  const uniqueMembersToday = new Set(todaySessions.map((s) => s.member_id)).size;

  // Today's date
  const today = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <div>
      <Header title="Panel Entrenador" showSearch={false} />

      <div className="p-6">
        {/* Welcome message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Bienvenido al Panel de Entrenador
          </h1>
          <p className="text-text-secondary capitalize">{today}</p>
        </div>

        {/* Quick action */}
        <div className="mb-6">
          <Link href="/trainer/training">
            <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
              Nueva sesión de entrenamiento
            </Button>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Sesiones hoy"
            value={todaySessions.length}
            icon={Dumbbell}
            variant="success"
          />
          <StatsCard
            title="Miembros atendidos hoy"
            value={uniqueMembersToday}
            icon={Users}
            variant="success"
          />
          <StatsCard
            title="Ejercicios disponibles"
            value={exercises.length}
            icon={ClipboardList}
            variant="default"
          />
          <StatsCard
            title="Rutinas disponibles"
            value={routines.length}
            icon={BookOpen}
            variant="default"
          />
        </div>

        {/* Today's sessions */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Sesiones de hoy
            </h2>
            <Link href="/trainer/training">
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary mb-4">
                No hay sesiones registradas hoy
              </p>
              <Link href="/trainer/training">
                <Button variant="primary" size="sm">
                  Crear primera sesión
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {todaySessions.slice(0, 5).map((session) => (
                <Link
                  key={session.id}
                  href={`/trainer/training/session/${session.id}`}
                  className="flex items-center gap-4 py-4 hover:bg-surface-elevated transition-colors -mx-4 px-4"
                >
                  <div className="p-2 rounded-lg bg-success/10">
                    <Dumbbell className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary">
                      {session.members?.name}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {session.session_exercises?.length || 0} ejercicios
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Quick links */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Acceso rápido
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/trainer/training">
              <Card hoverable className="text-center py-6">
                <Dumbbell className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-text-primary">Entrenamientos</p>
                <p className="text-sm text-text-secondary">Gestionar sesiones</p>
              </Card>
            </Link>
            <Link href="/trainer/members">
              <Card hoverable className="text-center py-6">
                <Users className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-text-primary">Miembros</p>
                <p className="text-sm text-text-secondary">{activeMembers} activos</p>
              </Card>
            </Link>
            <Link href="/trainer/exercises">
              <Card hoverable className="text-center py-6">
                <ClipboardList className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-text-primary">Ejercicios</p>
                <p className="text-sm text-text-secondary">{exercises.length} disponibles</p>
              </Card>
            </Link>
            <Link href="/trainer/routines">
              <Card hoverable className="text-center py-6">
                <BookOpen className="h-8 w-8 text-success mx-auto mb-2" />
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
