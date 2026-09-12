"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Users } from "lucide-react";
import { useMembers } from "@/hooks/useMembers";
import { usePersonalTraining } from "@/hooks/usePersonalTraining";
import { MemberCard } from "@/components/members";
import { Badge, Input, Spinner, EmptyState, Select } from "@/components/ui";
import { Header } from "@/components/layout";
import { getServiceStatus } from "@/lib/utils/serviceStatus";

type Filter = "all" | "personalizados" | "expiring" | "expired" | "sin-personalizado";

export default function TrainerMembersPage() {
  const { members, loading, error } = useMembers();
  const { clients } = usePersonalTraining();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(
    searchParams.get("filtro") === "personalizados" ? "personalizados" : "all"
  );

  /** Estado del personalizado por miembro, para pintarlo sin entrar a la ficha. */
  const ptByMember = useMemo(
    () => new Map(clients.map((c) => [c.id, getServiceStatus(c.current_subscription)])),
    [clients]
  );

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.phone?.includes(query);

      const pt = ptByMember.get(member.id);
      const isClient = pt !== undefined && pt.status !== "none";

      const matchesFilter =
        filter === "all" ||
        (filter === "personalizados" && isClient) ||
        (filter === "expiring" && pt?.status === "expiring") ||
        (filter === "expired" && pt?.status === "expired") ||
        (filter === "sin-personalizado" && !isClient);

      return matchesSearch && matchesFilter;
    });
  }, [members, searchQuery, filter, ptByMember]);

  const counts = useMemo(() => {
    const statuses = Array.from(ptByMember.values());
    return {
      total: members.length,
      personalizados: statuses.filter((s) => s.status !== "none").length,
      expiring: statuses.filter((s) => s.status === "expiring").length,
      expired: statuses.filter((s) => s.status === "expired").length,
    };
  }, [members, ptByMember]);

  return (
    <div>
      <Header title="Miembros" showSearch={false} />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="w-56">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              options={[
                { value: "all", label: "Todos" },
                { value: "personalizados", label: "Personalizados" },
                { value: "expiring", label: "Por vencer" },
                { value: "expired", label: "Vencidos" },
                { value: "sin-personalizado", label: "Sin personalizado" },
              ]}
            />
          </div>
        </div>

        {/* Stats del negocio del entrenador, no de la membresía del gym */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-text-secondary">Miembros</p>
            <p className="text-2xl font-bold text-text-primary">{counts.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Personalizados</p>
            <p className="text-2xl font-bold text-success">{counts.personalizados}</p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Por vencer</p>
            <p className="text-2xl font-bold text-warning">{counts.expiring}</p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Vencidos</p>
            <p className="text-2xl font-bold text-danger">{counts.expired}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-danger">{error}</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery || filter !== "all" ? "Sin resultados" : "Sin miembros"}
            description={
              searchQuery || filter !== "all"
                ? "Ningún miembro coincide con esos criterios."
                : "No hay miembros registrados en el sistema."
            }
          />
        ) : (
          <div className="grid-tablet">
            {filteredMembers.map((member) => {
              const pt = ptByMember.get(member.id);
              return (
                <MemberCard
                  key={member.id}
                  member={member}
                  basePath="/trainer"
                  extraBadge={
                    pt && pt.status !== "none" ? (
                      <Badge variant={pt.variant} size="sm" title="Personalizado">
                        PT
                      </Badge>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
