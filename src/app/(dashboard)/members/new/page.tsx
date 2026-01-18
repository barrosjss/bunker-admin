"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMembers } from "@/hooks/useMembers";
import { MemberForm } from "@/components/members";
import { Header } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import { MemberInsert } from "@/lib/types/database";

export default function NewMemberPage() {
  const router = useRouter();
  const { createMember } = useMembers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: MemberInsert) => {
    setIsSubmitting(true);
    try {
      const member = await createMember(data);
      router.push(`/members/${member.id}`);
    } catch (err) {
      console.error("Error creating member:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="" showSearch={false} />

      <div className="p-6 max-w-2xl mx-auto">
        {/* Back button */}
        <Link
          href="/members"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a miembros
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Nuevo miembro</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberForm
              onSubmit={handleSubmit}
              onCancel={() => router.push("/members")}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
