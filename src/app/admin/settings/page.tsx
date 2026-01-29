"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Modal,
  ModalFooter,
  Badge,
} from "@/components/ui";
import { User, Building, Shield, LogOut, Plus } from "lucide-react";
import { useMembershipPlans } from "@/hooks/useMemberships";
import { formatCurrency } from "@/lib/utils/formatting";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const planSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  duration_days: z.number().min(1, "Mínimo 1 día"),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
});

type PlanFormData = {
  name: string;
  description?: string;
  duration_days: number;
  price: number;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { plans, loading: plansLoading, createPlan } = useMembershipPlans();

  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_days: 30,
      price: 0,
    },
  });

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({ email: data.user.email || "" });
      }
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCreatePlan = async (data: PlanFormData) => {
    setIsSubmitting(true);
    try {
      await createPlan({
        name: data.name,
        description: data.description || null,
        duration_days: data.duration_days,
        price: data.price,
        is_active: true,
      });
      reset();
      setIsCreatingPlan(false);
    } catch (err) {
      console.error("Error creating plan:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="Configuración" showSearch={false} />

      <div className="p-6 max-w-4xl">
        {/* Profile section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Perfil de usuario</CardTitle>
                <p className="text-sm text-text-secondary">
                  Información de tu cuenta
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Correo electrónico
                </label>
                <p className="text-text-primary">{user?.email || "Cargando..."}</p>
              </div>
              <Button
                variant="danger"
                leftIcon={<LogOut className="h-5 w-5" />}
                onClick={handleSignOut}
              >
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Membership plans section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10">
                <Building className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <CardTitle>Planes de membresía</CardTitle>
                <p className="text-sm text-text-secondary">
                  Configura los planes disponibles para tus miembros
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  reset();
                  setIsCreatingPlan(true);
                }}
              >
                Nuevo plan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <p className="text-text-secondary">Cargando planes...</p>
            ) : plans.length === 0 ? (
              <p className="text-text-secondary">
                No hay planes configurados. Crea tu primer plan de membresía.
              </p>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg border border-border"
                  >
                    <div>
                      <h4 className="font-medium text-text-primary">
                        {plan.name}
                      </h4>
                      <p className="text-sm text-text-secondary">
                        {plan.duration_days} días
                        {plan.description && ` - ${plan.description}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="primary" className="text-lg px-4 py-1">
                        {formatCurrency(plan.price)}
                      </Badge>
                      {plan.is_active ? (
                        <Badge variant="success" size="sm">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-warning/10">
                <Shield className="h-6 w-6 text-warning" />
              </div>
              <div>
                <CardTitle>Información del sistema</CardTitle>
                <p className="text-sm text-text-secondary">
                  Versión y datos del sistema
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Versión</p>
                <p className="text-text-primary font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-text-secondary">Framework</p>
                <p className="text-text-primary font-medium">Next.js 14</p>
              </div>
              <div>
                <p className="text-text-secondary">Base de datos</p>
                <p className="text-text-primary font-medium">Supabase</p>
              </div>
              <div>
                <p className="text-text-secondary">Modo</p>
                <p className="text-text-primary font-medium">Oscuro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create plan modal */}
      <Modal
        isOpen={isCreatingPlan}
        onClose={() => {
          setIsCreatingPlan(false);
          reset();
        }}
        title="Nuevo plan de membresía"
        size="md"
      >
        <form onSubmit={handleSubmit(handleCreatePlan)} className="space-y-4">
          <Input
            label="Nombre del plan *"
            placeholder="Ej: Mensual"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Descripción"
            placeholder="Descripción opcional del plan"
            {...register("description")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Duración (días) *"
              placeholder="30"
              error={errors.duration_days?.message}
              {...register("duration_days")}
            />

            <Input
              type="number"
              label="Precio *"
              placeholder="500"
              step="0.01"
              error={errors.price?.message}
              {...register("price")}
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreatingPlan(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Crear plan
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
