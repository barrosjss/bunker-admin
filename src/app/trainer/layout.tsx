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

  // Check if user has staff record
  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!staff) {
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
