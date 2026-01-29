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

  // Get staff data
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  // No staff record - show error
  if (!staff) {
    return <NoAccessError email={user.email || ""} />;
  }

  // If user is trainer only (not admin), redirect directly to trainer panel
  if (staff.role !== "admin") {
    redirect("/trainer");
  }

  // Check for saved panel preference in cookie
  const cookieStore = await cookies();
  const savedPanel = cookieStore.get("bunker_current_panel")?.value;

  // If there's a saved panel preference, redirect to it
  if (savedPanel === "admin") {
    redirect("/admin");
  } else if (savedPanel === "trainer") {
    redirect("/trainer");
  }

  // Show panel selector for admins
  return <PanelSelector staffName={staff.name || "Usuario"} />;
}
