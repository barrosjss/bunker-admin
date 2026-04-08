import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoAccessError } from "./NoAccessError";

export default async function RootPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener el establecimiento y rol del usuario autenticado
  const { data: euData } = await supabase
    .from("establishment_users")
    .select("role, establishments(slug)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!euData) {
    return <NoAccessError email={user.email || ""} />;
  }

  const establishment = euData.establishments as { slug: string } | null;
  if (!establishment?.slug) {
    return <NoAccessError email={user.email || ""} />;
  }

  const { slug } = establishment;
  const { role } = euData;

  if (role === "owner" || role === "admin") redirect(`/${slug}/admin`);
  if (role === "trainer") redirect(`/${slug}/trainer`);

  return <NoAccessError email={user.email || ""} />;
}
