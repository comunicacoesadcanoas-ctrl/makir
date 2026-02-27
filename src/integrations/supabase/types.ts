export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      discipulos: {
        Row: {
          data_inicio: string
          discipulador_id: string
          discipulador_nome: string
          id: string
          licoes_concluidas: number
          progresso_percentual: number
          status_cor: Database["public"]["Enums"]["status_cor_enum"]
          ultima_atividade: string | null
          visitante_id: string
        }
        Insert: {
          data_inicio?: string
          discipulador_id: string
          discipulador_nome: string
          id?: string
          licoes_concluidas?: number
          progresso_percentual?: number
          status_cor?: Database["public"]["Enums"]["status_cor_enum"]
          ultima_atividade?: string | null
          visitante_id: string
        }
        Update: {
          data_inicio?: string
          discipulador_id?: string
          discipulador_nome?: string
          id?: string
          licoes_concluidas?: number
          progresso_percentual?: number
          status_cor?: Database["public"]["Enums"]["status_cor_enum"]
          ultima_atividade?: string | null
          visitante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipulos_visitante_id_fkey"
            columns: ["visitante_id"]
            isOneToOne: true
            referencedRelation: "visitantes"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_crescimento: {
        Row: {
          bairro: string | null
          capacidade: number | null
          criado_em: string
          data_inicio: string | null
          dia_encontro: string[] | null
          endereco: string | null
          horario: string | null
          id: string
          latitude: number | null
          lider_email: string | null
          lider_nome: string
          lider_usuario_id: string | null
          longitude: number | null
          nome: string
          observacoes: string | null
          status_cor: Database["public"]["Enums"]["status_cor_enum"]
          status_gc: Database["public"]["Enums"]["status_gc_enum"]
          telefone_contato: string | null
          total_membros: number | null
          zona: string | null
        }
        Insert: {
          bairro?: string | null
          capacidade?: number | null
          criado_em?: string
          data_inicio?: string | null
          dia_encontro?: string[] | null
          endereco?: string | null
          horario?: string | null
          id?: string
          latitude?: number | null
          lider_email?: string | null
          lider_nome: string
          lider_usuario_id?: string | null
          longitude?: number | null
          nome: string
          observacoes?: string | null
          status_cor?: Database["public"]["Enums"]["status_cor_enum"]
          status_gc?: Database["public"]["Enums"]["status_gc_enum"]
          telefone_contato?: string | null
          total_membros?: number | null
          zona?: string | null
        }
        Update: {
          bairro?: string | null
          capacidade?: number | null
          criado_em?: string
          data_inicio?: string | null
          dia_encontro?: string[] | null
          endereco?: string | null
          horario?: string | null
          id?: string
          latitude?: number | null
          lider_email?: string | null
          lider_nome?: string
          lider_usuario_id?: string | null
          longitude?: number | null
          nome?: string
          observacoes?: string | null
          status_cor?: Database["public"]["Enums"]["status_cor_enum"]
          status_gc?: Database["public"]["Enums"]["status_gc_enum"]
          telefone_contato?: string | null
          total_membros?: number | null
          zona?: string | null
        }
        Relationships: []
      }
      licoes: {
        Row: {
          concluida: boolean
          data_conclusao: string | null
          discipulo_id: string
          id: string
          numero: number
        }
        Insert: {
          concluida?: boolean
          data_conclusao?: string | null
          discipulo_id: string
          id?: string
          numero: number
        }
        Update: {
          concluida?: boolean
          data_conclusao?: string | null
          discipulo_id?: string
          id?: string
          numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "licoes_discipulo_id_fkey"
            columns: ["discipulo_id"]
            isOneToOne: false
            referencedRelation: "discipulos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          criado_em: string
          id: string
          lida: boolean
          mensagem: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          lida?: boolean
          mensagem: string
          tipo: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      relatorios: {
        Row: {
          criado_em: string
          data_hora: string
          discipulador_id: string
          discipulo_id: string
          id: string
          licao_numero: number
          observacoes: string
          status_sessao: Database["public"]["Enums"]["status_sessao_enum"]
        }
        Insert: {
          criado_em?: string
          data_hora?: string
          discipulador_id: string
          discipulo_id: string
          id?: string
          licao_numero: number
          observacoes: string
          status_sessao?: Database["public"]["Enums"]["status_sessao_enum"]
        }
        Update: {
          criado_em?: string
          data_hora?: string
          discipulador_id?: string
          discipulo_id?: string
          id?: string
          licao_numero?: number
          observacoes?: string
          status_sessao?: Database["public"]["Enums"]["status_sessao_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_discipulo_id_fkey"
            columns: ["discipulo_id"]
            isOneToOne: false
            referencedRelation: "discipulos"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          criado_em: string
          email: string
          foto_url: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["status_enum"]
          tipo_acesso: Database["public"]["Enums"]["tipo_acesso_enum"]
        }
        Insert: {
          criado_em?: string
          email: string
          foto_url?: string | null
          id: string
          nome: string
          status?: Database["public"]["Enums"]["status_enum"]
          tipo_acesso: Database["public"]["Enums"]["tipo_acesso_enum"]
        }
        Update: {
          criado_em?: string
          email?: string
          foto_url?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["status_enum"]
          tipo_acesso?: Database["public"]["Enums"]["tipo_acesso_enum"]
        }
        Relationships: []
      }
      visitantes: {
        Row: {
          aceitou_jesus: boolean
          ano: string | null
          assumido_por: string | null
          cadastrado_por: string
          cadastrado_por_nome: string
          cidade: string | null
          criado_em: string
          endereco: string | null
          estado_civil: Database["public"]["Enums"]["estado_civil_enum"] | null
          frequenta_igreja: boolean
          id: string
          nome: string
          observacoes: string | null
          quer_discipulado: boolean
          quer_gc: boolean
          sexo: Database["public"]["Enums"]["sexo_enum"] | null
          status_cor: Database["public"]["Enums"]["status_cor_enum"]
          telefone: string
        }
        Insert: {
          aceitou_jesus?: boolean
          ano?: string | null
          assumido_por?: string | null
          cadastrado_por: string
          cadastrado_por_nome: string
          cidade?: string | null
          criado_em?: string
          endereco?: string | null
          estado_civil?: Database["public"]["Enums"]["estado_civil_enum"] | null
          frequenta_igreja?: boolean
          id?: string
          nome: string
          observacoes?: string | null
          quer_discipulado?: boolean
          quer_gc?: boolean
          sexo?: Database["public"]["Enums"]["sexo_enum"] | null
          status_cor?: Database["public"]["Enums"]["status_cor_enum"]
          telefone: string
        }
        Update: {
          aceitou_jesus?: boolean
          ano?: string | null
          assumido_por?: string | null
          cadastrado_por?: string
          cadastrado_por_nome?: string
          cidade?: string | null
          criado_em?: string
          endereco?: string | null
          estado_civil?: Database["public"]["Enums"]["estado_civil_enum"] | null
          frequenta_igreja?: boolean
          id?: string
          nome?: string
          observacoes?: string | null
          quer_discipulado?: boolean
          quer_gc?: boolean
          sexo?: Database["public"]["Enums"]["sexo_enum"] | null
          status_cor?: Database["public"]["Enums"]["status_cor_enum"]
          telefone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_status_discipulos: { Args: never; Returns: undefined }
      get_user_tipo_acesso: {
        Args: never
        Returns: Database["public"]["Enums"]["tipo_acesso_enum"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      estado_civil_enum: "solteiro" | "casado" | "divorciado"
      sexo_enum: "masculino" | "feminino"
      status_cor_enum: "vermelho" | "amarelo" | "verde"
      status_enum: "pendente" | "aprovado" | "rejeitado"
      status_gc_enum: "ativo" | "em_formacao" | "inativo"
      status_sessao_enum: "presente" | "ausente" | "reagendado"
      tipo_acesso_enum: "recepcao" | "discipulador" | "rede"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_civil_enum: ["solteiro", "casado", "divorciado"],
      sexo_enum: ["masculino", "feminino"],
      status_cor_enum: ["vermelho", "amarelo", "verde"],
      status_enum: ["pendente", "aprovado", "rejeitado"],
      status_gc_enum: ["ativo", "em_formacao", "inativo"],
      status_sessao_enum: ["presente", "ausente", "reagendado"],
      tipo_acesso_enum: ["recepcao", "discipulador", "rede"],
    },
  },
} as const
