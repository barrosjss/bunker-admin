"use client";

import { useState } from "react";
import { usePartnerMemberId } from "@/hooks/usePartner";
import { usePartnerRoutinePlans, RoutinePlan, PlanDay, PlanExercise } from "@/hooks/useRoutines";
import { Header } from "@/components/layout";
import { Button, Spinner, Modal, ModalFooter, Input, Badge } from "@/components/ui";
import { Plus, ChevronRight, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function ExerciseRow({
  ex,
  onSave,
}: {
  ex: PlanExercise;
  onSave: (id: string, field: "sets" | "reps" | "notes", value: string) => Promise<void>;
}) {
  const [sets, setSets] = useState(String(ex.sets ?? ""));
  const [reps, setReps] = useState(ex.reps ?? "");
  const [notes, setNotes] = useState(ex.notes ?? "");

  const save = (field: "sets" | "reps" | "notes", value: string) => {
    onSave(ex.id, field, value);
  };

  return (
    <div className="grid grid-cols-[1fr_60px_80px] gap-2 items-start py-2 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-text-primary">{ex.exercises?.name ?? "Ejercicio"}</p>
        {ex.exercises?.muscle_group && (
          <p className="text-xs text-text-secondary">{ex.exercises.muscle_group}</p>
        )}
        <input
          className="mt-1 w-full text-xs bg-surface-elevated border border-border rounded px-2 py-1 text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-primary"
          placeholder="Notas..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => save("notes", notes)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-text-muted text-center">Series</span>
        <input
          className="w-full text-sm text-center bg-surface-elevated border border-border rounded px-1 py-1 text-text-primary focus:outline-none focus:border-primary"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          onBlur={() => save("sets", sets)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-text-muted text-center">Reps</span>
        <input
          className="w-full text-sm text-center bg-surface-elevated border border-border rounded px-1 py-1 text-text-primary focus:outline-none focus:border-primary"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => save("reps", reps)}
        />
      </div>
    </div>
  );
}

function DaySection({
  day,
  onSaveExercise,
}: {
  day: PlanDay;
  onSaveExercise: (id: string, field: "sets" | "reps" | "notes", value: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);
  const sorted = [...day.routine_template_exercises].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-elevated hover:bg-surface-elevated/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary text-sm">{day.name}</span>
          <Badge variant="default" size="sm">{day.routine_template_exercises.length} ejercicios</Badge>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
      </button>

      {open && (
        <div className="px-4 py-2">
          {sorted.map((ex) => (
            <ExerciseRow key={ex.id} ex={ex} onSave={onSaveExercise} />
          ))}
          {sorted.length === 0 && (
            <p className="text-sm text-text-muted py-3 text-center">Sin ejercicios</p>
          )}
        </div>
      )}
    </div>
  );
}

interface DetailModalProps {
  plan: RoutinePlan;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

function DetailModal({ plan, isOpen, onClose, onUpdate }: DetailModalProps) {
  const supabase = createClient();
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [saving, setSaving] = useState(false);

  const savePlanField = async (field: "name" | "description", value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("routine_plans").update({ [field]: value }).eq("id", plan.id);
    onUpdate();
  };

  const saveExercise = async (id: string, field: "sets" | "reps" | "notes", value: string) => {
    const update: Record<string, string | number | null> =
      field === "sets" ? { sets: value === "" ? null : Number(value) } : { [field]: value || null };
    await supabase.from("routine_template_exercises").update(update).eq("id", id);
  };

  const deletePlan = async () => {
    if (!confirm(`¿Eliminar la rutina "${plan.name}"? Se eliminarán todos los días y ejercicios.`)) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("routine_plans").delete().eq("id", plan.id);
    onUpdate();
    onClose();
    setSaving(false);
  };

  const sortedDays = [...plan.routine_templates].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const totalExercises = plan.routine_templates.reduce(
    (acc, d) => acc + d.routine_template_exercises.length, 0
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de rutina" size="xl">
      <div className="space-y-5">
        {/* Plan name */}
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase mb-1 block">Nombre</label>
          <input
            className="w-full text-lg font-bold bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => savePlanField("name", name)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase mb-1 block">Descripción</label>
          <textarea
            className="w-full text-sm bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
            rows={2}
            placeholder="Describe el objetivo o enfoque de esta rutina..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => savePlanField("description", description)}
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-text-secondary">
          <span><strong className="text-text-primary">{sortedDays.length}</strong> días</span>
          <span><strong className="text-text-primary">{totalExercises}</strong> ejercicios totales</span>
        </div>

        {/* Days */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {sortedDays.map((day) => (
            <DaySection key={day.id} day={day} onSaveExercise={saveExercise} />
          ))}
        </div>
      </div>

      <ModalFooter>
        <Button variant="danger" isLoading={saving} onClick={deletePlan}>
          Eliminar rutina
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Create Modal ──────────────────────────────────────────────────────────────

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  establishmentId: string;
  createdBy: string;
  onCreated: () => void;
}

function CreateModal({ isOpen, onClose, memberId, establishmentId, createdBy, onCreated }: CreateModalProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) { setError("El nombre es requerido"); return; }
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from("routine_plans").insert({
      establishment_id: establishmentId,
      member_id: memberId,
      created_by: createdBy,
      name: name.trim(),
      description: description.trim() || null,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setName("");
    setDescription("");
    onCreated();
    onClose();
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Rutina">
      <div className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Ej: Rutina Hipertrofia, Full Body..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <label className="text-sm font-medium text-text-primary mb-1 block">Descripción</label>
          <textarea
            className="w-full text-sm bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
            rows={3}
            placeholder="Objetivo, duración, enfoque..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button isLoading={loading} onClick={handleCreate}>Crear rutina</Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PartnerRoutinesPage() {
  const { memberId, partnerEuId, loading: loadingProfile } = usePartnerMemberId();
  const { plans, loading: loadingPlans, refetch } = usePartnerRoutinePlans(memberId ?? "");

  const [selectedPlan, setSelectedPlan] = useState<RoutinePlan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [estId, setEstId] = useState<string>("");

  const supabase = createClient();

  // Fetch establishment_id once
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("establishment_users")
        .select("establishment_id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => { if (data) setEstId(data.establishment_id); });
    });
  });

  if (loadingProfile || (loadingPlans && plans.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header title="Mis Rutinas" showSearch={false} />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <p className="text-text-secondary text-sm">
            Tus rutinas de entrenamiento. Toca una para ver y editar el detalle.
          </p>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Rutina
          </Button>
        </div>

        {plans.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center bg-surface-elevated/50 rounded-xl border-2 border-dashed border-border">
            <ClipboardList className="h-12 w-12 text-text-muted mb-4" />
            <p className="text-text-secondary font-medium">No tienes rutinas guardadas</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCreateOpen(true)}>
              Crear mi primera rutina
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const totalDays = plan.routine_templates.length;
              const totalEx = plan.routine_templates.reduce(
                (acc, d) => acc + d.routine_template_exercises.length, 0
              );
              const preview = plan.routine_templates
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, 3);

              return (
                <div
                  key={plan.id}
                  className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div>
                    <h3 className="font-bold text-text-primary">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{plan.description}</p>
                    )}
                  </div>

                  <div className="flex gap-3 text-xs text-text-secondary">
                    <span><strong className="text-text-primary">{totalDays}</strong> días</span>
                    <span><strong className="text-text-primary">{totalEx}</strong> ejercicios</span>
                  </div>

                  <div className="space-y-1">
                    {preview.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-xs text-text-secondary">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="truncate">{d.name}</span>
                      </div>
                    ))}
                    {totalDays > 3 && (
                      <p className="text-xs text-text-muted italic pl-3.5">+ {totalDays - 3} días más</p>
                    )}
                  </div>

                  <button className="mt-auto flex items-center justify-center gap-1 text-sm text-primary font-medium hover:underline">
                    Ver detalle <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlan && (
        <DetailModal
          plan={selectedPlan}
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onUpdate={() => {
            refetch();
            setSelectedPlan(null);
          }}
        />
      )}

      <CreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        memberId={memberId ?? ""}
        establishmentId={estId}
        createdBy={partnerEuId ?? ""}
        onCreated={refetch}
      />
    </div>
  );
}
