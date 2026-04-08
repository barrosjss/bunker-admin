import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrainerSidebar } from "@/components/layout/TrainerSidebar";
import { TrainerMobileNav } from "@/components/layout/TrainerMobileNav";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO: reemplazar con lógica de /[slug]/trainer cuando se refactoricen los dashboards
  const { data: euData } = await supabase
    .from("establishment_users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!euData) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <TrainerSidebar />
      </div>

      {/* Main content */}
      <main className="lg:pl-[280px] pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile navigation */}
      <TrainerMobileNav />
    </div>
  );
}
