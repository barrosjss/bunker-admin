import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PanelSelectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated - middleware should handle this, but just in case
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {children}
    </div>
  );
}
