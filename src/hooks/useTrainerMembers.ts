"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Member, Staff } from "@/lib/types/database";

export function useTrainerMembers(trainerId?: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTrainerMembers = useCallback(async () => {
    if (!trainerId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("trainer_members")
      .select(`
        id,
        member_id,
        members (*)
      `)
      .eq("trainer_id", trainerId);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Type definition for the joined query result
    type TrainerMemberWithMember = {
      members: Member;
    };

    const membersList = (data as unknown as TrainerMemberWithMember[])
      .map((tm) => tm.members)
      .filter(Boolean);

    setMembers(membersList);
    setLoading(false);
  }, [trainerId, supabase]);

  useEffect(() => {
    fetchTrainerMembers();
  }, [fetchTrainerMembers]);

  return { members, loading, error, refetch: fetchTrainerMembers };
}

export function useMemberTrainer(memberId?: string) {
  const [trainer, setTrainer] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMemberTrainer = useCallback(async () => {
    if (!memberId) {
      setTrainer(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("trainer_members")
      .select(`
        id,
        trainer_id,
        staff!trainer_members_trainer_id_fkey (*)
      `)
      .eq("member_id", memberId)
      .maybeSingle();

    if (error) {
      setLoading(false);
      return;
    }

    // Type definition for the joined query result
    type TrainerMemberWithStaff = {
      staff: Staff;
    };

    setTrainer((data as unknown as TrainerMemberWithStaff)?.staff || null);
    setLoading(false);
  }, [memberId, supabase]);

  useEffect(() => {
    fetchMemberTrainer();
  }, [fetchMemberTrainer]);

  const assignTrainer = async (trainerId: string) => {
    // Remove existing assignment first
    await supabase
      .from("trainer_members")
      .delete()
      .eq("member_id", memberId!);

    const { error } = await supabase
      .from("trainer_members")
      .insert({ trainer_id: trainerId, member_id: memberId! });

    if (error) throw error;
    await fetchMemberTrainer();
  };

  const unassignTrainer = async () => {
    const { error } = await supabase
      .from("trainer_members")
      .delete()
      .eq("member_id", memberId!);

    if (error) throw error;
    await fetchMemberTrainer();
  };

  return { trainer, loading, refetch: fetchMemberTrainer, assignTrainer, unassignTrainer };
}

export function useStaffTrainers() {
  const [trainers, setTrainers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("staff")
        .select("*")
        .eq("role", "trainer")
        .order("name");

      setTrainers(data || []);
      setLoading(false);
    }
    fetch();
  }, [supabase]);

  return { trainers, loading };
}

export function useCurrentTrainerId() {
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTrainerId() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: staff } = await supabase
        .from("staff")
        .select("id")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .single();

      if (staff) {
        setTrainerId(staff.id);
      }
      setLoading(false);
    }

    fetchTrainerId();
  }, [supabase]);

  return { trainerId, loading };
}
