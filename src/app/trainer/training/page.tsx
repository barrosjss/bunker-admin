"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTodaySessions, useTrainingSessions } from "@/hooks/useTraining";
import { useExercises } from "@/hooks/useExercises";
import { useTrainerMembers, useCurrentTrainerId } from "@/hooks/useTrainerMembers";
import { useMembers } from "@/hooks/useMembers";
import { SessionForm, SessionHistory, ExerciseSelector } from "@/components/training";
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
import { Exercise, SessionExerciseInsert } from "@/lib/types/database";

type ModalStep = "closed" | "select-exercises" | "configure-session";

export default function TrainerTrainingPage() {
  const searchParams = useSearchParams();
  const preselectedMember = searchParams.get("member");

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [modalStep, setModalStep] = useState<ModalStep>(
    preselectedMember ? "select-exercises" : "closed"
  );
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { sessions: todaySessions, loading: todayLoading } = useTodaySessions();
  const {
    sessions: dateSessions,
    loading: dateLoading,
    createSession,
  } = useTrainingSessions(selectedDate);
  const { trainerId } = useCurrentTrainerId();
  const { members: trainerMembers } = useTrainerMembers(trainerId || undefined);
  const { members: allMembers } = useMembers();
  const { exercises } = useExercises();

  // Use assigned members if available, otherwise fallback to all members
  const sessionMembers = trainerMembers.length > 0 ? trainerMembers : allMembers;

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
          trainer_id: trainerId,
          date: data.session.date,
          notes: data.session.notes || null,
        },
        data.exercises
      );
      closeModal();
    } catch (err: unknown) {
      console.error("Error creating session:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      alert("Error al guardar la sesión: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalStep("closed");
    setSelectedExercises([]);
  };

  // Stats for today
  const uniqueMembersToday = new Set(todaySessions.map((s) => s.member_id)).size;
  const totalExercisesToday = todaySessions.reduce(
    (sum, s) => sum + (s.session_exercises?.length || 0),
    0
  );

  const modalTitle =
    modalStep === "select-exercises"
      ? "Paso 1: Seleccionar ejercicios"
      : "Paso 2: Configurar sesión";

  return (
    <div>
      <Header title="Entrenamientos" showSearch={false} />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <Dumbbell className="h-6 w-6 text-success" />
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
              onClick={() => setModalStep("select-exercises")}
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
            <Badge variant="success">{displaySessions.length}</Badge>
          </CardHeader>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <SessionHistory sessions={displaySessions} showMember basePath="/trainer" />
            )}
          </div>
        </Card>
      </div>

      {/* Create session modal - 2 steps */}
      <Modal
        isOpen={modalStep !== "closed"}
        onClose={closeModal}
        title={modalTitle}
        size="xl"
      >
        {modalStep === "select-exercises" && (
          <ExerciseSelector
            exercises={exercises}
            selectedExercises={selectedExercises}
            onConfirm={(exs) => {
              setSelectedExercises(exs);
              setModalStep("configure-session");
            }}
            onCancel={closeModal}
          />
        )}

        {modalStep === "configure-session" && (
          <SessionForm
            members={sessionMembers}
            selectedExercises={selectedExercises}
            defaultMemberId={preselectedMember || undefined}
            onSubmit={handleCreateSession}
            onBack={() => setModalStep("select-exercises")}
            onCancel={closeModal}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}
