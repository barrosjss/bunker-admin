"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTodaySessions, useTrainingSessions } from "@/hooks/useTraining";
import { useMembers } from "@/hooks/useMembers";
import { useExercises } from "@/hooks/useExercises";
import { SessionForm, SessionHistory } from "@/components/training";
import { Header } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Modal,
  Spinner,
  Badge,
} from "@/components/ui";
import { Plus, Calendar, Dumbbell, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SessionExerciseInsert } from "@/lib/types/database";

export default function TrainingPage() {
  const searchParams = useSearchParams();
  const preselectedMember = searchParams.get("member");

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isCreating, setIsCreating] = useState(!!preselectedMember);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { sessions: todaySessions, loading: todayLoading } = useTodaySessions();
  const {
    sessions: dateSessions,
    loading: dateLoading,
    createSession,
  } = useTrainingSessions(selectedDate);
  const { members } = useMembers();
  const { exercises } = useExercises();

  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
  const displaySessions = isToday ? todaySessions : dateSessions;
  const loading = isToday ? todayLoading : dateLoading;

  const handleCreateSession = async (data: {
    session: { member_id: string; date: string; notes?: string };
    exercises: SessionExerciseInsert[];
  }) => {
    setIsSubmitting(true);
    try {
      await createSession(
        {
          member_id: data.session.member_id,
          date: data.session.date,
          notes: data.session.notes || null,
        },
        data.exercises
      );
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating session:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats for today
  const uniqueMembersToday = new Set(todaySessions.map((s) => s.member_id)).size;
  const totalExercisesToday = todaySessions.reduce(
    (sum, s) => sum + (s.session_exercises?.length || 0),
    0
  );

  return (
    <div>
      <Header title="Entrenamientos" showSearch={false} />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Sesiones hoy</p>
                <p className="text-2xl font-bold text-text-primary">
                  {todaySessions.length}
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
                <p className="text-sm text-text-secondary">Miembros activos</p>
                <p className="text-2xl font-bold text-text-primary">
                  {uniqueMembersToday}
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
                <p className="text-sm text-text-secondary">Ejercicios hoy</p>
                <p className="text-2xl font-bold text-text-primary">
                  {totalExercisesToday}
                </p>
              </div>
            </div>
          </Card>

          <Card className="flex items-center justify-center">
            <Button
              variant="primary"
              onClick={() => setIsCreating(true)}
              leftIcon={<Plus className="h-5 w-5" />}
              className="w-full"
            >
              Nueva sesión
            </Button>
          </Card>
        </div>

        {/* Date selector */}
        <div className="flex items-center gap-4 mb-6">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          />
          {!isToday && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
            >
              Ir a hoy
            </Button>
          )}
          <div className="flex-1" />
          <Badge variant={isToday ? "success" : "default"}>
            {format(new Date(selectedDate + "T12:00:00"), "EEEE, d MMMM yyyy", {
              locale: es,
            })}
          </Badge>
        </div>

        {/* Sessions list */}
        <Card padding="none">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle>
              {isToday ? "Sesiones de hoy" : "Sesiones del día"}
            </CardTitle>
            <Badge variant="primary">{displaySessions.length}</Badge>
          </CardHeader>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <SessionHistory sessions={displaySessions} showMember />
            )}
          </div>
        </Card>
      </div>

      {/* Create session modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Nueva sesión de entrenamiento"
        size="xl"
      >
        <SessionForm
          members={members}
          exercises={exercises}
          defaultMemberId={preselectedMember || undefined}
          onSubmit={handleCreateSession}
          onCancel={() => setIsCreating(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}
