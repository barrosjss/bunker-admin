"use client";

import React, { useState } from "react";
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
import { Exercise, SessionExerciseInsert } from "@/lib/types/database";

type ModalStep = "closed" | "select-exercises" | "configure-session";
type ViewMode = "daily" | "weekly" | "monthly";

export default function TrainerTrainingPage() {
  const searchParams = useSearchParams();
  const preselectedMember = searchParams.get("member");

  // Filter State
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

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

  const [modalStep, setModalStep] = useState<ModalStep>(
    preselectedMember ? "select-exercises" : "closed"
  );
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    refetch: refetchToday,
  } = useTodaySessions();
  
  const {
    sessions: filteredSessionsRaw,
    loading,
    createSession,
  } = useTrainingSessions({ startDate, endDate });

  const { trainerId } = useCurrentTrainerId();
  const { members: trainerMembers } = useTrainerMembers(trainerId || undefined);
  const { members: allMembers } = useMembers();
  const { exercises } = useExercises();

  // Use assigned members if available, otherwise fallback to all members
  const sessionMembers = trainerMembers.length > 0 ? trainerMembers : allMembers;
  const isToday = format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  // Client-side filtering by Member Name
  const filteredSessions = filteredSessionsRaw.filter((session) => {
    if (!searchQuery) return true;
    return session.member_id === searchQuery;
  });

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
            // Fallback for older browsers: focus might help, or just rely on native click if valid
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

      // Si la fecha seleccionada es hoy, recargar las sesiones de hoy
      if (isToday) {
        await refetchToday();
      }

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

  const modalTitle =
    modalStep === "select-exercises"
      ? "Paso 1: Seleccionar ejercicios"
      : "Paso 2: Configurar sesión";

  // Formatter for Display Date Range
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

  return (
    <div>
      <Header title="Entrenamientos" showSearch={false} />

      <div className="p-6">

        {/* Filters & Actions Bar */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6 justify-between items-stretch xl:items-center">
            
            {/* View Mode & Date Nav - Same Row */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                {/* View Mode */}
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

                {/* Date Navigation */}
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
                        
                        {/* Hidden input - pointer-events-none so click goes to parent div */}
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

            {/* Member Filter & New Session */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center w-full md:w-auto">
                <div className="w-full md:w-64">
                    <Select
                        placeholder="Filtrar por miembro"
                        options={[
                          { value: "", label: "Todos los miembros" },
                          ...allMembers.map((m) => ({ value: m.id, label: m.name })),
                        ]}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Button
                    variant="primary"
                    onClick={() => setModalStep("select-exercises")}
                    leftIcon={<Plus className="h-5 w-5" />}
                    className="h-[46px]"
                >
                    Nueva sesión
                </Button>
            </div>
        </div>

        {/* Sessions list */}
        <Card padding="none">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <CardTitle>
              {viewMode === "daily" && isToday ? "Sesiones de hoy" : "Sesiones"}
            </CardTitle>
            <Badge variant="success">{filteredSessions.length}</Badge>
          </CardHeader>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <SessionHistory sessions={filteredSessions} showMember basePath="/trainer" />
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
