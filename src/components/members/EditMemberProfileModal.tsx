"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import { MemberForm } from "./MemberForm";
import { useMembers } from "@/hooks/useMembers";
import type { MemberWithMembership, MemberInsert } from "@/lib/supabase/types/database";

interface EditMemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberWithMembership;
  onSuccess: () => void;
}

export function EditMemberProfileModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: EditMemberProfileModalProps) {
  const { updateMember } = useMembers();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (data: MemberInsert) => {
    setIsSaving(true);
    try {
      await updateMember(member.id, data);
      onSuccess();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar datos — ${member.name}`}
      size="lg"
    >
      <MemberForm
        member={member}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isSaving}
      />
    </Modal>
  );
}
