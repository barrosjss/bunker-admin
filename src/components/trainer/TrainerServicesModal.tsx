"use client";

import { useEffect, useState } from "react";
import { Modal, ModalFooter, Input, Button, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/formatting";
import type { TrainerService, TrainerServiceUpdate } from "@/lib/supabase/types/database";

interface Draft {
  name: string;
  price: string;
  duration_days: string;
}

export interface TrainerServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: TrainerService[];
  onSave: (id: string, changes: TrainerServiceUpdate) => Promise<unknown>;
}

const KIND_BADGES: Record<string, { label: string; variant: "primary" | "success" | "default" }> = {
  personal_training: { label: "Mensual", variant: "primary" },
  evaluation: { label: "Pago único", variant: "success" },
  other: { label: "Otro", variant: "default" },
};

/**
 * Precios de los servicios del entrenador.
 *
 * Los dos servicios base nacen con precio 0 — el entrenador los fija acá antes
 * de poder cobrar nada, y el resto de la UI lo empuja a hacerlo.
 */
export function TrainerServicesModal({
  isOpen,
  onClose,
  services,
  onSave,
}: TrainerServicesModalProps) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setDrafts(
      Object.fromEntries(
        services.map((s) => [
          s.id,
          {
            name: s.name,
            price: String(s.price ?? 0),
            duration_days: s.duration_days ? String(s.duration_days) : "",
          },
        ])
      )
    );
  }, [isOpen, services]);

  const update = (id: string, field: keyof Draft, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      for (const service of services) {
        const draft = drafts[service.id];
        if (!draft) continue;

        const price = Number(draft.price) || 0;
        const durationDays =
          service.billing_type === "recurring" ? Number(draft.duration_days) || null : null;
        const name = draft.name.trim() || service.name;

        const unchanged =
          name === service.name &&
          price === Number(service.price) &&
          durationDays === service.duration_days;

        if (unchanged) continue;

        // El CHECK de la tabla rechaza un recurrente sin duración válida.
        if (service.billing_type === "recurring" && (!durationDays || durationDays <= 0)) {
          throw new Error(`"${name}" es mensual: necesita una duración en días mayor a 0.`);
        }

        await onSave(service.id, { name, price, duration_days: durationDays });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los precios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Servicios y precios" size="lg">
      <div className="space-y-5">
        <p className="text-sm text-text-secondary">
          Estos son tus servicios, aparte de la membresía del gym. El precio que pongas acá se
          precarga al cobrar, pero podés ajustarlo en cada cobro.
        </p>

        {services.map((service) => {
          const draft = drafts[service.id];
          if (!draft) return null;
          const badge = KIND_BADGES[service.kind] || KIND_BADGES.other;

          return (
            <div
              key={service.id}
              className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <Input
                  aria-label="Nombre del servicio"
                  value={draft.name}
                  onChange={(e) => update(service.id, "name", e.target.value)}
                  className="font-medium"
                />
                <Badge variant={badge.variant} size="sm" className="flex-shrink-0">
                  {badge.label}
                </Badge>
              </div>

              {service.description && (
                <p className="text-sm text-text-secondary">{service.description}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  label="Precio"
                  value={draft.price}
                  onChange={(e) => update(service.id, "price", e.target.value)}
                  hint={
                    Number(draft.price) > 0
                      ? formatCurrency(Number(draft.price))
                      : "Sin precio: el cobro arranca en 0"
                  }
                />
                {service.billing_type === "recurring" && (
                  <Input
                    type="number"
                    min="1"
                    label="Duración (días)"
                    value={draft.duration_days}
                    onChange={(e) => update(service.id, "duration_days", e.target.value)}
                    hint="30 = un mes"
                  />
                )}
              </div>

              {service.included_with_personal_training && (
                <p className="text-sm text-success">
                  Incluida sin costo para quien tenga personalizado activo.
                </p>
              )}
            </div>
          );
        })}

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" isLoading={saving} onClick={handleSave}>
            Guardar
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
