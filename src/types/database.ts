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
    };
  };
}
