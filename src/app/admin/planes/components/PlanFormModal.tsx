"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { MembershipPlan, CreateMembershipPlanInput } from "@/hooks/useMembershipPlans";
import { Loader2 } from "lucide-react";

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: MembershipPlan | null;
  onSave: (data: CreateMembershipPlanInput, id?: string) => Promise<{ error: string | null }>;
}

export function PlanFormModal({ isOpen, onClose, plan, onSave }: PlanFormModalProps) {
  const [formData, setFormData] = useState<CreateMembershipPlanInput>({
    name: "",
    description: "",
    duration_days: 30,
    price: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        setFormData({
          name: plan.name,
          description: plan.description || "",
          duration_days: plan.duration_days,
          price: plan.price,
          is_active: plan.is_active,
        });
      } else {
        setFormData({
          name: "",
          description: "",
          duration_days: 30,
          price: 0,
          is_active: true,
        });
      }
      setError(null);
    }
  }, [isOpen, plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: saveError } = await onSave(formData, plan?.id);

    if (saveError) {
      setError(saveError);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? "Editar Plan" : "Nuevo Plan de Membresía"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Nombre del plan"
          placeholder="Ej: BC22 Pareja 1 Mes"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Textarea
          label="Descripción"
          placeholder="Ej: Incluye acceso completo al gimnasio..."
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duración (días)"
            type="number"
            min="1"
            value={formData.duration_days}
            onChange={(e) =>
              setFormData({ ...formData, duration_days: parseInt(e.target.value) })
            }
            required
          />

          <Input
            label="Precio"
            type="number"
            min="0"
            step="1000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            required
          />
        </div>

        <Select
          label="Estado"
          value={formData.is_active ? "active" : "inactive"}
          onChange={(e) =>
            setFormData({ ...formData, is_active: e.target.value === "active" })
          }
          options={[
            { value: "active", label: "Activo" },
            { value: "inactive", label: "Inactivo" },
          ]}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Plan"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
