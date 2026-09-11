"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout";
import { Spinner } from "@/components/ui";
import { EvaluationForm } from "@/components/trainer";
import type { EvaluationCharge, EvaluationFormValues } from "@/components/trainer";
import { useMembers } from "@/hooks/useMembers";
import { usePersonalTraining } from "@/hooks/usePersonalTraining";
import { usePhysicalEvaluations } from "@/hooks/usePhysicalEvaluations";
import { useTrainerServices } from "@/hooks/useTrainerServices";
import { isActivePersonalTraining } from "@/lib/utils/serviceStatus";

export default function NuevaEvaluacionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMemberId = searchParams.get("member") || undefined;

  const { members, loading: membersLoading, updateMember, refetch: refetchMembers } = useMembers();
  const { clients, loading: ptLoading, registerPayment } = usePersonalTraining();
  const { evaluationService, loading: servicesLoading, ensureBaseServices } = useTrainerServices();
  const { createEvaluation } = usePhysicalEvaluations();

  useEffect(() => {
    if (!servicesLoading) ensureBaseServices();
  }, [servicesLoading, ensureBaseServices]);

  /** Quiénes tienen el personalizado vigente: para ellos la evaluación va incluida. */
  const activeClientIds = useMemo(
    () =>
      new Set(
        clients
          .filter((c) => isActivePersonalTraining(c.current_subscription))
          .map((c) => c.id)
      ),
    [clients]
  );

  const handleSubmit = async (values: EvaluationFormValues, charge: EvaluationCharge | null) => {
    // El cobro va primero: si falla, no queda una evaluación marcada como
    // cobrada sin su cobro detrás.
    let paymentId: string | null = null;

    if (charge && evaluationService) {
      const payment = await registerPayment({
        memberId: values.member_id,
        service: evaluationService,
        startDate: values.evaluated_on,
        amountPaid: charge.amount,
        paymentMethod: charge.paymentMethod,
        notes: "Evaluación física",
      });
      paymentId = payment.id;
    }

    const created = await createEvaluation({
      ...values,
      payment_id: paymentId,
    });

    router.push(`/trainer/evaluaciones/${created.id}`);
  };

  const handleSetMemberSex = async (memberId: string, sex: "male" | "female") => {
    await updateMember(memberId, { sex });
    await refetchMembers();
  };

  const loading = membersLoading || ptLoading || servicesLoading;

  return (
    <div>
      <Header title="Nueva evaluación" showSearch={false} />

      <div className="p-6">
        <Link
          href="/trainer/evaluaciones"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a evaluaciones
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <EvaluationForm
            members={members}
            activeClientIds={activeClientIds}
            evaluationService={evaluationService}
            preselectedMemberId={preselectedMemberId}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/trainer/evaluaciones")}
            onSetMemberSex={handleSetMemberSex}
          />
        )}
      </div>
    </div>
  );
}
