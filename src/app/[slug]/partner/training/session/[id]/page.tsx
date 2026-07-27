"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TrainingSessionWithDetails, SessionExercise } from "@/lib/supabase/types/database";
import { Header } from "@/components/layout";
import {
  Card,
  Button,
  Spinner,
  Avatar,
  Badge,
  Modal,
  ModalFooter,
  Input,
  Checkbox,
} from "@/components/ui";
import { ArrowLeft, Calendar, Trash2, Edit, RotateCcw, Flame, Target } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

export default function PartnerSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const sessionId = params.id as string;

  const [session, setSession] = useState<TrainingSessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline edit state
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<SessionExercise>>({});

  const supabase = createClient();

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("training_sessions")
      .select(`
        *,
        members (*),
        establishment_users!training_sessions_trainer_id_fkey (*),
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
      await supabase.from("session_exercises").delete().eq("session_id", sessionId);
      const { error } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
      router.push(`/${slug}/partner/training`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert("Error al eliminar: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditExercise = (ex: SessionExercise) => {
    setEditingExercise(ex.id);
    setEditValues({
      warmup_sets: ex.warmup_sets || 0,
      warmup_weight: ex.warmup_weight || "",
      warmup_reps: ex.warmup_reps || "",
      effective_sets: ex.effective_sets || 0,
      effective_reps_range: ex.effective_reps_range || "",
      effective_weight: ex.effective_weight || "",
      unit: ex.unit || "kg",
      circuit_group: ex.circuit_group || "",
      to_failure: ex.to_failure || false,
      notes: ex.notes || "",
    });
  };

  const saveExerciseEdit = async () => {
    if (!editingExercise) return;
    try {
      const { error } = await supabase
        .from("session_exercises")
        .update({
          ...editValues,
          // Sync legacy fields
          sets_completed: editValues.effective_sets,
          reps_completed: editValues.effective_reps_range,
          weight: parseFloat(editValues.effective_weight || "0") || null,
        })
        .eq("id", editingExercise);
      if (error) throw error;
      setEditingExercise(null);
      await fetchSession();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert("Error al guardar: " + msg);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert("Error al eliminar ejercicio: " + msg);
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
        <Link href={`/${slug}/partner/training`}>
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
          href={`/${slug}/partner/training`}
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
                <p className="text-xl font-bold text-text-primary">
                  {session.members?.name}
                </p>
                <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(session.date)}
                  </div>
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
              <p className="text-sm text-text-secondary italic">&quot;{session.notes}&quot;</p>
            </div>
          )}
        </Card>

        {/* Exercises */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Ejercicios realizados
        </h2>

        <div className="space-y-4">
          {session.session_exercises?.map((exercise, index) => (
            <Card key={exercise.id} padding="none" className="overflow-hidden">
              {editingExercise === exercise.id ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                     <h3 className="font-bold text-text-primary">
                      {exercise.exercises?.name || "Ejercicio"}
                    </h3>
                    <Input
                      placeholder="Grupo (A1...)"
                      className="w-24 h-8"
                      value={editValues.circuit_group || ""}
                      onChange={(e) => setEditValues({ ...editValues, circuit_group: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Calentamiento Edit */}
                    <div className="bg-surface/50 p-3 rounded-lg border border-border/50">
                      <p className="text-xs font-bold text-text-secondary uppercase mb-3">Calentamiento</p>
                      <div className="grid grid-cols-3 gap-2">
                         <Input
                          type="number"
                          label="Sets"
                          value={editValues.warmup_sets || 0}
                          onChange={(e) => setEditValues({ ...editValues, warmup_sets: Number(e.target.value) })}
                        />
                         <Input
                          label="Peso"
                          value={editValues.warmup_weight || ""}
                          onChange={(e) => setEditValues({ ...editValues, warmup_weight: e.target.value })}
                        />
                         <Input
                          label="Reps"
                          value={editValues.warmup_reps || ""}
                          onChange={(e) => setEditValues({ ...editValues, warmup_reps: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Efectivas Edit */}
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <p className="text-xs font-bold text-primary uppercase mb-3">Efectivas</p>
                      <div className="grid grid-cols-3 gap-2">
                         <Input
                          type="number"
                          label="Sets"
                          value={editValues.effective_sets || 0}
                          onChange={(e) => setEditValues({ ...editValues, effective_sets: Number(e.target.value) })}
                        />
                         <Input
                          label="Peso"
                          value={editValues.effective_weight || ""}
                          onChange={(e) => setEditValues({ ...editValues, effective_weight: e.target.value })}
                        />
                         <Input
                          label="Reps"
                          value={editValues.effective_reps_range || ""}
                          onChange={(e) => setEditValues({ ...editValues, effective_reps_range: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                         <Checkbox
                          label="Al Fallo"
                          checked={editValues.to_failure || false}
                          onChange={(e) => setEditValues({ ...editValues, to_failure: e.target.checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Input
                    placeholder="Notas..."
                    value={editValues.notes || ""}
                    onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setEditingExercise(null)}>
                      Cancelar
                    </Button>
                    <Button variant="primary" size="sm" onClick={saveExerciseEdit}>
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Header */}
                  <div className="p-4 bg-surface-elevated/30 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary">
                          {exercise.exercises?.name || "Ejercicio"}
                        </h3>
                        {exercise.circuit_group && (
                          <Badge variant="warning" size="sm" className="mt-1">
                            {exercise.circuit_group}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEditExercise(exercise)}>
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

                  {/* Body */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Calentamiento Display */}
                    {exercise.warmup_sets ? (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 bg-surface-elevated p-2 rounded-full">
                           <RotateCcw className="h-4 w-4 text-text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-secondary uppercase">Calentamiento</p>
                          <p className="text-text-primary font-medium">
                            {exercise.warmup_sets} series <span className="text-text-secondary">@</span> {exercise.warmup_weight} {exercise.unit}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {exercise.warmup_reps} reps
                          </p>
                        </div>
                      </div>
                    ) : (
                       <div className="text-sm text-text-muted italic flex items-center gap-2">
                         <RotateCcw className="h-4 w-4 opacity-30" />
                         Sin calentamiento registrado
                       </div>
                    )}

                    {/* Efectivas Display */}
                    <div className="flex items-start gap-3">
                      <div className="mt-1 bg-primary/10 p-2 rounded-full">
                         <Flame className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary uppercase">Efectivas</p>
                        <p className="text-text-primary font-bold text-lg">
                          {exercise.effective_sets} <span className="text-sm font-normal text-text-secondary">x</span> {exercise.effective_reps_range} <span className="text-sm font-normal text-text-secondary">@</span> {exercise.effective_weight} {exercise.unit}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {exercise.to_failure && (
                            <Badge variant="danger" size="sm" className="gap-1">
                              <Target className="h-3 w-3" />
                              Al Fallo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {exercise.notes && (
                    <div className="px-4 pb-4">
                      <div className="bg-surface p-3 rounded-lg border border-border/50 text-sm text-text-secondary">
                        <p className="font-semibold text-xs mb-1 uppercase opacity-50">Notas:</p>
                        {exercise.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Delete confirmation */}
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
