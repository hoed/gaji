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
      api_keys: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          last_used_at: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          last_used_at?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "attendance_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendance_id: string | null
          created_at: string | null
          description: string | null
          employee_id: string | null
          end_time: string
          event_type: string
          google_event_id: string | null
          id: string
          is_synced: boolean | null
          payroll_id: string | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          attendance_id?: string | null
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          end_time: string
          event_type: string
          google_event_id?: string | null
          id?: string
          is_synced?: boolean | null
          payroll_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          attendance_id?: string | null
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          end_time?: string
          event_type?: string
          google_event_id?: string | null
          id?: string
          is_synced?: boolean | null
          payroll_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "attendance_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "calendar_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          birth_date: string | null
          bpjs_kesehatan: string | null
          bpjs_ketenagakerjaan: string | null
          created_at: string | null
          email: string | null
          first_name: string
          hire_date: string
          id: string
          last_name: string | null
          nik: string | null
          npwp: string | null
          phone: string | null
          position_id: string | null
          tax_status: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          birth_date?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          hire_date: string
          id?: string
          last_name?: string | null
          nik?: string | null
          npwp?: string | null
          phone?: string | null
          position_id?: string | null
          tax_status?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          birth_date?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string | null
          nik?: string | null
          npwp?: string | null
          phone?: string | null
          position_id?: string | null
          tax_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_position_id_fkey"
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
          deductions: number | null
          employee_id: string | null
          id: string
          net_salary: number
          notes: string | null
          overtime: number | null
          payment_date: string | null
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
          deductions?: number | null
          employee_id?: string | null
          id?: string
          net_salary: number
          notes?: string | null
          overtime?: number | null
          payment_date?: string | null
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
          deductions?: number | null
          employee_id?: string | null
          id?: string
          net_salary?: number
          notes?: string | null
          overtime?: number | null
          payment_date?: string | null
          payment_status?: string | null
          period_end?: string
          period_start?: string
          pph21?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "attendance_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          salary_base: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          salary_base: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          salary_base?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      attendance_summary: {
        Row: {
          absent_days: number | null
          employee_id: string | null
          full_name: string | null
          leave_days: number | null
          month: string | null
          present_days: number | null
          sick_days: number | null
          total_days: number | null
        }
        Relationships: []
      }
      payroll_summary: {
        Row: {
          allowances: number | null
          bank_account: string | null
          bank_name: string | null
          basic_salary: number | null
          bpjs_kesehatan_total: number | null
          bpjs_ketenagakerjaan_total: number | null
          deductions: number | null
          department: string | null
          full_name: string | null
          id: string | null
          net_salary: number | null
          overtime: number | null
          payment_status: string | null
          period_end: string | null
          period_start: string | null
          position: string | null
          pph21: number | null
        }
        Relationships: []
      }
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
