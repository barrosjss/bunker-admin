"use client";

import { useState } from "react";
import { Header } from "@/components/layout";
import {
  Button,
  Spinner,
  EmptyState,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
} from "@/components/ui";
import { Plus, Tag } from "lucide-react";
import { useMembershipPlans, MembershipPlan, CreateMembershipPlanInput } from "@/hooks/useMembershipPlans";
import { PlanFormModal } from "./components/PlanFormModal";

export default function AdminPlanesPage() {
  const { plans, loading, error, createPlan, updatePlan } = useMembershipPlans();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSavePlan = async (input: CreateMembershipPlanInput, id?: string) => {
    if (id) {
      return await updatePlan(id, input);
    } else {
      return await createPlan(input);
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleNewPlan = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <Header title="Planes de Membresía" showSearch={false} />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-text-secondary">
            Gestiona los diferentes planes y campañas disponibles.
          </p>
          <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />} onClick={handleNewPlan}>
            Nuevo plan
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-danger">{error}</p>
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Sin planes configurados"
            description="Crear planes te permitirá seleccionarlos al momento de registrar el pago de una membresía."
            action={
              <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />} onClick={handleNewPlan}>
                Crear primer plan
              </Button>
            }
          />
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Plan</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <p className="font-medium text-text-primary">{plan.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-text-secondary max-w-xs truncate">
                        {plan.description || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-text-secondary">
                        {plan.duration_days} días
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-text-primary">
                        {formatPrice(plan.price)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "success" : "default"}>
                        {plan.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <PlanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={selectedPlan}
        onSave={handleSavePlan}
      />
    </div>
  );
}
