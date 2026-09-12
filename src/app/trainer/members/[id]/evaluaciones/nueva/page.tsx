"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout";
import { Button, Spinner } from "@/components/ui";
import { EvaluationForm } from "@/components/trainer";
import type { EvaluationCharge, EvaluationFormValues } from "@/components/trainer";
import { useMember, useMembers } from "@/hooks/useMembers";
import { usePersonalTraining } from "@/hooks/usePersonalTraining";
import { usePhysicalEvaluations } from "@/hooks/usePhysicalEvaluations";
import { useTrainerServices } from "@/hooks/useTrainerServices";
import { isActivePersonalTraining } from "@/lib/utils/serviceStatus";

export default function NuevaEvaluacionPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;

  const { member, loading: memberLoading } = useMember(memberId);
  const { updateMember, refetch: refetchMembers } = useMembers();
  const { clients, loading: ptLoading, registerPayment } = usePersonalTraining();
  const { evaluationService, loading: servicesLoading, ensureBaseServices } = useTrainerServices();
  const { createEvaluation } = usePhysicalEvaluations();

  useEffect(() => {
    if (!servicesLoading) ensureBaseServices();
  }, [servicesLoading, ensureBaseServices]);

  /** Si tiene el personalizado vigente, la evaluación va incluida. */
  const activeClientIds = useMemo(
    () =>
      new Set(
        clients.filter((c) => isActivePersonalTraining(c.current_subscription)).map((c) => c.id)
      ),
    [clients]
  );

  const handleSubmit = async (values: EvaluationFormValues, charge: EvaluationCharge | null) => {
    // El cobro va primero: si falla, no queda una evaluación marcada como
    // cobrada sin su cobro detrás.
    let paymentId: string | null = null;

    if (charge && evaluationService) {
      const payment = await registerPayment({
        memberId,
        service: evaluationService,
        concept: evaluationService.name,
        startDate: values.evaluated_on,
        amountPaid: charge.amount,
        paymentMethod: charge.paymentMethod,
        notes: "Evaluación física",
      });
      paymentId = payment.id;
    }

    const created = await createEvaluation({ ...values, payment_id: paymentId });
    router.push(`/trainer/members/${memberId}/evaluaciones/${created.id}`);
  };

  const handleSetMemberSex = async (id: string, sex: "male" | "female") => {
    await updateMember(id, { sex });
    await refetchMembers();
  };

  const loading = memberLoading || ptLoading || servicesLoading;

  return (
    <div>
      <Header title="Nueva evaluación" showSearch={false} />

      <div className="p-6">
        <Link
          href={`/trainer/members/${memberId}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a la ficha
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !member ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">Miembro no encontrado.</p>
            <Link href="/trainer/members">
              <Button variant="secondary">Volver a miembros</Button>
            </Link>
          </div>
        ) : (
          <EvaluationForm
            members={[member]}
            activeClientIds={activeClientIds}
            evaluationService={evaluationService}
            preselectedMemberId={memberId}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/trainer/members/${memberId}`)}
            onSetMemberSex={handleSetMemberSex}
          />
        )}
      </div>
    </div>
  );
}
