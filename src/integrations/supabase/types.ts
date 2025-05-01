export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      absences: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          key: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          api_key_id: string | null
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          payroll_event_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_id?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: string
          payroll_event_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_id?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          payroll_event_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_payroll_event_id_fkey"
            columns: ["payroll_event_id"]
            isOneToOne: false
            referencedRelation: "payroll_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_api_key"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          api_key_id: string | null
          check_in: string | null
          check_out: string | null
          created_at: string | null
          description: string | null
          earliest_check_in_attendance_id: string | null
          end_time: string
          id: string
          is_synced: boolean | null
          latest_check_out_attendance_id: string | null
          payroll_event_id: string | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          api_key_id?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          description?: string | null
          earliest_check_in_attendance_id?: string | null
          end_time: string
          id?: string
          is_synced?: boolean | null
          latest_check_out_attendance_id?: string | null
          payroll_event_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          api_key_id?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          description?: string | null
          earliest_check_in_attendance_id?: string | null
          end_time?: string
          id?: string
          is_synced?: boolean | null
          latest_check_out_attendance_id?: string | null
          payroll_event_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_earliest_check_in_attendance_id_fkey"
            columns: ["earliest_check_in_attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_latest_check_out_attendance_id_fkey"
            columns: ["latest_check_out_attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_payroll_event_id_fkey"
            columns: ["payroll_event_id"]
            isOneToOne: false
            referencedRelation: "payroll_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_calendar_events_api_key"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          api_key_id: string | null
          bank_account: string | null
          bank_name: string | null
          basic_salary: number | null
          birth_date: string | null
          bpjs_account: string | null
          bpjs_kes_company: number | null
          bpjs_kes_employee: number | null
          bpjs_tk_jht_company: number | null
          bpjs_tk_jht_employee: number | null
          bpjs_tk_jkk: number | null
          bpjs_tk_jkm: number | null
          created_at: string | null
          department_id: string | null
          email: string | null
          first_name: string
          hire_date: string
          id: string
          incentive: number | null
          last_name: string | null
          npwp_account: string | null
          phone: string | null
          position_id: string | null
          pph21: number | null
          transportation_fee: number | null
          updated_at: string | null
        }
        Insert: {
          api_key_id?: string | null
          bank_account?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          birth_date?: string | null
          bpjs_account?: string | null
          bpjs_kes_company?: number | null
          bpjs_kes_employee?: number | null
          bpjs_tk_jht_company?: number | null
          bpjs_tk_jht_employee?: number | null
          bpjs_tk_jkk?: number | null
          bpjs_tk_jkm?: number | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          first_name: string
          hire_date: string
          id?: string
          incentive?: number | null
          last_name?: string | null
          npwp_account?: string | null
          phone?: string | null
          position_id?: string | null
          pph21?: number | null
          transportation_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          api_key_id?: string | null
          bank_account?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          birth_date?: string | null
          bpjs_account?: string | null
          bpjs_kes_company?: number | null
          bpjs_kes_employee?: number | null
          bpjs_tk_jht_company?: number | null
          bpjs_tk_jht_employee?: number | null
          bpjs_tk_jkk?: number | null
          bpjs_tk_jkm?: number | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          first_name?: string
          hire_date?: string
          id?: string
          incentive?: number | null
          last_name?: string | null
          npwp_account?: string | null
          phone?: string | null
          position_id?: string | null
          pph21?: number | null
          transportation_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employees_api_key"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_position"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          allowances: number | null
          basic_salary: number
          bpjs_kes_company: number | null
          bpjs_kes_employee: number | null
          bpjs_tk_jht_company: number | null
          bpjs_tk_jht_employee: number | null
          bpjs_tk_jkk: number | null
          bpjs_tk_jkm: number | null
          bpjs_tk_jp_company: number | null
          bpjs_tk_jp_employee: number | null
          created_at: string | null
          employee_id: string | null
          id: string
          net_salary: number
          payment_status: string | null
          period_end: string
          period_start: string
          pph21: number | null
          updated_at: string | null
        }
        Insert: {
          allowances?: number | null
          basic_salary: number
          bpjs_kes_company?: number | null
          bpjs_kes_employee?: number | null
          bpjs_tk_jht_company?: number | null
          bpjs_tk_jht_employee?: number | null
          bpjs_tk_jkk?: number | null
          bpjs_tk_jkm?: number | null
          bpjs_tk_jp_company?: number | null
          bpjs_tk_jp_employee?: number | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          net_salary: number
          payment_status?: string | null
          period_end: string
          period_start: string
          pph21?: number | null
          updated_at?: string | null
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          bpjs_kes_company?: number | null
          bpjs_kes_employee?: number | null
          bpjs_tk_jht_company?: number | null
          bpjs_tk_jht_employee?: number | null
          bpjs_tk_jkk?: number | null
          bpjs_tk_jkm?: number | null
          bpjs_tk_jp_company?: number | null
          bpjs_tk_jp_employee?: number | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          net_salary?: number
          payment_status?: string | null
          period_end?: string
          period_start?: string
          pph21?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payroll_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_events: {
        Row: {
          attendance_id: string | null
          calendar_event_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_type: string
          id: string
          payroll_id: string | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          attendance_id?: string | null
          calendar_event_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          payroll_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          attendance_id?: string | null
          calendar_event_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          payroll_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_events_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_events_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_events_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
