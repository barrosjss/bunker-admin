"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Phone, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { registerMember } from "./actions";
import type { RegistrationForm } from "@/lib/supabase/types/database";

interface Props {
  establishmentId: string;
  establishmentName: string;
  formConfig: RegistrationForm;
}

function buildSchema(formConfig: RegistrationForm) {
  return z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z
      .string()
      .email("Email inválido")
      .optional()
      .or(z.literal("")),
    phone: formConfig.show_phone
      ? z.string().min(7, "Teléfono inválido").optional().or(z.literal(""))
      : z.string().optional(),
    birth_date: z.string().optional(),
    emergency_contact: z.string().optional(),
  });
}

type FormData = z.infer<ReturnType<typeof buildSchema>>;

export default function RegisterForm({ establishmentId, establishmentName, formConfig }: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = buildSchema(formConfig);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    setServerError(null);
    const formData = new FormData();
    formData.set("establishment_id", establishmentId);
    formData.set("name", data.name);
    if (data.email) formData.set("email", data.email);
    if (data.phone) formData.set("phone", data.phone);
    if (data.birth_date) formData.set("birth_date", data.birth_date);
    if (data.emergency_contact) formData.set("emergency_contact", data.emergency_contact);

    startTransition(async () => {
      const result = await registerMember(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setServerError(result.error);
      }
    });
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-8 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-1">¡Registro exitoso!</h2>
            <p className="text-text-secondary">
              Ya eres parte de <span className="font-medium text-text-primary">{establishmentName}</span>.
              El equipo se pondrá en contacto contigo pronto.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-3">
            <User className="h-7 w-7 text-background" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {formConfig.welcome_title || "Únete a nosotros"}
          </h1>
          <p className="text-text-secondary text-sm text-center mt-1">
            {formConfig.welcome_message || `Regístrate en ${establishmentName}`}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <Input
            label="Nombre completo *"
            placeholder="Tu nombre"
            leftIcon={<User className="h-5 w-5" />}
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            type="email"
            label="Correo electrónico"
            placeholder="tu@email.com"
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email?.message}
            {...register("email")}
          />

          {formConfig.show_phone && (
            <Input
              type="tel"
              label="Teléfono"
              placeholder="+57 300 000 0000"
              leftIcon={<Phone className="h-5 w-5" />}
              error={errors.phone?.message}
              {...register("phone")}
            />
          )}

          {formConfig.show_birth_date && (
            <Input
              type="date"
              label="Fecha de nacimiento"
              leftIcon={<Calendar className="h-5 w-5" />}
              error={errors.birth_date?.message}
              {...register("birth_date")}
            />
          )}

          {formConfig.show_emergency_contact && (
            <Input
              label="Contacto de emergencia"
              placeholder="Nombre y teléfono"
              error={errors.emergency_contact?.message}
              {...register("emergency_contact")}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isPending}
          >
            Registrarme
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
