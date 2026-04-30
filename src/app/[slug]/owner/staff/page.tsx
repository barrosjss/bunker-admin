"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Button, Input, EmptyState, Spinner, Select, Modal, ModalFooter, Badge,
} from "@/components/ui";
import { Header } from "@/components/layout";
import { createClient } from "@/lib/supabase/client";
import { Search, Users, Pencil, Trash2, Plus, Info } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui";
import type { Member } from "@/lib/supabase/types/database";

type StaffRole = "owner" | "admin" | "trainer" | "partner";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  member_id: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  admin: "Admin",
  trainer: "Entrenador",
  partner: "Partner",
};

const ROLE_VARIANTS: Record<StaffRole, "warning" | "primary" | "success" | "default"> = {
  owner: "warning",
  admin: "primary",
  trainer: "success",
  partner: "default",
};

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "trainer", label: "Entrenador" },
  { value: "partner", label: "Partner" },
];

// ─── Staff Form Modal ──────────────────────────────────────────────────────────

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; password?: string; role: StaffRole; member_id: string | null; is_active: boolean }) => Promise<void>;
  initial?: StaffMember | null;
  members: Member[];
}

function StaffFormModal({ isOpen, onClose, onSave, initial, members }: StaffFormModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<StaffRole>("trainer");
  const [memberId, setMemberId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = !initial;

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? "");
      setEmail(initial?.email ?? "");
      setPassword("");
      setShowPassword(false);
      setRole(initial?.role ?? "trainer");
      setMemberId(initial?.member_id ?? "");
      setIsActive(initial?.is_active ?? true);
      setError(null);
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Nombre y email son requeridos");
      return;
    }
    if (isNew && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (role === "partner" && !memberId) {
      setError("Debes vincular un miembro del gym para el rol Partner");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        ...(isNew && { password }),
        role,
        member_id: role === "partner" ? memberId : null,
        is_active: isActive,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const memberOptions = [
    { value: "", label: "Seleccionar miembro..." },
    ...members.map((m) => ({ value: m.id, label: `${m.name}${m.email ? ` — ${m.email}` : ""}` })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? "Editar miembro del equipo" : "Agregar miembro del equipo"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          required
          disabled={!isNew}  // El email no se puede cambiar al editar
        />

        {/* Contraseña: solo al crear un usuario nuevo */}
        {isNew && (
          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
        )}

        <Select
          label="Rol"
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRole)}
          options={ROLE_OPTIONS}
        />

        {/* Campo member_id: solo visible y requerido para partners */}
        {role === "partner" && (
          <div className="space-y-1">
            <Select
              label="Miembro vinculado"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              options={memberOptions}
            />
            <p className="text-xs text-text-secondary flex items-center gap-1">
              <Info className="h-3 w-3" />
              El partner solo verá las sesiones de este miembro
            </p>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <div className="w-10 h-6 bg-border rounded-full peer peer-checked:bg-primary transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm font-medium text-text-primary">Activo</span>
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={loading}>
            {initial ? "Guardar cambios" : "Crear cuenta"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

interface DeleteModalProps {
  isOpen: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteModal({ isOpen, name, onClose, onConfirm }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpiar error al abrir/cerrar
  useEffect(() => {
    if (!isOpen) setError(null);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar miembro">
      <p className="text-text-secondary text-sm mb-4">
        ¿Eliminar a <span className="font-semibold text-text-primary">{name}</span> del equipo? Esta acción no se puede deshacer.
      </p>
      {error && <p className="text-sm text-danger mb-3">{error}</p>}
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button
          variant="danger"
          isLoading={loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              await onConfirm();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Error al eliminar");
            } finally {
              setLoading(false);
            }
          }}
        >
          Eliminar
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Staff Page ────────────────────────────────────────────────────────────────

export default function OwnerStaffPage() {
  const { slug } = useParams<{ slug: string }>();
  const supabase = createClient();

  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);

  const fetchStaff = useCallback(async (estId: string) => {
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from("establishment_users")
      .select("id, name, email, role, member_id, is_active, created_at")
      .eq("establishment_id", estId)
      .order("role")
      .order("name");
    if (dbError) {
      setError(dbError.message);
    } else {
      setStaff((data ?? []) as StaffMember[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from("establishments")
        .select("id")
        .eq("slug", slug)
        .single();
      if (data?.id) {
        setEstablishmentId(data.id);
        await fetchStaff(data.id);
        // Cargar lista de miembros para el selector de partners
        const { data: memberData } = await supabase
          .from("members")
          .select("id, name, email")
          .eq("establishment_id", data.id)
          .eq("status", "active")
          .order("name");
        setMembers((memberData ?? []) as Member[]);
      }
    };
    init();
  }, [slug, supabase, fetchStaff]);

  const refetch = () => { if (establishmentId) fetchStaff(establishmentId); };

  const handleSave = async (formData: { name: string; email: string; password?: string; role: StaffRole; member_id: string | null; is_active: boolean }) => {
    if (!establishmentId) return;

    if (editing) {
      // Editar: actualizar directamente en establishment_users
      // (no se puede cambiar el email ni la contraseña desde aquí)
      const { error: err } = await supabase
        .from("establishment_users")
        .update({
          name: formData.name,
          role: formData.role,
          member_id: formData.member_id,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (err) throw err;
    } else {
      // Crear: llamar al API Route que crea el usuario en Supabase Auth
      const res = await fetch("/api/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Error al crear el usuario");
      }
    }
    refetch();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch("/api/staff/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: deleting.id }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Error al eliminar el miembro");
    }
    setDeleting(null);
    refetch();
  };

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Equipo" showSearch={false} />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <Button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar miembro
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <p className="text-center py-12 text-danger">{error}</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin miembros de equipo"
            description={search ? "No hay resultados para esa búsqueda." : "Agrega el primer miembro del equipo."}
          />
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <p className="font-medium text-text-primary">{member.name}</p>
                        <p className="text-xs text-text-secondary">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANTS[member.role]}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "success" : "default"}>
                        {member.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() => { setEditing(member); setFormOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 text-danger hover:bg-danger/10"
                          onClick={() => setDeleting(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <StaffFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editing}
        members={members}
      />

      {deleting && (
        <DeleteModal
          isOpen={!!deleting}
          name={deleting.name}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
