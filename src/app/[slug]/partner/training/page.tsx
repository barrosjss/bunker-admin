"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePartnerMemberId } from "@/hooks/usePartner";
import { useMemberSessions, useTrainingSessions } from "@/hooks/useTraining";
import { useExercises } from "@/hooks/useExercises";
import { SessionForm, SessionHistory, ExerciseSelector } from "@/components/training";
import { Header } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Modal,
  Spinner,
  Badge,
  Select,
} from "@/components/ui";
import { Plus, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { Exercise, SessionExerciseInsert, TrainingSessionInsert } from "@/lib/supabase/types/database";
import { createClient } from "@/lib/supabase/client";

type ModalStep = "closed" | "select-exercises" | "configure-session";
type ViewMode = "daily" | "weekly" | "monthly";

export default function PartnerTrainingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { memberId, loading: loadingProfile } = usePartnerMemberId();

  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalStep, setModalStep] = useState<ModalStep>("closed");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // Derived Date Ranges
  const getDateRange = () => {
    switch (viewMode) {
      case "daily":
        return {
          start: format(currentDate, "yyyy-MM-dd"),
          end: format(currentDate, "yyyy-MM-dd"),
        };
      case "weekly":
        return {
          start: format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          end: format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "monthly":
        return {
          start: format(startOfMonth(currentDate), "yyyy-MM-dd"),
          end: format(endOfMonth(currentDate), "yyyy-MM-dd"),
        };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Usar useMemberSessions para filtrar solo las sesiones del partner
  const { sessions: allMemberSessions, loading: loadingSessions, refetch } = useMemberSessions(
    memberId || ""
  );

  // Filtrar por rango de fecha en cliente
  const filteredSessions = allMemberSessions.filter(
    (s) => s.date >= startDate && s.date <= endDate
  );

  const { exercises } = useExercises();

  // Navigation Handlers
  const handlePrev = () => {
    switch (viewMode) {
      case "daily": setCurrentDate(subDays(currentDate, 1)); break;
      case "weekly": setCurrentDate(subWeeks(currentDate, 1)); break;
      case "monthly": setCurrentDate(subMonths(currentDate, 1)); break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case "daily": setCurrentDate(addDays(currentDate, 1)); break;
      case "weekly": setCurrentDate(addWeeks(currentDate, 1)); break;
      case "monthly": setCurrentDate(addMonths(currentDate, 1)); break;
    }
  };

  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const handleDateContainerClick = () => {
    try {
      if (dateInputRef.current) {
        if (typeof dateInputRef.current.showPicker === "function") {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
        }
      }
    } catch (error) {
      console.error("Error opening date picker:", error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCurrentDate(new Date(e.target.value + "T12:00:00"));
    }
  };

  const handleCreateSession = async (data: {
    session: { member_id: string; date: string; notes?: string };
    exercises: SessionExerciseInsert[];
  }) => {
    if (!memberId) return;
    setIsSubmitting(true);
    try {
      // Obtener el establishment_id del partner
      const { data: { user } } = await supabase.auth.getUser();
      const { data: eu } = await supabase
        .from("establishment_users")
        .select("establishment_id")
        .eq("user_id", user!.id)
        .single();

      if (!eu) throw new Error("No se encontró el establecimiento");

      // Crear la sesión vinculada al member_id del partner
      const sessionData: TrainingSessionInsert = {
        establishment_id: eu.establishment_id,
        member_id: memberId,
        date: data.session.date,
        notes: data.session.notes || null,
      };

      const { data: session, error: sessionError } = await supabase
        .from("training_sessions")
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (data.exercises.length > 0) {
        const exercisesWithSession = data.exercises.map((ex) => ({
          ...ex,
          session_id: session.id,
        }));
        const { error: exError } = await supabase
          .from("session_exercises")
          .insert(exercisesWithSession);
        if (exError) throw exError;
      }

      await refetch();
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert("Error al guardar la sesión: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalStep("closed");
    setSelectedExercises([]);
  };

  const formatDateRange = () => {
    if (viewMode === "daily") {
      return format(currentDate, "d MMM yyyy", { locale: es });
    }
    const start = new Date(startDate + "T12:00:00");
    const end = new Date(endDate + "T12:00:00");
    if (viewMode === "monthly") {
      return format(start, "MMMM yyyy", { locale: es });
    }
    return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM", { locale: es })}`;
  };

  // El partner siempre es el member — no necesita selector de miembro
  const partnerAsMember = memberId ? [{ id: memberId, name: "Yo" }] : [];

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header title="Mis Entrenamientos" showSearch={false} />

      <div className="p-6">

        {/* Filters & Actions Bar */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6 justify-between items-stretch xl:items-center">

          {/* View Mode & Date Nav */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="w-full">
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                options={[
                  { value: "daily", label: "Diario" },
                  { value: "weekly", label: "Semanal" },
                  { value: "monthly", label: "Mensual" },
                ]}
              />
            </div>

            <div className="flex items-center justify-between bg-surface-elevated border border-border rounded-lg px-1 h-[46px] w-full">
              <button onClick={handlePrev} className="p-2 z-10 text-text-secondary hover:text-text-primary transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div
                className="flex-1 flex items-center justify-center gap-2 relative h-full cursor-pointer group"
                onClick={handleDateContainerClick}
              >
                <span className="text-sm font-medium capitalize truncate select-none">
                  {formatDateRange()}
                </span>
                <Calendar className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors" />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={format(currentDate, "yyyy-MM-dd")}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                  onChange={handleDateChange}
                />
              </div>

              <button onClick={handleNext} className="p-2 z-10 text-text-secondary hover:text-text-primary transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* New Session Button */}
          <Button
            variant="primary"
            onClick={() => setModalStep("select-exercises")}
            leftIcon={<Plus className="h-5 w-5" />}
            className="h-[46px]"
          >
            Nueva sesión
          </Button>
        </div>

        {/* Sessions list */}
        <Card padding="none">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <CardTitle>Mis sesiones</CardTitle>
            <Badge variant="success">{filteredSessions.length}</Badge>
          </CardHeader>

          <div className="p-4">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <SessionHistory
                sessions={filteredSessions}
                showMember={false}
                basePath={`/${slug}/partner`}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Create session modal */}
      <Modal
        isOpen={modalStep !== "closed"}
        onClose={closeModal}
        title={
          modalStep === "select-exercises"
            ? "Paso 1: Seleccionar ejercicios"
            : "Paso 2: Configurar sesión"
        }
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
            members={partnerAsMember as Parameters<typeof SessionForm>[0]["members"]}
            selectedExercises={selectedExercises}
            defaultMemberId={memberId || undefined}
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
