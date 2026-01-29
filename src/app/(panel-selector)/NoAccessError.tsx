"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Button } from "@/components/ui";
import { ShieldX, LogOut } from "lucide-react";

interface NoAccessErrorProps {
  email: string;
}

export function NoAccessError({ email }: NoAccessErrorProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="w-full max-w-md">
      <Card className="text-center p-8">
        <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="h-8 w-8 text-danger" />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Sin acceso
        </h1>
        <p className="text-text-secondary mb-4">
          No tienes un registro de personal asociado a tu cuenta.
        </p>
        <p className="text-sm text-text-secondary mb-6">
          Email: <span className="font-medium text-text-primary">{email}</span>
        </p>
        <p className="text-sm text-text-secondary mb-6">
          Contacta al administrador para que te agregue como miembro del staff.
        </p>
        <Button
          variant="secondary"
          onClick={handleSignOut}
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}
