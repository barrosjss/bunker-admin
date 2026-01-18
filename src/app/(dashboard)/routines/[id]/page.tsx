"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRoutine } from "@/hooks/useRoutines";
import { Header } from "@/components/layout";
import { Card, Button, Spinner, Badge } from "@/components/ui";
import { ArrowLeft, Dumbbell, Clock, Hash } from "lucide-react";
import { getDifficultyLabel } from "@/lib/utils/formatting";

export default function RoutineDetailPage() {
  const params = useParams();
  const routineId = params.id as string;

  const { routine, loading, error } = useRoutine(routineId);

  const difficultyVariants: Record<string, "success" | "warning" | "danger"> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "danger",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="p-6">
        <p className="text-danger">{error || "Rutina no encontrada."}</p>
        <Link href="/routines">
          <Button variant="secondary" className="mt-4">
            Volver a rutinas
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Header title="" showSearch={false} />

      <div className="p-6">
        {/* Back button */}
        <Link
          href="/routines"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a rutinas
        </Link>

        {/* Routine header */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {routine.name}
              </h1>
              {routine.description && (
                <p className="text-text-secondary mb-4">{routine.description}</p>
              )}
              <div className="flex items-center gap-3">
                <Badge
                  variant={difficultyVariants[routine.difficulty || "beginner"]}
                >
                  {getDifficultyLabel(routine.difficulty || "beginner")}
                </Badge>
                <Badge variant="primary">
                  <Dumbbell className="h-4 w-4 mr-1" />
                  {routine.routine_template_exercises?.length || 0} ejercicios
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Exercises list */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Ejercicios de la rutina
        </h2>

        <div className="space-y-4">
          {routine.routine_template_exercises?.map((exercise, index) => (
            <Card key={exercise.id}>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary font-bold text-lg">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary text-lg mb-2">
                    {exercise.exercises?.name || "Ejercicio"}
                  </h3>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm bg-surface-elevated px-3 py-1.5 rounded-lg">
                      <Hash className="h-4 w-4 text-text-secondary" />
                      <span className="text-text-primary">
                        {exercise.sets} series x {exercise.reps} reps
                      </span>
                    </div>

                    {exercise.rest_seconds && (
                      <div className="flex items-center gap-2 text-sm bg-surface-elevated px-3 py-1.5 rounded-lg">
                        <Clock className="h-4 w-4 text-text-secondary" />
                        <span className="text-text-primary">
                          {exercise.rest_seconds}s descanso
                        </span>
                      </div>
                    )}
                  </div>

                  {exercise.notes && (
                    <p className="mt-3 text-sm text-text-secondary">
                      {exercise.notes}
                    </p>
                  )}

                  {exercise.exercises?.muscle_group && (
                    <Badge variant="default" size="sm" className="mt-3">
                      {exercise.exercises.muscle_group}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
