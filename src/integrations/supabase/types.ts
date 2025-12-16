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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      business_services: {
        Row: {
          business_id: string
          created_at: string
          id: string
          service_name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          service_name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_tags: {
        Row: {
          business_id: string
          tag_id: string
        }
        Insert: {
          business_id: string
          tag_id: string
        }
        Update: {
          business_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          category_id: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string
          email: string | null
          employees: string | null
          featured: boolean | null
          founded: string | null
          id: string
          long_description: string | null
          name: string
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["business_status"] | null
          submitted_by: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description: string
          email?: string | null
          employees?: string | null
          featured?: boolean | null
          founded?: string | null
          id?: string
          long_description?: string | null
          name: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          submitted_by?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string
          email?: string | null
          employees?: string | null
          featured?: boolean | null
          founded?: string | null
          id?: string
          long_description?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          submitted_by?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      event_allocations: {
        Row: {
          conference_tickets: number | null
          created_at: string
          event_id: string
          id: string
          symposium_seats: number | null
          tier: Database["public"]["Enums"]["member_tier"]
          vip_dinner_seats: number | null
        }
        Insert: {
          conference_tickets?: number | null
          created_at?: string
          event_id: string
          id?: string
          symposium_seats?: number | null
          tier: Database["public"]["Enums"]["member_tier"]
          vip_dinner_seats?: number | null
        }
        Update: {
          conference_tickets?: number | null
          created_at?: string
          event_id?: string
          id?: string
          symposium_seats?: number | null
          tier?: Database["public"]["Enums"]["member_tier"]
          vip_dinner_seats?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_allocations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          external_url: string | null
          has_symposium: boolean | null
          has_vip_dinner: boolean | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          location_city: string | null
          location_country: string | null
          location_name: string | null
          name: string
          slug: string
          speaking_applications_open: boolean | null
          speaking_deadline: string | null
          start_date: string | null
          subtitle: string | null
          symposium_date: string | null
          symposium_venue: string | null
          updated_at: string
          vip_dinner_date: string | null
          vip_dinner_time: string | null
          vip_dinner_venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          external_url?: string | null
          has_symposium?: boolean | null
          has_vip_dinner?: boolean | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location_city?: string | null
          location_country?: string | null
          location_name?: string | null
          name: string
          slug: string
          speaking_applications_open?: boolean | null
          speaking_deadline?: string | null
          start_date?: string | null
          subtitle?: string | null
          symposium_date?: string | null
          symposium_venue?: string | null
          updated_at?: string
          vip_dinner_date?: string | null
          vip_dinner_time?: string | null
          vip_dinner_venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          external_url?: string | null
          has_symposium?: boolean | null
          has_vip_dinner?: boolean | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location_city?: string | null
          location_country?: string | null
          location_name?: string | null
          name?: string
          slug?: string
          speaking_applications_open?: boolean | null
          speaking_deadline?: string | null
          start_date?: string | null
          subtitle?: string | null
          symposium_date?: string | null
          symposium_venue?: string | null
          updated_at?: string
          vip_dinner_date?: string | null
          vip_dinner_time?: string | null
          vip_dinner_venue?: string | null
        }
        Relationships: []
      }
      member_resource_requests: {
        Row: {
          admin_notes: string | null
          completed_at: string | null
          id: string
          member_id: string
          request_details: Json | null
          requested_at: string
          resource_type: string
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          completed_at?: string | null
          id?: string
          member_id: string
          request_details?: Json | null
          requested_at?: string
          resource_type: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          completed_at?: string | null
          id?: string
          member_id?: string
          request_details?: Json | null
          requested_at?: string
          resource_type?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_resource_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          business_id: string | null
          created_at: string
          display_name: string
          email: string
          hubspot_contact_id: string | null
          id: string
          is_active: boolean | null
          is_primary_contact: boolean | null
          member_since: string
          next_payment_due: string | null
          notes: string | null
          payment_amount_cents: number | null
          phone: string | null
          renewal_date: string | null
          tier: Database["public"]["Enums"]["member_tier"]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          display_name: string
          email: string
          hubspot_contact_id?: string | null
          id?: string
          is_active?: boolean | null
          is_primary_contact?: boolean | null
          member_since?: string
          next_payment_due?: string | null
          notes?: string | null
          payment_amount_cents?: number | null
          phone?: string | null
          renewal_date?: string | null
          tier?: Database["public"]["Enums"]["member_tier"]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          display_name?: string
          email?: string
          hubspot_contact_id?: string | null
          id?: string
          is_active?: boolean | null
          is_primary_contact?: boolean | null
          member_since?: string
          next_payment_due?: string | null
          notes?: string | null
          payment_amount_cents?: number | null
          phone?: string | null
          renewal_date?: string | null
          tier?: Database["public"]["Enums"]["member_tier"]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_applications: {
        Row: {
          admin_notes: string | null
          airtable_record_id: string | null
          av_requirements: string | null
          created_at: string
          event_id: string
          format: string
          id: string
          member_id: string
          previous_speaking: string | null
          proposed_topic: string
          session_description: string | null
          speaker_bio: string | null
          speaker_company: string | null
          speaker_email: string
          speaker_headshot_url: string | null
          speaker_name: string
          speaker_title: string | null
          status: Database["public"]["Enums"]["speaker_status"] | null
          submitted_at: string | null
          synced_to_airtable_at: string | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          airtable_record_id?: string | null
          av_requirements?: string | null
          created_at?: string
          event_id: string
          format: string
          id?: string
          member_id: string
          previous_speaking?: string | null
          proposed_topic: string
          session_description?: string | null
          speaker_bio?: string | null
          speaker_company?: string | null
          speaker_email: string
          speaker_headshot_url?: string | null
          speaker_name: string
          speaker_title?: string | null
          status?: Database["public"]["Enums"]["speaker_status"] | null
          submitted_at?: string | null
          synced_to_airtable_at?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          airtable_record_id?: string | null
          av_requirements?: string | null
          created_at?: string
          event_id?: string
          format?: string
          id?: string
          member_id?: string
          previous_speaking?: string | null
          proposed_topic?: string
          session_description?: string | null
          speaker_bio?: string | null
          speaker_company?: string | null
          speaker_email?: string
          speaker_headshot_url?: string | null
          speaker_name?: string
          speaker_title?: string | null
          status?: Database["public"]["Enums"]["speaker_status"] | null
          submitted_at?: string | null
          synced_to_airtable_at?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_applications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      symposium_registrations: {
        Row: {
          accessibility_needs: string | null
          attendee_company: string | null
          attendee_email: string
          attendee_name: string
          attendee_title: string | null
          confirmed_at: string | null
          dietary_requirements: string | null
          event_id: string
          id: string
          member_id: string
          registered_at: string
          registration_code: string | null
          status: Database["public"]["Enums"]["rsvp_status"] | null
        }
        Insert: {
          accessibility_needs?: string | null
          attendee_company?: string | null
          attendee_email: string
          attendee_name: string
          attendee_title?: string | null
          confirmed_at?: string | null
          dietary_requirements?: string | null
          event_id: string
          id?: string
          member_id: string
          registered_at?: string
          registration_code?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"] | null
        }
        Update: {
          accessibility_needs?: string | null
          attendee_company?: string | null
          attendee_email?: string
          attendee_name?: string
          attendee_title?: string | null
          confirmed_at?: string | null
          dietary_requirements?: string | null
          event_id?: string
          id?: string
          member_id?: string
          registered_at?: string
          registration_code?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "symposium_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symposium_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      ticket_claims: {
        Row: {
          attendee_company: string | null
          attendee_email: string
          attendee_name: string
          attendee_title: string | null
          claimed_at: string
          confirmed_at: string | null
          event_id: string
          id: string
          member_id: string
          notes: string | null
          status: Database["public"]["Enums"]["rsvp_status"] | null
          ticket_code: string | null
        }
        Insert: {
          attendee_company?: string | null
          attendee_email: string
          attendee_name: string
          attendee_title?: string | null
          claimed_at?: string
          confirmed_at?: string | null
          event_id: string
          id?: string
          member_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"] | null
          ticket_code?: string | null
        }
        Update: {
          attendee_company?: string | null
          attendee_email?: string
          attendee_name?: string
          attendee_title?: string | null
          claimed_at?: string
          confirmed_at?: string | null
          event_id?: string
          id?: string
          member_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"] | null
          ticket_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_claims_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_claims_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_dinner_rsvps: {
        Row: {
          confirmation_code: string | null
          confirmed_at: string | null
          dietary_requirements: string | null
          event_id: string
          guest_company: string | null
          guest_email: string
          guest_name: string
          guest_title: string | null
          id: string
          member_id: string
          rsvp_at: string
          seating_preferences: string | null
          status: Database["public"]["Enums"]["rsvp_status"] | null
        }
        Insert: {
          confirmation_code?: string | null
          confirmed_at?: string | null
          dietary_requirements?: string | null
          event_id: string
          guest_company?: string | null
          guest_email: string
          guest_name: string
          guest_title?: string | null
          id?: string
          member_id: string
          rsvp_at?: string
          seating_preferences?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"] | null
        }
        Update: {
          confirmation_code?: string | null
          confirmed_at?: string | null
          dietary_requirements?: string | null
          event_id?: string
          guest_company?: string | null
          guest_email?: string
          guest_name?: string
          guest_title?: string | null
          id?: string
          member_id?: string
          rsvp_at?: string
          seating_preferences?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_dinner_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_dinner_rsvps_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      business_status: "pending" | "approved" | "rejected"
      event_type: "flagship" | "regional" | "secondary"
      member_tier: "silver" | "gold" | "platinum" | "chairman" | "executive"
      rsvp_status:
        | "pending"
        | "confirmed"
        | "declined"
        | "waitlisted"
        | "cancelled"
      speaker_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "waitlisted"
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
      business_status: ["pending", "approved", "rejected"],
      event_type: ["flagship", "regional", "secondary"],
      member_tier: ["silver", "gold", "platinum", "chairman", "executive"],
      rsvp_status: [
        "pending",
        "confirmed",
        "declined",
        "waitlisted",
        "cancelled",
      ],
      speaker_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "waitlisted",
      ],
    },
  },
} as const
