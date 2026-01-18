"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useMembers } from "@/hooks/useMembers";
import { MemberCard } from "@/components/members";
import { Button, Input, Spinner, EmptyState, Select } from "@/components/ui";
import { Header } from "@/components/layout";
import { Plus, Search, Users } from "lucide-react";

export default function MembersPage() {
  const { members, loading, error } = useMembers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone?.includes(searchQuery);

      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  return (
    <div>
      <Header title="Miembros" showSearch={false} />

      <div className="p-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "Todos" },
                  { value: "active", label: "Activos" },
                  { value: "inactive", label: "Inactivos" },
                  { value: "suspended", label: "Suspendidos" },
                ]}
              />
            </div>
          </div>
          <Link href="/members/new">
            <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
              Nuevo miembro
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-text-secondary">Total</p>
            <p className="text-2xl font-bold text-text-primary">
              {members.length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Activos</p>
            <p className="text-2xl font-bold text-success">
              {members.filter((m) => m.status === "active").length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Con membresía</p>
            <p className="text-2xl font-bold text-primary">
              {members.filter((m) => m.current_membership).length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-text-secondary">Sin membresía</p>
            <p className="text-2xl font-bold text-warning">
              {members.filter((m) => !m.current_membership).length}
            </p>
          </div>
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
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "Sin resultados" : "Sin miembros"}
            description={
              searchQuery
                ? "No se encontraron miembros con esos criterios de búsqueda."
                : "Comienza agregando tu primer miembro al sistema."
            }
            action={
              !searchQuery && (
                <Link href="/members/new">
                  <Button
                    variant="primary"
                    leftIcon={<Plus className="h-5 w-5" />}
                  >
                    Agregar miembro
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="grid-tablet">
            {filteredMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
