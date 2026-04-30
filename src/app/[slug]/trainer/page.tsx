import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

// Ruta temporal: /[slug]/trainer → redirige al dashboard /trainer
// TODO: Migrar completamente el dashboard trainer a /[slug]/trainer (ADR 003)
export default async function TrainerSlugRedirectPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verificar que existe como trainer de este establecimiento
  const { data: establishment } = await supabase
    .from("establishments")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!establishment) redirect("/login");

  const { data: euData } = await supabase
    .from("establishment_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("establishment_id", establishment.id)
    .eq("role", "trainer")
    .eq("is_active", true)
    .single();

  if (!euData) redirect("/login");

  // Redirigir al dashboard actual del trainer
  redirect("/trainer");
}
