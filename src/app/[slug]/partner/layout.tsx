import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartnerSidebar } from "@/components/layout/PartnerSidebar";
import { PartnerMobileNav } from "@/components/layout/PartnerMobileNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function PartnerLayout({ children, params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verificar que el establecimiento existe y está activo
  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!establishment) redirect("/login");

  // Verificar que el usuario es partner de este establecimiento
  const { data: euData } = await supabase
    .from("establishment_users")
    .select("role, member_id")
    .eq("user_id", user.id)
    .eq("establishment_id", establishment.id)
    .eq("role", "partner")
    .eq("is_active", true)
    .single();

  if (!euData || !euData.member_id) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <PartnerSidebar slug={slug} />
      </div>

      {/* Main content */}
      <main className="lg:pl-[280px] pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile navigation */}
      <PartnerMobileNav slug={slug} />
    </div>
  );
}
