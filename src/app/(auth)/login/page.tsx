"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dumbbell, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardContent } from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("Credenciales incorrectas. Por favor, intenta de nuevo.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Dumbbell className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Bunker Admin</h1>
          <p className="text-text-secondary mt-1">
            Sistema de Gestión de Gimnasio
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <Input
            type="email"
            label="Correo electrónico"
            placeholder="tu@email.com"
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="Contraseña"
              placeholder="Tu contraseña"
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Iniciar sesión
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-text-secondary text-sm mt-6">
          ¿Problemas para acceder? Contacta al administrador.
        </p>
      </CardContent>
    </Card>
  );
}
