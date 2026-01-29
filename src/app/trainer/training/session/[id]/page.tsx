"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TrainingSessionWithDetails } from "@/lib/types/database";
import { Header } from "@/components/layout";
import {
  Card,
  Button,
  Spinner,
  Avatar,
  Badge,
  Modal,
  ModalFooter,
} from "@/components/ui";
import { ArrowLeft, Calendar, User, Dumbbell, Weight, Trash2, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

export default function TrainerSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TrainingSessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline edit state
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    sets_completed: number;
    reps_completed: string;
    weight: number;
    notes: string;
  }>({ sets_completed: 0, reps_completed: "", weight: 0, notes: "" });

  const supabase = createClient();

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("training_sessions")
      .select(`
        *,
        members (*),
        staff (*),
        session_exercises (
          *,
          exercises (*)
        )
      `)
      .eq("id", sessionId)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const sessionData = data as TrainingSessionWithDetails;

    if (sessionData.session_exercises) {
      sessionData.session_exercises.sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      );
    }

    setSession(sessionData);
    setLoading(false);
  }, [sessionId, supabase]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleDeleteSession = async () => {
    setIsSubmitting(true);
    try {
      // Delete session exercises first
      await supabase
        .from("session_exercises")
        .delete()
        .eq("session_id", sessionId);

      // Delete the session
      const { error } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
      router.push("/trainer/training");
    } catch (err: any) {
      alert("Error al eliminar: " + (err?.message || "Error desconocido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditExercise = (ex: any) => {
    setEditingExercise(ex.id);
    setEditValues({
      sets_completed: ex.sets_completed || 0,
      reps_completed: ex.reps_completed || "",
      weight: ex.weight || 0,
      notes: ex.notes || "",
    });
  };

  const saveExerciseEdit = async () => {
    if (!editingExercise) return;
    try {
      const { error } = await supabase
        .from("session_exercises")
        .update({
          sets_completed: editValues.sets_completed,
          reps_completed: editValues.reps_completed,
          weight: editValues.weight || null,
          notes: editValues.notes || null,
        })
        .eq("id", editingExercise);

      if (error) throw error;
      setEditingExercise(null);
      await fetchSession();
    } catch (err: any) {
      alert("Error al guardar: " + (err?.message || "Error desconocido"));
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from("session_exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;
      await fetchSession();
    } catch (err: any) {
      alert("Error al eliminar ejercicio: " + (err?.message || "Error desconocido"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <p className="text-danger">{error || "Sesión no encontrada."}</p>
        <Link href="/trainer/training">
          <Button variant="secondary" className="mt-4">
            Volver a entrenamientos
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
          href="/trainer/training"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a entrenamientos
        </Link>

        {/* Session header */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Avatar
                src={session.members?.photo_url}
                name={session.members?.name || ""}
                size="lg"
              />
              <div>
                <Link
                  href={`/trainer/members/${session.member_id}`}
                  className="text-xl font-bold text-text-primary hover:text-success transition-colors"
                >
                  {session.members?.name}
                </Link>
                <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(session.date)}
                  </div>
                  {session.staff && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {session.staff.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success" className="text-lg px-4 py-2">
                {session.session_exercises?.length || 0} ejercicios
              </Badge>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleting(true)}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Eliminar
              </Button>
            </div>
          </div>

          {session.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-text-secondary">{session.notes}</p>
            </div>
          )}
        </Card>

        {/* Exercises */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Ejercicios realizados
        </h2>

        <div className="space-y-4">
          {session.session_exercises?.map((exercise, index) => (
            <Card key={exercise.id}>
              {editingExercise === exercise.id ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-text-primary">
                    {exercise.exercises?.name || "Ejercicio"}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-text-secondary">Series</label>
                      <input
                        type="number"
                        className="w-full mt-1 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary"
                        value={editValues.sets_completed}
                        onChange={(e) =>
                          setEditValues({ ...editValues, sets_completed: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary">Reps</label>
                      <input
                        className="w-full mt-1 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary"
                        value={editValues.reps_completed}
                        onChange={(e) =>
                          setEditValues({ ...editValues, reps_completed: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        className="w-full mt-1 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary"
                        value={editValues.weight}
                        onChange={(e) =>
                          setEditValues({ ...editValues, weight: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <input
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary"
                    placeholder="Notas..."
                    value={editValues.notes}
                    onChange={(e) =>
                      setEditValues({ ...editValues, notes: e.target.value })
                    }
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={saveExerciseEdit}>
                      Guardar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingExercise(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-success/10 text-success font-bold shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-2">
                      {exercise.exercises?.name || "Ejercicio"}
                    </h3>

                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Dumbbell className="h-4 w-4 text-text-secondary" />
                        <span className="text-text-primary">
                          {exercise.sets_completed} series x {exercise.reps_completed} reps
                        </span>
                      </div>

                      {exercise.weight && exercise.weight > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Weight className="h-4 w-4 text-text-secondary" />
                          <span className="text-text-primary">
                            {exercise.weight} kg
                          </span>
                        </div>
                      )}
                    </div>

                    {exercise.notes && (
                      <p className="mt-2 text-sm text-text-secondary">
                        {exercise.notes}
                      </p>
                    )}

                    {exercise.exercises?.muscle_group && (
                      <Badge variant="default" size="sm" className="mt-2">
                        {exercise.exercises.muscle_group}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditExercise(exercise)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger hover:bg-danger/10"
                      onClick={() => handleDeleteExercise(exercise.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Delete session confirmation */}
      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Eliminar sesión"
        size="sm"
      >
        <p className="text-text-secondary mb-4">
          ¿Estás seguro de que deseas eliminar esta sesión? Se eliminarán todos
          los ejercicios registrados. Esta acción no se puede deshacer.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDeleting(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSession}
            isLoading={isSubmitting}
          >
            Eliminar sesión
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
