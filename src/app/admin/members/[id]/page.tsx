"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMember, useMembers } from "@/hooks/useMembers";
import { useMemberSessions } from "@/hooks/useTraining";
import { useMemberTrainer, useStaffTrainers } from "@/hooks/useTrainerMembers";
import { MemberForm, MembershipStatus } from "@/components/members";
import { Header } from "@/components/layout";
import {
  Card,
  Button,
  Avatar,
  Badge,
  Select,
  Spinner,
  Modal,
  ModalFooter,
  EmptyState,
} from "@/components/ui";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Dumbbell,
  ClipboardList,
  UserCheck,
  X,
} from "lucide-react";
import { formatDate, formatRelative } from "@/lib/utils/dates";
import { getMemberStatusLabel } from "@/lib/utils/formatting";
import { MemberInsert } from "@/lib/types/database";
import Link from "next/link";

export default function AdminMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const { member, loading, error, refetch } = useMember(memberId);
  const { updateMember, deleteMember } = useMembers();
  const { sessions, loading: sessionsLoading } = useMemberSessions(memberId);

  const { trainer, loading: trainerLoading, assignTrainer, unassignTrainer } = useMemberTrainer(memberId);
  const { trainers } = useStaffTrainers();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigningTrainer, setIsAssigningTrainer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (data: MemberInsert) => {
    setIsSubmitting(true);
    try {
      await updateMember(memberId, data);
      await refetch();
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating member:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteMember(memberId);
      router.push("/admin/members");
    } catch (err) {
      console.error("Error deleting member:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="h-12 w-12 text-danger mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Miembro no encontrado
        </h2>
        <p className="text-text-secondary mb-4">
          {error || "El miembro que buscas no existe."}
        </p>
        <Link href="/admin/members">
          <Button variant="secondary">Volver a miembros</Button>
        </Link>
      </div>
    );
  }

  const statusVariants: Record<string, "success" | "warning" | "danger"> = {
    active: "success",
    inactive: "warning",
    suspended: "danger",
  };

  return (
    <div>
      <Header title="" showSearch={false} />

      <div className="p-6">
        {/* Back button */}
        <Link
          href="/admin/members"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a miembros
        </Link>

        {/* Member header */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar
              src={member.photo_url}
              name={member.name}
              size="xl"
              className="h-24 w-24 text-2xl"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary mb-1">
                    {member.name}
                  </h1>
                  <Badge variant={statusVariants[member.status]}>
                    {getMemberStatusLabel(member.status)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Edit className="h-4 w-4" />}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeleting(true)}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {member.phone && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Phone className="h-4 w-4" />
                    {member.phone}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                )}
                {member.birth_date && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar className="h-4 w-4" />
                    {formatDate(member.birth_date)}
                  </div>
                )}
              </div>

              {member.notes && (
                <p className="mt-4 text-sm text-text-secondary bg-surface-elevated p-3 rounded-lg">
                  {member.notes}
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Membership status */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Membresía
            </h2>
            <MembershipStatus
              membership={member.current_membership as never}
              onRenew={() => router.push(`/admin/memberships?member=${memberId}`)}
            />
          </div>

          {/* Trainer assignment */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Entrenador asignado
            </h2>
            <Card>
              {trainerLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : trainer ? (
                <div className="flex items-center gap-3">
                  <Avatar name={trainer.name} size="md" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{trainer.name}</p>
                    <p className="text-sm text-text-secondary">{trainer.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await unassignTrainer();
                      } catch (err) {
                        console.error("Error removing trainer:", err);
                      }
                    }}
                    className="text-danger hover:text-danger hover:bg-danger/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : isAssigningTrainer ? (
                <div className="space-y-3">
                  <Select
                    label="Seleccionar entrenador"
                    placeholder="Elige un entrenador"
                    options={trainers.map((t) => ({ value: t.id, label: t.name }))}
                    onChange={async (e) => {
                      const val = (e.target as HTMLSelectElement).value;
                      if (val) {
                        try {
                          await assignTrainer(val);
                          setIsAssigningTrainer(false);
                        } catch (err) {
                          console.error("Error assigning trainer:", err);
                        }
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAssigningTrainer(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <UserCheck className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary mb-3">
                    Sin entrenador asignado
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAssigningTrainer(true)}
                  >
                    Asignar entrenador
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Recent sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Entrenamientos recientes
              </h2>
              <Link href={`/trainer/training/${memberId}`}>
                <Button variant="ghost" size="sm">
                  Ver historial
                </Button>
              </Link>
            </div>

            <Card padding="none">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : sessions.length === 0 ? (
                <EmptyState
                  icon={Dumbbell}
                  title="Sin entrenamientos"
                  description="Este miembro aún no tiene sesiones registradas."
                  action={
                    <Link href={`/trainer/training?member=${memberId}`}>
                      <Button variant="primary" size="sm">
                        Registrar sesión
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y divide-border">
                  {sessions.slice(0, 5).map((session) => (
                    <Link
                      key={session.id}
                      href={`/trainer/training/session/${session.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary">
                          {formatDate(session.date)}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {session.session_exercises?.length || 0} ejercicios
                        </p>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {formatRelative(session.created_at)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar miembro"
        size="lg"
      >
        <MemberForm
          member={member}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Eliminar miembro"
        size="sm"
      >
        <p className="text-text-secondary mb-4">
          ¿Estás seguro de que deseas eliminar a <strong>{member.name}</strong>?
          Esta acción no se puede deshacer y se eliminarán todos sus datos,
          incluyendo membresías y entrenamientos.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDeleting(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isSubmitting}
          >
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
