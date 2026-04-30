import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoAccessError } from "./NoAccessError";

export default async function RootPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Buscar el registro del usuario por user_id primero,
  // y si no existe (fue agregado solo con email), buscar por email como fallback.
  let { data: euData } = await supabase
    .from("establishment_users")
    .select("id, role, user_id, establishments(slug)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  // Fallback: buscar por email si no se encontró por user_id
  // Cubre el caso donde el owner agrega un usuario con email antes de que haga login
  if (!euData && user.email) {
    const { data: byEmail } = await supabase
      .from("establishment_users")
      .select("id, role, user_id, establishments(slug)")
      .eq("email", user.email)
      .eq("is_active", true)
      .is("user_id", null)
      .maybeSingle();

    if (byEmail) {
      // Vincular el user_id automáticamente en el primer login
      await supabase
        .from("establishment_users")
        .update({ user_id: user.id })
        .eq("id", byEmail.id);

      euData = { ...byEmail, user_id: user.id };
    }
  }

  if (!euData) {
    return <NoAccessError email={user.email || ""} />;
  }

  const establishment = euData.establishments as { slug: string } | null;
  if (!establishment?.slug) {
    return <NoAccessError email={user.email || ""} />;
  }

  const { slug } = establishment;
  const { role } = euData;

  if (role === "owner") redirect(`/${slug}/owner`);
  if (role === "admin") redirect(`/${slug}/admin`);
  if (role === "trainer") redirect(`/${slug}/trainer`);
  if (role === "partner") redirect(`/${slug}/partner`);

  return <NoAccessError email={user.email || ""} />;
}
