"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Member, MemberInsert, MemberUpdate, MemberWithMembership } from "@/lib/types/database";

export function useMembers() {
  const [members, setMembers] = useState<MemberWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("members")
      .select(`
        *,
        memberships (
          *,
          membership_plans (
            *
          )
        )
      `)
      .order("name");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Add current membership info
    const membersWithCurrentMembership = data.map((member) => {
      const activeMembership = member.memberships?.find(
        (m: { status: string }) => m.status === "active"
      );
      return {
        ...member,
        current_membership: activeMembership || null,
      };
    });

    setMembers(membersWithCurrentMembership);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const createMember = async (memberData: MemberInsert): Promise<Member> => {
    const { data, error } = await supabase
      .from("members")
      .insert(memberData)
      .select()
      .single();

    if (error) throw error;
    await fetchMembers();
    return data as Member;
  };

  const updateMember = async (id: string, memberData: MemberUpdate) => {
    const { data, error } = await supabase
      .from("members")
      .update({ ...memberData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    await fetchMembers();
    return data;
  };

  const deleteMember = async (id: string) => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) throw error;
    await fetchMembers();
  };

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    createMember,
    updateMember,
    deleteMember,
  };
}

export function useMember(id: string) {
  const [member, setMember] = useState<MemberWithMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMember = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("members")
      .select(`
        *,
        memberships (
          *,
          membership_plans (*)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const activeMembership = data.memberships?.find(
      (m: { status: string }) => m.status === "active"
    );

    setMember({
      ...data,
      current_membership: activeMembership || null,
    });
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  return { member, loading, error, refetch: fetchMember };
}
