"use client";

import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  Checkbox,
} from "@/components/ui";
import { ChevronLeft, Trash2, Dumbbell, Flame, RotateCcw } from "lucide-react";
import { Member, Exercise, SessionExerciseInsert } from "@/lib/supabase/types/database";

const exerciseSchema = z.object({
  exercise_id: z.string().min(1),
  exercise_name: z.string(),
  // Warmup
  warmup_sets: z.coerce.number().default(0),
  warmup_weight: z.string().optional(),
  warmup_reps: z.string().optional(),
  // Effective
  effective_sets: z.coerce.number().min(1, "Min 1"),
  effective_reps_range: z.string().min(1, "Requerido"),
  effective_weight: z.string().min(1, "Requerido"),
  unit: z.string().default("kg"),
  circuit_group: z.string().optional(),
  to_failure: z.boolean().default(false),
  notes: z.string().optional(),
});

const sessionSchema = z.object({
  member_id: z.string().min(1, "Selecciona un miembro"),
  date: z.string().min(1, "Selecciona una fecha"),
  notes: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, "Agrega al menos un ejercicio"),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  members: Member[];
  selectedExercises: Exercise[];
  defaultMemberId?: string;
  onSubmit: (data: {
    session: { member_id: string; date: string; notes?: string };
    exercises: SessionExerciseInsert[];
  }) => Promise<void>;
  onBack: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  getLastStats?: (exerciseId: string) => Promise<{
    last_weight: string;
    last_unit: string;
    last_effective_reps: string;
  } | null>;
}

export function SessionForm({
  members,
  selectedExercises,
  defaultMemberId,
  onSubmit,
  onBack,
  onCancel,
  isLoading,
  getLastStats,
}: SessionFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema) as Resolver<SessionFormData>,
    defaultValues: {
      member_id: defaultMemberId || "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      exercises: selectedExercises.map((ex) => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        warmup_sets: 0,
        warmup_weight: "",
        warmup_reps: "",
        effective_sets: 3,
        effective_reps_range: "10",
        effective_weight: "0",
        unit: "kg",
        circuit_group: "",
        to_failure: false,
        notes: "",
      })),
    },
  });

  // Fetch last stats on mount
  useEffect(() => {
    if (!getLastStats) return;

    selectedExercises.forEach(async (ex, index) => {
      const stats = await getLastStats(ex.id);
      if (stats) {
        setValue(`exercises.${index}.effective_weight`, stats.last_weight);
        setValue(`exercises.${index}.unit`, stats.last_unit);
        setValue(`exercises.${index}.effective_reps_range`, stats.last_effective_reps);
      }
    });
  }, [getLastStats, selectedExercises, setValue]);

  const { fields, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  const handleFormSubmit = async (data: SessionFormData) => {
    const sessionExercises: SessionExerciseInsert[] = data.exercises.map(
      (ex, index) => ({
        session_id: "", // Will be filled by parent
        exercise_id: ex.exercise_id,
        warmup_sets: ex.warmup_sets,
        warmup_weight: ex.warmup_weight || null,
        warmup_reps: ex.warmup_reps || null,
        effective_sets: ex.effective_sets,
        effective_reps_range: ex.effective_reps_range,
        effective_weight: ex.effective_weight,
        unit: ex.unit,
        circuit_group: ex.circuit_group || null,
        to_failure: ex.to_failure,
        notes: ex.notes || null,
        order_index: index,
        // Legacy compatibility
        sets_completed: ex.effective_sets,
        reps_completed: ex.effective_reps_range,
        weight: parseFloat(ex.effective_weight) || null,
      })
    );

    await onSubmit({
      session: {
        member_id: data.member_id,
        date: data.date,
        notes: data.notes,
      },
      exercises: sessionExercises,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Miembro *"
          placeholder="Selecciona un miembro"
          options={members.map((m) => ({ value: m.id, label: m.name }))}
          error={errors.member_id?.message}
          {...register("member_id")}
        />

        <Input
          type="date"
          label="Fecha *"
          error={errors.date?.message}
          {...register("date")}
        />
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Ejercicios ({fields.length})
          </h3>
        </div>

        {errors.exercises?.message && (
          <p className="text-sm text-danger">{errors.exercises.message}</p>
        )}

        <div className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} variant="elevated" padding="none" className="overflow-hidden border-l-4 border-l-primary">
              <div className="p-4 bg-surface-elevated/50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-bold text-text-primary">
                    {field.exercise_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                   <Input
                    placeholder="Grupo (A1, B1...)"
                    className="w-24 h-8 text-xs"
                    {...register(`exercises.${index}.circuit_group`)}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-danger hover:text-danger hover:bg-danger/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <input type="hidden" {...register(`exercises.${index}.exercise_id`)} />
                <input type="hidden" {...register(`exercises.${index}.exercise_name`)} />

                {/* Calentamiento */}
                <div className="bg-surface/50 p-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <RotateCcw className="h-3 w-3" />
                    Calentamiento
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      label="Series"
                      placeholder="0"
                      {...register(`exercises.${index}.warmup_sets`)}
                    />
                    <Input
                      label="Peso"
                      placeholder="Poco"
                      {...register(`exercises.${index}.warmup_weight`)}
                    />
                    <Input
                      label="Reps"
                      placeholder="15-20"
                      {...register(`exercises.${index}.warmup_reps`)}
                    />
                  </div>
                </div>

                {/* Efectivas */}
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-primary uppercase tracking-wider">
                    <Flame className="h-3 w-3" />
                    Series Efectivas
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      label="Series *"
                      placeholder="3"
                      error={errors.exercises?.[index]?.effective_sets?.message}
                      {...register(`exercises.${index}.effective_sets`)}
                    />
                    <Input
                      label="Peso *"
                      placeholder="100"
                      error={errors.exercises?.[index]?.effective_weight?.message}
                      {...register(`exercises.${index}.effective_weight`)}
                    />
                    <Input
                      label="Reps/Rango *"
                      placeholder="10-12"
                      error={errors.exercises?.[index]?.effective_reps_range?.message}
                      {...register(`exercises.${index}.effective_reps_range`)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                      <Select
                        className="w-24"
                        options={[
                          { value: "kg", label: "kg" },
                          { value: "placas", label: "placas" },
                          { value: "lbs", label: "lbs" },
                        ]}
                        {...register(`exercises.${index}.unit`)}
                      />
                      <Checkbox
                        label="Al Fallo"
                        {...register(`exercises.${index}.to_failure`)}
                      />
                    </div>
                  </div>
                </div>

                <Input
                  placeholder="Notas adicionales..."
                  {...register(`exercises.${index}.notes`)}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Textarea
        label="Notas generales de la sesión"
        placeholder="¿Cómo te sentiste hoy?..."
        {...register("notes")}
      />

      <div className="flex justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Volver a ejercicios
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Guardar sesión
          </Button>
        </div>
      </div>
    </form>
  );
}
