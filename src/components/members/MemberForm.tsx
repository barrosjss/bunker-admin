"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Textarea, Select } from "@/components/ui";
import { Member, MemberInsert } from "@/lib/types/database";

const memberSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  birth_date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: Member;
  onSubmit: (data: MemberInsert) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MemberForm({
  member,
  onSubmit,
  onCancel,
  isLoading,
}: MemberFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: member?.name || "",
      email: member?.email || "",
      phone: member?.phone || "",
      emergency_contact: member?.emergency_contact || "",
      birth_date: member?.birth_date || "",
      notes: member?.notes || "",
      status: member?.status || "active",
    },
  });

  const handleFormSubmit = async (data: MemberFormData) => {
    const memberData: MemberInsert = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      emergency_contact: data.emergency_contact || null,
      birth_date: data.birth_date || null,
      notes: data.notes || null,
    };
    await onSubmit(memberData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Nombre completo *"
        placeholder="Juan Pérez"
        error={errors.name?.message}
        {...register("name")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="email"
          label="Correo electrónico"
          placeholder="juan@email.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Teléfono"
          placeholder="55 1234 5678"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="Fecha de nacimiento"
          error={errors.birth_date?.message}
          {...register("birth_date")}
        />

        <Input
          label="Contacto de emergencia"
          placeholder="Nombre y teléfono"
          error={errors.emergency_contact?.message}
          {...register("emergency_contact")}
        />
      </div>

      <Select
        label="Estado"
        options={[
          { value: "active", label: "Activo" },
          { value: "inactive", label: "Inactivo" },
          { value: "suspended", label: "Suspendido" },
        ]}
        error={errors.status?.message}
        {...register("status")}
      />

      <Textarea
        label="Notas"
        placeholder="Observaciones, condiciones médicas, etc."
        error={errors.notes?.message}
        {...register("notes")}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {member ? "Guardar cambios" : "Crear miembro"}
        </Button>
      </div>
    </form>
  );
}
