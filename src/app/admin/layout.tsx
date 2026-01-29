import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminMobileNav } from "@/components/layout/AdminMobileNav";

export default async function AdminLayout({
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

  // Check if user has staff record with admin role
  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!staff || staff.role !== "admin") {
    redirect("/trainer");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <main className="lg:pl-[280px] pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile navigation */}
      <AdminMobileNav />
    </div>
  );
}
