"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  establishment_id: z.string().uuid("ID de establecimiento inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  emergency_contact: z.string().optional(),
});

export type RegisterResult = { success: true } | { success: false; error: string };

export async function registerMember(formData: FormData): Promise<RegisterResult> {
  const raw = {
    establishment_id: formData.get("establishment_id"),
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    birth_date: formData.get("birth_date") || undefined,
    emergency_contact: formData.get("emergency_contact") || undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { establishment_id, name, email, phone, birth_date, emergency_contact } = parsed.data;

  const supabase = await createClient();

  // Verificar que el formulario sigue habilitado (seguridad server-side)
  const { data: form } = await supabase
    .from("registration_forms")
    .select("is_enabled")
    .eq("establishment_id", establishment_id)
    .single();

  if (!form?.is_enabled) {
    return { success: false, error: "El formulario de registro no está disponible." };
  }

  const { error } = await supabase.from("members").insert({
    establishment_id,
    name,
    email: email || null,
    phone: phone || null,
    birth_date: birth_date || null,
    emergency_contact: emergency_contact || null,
    status: "active",
  });

  if (error) {
    console.error("registerMember error:", error.message);
    return { success: false, error: "No se pudo completar el registro. Intenta de nuevo." };
  }

  return { success: true };
}
