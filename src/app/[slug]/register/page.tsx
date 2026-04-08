import { notFound } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui";
import RegisterForm from "./RegisterForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RegisterPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, name, slug, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!establishment) notFound();

  const { data: form } = await supabase
    .from("registration_forms")
    .select("*")
    .eq("establishment_id", establishment.id)
    .single();

  const isOpen = form?.is_enabled === true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {!isOpen ? (
        <Card className="w-full max-w-md">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-surface-elevated flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-text-secondary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary mb-1">{establishment.name}</h1>
              <p className="text-text-secondary">
                {form?.disabled_message || "El registro no está disponible en este momento."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <RegisterForm
          establishmentId={establishment.id}
          establishmentName={establishment.name}
          formConfig={form}
        />
      )}
    </div>
  );
}
