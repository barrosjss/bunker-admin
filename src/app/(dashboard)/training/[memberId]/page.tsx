"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMember } from "@/hooks/useMembers";
import { useMemberSessions } from "@/hooks/useTraining";
import { SessionHistory } from "@/components/training";
import { Header } from "@/components/layout";
import { Card, Button, Spinner, Avatar, Badge } from "@/components/ui";
import { ArrowLeft, Plus, Dumbbell, Calendar, TrendingUp } from "lucide-react";
import { getMemberStatusLabel } from "@/lib/utils/formatting";

export default function MemberTrainingHistoryPage() {
  const params = useParams();
  const memberId = params.memberId as string;

  const { member, loading: memberLoading } = useMember(memberId);
  const { sessions, loading: sessionsLoading } = useMemberSessions(memberId);

  const loading = memberLoading || sessionsLoading;

  // Calculate stats
  const totalSessions = sessions.length;
  const totalExercises = sessions.reduce(
    (sum, s) => sum + (s.session_exercises?.length || 0),
    0
  );
  const thisMonthSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    const now = new Date();
    return (
      sessionDate.getMonth() === now.getMonth() &&
      sessionDate.getFullYear() === now.getFullYear()
    );
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Miembro no encontrado.</p>
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
          href={`/members/${memberId}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver al perfil
        </Link>

        {/* Member header */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={member.photo_url}
              name={member.name}
              size="lg"
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary mb-1">
                {member.name}
              </h1>
              <Badge variant={statusVariants[member.status]}>
                {getMemberStatusLabel(member.status)}
              </Badge>
            </div>
            <Link href={`/training?member=${memberId}`}>
              <Button
                variant="primary"
                leftIcon={<Plus className="h-5 w-5" />}
              >
                Nueva sesión
              </Button>
            </Link>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total sesiones</p>
                <p className="text-2xl font-bold text-text-primary">
                  {totalSessions}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Ejercicios totales</p>
                <p className="text-2xl font-bold text-text-primary">
                  {totalExercises}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/10">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Este mes</p>
                <p className="text-2xl font-bold text-text-primary">
                  {thisMonthSessions}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sessions list */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Historial de entrenamientos
        </h2>
        <SessionHistory sessions={sessions} />
      </div>
    </div>
  );
}
