export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          nickname: string | null;
          anonymous_alias: string | null;
          mobile_number: string | null;
          pronouns: string | null;
          role: string | null;
          is_active: boolean | null;
          base_tolerance: string | null;
          literature_prompt_status: string | null;
          onboarding_completed?: boolean | null;
          account_created_at?: string | null;
          created_at?: string | null;
          last_survey_prompted_at?: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          nickname?: string | null;
          anonymous_alias?: string | null;
          mobile_number?: string | null;
          pronouns?: string | null;
          role?: string | null;
          is_active?: boolean | null;
          base_tolerance?: string | null;
          literature_prompt_status?: string | null;
          onboarding_completed?: boolean | null;
          account_created_at?: string | null;
          created_at?: string | null;
          last_survey_prompted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          nickname?: string | null;
          anonymous_alias?: string | null;
          mobile_number?: string | null;
          pronouns?: string | null;
          role?: string | null;
          is_active?: boolean | null;
          base_tolerance?: string | null;
          literature_prompt_status?: string | null;
          onboarding_completed?: boolean | null;
          account_created_at?: string | null;
          created_at?: string | null;
          last_survey_prompted_at?: string | null;
        };
      };
      invitations: {
        Row: {
          id: string;
          sender_id: string | null;
          recipient_identifier: string | null;
          status: string;
          expires_at: string | null;
          invite_token: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id?: string | null;
          recipient_identifier?: string | null;
          status?: string;
          expires_at?: string | null;
          invite_token?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string | null;
          recipient_identifier?: string | null;
          status?: string;
          expires_at?: string | null;
          invite_token?: string;
          created_at?: string | null;
        };
      };
      in_app_messages: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      generated_content: {
        Row: {
          id: string;
          user_id: string;
          content_type: string;
          title: string;
          body: string;
          pre_experience_tasks?: string[] | null;
          status: string;
          tolerance_tier?: string | null;
          play_mode?: string | null;
          theme_tags?: string | null;
          theme_embedding?: number[] | string | null;
          created_at?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: string;
          title: string;
          body: string;
          pre_experience_tasks?: string[] | null;
          status?: string;
          tolerance_tier?: string | null;
          play_mode?: string | null;
          theme_tags?: string | null;
          theme_embedding?: number[] | string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_type?: string;
          title?: string;
          body?: string;
          pre_experience_tasks?: string[] | null;
          status?: string;
          tolerance_tier?: string | null;
          play_mode?: string | null;
          theme_tags?: string | null;
          theme_embedding?: number[] | string | null;
          created_at?: string | null;
        };
      };
      style_references: {
        Row: {
          id: string;
          title: string;
          author?: string | null;
          excerpt: string;
          pacing?: string | null;
          boundary_level?: string | null;
          rating?: number | null;
          theme_embedding?: number[] | string | null;
          tags?: string[] | null;
          created_at?: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          author?: string | null;
          excerpt: string;
          pacing?: string | null;
          boundary_level?: string | null;
          rating?: number | null;
          theme_embedding?: number[] | string | null;
          tags?: string[] | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          author?: string | null;
          excerpt?: string;
          pacing?: string | null;
          boundary_level?: string | null;
          rating?: number | null;
          theme_embedding?: number[] | string | null;
          tags?: string[] | null;
          created_at?: string | null;
        };
      };
      saved_pass_configs: {
        Row: {
          id: string;
          user_id: string | null;
          config_name: string | null;
          selected_boundaries: any | null;
          instructions: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          config_name?: string | null;
          selected_boundaries?: any | null;
          instructions?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          config_name?: string | null;
          selected_boundaries?: any | null;
          instructions?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
}
