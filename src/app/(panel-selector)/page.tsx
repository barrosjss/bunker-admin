import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PanelSelector } from "./PanelSelector";
import { NoAccessError } from "./NoAccessError";

export default async function PanelSelectorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO: reemplazar con lógica de /[slug]/owner cuando se refactoricen los dashboards
  const { data: euData } = await supabase
    .from("establishment_users")
    .select("name, role")
    .eq("user_id", user.id)
    .single();

  if (!euData) {
    return <NoAccessError email={user.email || ""} />;
  }

  if (euData.role !== "admin" && euData.role !== "owner") {
    redirect("/trainer");
  }

  const cookieStore = await cookies();
  const savedPanel = cookieStore.get("bunker_current_panel")?.value;

  if (savedPanel === "admin") {
    redirect("/admin");
  } else if (savedPanel === "trainer") {
    redirect("/trainer");
  }

  return <PanelSelector staffName={euData.name || "Usuario"} />;
}
