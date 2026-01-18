"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TrainingSessionWithDetails } from "@/lib/types/database";
import { Header } from "@/components/layout";
import {
  Card,
  Button,
  Spinner,
  Avatar,
  Badge,
} from "@/components/ui";
import { ArrowLeft, Calendar, User, Dumbbell, Weight } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TrainingSessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("training_sessions")
      .select(`
        *,
        members (*),
        staff (*),
        session_exercises (
          *,
          exercises (*)
        )
      `)
      .eq("id", sessionId)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const sessionData = data as TrainingSessionWithDetails;

    // Sort exercises by order_index
    if (sessionData.session_exercises) {
      sessionData.session_exercises.sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      );
    }

    setSession(sessionData);
    setLoading(false);
  }, [sessionId, supabase]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <p className="text-danger">{error || "Sesión no encontrada."}</p>
        <Link href="/training">
          <Button variant="secondary" className="mt-4">
            Volver a entrenamientos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Header title="" showSearch={false} />

      <div className="p-6">
        {/* Back button */}
        <Link
          href="/training"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a entrenamientos
        </Link>

        {/* Session header */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Avatar
                src={session.members?.photo_url}
                name={session.members?.name || ""}
                size="lg"
              />
              <div>
                <Link
                  href={`/members/${session.member_id}`}
                  className="text-xl font-bold text-text-primary hover:text-primary transition-colors"
                >
                  {session.members?.name}
                </Link>
                <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(session.date)}
                  </div>
                  {session.staff && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {session.staff.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="primary" className="text-lg px-4 py-2">
              {session.session_exercises?.length || 0} ejercicios
            </Badge>
          </div>

          {session.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-text-secondary">{session.notes}</p>
            </div>
          )}
        </Card>

        {/* Exercises */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Ejercicios realizados
        </h2>

        <div className="space-y-4">
          {session.session_exercises?.map((exercise, index) => (
            <Card key={exercise.id}>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-2">
                    {exercise.exercises?.name || "Ejercicio"}
                  </h3>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Dumbbell className="h-4 w-4 text-text-secondary" />
                      <span className="text-text-primary">
                        {exercise.sets_completed} series x {exercise.reps_completed} reps
                      </span>
                    </div>

                    {exercise.weight && exercise.weight > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Weight className="h-4 w-4 text-text-secondary" />
                        <span className="text-text-primary">
                          {exercise.weight} kg
                        </span>
                      </div>
                    )}
                  </div>

                  {exercise.notes && (
                    <p className="mt-2 text-sm text-text-secondary">
                      {exercise.notes}
                    </p>
                  )}

                  {exercise.exercises?.muscle_group && (
                    <Badge variant="default" size="sm" className="mt-2">
                      {exercise.exercises.muscle_group}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
