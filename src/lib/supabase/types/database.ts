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
      establishments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      establishment_users: {
        Row: {
          id: string;
          establishment_id: string;
          user_id: string | null;
          name: string;
          email: string;
          role: "owner" | "admin" | "trainer" | "partner";
          avatar_url: string | null;
          member_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          user_id?: string | null;
          name: string;
          email: string;
          role: "owner" | "admin" | "trainer" | "partner";
          avatar_url?: string | null;
          member_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          role?: "owner" | "admin" | "trainer" | "partner";
          avatar_url?: string | null;
          member_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "establishment_users_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "establishment_users_user_id_fkey";
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
          establishment_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          emergency_contact: string | null;
          birth_date: string | null;
          sex: "male" | "female" | null;
          photo_url: string | null;
          notes: string | null;
          status: "active" | "inactive" | "suspended";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          birth_date?: string | null;
          sex?: "male" | "female" | null;
          photo_url?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "suspended";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          birth_date?: string | null;
          sex?: "male" | "female" | null;
          photo_url?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "suspended";
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "members_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "establishment_users";
            referencedColumns: ["id"];
          }
        ];
      };
      membership_plans: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          description: string | null;
          duration_days: number;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          description?: string | null;
          duration_days: number;
          price: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          description?: string | null;
          duration_days?: number;
          price?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "membership_plans_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          }
        ];
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
          status: "active" | "expired" | "cancelled" | "frozen";
          frozen_at: string | null;
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
          status?: "active" | "expired" | "cancelled" | "frozen";
          frozen_at?: string | null;
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
          status?: "active" | "expired" | "cancelled" | "frozen";
          frozen_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
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
            referencedRelation: "establishment_users";
            referencedColumns: ["id"];
          }
        ];
      };
      exercises: {
        Row: {
          id: string;
          establishment_id: string | null;
          name: string;
          description: string | null;
          muscle_group: string | null;
          equipment: string | null;
          video_url: string | null;
          image_url: string | null;
          gif_url: string | null;
          instructions: string | null;
          instruction_steps: string[] | null;
          body_part: string | null;
          secondary_muscles: string[] | null;
          attribution: string | null;
          source: string | null;
          source_id: string | null;
          name_en: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id?: string | null;
          name: string;
          description?: string | null;
          muscle_group?: string | null;
          equipment?: string | null;
          video_url?: string | null;
          image_url?: string | null;
          gif_url?: string | null;
          instructions?: string | null;
          instruction_steps?: string[] | null;
          body_part?: string | null;
          secondary_muscles?: string[] | null;
          attribution?: string | null;
          source?: string | null;
          source_id?: string | null;
          name_en?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string | null;
          name?: string;
          description?: string | null;
          muscle_group?: string | null;
          equipment?: string | null;
          video_url?: string | null;
          image_url?: string | null;
          gif_url?: string | null;
          instructions?: string | null;
          instruction_steps?: string[] | null;
          body_part?: string | null;
          secondary_muscles?: string[] | null;
          attribution?: string | null;
          source?: string | null;
          source_id?: string | null;
          name_en?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          }
        ];
      };
      routine_templates: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          description: string | null;
          difficulty: "beginner" | "intermediate" | "advanced" | null;
          created_by: string | null;
          created_at: string;
          member_id: string | null;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          description?: string | null;
          difficulty?: "beginner" | "intermediate" | "advanced" | null;
          created_by?: string | null;
          created_at?: string;
          member_id?: string | null;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          description?: string | null;
          difficulty?: "beginner" | "intermediate" | "advanced" | null;
          created_by?: string | null;
          member_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "routine_templates_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_templates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "establishment_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_templates_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
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
      trainer_members: {
        Row: {
          id: string;
          establishment_id: string;
          trainer_id: string;
          member_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          trainer_id: string;
          member_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          trainer_id?: string;
          member_id?: string;
          assigned_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trainer_members_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_members_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "establishment_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_members_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          }
        ];
      };
      training_sessions: {
        Row: {
          id: string;
          establishment_id: string;
          member_id: string;
          trainer_id: string | null;
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          member_id: string;
          trainer_id?: string | null;
          date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          member_id?: string;
          trainer_id?: string | null;
          date?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "training_sessions_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
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
            referencedRelation: "establishment_users";
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
          warmup_sets: number | null;
          warmup_weight: string | null;
          warmup_reps: string | null;
          effective_sets: number | null;
          effective_reps_range: string | null;
          effective_weight: string | null;
          unit: string | null;
          circuit_group: string | null;
          to_failure: boolean | null;
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
          warmup_sets?: number | null;
          warmup_weight?: string | null;
          warmup_reps?: string | null;
          effective_sets?: number | null;
          effective_reps_range?: string | null;
          effective_weight?: string | null;
          unit?: string | null;
          circuit_group?: string | null;
          to_failure?: boolean | null;
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
          warmup_sets?: number | null;
          warmup_weight?: string | null;
          warmup_reps?: string | null;
          effective_sets?: number | null;
          effective_reps_range?: string | null;
          effective_weight?: string | null;
          unit?: string | null;
          circuit_group?: string | null;
          to_failure?: boolean | null;
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
      discount_coupons: {
        Row: {
          id: string;
          establishment_id: string;
          code: string;
          name: string;
          description: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          min_amount: number;
          max_uses: number | null;
          used_count: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          code: string;
          name: string;
          description?: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          min_amount?: number;
          max_uses?: number | null;
          used_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          discount_type?: "percentage" | "fixed";
          discount_value?: number;
          min_amount?: number;
          max_uses?: number | null;
          used_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discount_coupons_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          }
        ];
      };
      registration_forms: {
        Row: {
          id: string;
          establishment_id: string;
          is_enabled: boolean;
          show_phone: boolean;
          show_birth_date: boolean;
          show_emergency_contact: boolean;
          welcome_title: string | null;
          welcome_message: string | null;
          disabled_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          is_enabled?: boolean;
          show_phone?: boolean;
          show_birth_date?: boolean;
          show_emergency_contact?: boolean;
          welcome_title?: string | null;
          welcome_message?: string | null;
          disabled_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          is_enabled?: boolean;
          show_phone?: boolean;
          show_birth_date?: boolean;
          show_emergency_contact?: boolean;
          welcome_title?: string | null;
          welcome_message?: string | null;
          disabled_message?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registration_forms_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: true;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          }
        ];
      };
      trainer_services: {
        Row: {
          id: string;
          establishment_id: string;
          trainer_id: string | null;
          name: string;
          description: string | null;
          price: number;
          billing_type: "recurring" | "one_off";
          duration_days: number | null;
          kind: "personal_training" | "evaluation" | "other";
          included_with_personal_training: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          trainer_id?: string | null;
          name: string;
          description?: string | null;
          price?: number;
          billing_type?: "recurring" | "one_off";
          duration_days?: number | null;
          kind?: "personal_training" | "evaluation" | "other";
          included_with_personal_training?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          trainer_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          billing_type?: "recurring" | "one_off";
          duration_days?: number | null;
          kind?: "personal_training" | "evaluation" | "other";
          included_with_personal_training?: boolean;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trainer_services_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_services_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "establishment_users";
            referencedColumns: ["id"];
          }
        ];
      };
      service_subscriptions: {
        Row: {
          id: string;
          establishment_id: string;
          member_id: string;
          service_id: string;
          trainer_id: string | null;
          concept: string | null;
          billing_source: "paid" | "included_in_membership";
          start_date: string;
          end_date: string | null;
          amount_paid: number;
          payment_method: "cash" | "card" | "transfer" | null;
          status: "active" | "expired" | "cancelled" | "frozen";
          frozen_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          member_id: string;
          service_id: string;
          trainer_id?: string | null;
          concept?: string | null;
          billing_source?: "paid" | "included_in_membership";
          start_date?: string;
          end_date?: string | null;
          amount_paid?: number;
          payment_method?: "cash" | "card" | "transfer" | null;
          status?: "active" | "expired" | "cancelled" | "frozen";
          frozen_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          member_id?: string;
          service_id?: string;
          trainer_id?: string | null;
          concept?: string | null;
          billing_source?: "paid" | "included_in_membership";
          start_date?: string;
          end_date?: string | null;
          amount_paid?: number;
          payment_method?: "cash" | "card" | "transfer" | null;
          status?: "active" | "expired" | "cancelled" | "frozen";
          frozen_at?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "service_subscriptions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_subscriptions_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "trainer_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_subscriptions_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "establishment_users";
            referencedColumns: ["id"];
          }
        ];
      };
      physical_evaluations: {
        Row: {
          id: string;
          establishment_id: string;
          member_id: string;
          trainer_id: string | null;
          evaluated_on: string;
          weight_kg: number | null;
          height_cm: number | null;
          tricipital_left: number | null;
          tricipital_right: number | null;
          bicipital_left: number | null;
          bicipital_right: number | null;
          cuadriceps_left: number | null;
          cuadriceps_right: number | null;
          pantorrilla_left: number | null;
          pantorrilla_right: number | null;
          pectoral_left: number | null;
          pectoral_right: number | null;
          subescapular: number | null;
          suprailiaco: number | null;
          abdominal: number | null;
          payment_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          member_id: string;
          trainer_id?: string | null;
          evaluated_on?: string;
          weight_kg?: number | null;
          height_cm?: number | null;
          tricipital_left?: number | null;
          tricipital_right?: number | null;
          bicipital_left?: number | null;
          bicipital_right?: number | null;
          cuadriceps_left?: number | null;
          cuadriceps_right?: number | null;
          pantorrilla_left?: number | null;
          pantorrilla_right?: number | null;
          pectoral_left?: number | null;
          pectoral_right?: number | null;
          subescapular?: number | null;
          suprailiaco?: number | null;
          abdominal?: number | null;
          payment_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          member_id?: string;
          trainer_id?: string | null;
          evaluated_on?: string;
          weight_kg?: number | null;
          height_cm?: number | null;
          tricipital_left?: number | null;
          tricipital_right?: number | null;
          bicipital_left?: number | null;
          bicipital_right?: number | null;
          cuadriceps_left?: number | null;
          cuadriceps_right?: number | null;
          pantorrilla_left?: number | null;
          pantorrilla_right?: number | null;
          pectoral_left?: number | null;
          pectoral_right?: number | null;
          subescapular?: number | null;
          suprailiaco?: number | null;
          abdominal?: number | null;
          payment_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "physical_evaluations_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "physical_evaluations_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "establishment_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "physical_evaluations_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "service_subscriptions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_establishment_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_my_member_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_last_exercise_stats: {
        Args: { p_member_id: string; p_exercise_id: string };
        Returns: {
          last_weight: string | null;
          last_unit: string | null;
          last_effective_reps: string | null;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Tipos de fila ────────────────────────────────────────────────────────────
export type Establishment = Database["public"]["Tables"]["establishments"]["Row"];
export type EstablishmentUser = Database["public"]["Tables"]["establishment_users"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type MembershipPlan = Database["public"]["Tables"]["membership_plans"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type RoutineTemplate = Database["public"]["Tables"]["routine_templates"]["Row"];
export type RoutineTemplateExercise = Database["public"]["Tables"]["routine_template_exercises"]["Row"];
export type TrainerMember = Database["public"]["Tables"]["trainer_members"]["Row"];
export type TrainingSession = Database["public"]["Tables"]["training_sessions"]["Row"];
export type SessionExercise = Database["public"]["Tables"]["session_exercises"]["Row"];
export type RegistrationForm = Database["public"]["Tables"]["registration_forms"]["Row"];
export type DiscountCoupon = Database["public"]["Tables"]["discount_coupons"]["Row"];
export type TrainerService = Database["public"]["Tables"]["trainer_services"]["Row"];
export type ServiceSubscription = Database["public"]["Tables"]["service_subscriptions"]["Row"];
export type PhysicalEvaluation = Database["public"]["Tables"]["physical_evaluations"]["Row"];

// ─── Tipos de inserción ───────────────────────────────────────────────────────
export type EstablishmentInsert = Database["public"]["Tables"]["establishments"]["Insert"];
export type EstablishmentUserInsert = Database["public"]["Tables"]["establishment_users"]["Insert"];
export type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];
export type MembershipPlanInsert = Database["public"]["Tables"]["membership_plans"]["Insert"];
export type MembershipInsert = Database["public"]["Tables"]["memberships"]["Insert"];
export type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"];
export type RoutineTemplateInsert = Database["public"]["Tables"]["routine_templates"]["Insert"];
export type RoutineTemplateExerciseInsert = Database["public"]["Tables"]["routine_template_exercises"]["Insert"];
export type TrainerMemberInsert = Database["public"]["Tables"]["trainer_members"]["Insert"];
export type TrainingSessionInsert = Database["public"]["Tables"]["training_sessions"]["Insert"];
export type SessionExerciseInsert = Database["public"]["Tables"]["session_exercises"]["Insert"];
export type RegistrationFormInsert = Database["public"]["Tables"]["registration_forms"]["Insert"];
export type DiscountCouponInsert = Database["public"]["Tables"]["discount_coupons"]["Insert"];
export type TrainerServiceInsert = Database["public"]["Tables"]["trainer_services"]["Insert"];
export type ServiceSubscriptionInsert = Database["public"]["Tables"]["service_subscriptions"]["Insert"];
export type PhysicalEvaluationInsert = Database["public"]["Tables"]["physical_evaluations"]["Insert"];

// ─── Tipos de actualización ───────────────────────────────────────────────────
export type EstablishmentUpdate = Database["public"]["Tables"]["establishments"]["Update"];
export type EstablishmentUserUpdate = Database["public"]["Tables"]["establishment_users"]["Update"];
export type MemberUpdate = Database["public"]["Tables"]["members"]["Update"];
export type MembershipPlanUpdate = Database["public"]["Tables"]["membership_plans"]["Update"];
export type MembershipUpdate = Database["public"]["Tables"]["memberships"]["Update"];
export type ExerciseUpdate = Database["public"]["Tables"]["exercises"]["Update"];
export type RoutineTemplateUpdate = Database["public"]["Tables"]["routine_templates"]["Update"];
export type RoutineTemplateExerciseUpdate = Database["public"]["Tables"]["routine_template_exercises"]["Update"];
export type TrainerMemberUpdate = Database["public"]["Tables"]["trainer_members"]["Update"];
export type TrainingSessionUpdate = Database["public"]["Tables"]["training_sessions"]["Update"];
export type SessionExerciseUpdate = Database["public"]["Tables"]["session_exercises"]["Update"];
export type RegistrationFormUpdate = Database["public"]["Tables"]["registration_forms"]["Update"];
export type DiscountCouponUpdate = Database["public"]["Tables"]["discount_coupons"]["Update"];
export type TrainerServiceUpdate = Database["public"]["Tables"]["trainer_services"]["Update"];
export type ServiceSubscriptionUpdate = Database["public"]["Tables"]["service_subscriptions"]["Update"];
export type PhysicalEvaluationUpdate = Database["public"]["Tables"]["physical_evaluations"]["Update"];

// ─── Tipos extendidos con relaciones ─────────────────────────────────────────
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
  establishment_users?: EstablishmentUser | null;
  session_exercises?: (SessionExercise & {
    exercises?: Exercise | null;
  })[];
};

export type RoutineTemplateWithExercises = RoutineTemplate & {
  routine_template_exercises?: (RoutineTemplateExercise & {
    exercises?: Exercise | null;
  })[];
};

export type EstablishmentUserWithMember = EstablishmentUser & {
  members?: Member | null;
};

// Alias semántico para el rol partner
export type PartnerUser = EstablishmentUser & {
  role: "partner";
  member_id: string;
  members?: Member | null;
};

// ─── Servicios del entrenador ────────────────────────────────────────────────
export type ServiceSubscriptionWithDetails = ServiceSubscription & {
  trainer_services?: TrainerService | null;
  members?: Member | null;
};

/** Un miembro visto desde el negocio del entrenador: su personalizado vigente. */
export type PersonalTrainingClient = Member & {
  subscriptions: ServiceSubscriptionWithDetails[];
  current_subscription: ServiceSubscriptionWithDetails | null;
};

export type PhysicalEvaluationWithMember = PhysicalEvaluation & {
  members?: Member | null;
  establishment_users?: EstablishmentUser | null;
};
