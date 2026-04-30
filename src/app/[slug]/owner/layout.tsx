import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OwnerSlugSidebar } from "@/components/layout/OwnerSlugSidebar";
import { OwnerSlugMobileNav } from "@/components/layout/OwnerSlugMobileNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OwnerSlugLayout({ children, params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!establishment) redirect("/login");

  const { data: euData } = await supabase
    .from("establishment_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("establishment_id", establishment.id)
    .eq("role", "owner")
    .single();

  if (!euData) redirect(`/${slug}/admin`);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <OwnerSlugSidebar slug={slug} establishmentName={establishment.name} />
      </div>
      <OwnerSlugMobileNav slug={slug} />
      <main className="lg:pl-[280px] min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
