export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      ai_response_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          request_type: string
          response_action: Json | null
          response_message: string
          tokens_saved: number
          user_id: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at?: string
          id?: string
          request_type: string
          response_action?: Json | null
          response_message: string
          tokens_saved?: number
          user_id: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          request_type?: string
          response_action?: Json | null
          response_message?: string
          tokens_saved?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          action_type: string | null
          created_at: string
          id: string
          request_type: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          action_type?: string | null
          created_at?: string
          id?: string
          request_type: string
          tokens_used?: number
          user_id: string
        }
        Update: {
          action_type?: string | null
          created_at?: string
          id?: string
          request_type?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: []
      }
      category: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      data_export_log: {
        Row: {
          exported_at: string | null
          id: string
          table_name: string
          user_id: string
        }
        Insert: {
          exported_at?: string | null
          id?: string
          table_name: string
          user_id: string
        }
        Update: {
          exported_at?: string | null
          id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      intent_cache: {
        Row: {
          canonical_text: string
          created_at: string
          embedding: string
          extraction_hints: string | null
          function_name: string
          id: string
          params_template: Json
          updated_at: string
          usage_count: number
        }
        Insert: {
          canonical_text: string
          created_at?: string
          embedding: string
          extraction_hints?: string | null
          function_name: string
          id?: string
          params_template?: Json
          updated_at?: string
          usage_count?: number
        }
        Update: {
          canonical_text?: string
          created_at?: string
          embedding?: string
          extraction_hints?: string | null
          function_name?: string
          id?: string
          params_template?: Json
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      payment_log: {
        Row: {
          amount_cents: number | null
          created_at: string
          event_type: string
          id: string
          mp_payment_id: string | null
          mp_preapproval_id: string | null
          raw_payload: Json | null
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          event_type: string
          id?: string
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          raw_payload?: Json | null
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          event_type?: string
          id?: string
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          raw_payload?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          email: string
          is_onboarded: boolean
          locale: string
          name: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email: string
          is_onboarded?: boolean
          locale?: string
          name?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email?: string
          is_onboarded?: boolean
          locale?: string
          name?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: []
      }
      spending_limit: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
          year_month: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          year_month: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          year_month?: string
        }
        Relationships: []
      }
      subscription: {
        Row: {
          ai_image_limit: number
          ai_requests_limit: number
          ai_text_limit: number
          ai_voice_limit: number
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mp_payment_id: string | null
          mp_payment_status: string | null
          mp_preapproval_id: string | null
          payment_method: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_image_limit?: number
          ai_requests_limit?: number
          ai_text_limit?: number
          ai_voice_limit?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_payment_status?: string | null
          mp_preapproval_id?: string | null
          payment_method?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_image_limit?: number
          ai_requests_limit?: number
          ai_text_limit?: number
          ai_voice_limit?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_payment_status?: string | null
          mp_preapproval_id?: string | null
          payment_method?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      credit_card: {
        Row: {
          bank: string | null
          closing_day: number | null
          color: string | null
          created_at: string | null
          credit_limit_cents: number | null
          expiration_day: number | null
          flag: string | null
          id: string | null
          is_active: boolean | null
          last_4_digits: string | null
          name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank?: string | null
          closing_day?: number | null
          color?: string | null
          created_at?: string | null
          credit_limit_cents?: never
          expiration_day?: number | null
          flag?: string | null
          id?: string | null
          is_active?: boolean | null
          last_4_digits?: never
          name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank?: string | null
          closing_day?: number | null
          color?: string | null
          created_at?: string | null
          credit_limit_cents?: never
          expiration_day?: number | null
          flag?: string | null
          id?: string | null
          is_active?: boolean | null
          last_4_digits?: never
          name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expense: {
        Row: {
          amount_cents: number | null
          category_id: string | null
          created_at: string | null
          credit_card_id: string | null
          date: string | null
          description: string | null
          id: string | null
          installment_current: number | null
          installment_group_id: string | null
          installment_total: number | null
          invoice_id: string | null
          is_recurrent: boolean | null
          payment_method: Database['public']['Enums']['payment_method'] | null
          recurrence_day: number | null
          recurrence_end: string | null
          recurrence_start: string | null
          recurrent_group_id: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents?: never
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          date?: string | null
          description?: never
          id?: string | null
          installment_current?: number | null
          installment_group_id?: string | null
          installment_total?: number | null
          invoice_id?: string | null
          is_recurrent?: boolean | null
          payment_method?: Database['public']['Enums']['payment_method'] | null
          recurrence_day?: number | null
          recurrence_end?: string | null
          recurrence_start?: string | null
          recurrent_group_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: never
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          date?: string | null
          description?: never
          id?: string | null
          installment_current?: number | null
          installment_group_id?: string | null
          installment_total?: number | null
          invoice_id?: string | null
          is_recurrent?: boolean | null
          payment_method?: Database['public']['Enums']['payment_method'] | null
          recurrence_day?: number | null
          recurrence_end?: string | null
          recurrence_start?: string | null
          recurrent_group_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoice: {
        Row: {
          carry_over_cents: number | null
          created_at: string | null
          credit_card_id: string | null
          cycle_end: string | null
          cycle_start: string | null
          id: string | null
          paid_amount_cents: number | null
          paid_at: string | null
          reference_month: string | null
          status: Database['public']['Enums']['invoice_status'] | null
          total_amount_cents: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          carry_over_cents?: never
          created_at?: string | null
          credit_card_id?: string | null
          cycle_end?: string | null
          cycle_start?: string | null
          id?: string | null
          paid_amount_cents?: never
          paid_at?: string | null
          reference_month?: string | null
          status?: Database['public']['Enums']['invoice_status'] | null
          total_amount_cents?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          carry_over_cents?: never
          created_at?: string | null
          credit_card_id?: string | null
          cycle_end?: string | null
          cycle_start?: string | null
          id?: string | null
          paid_amount_cents?: never
          paid_at?: string | null
          reference_month?: string | null
          status?: Database['public']['Enums']['invoice_status'] | null
          total_amount_cents?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      salary_history: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          effective_from: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents?: never
          created_at?: string | null
          effective_from?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: never
          created_at?: string | null
          effective_from?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_referral_reward: {
        Args: { p_referral_code: string; p_referred_user_id: string }
        Returns: Json
      }
      cleanup_expired_ai_cache: { Args: never; Returns: number }
      cleanup_low_usage_intents: {
        Args: { min_age_days?: number; min_usage?: number }
        Returns: number
      }
      downgrade_expired_pix_subscriptions: { Args: never; Returns: undefined }
      execute_readonly_sql: { Args: { query_text: string }; Returns: Json }
      extend_recurrent_expenses: { Args: never; Returns: undefined }
      find_similar_intent: {
        Args: {
          max_results?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          canonical_text: string
          extraction_hints: string
          function_name: string
          id: string
          params_template: Json
          similarity: number
          usage_count: number
        }[]
      }
      get_referred_user_names: {
        Args: { p_referred_user_ids: string[] }
        Returns: {
          name: string
          user_id: string
        }[]
      }
      upsert_salary: {
        Args: {
          p_amount_cents: number
          p_effective_from: string
          p_user_id: string
        }
        Returns: {
          amount_cents: number | null
          created_at: string | null
          effective_from: string | null
          id: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: '*'
          to: 'salary_history'
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      invoice_status: 'open' | 'partially_paid' | 'paid'
      payment_method: 'credit_card' | 'debit_card' | 'pix' | 'cash'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      invoice_status: ['open', 'partially_paid', 'paid'],
      payment_method: ['credit_card', 'debit_card', 'pix', 'cash'],
    },
  },
} as const
