export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          role: "admin" | "trainer";
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          role?: "admin" | "trainer";
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          role?: "admin" | "trainer";
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      members: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          emergency_contact: string | null;
          birth_date: string | null;
          photo_url: string | null;
          notes: string | null;
          status: "active" | "inactive" | "suspended";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          birth_date?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          birth_date?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "suspended";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      membership_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration_days: number;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          duration_days: number;
          price: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          duration_days?: number;
          price?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          member_id: string;
          plan_id: string | null;
          start_date: string;
          end_date: string;
          amount_paid: number;
          payment_method: "cash" | "card" | "transfer" | null;
          status: "active" | "expired" | "cancelled";
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          plan_id?: string | null;
          start_date: string;
          end_date: string;
          amount_paid: number;
          payment_method?: "cash" | "card" | "transfer" | null;
          status?: "active" | "expired" | "cancelled";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          plan_id?: string | null;
          start_date?: string;
          end_date?: string;
          amount_paid?: number;
          payment_method?: "cash" | "card" | "transfer" | null;
          status?: "active" | "expired" | "cancelled";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "membership_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          }
        ];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          muscle_group: string | null;
          equipment: string | null;
          video_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          muscle_group?: string | null;
          equipment?: string | null;
          video_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          muscle_group?: string | null;
          equipment?: string | null;
          video_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      routine_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          difficulty: "beginner" | "intermediate" | "advanced" | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          difficulty?: "beginner" | "intermediate" | "advanced" | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          difficulty?: "beginner" | "intermediate" | "advanced" | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_templates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          }
        ];
      };
      routine_template_exercises: {
        Row: {
          id: string;
          template_id: string;
          exercise_id: string | null;
          sets: number | null;
          reps: string | null;
          rest_seconds: number | null;
          order_index: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          exercise_id?: string | null;
          sets?: number | null;
          reps?: string | null;
          rest_seconds?: number | null;
          order_index?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          exercise_id?: string | null;
          sets?: number | null;
          reps?: string | null;
          rest_seconds?: number | null;
          order_index?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "routine_template_exercises_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "routine_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_template_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          }
        ];
      };
      training_sessions: {
        Row: {
          id: string;
          member_id: string;
          trainer_id: string | null;
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          trainer_id?: string | null;
          date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          trainer_id?: string | null;
          date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_sessions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_sessions_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          }
        ];
      };
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string | null;
          sets_completed: number | null;
          reps_completed: string | null;
          weight: number | null;
          notes: string | null;
          order_index: number | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id?: string | null;
          sets_completed?: number | null;
          reps_completed?: string | null;
          weight?: number | null;
          notes?: string | null;
          order_index?: number | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string | null;
          sets_completed?: number | null;
          reps_completed?: string | null;
          weight?: number | null;
          notes?: string | null;
          order_index?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "session_exercises_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "training_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Staff = Database["public"]["Tables"]["staff"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type MembershipPlan = Database["public"]["Tables"]["membership_plans"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type RoutineTemplate = Database["public"]["Tables"]["routine_templates"]["Row"];
export type RoutineTemplateExercise = Database["public"]["Tables"]["routine_template_exercises"]["Row"];
export type TrainingSession = Database["public"]["Tables"]["training_sessions"]["Row"];
export type SessionExercise = Database["public"]["Tables"]["session_exercises"]["Row"];

// Insert types
export type StaffInsert = Database["public"]["Tables"]["staff"]["Insert"];
export type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];
export type MembershipPlanInsert = Database["public"]["Tables"]["membership_plans"]["Insert"];
export type MembershipInsert = Database["public"]["Tables"]["memberships"]["Insert"];
export type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"];
export type RoutineTemplateInsert = Database["public"]["Tables"]["routine_templates"]["Insert"];
export type RoutineTemplateExerciseInsert = Database["public"]["Tables"]["routine_template_exercises"]["Insert"];
export type TrainingSessionInsert = Database["public"]["Tables"]["training_sessions"]["Insert"];
export type SessionExerciseInsert = Database["public"]["Tables"]["session_exercises"]["Insert"];

// Update types
export type StaffUpdate = Database["public"]["Tables"]["staff"]["Update"];
export type MemberUpdate = Database["public"]["Tables"]["members"]["Update"];
export type MembershipPlanUpdate = Database["public"]["Tables"]["membership_plans"]["Update"];
export type MembershipUpdate = Database["public"]["Tables"]["memberships"]["Update"];
export type ExerciseUpdate = Database["public"]["Tables"]["exercises"]["Update"];
export type RoutineTemplateUpdate = Database["public"]["Tables"]["routine_templates"]["Update"];
export type RoutineTemplateExerciseUpdate = Database["public"]["Tables"]["routine_template_exercises"]["Update"];
export type TrainingSessionUpdate = Database["public"]["Tables"]["training_sessions"]["Update"];
export type SessionExerciseUpdate = Database["public"]["Tables"]["session_exercises"]["Update"];

// Extended types with relations
export type MembershipWithPlan = Membership & {
  membership_plans?: MembershipPlan | null;
  members?: Member | null;
};

export type MemberWithMembership = Member & {
  memberships?: MembershipWithPlan[];
  current_membership?: MembershipWithPlan | null;
};

export type TrainingSessionWithDetails = TrainingSession & {
  members?: Member | null;
  staff?: Staff | null;
  session_exercises?: (SessionExercise & {
    exercises?: Exercise | null;
  })[];
};

export type RoutineTemplateWithExercises = RoutineTemplate & {
  routine_template_exercises?: (RoutineTemplateExercise & {
    exercises?: Exercise | null;
  })[];
};
