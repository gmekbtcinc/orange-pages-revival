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
      admins: {
        Row: {
          can_impersonate: boolean | null
          can_manage_admins: boolean | null
          can_manage_content: boolean | null
          can_manage_events: boolean | null
          can_manage_memberships: boolean | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_impersonate?: boolean | null
          can_manage_admins?: boolean | null
          can_manage_content?: boolean | null
          can_manage_events?: boolean | null
          can_manage_memberships?: boolean | null
          created_at?: string | null
          display_name: string
          email: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_impersonate?: boolean | null
          can_manage_admins?: boolean | null
          can_manage_content?: boolean | null
          can_manage_events?: boolean | null
          can_manage_memberships?: boolean | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      benefit_brand_tags: {
        Row: {
          benefit_id: string
          brand_tag_id: string
        }
        Insert: {
          benefit_id: string
          brand_tag_id: string
        }
        Update: {
          benefit_id?: string
          brand_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_brand_tags_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_brand_tags_brand_tag_id_fkey"
            columns: ["brand_tag_id"]
            isOneToOne: false
            referencedRelation: "brand_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      benefits: {
        Row: {
          base_price: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          fulfillment_mode: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_quantifiable: boolean | null
          label: string
          long_description: string | null
          region_multiplier: number | null
          scope: string | null
          tracking_type: string | null
          unit_label: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          fulfillment_mode?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_quantifiable?: boolean | null
          label: string
          long_description?: string | null
          region_multiplier?: number | null
          scope?: string | null
          tracking_type?: string | null
          unit_label?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          fulfillment_mode?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_quantifiable?: boolean | null
          label?: string
          long_description?: string | null
          region_multiplier?: number | null
          scope?: string | null
          tracking_type?: string | null
          unit_label?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "benefit_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_tag_category_mappings: {
        Row: {
          brand_tag_id: string
          category_id: string
          display_order: number | null
        }
        Insert: {
          brand_tag_id: string
          category_id: string
          display_order?: number | null
        }
        Update: {
          brand_tag_id?: string
          category_id?: string
          display_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_tag_category_mappings_brand_tag_id_fkey"
            columns: ["brand_tag_id"]
            isOneToOne: false
            referencedRelation: "brand_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_tag_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "benefit_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_tags: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      business_articles: {
        Row: {
          business_id: string
          created_at: string
          id: string
          published_date: string | null
          source: string | null
          title: string
          url: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          published_date?: string | null
          source?: string | null
          title: string
          url: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          published_date?: string | null
          source?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_articles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_claims: {
        Row: {
          business_id: string
          claimant_email: string
          claimant_name: string
          claimant_phone: string | null
          claimant_title: string | null
          claimant_user_id: string | null
          created_at: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_status"] | null
          supporting_document_url: string | null
          updated_at: string | null
          verification_method: string | null
          verification_notes: string | null
        }
        Insert: {
          business_id: string
          claimant_email: string
          claimant_name: string
          claimant_phone?: string | null
          claimant_title?: string | null
          claimant_user_id?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          supporting_document_url?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verification_notes?: string | null
        }
        Update: {
          business_id?: string
          claimant_email?: string
          claimant_name?: string
          claimant_phone?: string | null
          claimant_title?: string | null
          claimant_user_id?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          supporting_document_url?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
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
      business_social_links: {
        Row: {
          business_id: string
          created_at: string
          id: string
          platform: string
          url: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          platform: string
          url: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_social_links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_submissions: {
        Row: {
          category_id: string | null
          city: string | null
          claim_relationship: string | null
          claim_title: string | null
          country: string | null
          created_at: string | null
          created_business_id: string | null
          description: string
          id: string
          name: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string
          submitter_email: string
          submitter_name: string
          submitter_user_id: string
          updated_at: string | null
          wants_to_claim: boolean | null
          website: string | null
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          claim_relationship?: string | null
          claim_title?: string | null
          country?: string | null
          created_at?: string | null
          created_business_id?: string | null
          description: string
          id?: string
          name: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          submitter_email: string
          submitter_name: string
          submitter_user_id: string
          updated_at?: string | null
          wants_to_claim?: boolean | null
          website?: string | null
        }
        Update: {
          category_id?: string | null
          city?: string | null
          claim_relationship?: string | null
          claim_title?: string | null
          country?: string | null
          created_at?: string | null
          created_business_id?: string | null
          description?: string
          id?: string
          name?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          submitter_email?: string
          submitter_name?: string
          submitter_user_id?: string
          updated_at?: string | null
          wants_to_claim?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_submissions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_submissions_created_business_id_fkey"
            columns: ["created_business_id"]
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
          accepts_crypto: boolean | null
          address: string | null
          btc_holdings_source: string | null
          category_id: string | null
          ceo_headshot_url: string | null
          ceo_name: string | null
          ceo_title: string | null
          city: string | null
          company_type: Database["public"]["Enums"]["company_type"] | null
          country: string | null
          created_at: string
          description: string
          email: string | null
          employees: string | null
          featured: boolean | null
          founded: string | null
          has_linked_users: boolean | null
          id: string
          is_active: boolean | null
          is_bfc_member: boolean | null
          is_bitcoin_only: boolean | null
          is_conference_sponsor: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          long_description: string | null
          markets: string | null
          name: string
          phone: string | null
          referral_url: string | null
          state: string | null
          status: Database["public"]["Enums"]["business_status"] | null
          submitted_by: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          accepts_crypto?: boolean | null
          address?: string | null
          btc_holdings_source?: string | null
          category_id?: string | null
          ceo_headshot_url?: string | null
          ceo_name?: string | null
          ceo_title?: string | null
          city?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          country?: string | null
          created_at?: string
          description: string
          email?: string | null
          employees?: string | null
          featured?: boolean | null
          founded?: string | null
          has_linked_users?: boolean | null
          id?: string
          is_active?: boolean | null
          is_bfc_member?: boolean | null
          is_bitcoin_only?: boolean | null
          is_conference_sponsor?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          long_description?: string | null
          markets?: string | null
          name: string
          phone?: string | null
          referral_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          submitted_by?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          accepts_crypto?: boolean | null
          address?: string | null
          btc_holdings_source?: string | null
          category_id?: string | null
          ceo_headshot_url?: string | null
          ceo_name?: string | null
          ceo_title?: string | null
          city?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          country?: string | null
          created_at?: string
          description?: string
          email?: string | null
          employees?: string | null
          featured?: boolean | null
          founded?: string | null
          has_linked_users?: boolean | null
          id?: string
          is_active?: boolean | null
          is_bfc_member?: boolean | null
          is_bitcoin_only?: boolean | null
          is_conference_sponsor?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          long_description?: string | null
          markets?: string | null
          name?: string
          phone?: string | null
          referral_url?: string | null
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
      company_allocation_overrides: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          custom_pass_name: string | null
          custom_tickets_override: number | null
          event_id: string
          ga_tickets_override: number | null
          id: string
          override_mode: string
          pro_tickets_override: number | null
          reason: string | null
          symposium_seats_override: number | null
          updated_at: string
          vip_dinner_seats_override: number | null
          whale_tickets_override: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          custom_pass_name?: string | null
          custom_tickets_override?: number | null
          event_id: string
          ga_tickets_override?: number | null
          id?: string
          override_mode?: string
          pro_tickets_override?: number | null
          reason?: string | null
          symposium_seats_override?: number | null
          updated_at?: string
          vip_dinner_seats_override?: number | null
          whale_tickets_override?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          custom_pass_name?: string | null
          custom_tickets_override?: number | null
          event_id?: string
          ga_tickets_override?: number | null
          id?: string
          override_mode?: string
          pro_tickets_override?: number | null
          reason?: string | null
          symposium_seats_override?: number | null
          updated_at?: string
          vip_dinner_seats_override?: number | null
          whale_tickets_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_allocation_overrides_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_allocation_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_allocation_overrides_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      company_benefit_overrides: {
        Row: {
          benefit_id: string
          business_id: string
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          is_unlimited_override: boolean | null
          override_mode: string
          period_year: number | null
          quantity_override: number | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          benefit_id: string
          business_id: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          is_unlimited_override?: boolean | null
          override_mode?: string
          period_year?: number | null
          quantity_override?: number | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          benefit_id?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          is_unlimited_override?: boolean | null
          override_mode?: string
          period_year?: number | null
          quantity_override?: number | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_benefit_overrides_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_benefit_overrides_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_benefit_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_benefit_overrides_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      company_leadership: {
        Row: {
          bio: string | null
          business_id: string
          created_at: string
          display_name: string
          display_order: number
          email: string | null
          headshot_url: string | null
          id: string
          is_primary: boolean
          is_visible: boolean
          linkedin_url: string | null
          profile_id: string | null
          title: string
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          business_id: string
          created_at?: string
          display_name: string
          display_order?: number
          email?: string | null
          headshot_url?: string | null
          id?: string
          is_primary?: boolean
          is_visible?: boolean
          linkedin_url?: string | null
          profile_id?: string | null
          title: string
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          business_id?: string
          created_at?: string
          display_name?: string
          display_order?: number
          email?: string | null
          headshot_url?: string | null
          id?: string
          is_primary?: boolean
          is_visible?: boolean
          linkedin_url?: string | null
          profile_id?: string | null
          title?: string
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_leadership_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_leadership_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_allocations: {
        Row: {
          conference_tickets: number | null
          created_at: string
          custom_pass_name: string | null
          custom_tickets: number | null
          event_id: string
          ga_tickets: number | null
          id: string
          pro_tickets: number | null
          symposium_seats: number | null
          tier: Database["public"]["Enums"]["member_tier"]
          vip_dinner_seats: number | null
          whale_tickets: number | null
        }
        Insert: {
          conference_tickets?: number | null
          created_at?: string
          custom_pass_name?: string | null
          custom_tickets?: number | null
          event_id: string
          ga_tickets?: number | null
          id?: string
          pro_tickets?: number | null
          symposium_seats?: number | null
          tier: Database["public"]["Enums"]["member_tier"]
          vip_dinner_seats?: number | null
          whale_tickets?: number | null
        }
        Update: {
          conference_tickets?: number | null
          created_at?: string
          custom_pass_name?: string | null
          custom_tickets?: number | null
          event_id?: string
          ga_tickets?: number | null
          id?: string
          pro_tickets?: number | null
          symposium_seats?: number | null
          tier?: Database["public"]["Enums"]["member_tier"]
          vip_dinner_seats?: number | null
          whale_tickets?: number | null
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
          available_pass_types: string[] | null
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
          logo_url: string | null
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
          available_pass_types?: string[] | null
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
          logo_url?: string | null
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
          available_pass_types?: string[] | null
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
          logo_url?: string | null
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
      fulfillments: {
        Row: {
          benefit_id: string
          business_id: string
          created_at: string
          event_id: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          notes: string | null
          period_year: number | null
          proof_url: string | null
          quantity: number
          scheduled_date: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          benefit_id: string
          business_id: string
          created_at?: string
          event_id?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          period_year?: number | null
          proof_url?: string | null
          quantity?: number
          scheduled_date?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          benefit_id?: string
          business_id?: string
          created_at?: string
          event_id?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          period_year?: number | null
          proof_url?: string | null
          quantity?: number
          scheduled_date?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfillments_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillments_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          business_id: string
          created_at: string
          display_name: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          revoked_at: string | null
          revoked_by: string | null
          role: Database["public"]["Enums"]["team_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          business_id: string
          created_at?: string
          display_name?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          business_id?: string
          created_at?: string
          display_name?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_resource_requests: {
        Row: {
          admin_notes: string | null
          business_id: string | null
          completed_at: string | null
          id: string
          profile_id: string | null
          request_details: Json | null
          requested_at: string
          resource_type: string
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_id?: string | null
          completed_at?: string | null
          id?: string
          profile_id?: string | null
          request_details?: Json | null
          requested_at?: string
          resource_type: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_id?: string | null
          completed_at?: string | null
          id?: string
          profile_id?: string | null
          request_details?: Json | null
          requested_at?: string
          resource_type?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_resource_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tiers: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          tagline: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          tagline?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          tagline?: string | null
        }
        Relationships: []
      }
      membership_tracks: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          target_audience: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          target_audience?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          target_audience?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          billing_contact_name: string | null
          billing_email: string | null
          business_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          hubspot_deal_id: string | null
          id: string
          is_active: boolean | null
          member_since: string
          next_payment_due: string | null
          notes: string | null
          payment_amount_cents: number | null
          renewal_date: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["member_tier"]
          updated_at: string | null
        }
        Insert: {
          billing_contact_name?: string | null
          billing_email?: string | null
          business_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          hubspot_deal_id?: string | null
          id?: string
          is_active?: boolean | null
          member_since?: string
          next_payment_due?: string | null
          notes?: string | null
          payment_amount_cents?: number | null
          renewal_date?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["member_tier"]
          updated_at?: string | null
        }
        Update: {
          billing_contact_name?: string | null
          billing_email?: string | null
          business_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          hubspot_deal_id?: string | null
          id?: string
          is_active?: boolean | null
          member_since?: string
          next_payment_due?: string | null
          notes?: string | null
          payment_amount_cents?: number | null
          renewal_date?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["member_tier"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      package_benefits: {
        Row: {
          benefit_id: string
          is_unlimited: boolean | null
          notes: string | null
          package_id: string
          quantity: number | null
        }
        Insert: {
          benefit_id: string
          is_unlimited?: boolean | null
          notes?: string | null
          package_id: string
          quantity?: number | null
        }
        Update: {
          benefit_id?: string
          is_unlimited?: boolean | null
          notes?: string | null
          package_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "package_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_benefits_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "tier_track_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      pricing_thresholds: {
        Row: {
          created_at: string | null
          discount_label: string
          discount_percentage: number
          display_order: number | null
          id: string
          is_active: boolean | null
          threshold_type: string
          threshold_value: number
        }
        Insert: {
          created_at?: string | null
          discount_label: string
          discount_percentage: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          threshold_type: string
          threshold_value: number
        }
        Update: {
          created_at?: string | null
          discount_label?: string
          discount_percentage?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          threshold_type?: string
          threshold_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          linkedin_url: string | null
          phone: string | null
          title: string | null
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          email: string
          id: string
          linkedin_url?: string | null
          phone?: string | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: []
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
          previous_speaking: string | null
          profile_id: string | null
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
          previous_speaking?: string | null
          profile_id?: string | null
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
          previous_speaking?: string | null
          profile_id?: string | null
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
            foreignKeyName: "speaker_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          is_external_attendee: boolean | null
          profile_id: string | null
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
          is_external_attendee?: boolean | null
          profile_id?: string | null
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
          is_external_attendee?: boolean | null
          profile_id?: string | null
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
            foreignKeyName: "symposium_registrations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      team_memberships: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invited_by: string | null
          is_primary: boolean
          joined_at: string
          profile_id: string
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_primary?: boolean
          joined_at?: string
          profile_id: string
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_primary?: boolean
          joined_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_claims: {
        Row: {
          attendee_company: string | null
          attendee_email: string
          attendee_name: string
          attendee_title: string | null
          business_id: string | null
          claimed_at: string
          confirmed_at: string | null
          event_id: string
          id: string
          is_external_attendee: boolean | null
          notes: string | null
          pass_type: Database["public"]["Enums"]["pass_type"]
          profile_id: string | null
          status: Database["public"]["Enums"]["rsvp_status"] | null
          ticket_code: string | null
        }
        Insert: {
          attendee_company?: string | null
          attendee_email: string
          attendee_name: string
          attendee_title?: string | null
          business_id?: string | null
          claimed_at?: string
          confirmed_at?: string | null
          event_id: string
          id?: string
          is_external_attendee?: boolean | null
          notes?: string | null
          pass_type?: Database["public"]["Enums"]["pass_type"]
          profile_id?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"] | null
          ticket_code?: string | null
        }
        Update: {
          attendee_company?: string | null
          attendee_email?: string
          attendee_name?: string
          attendee_title?: string | null
          business_id?: string | null
          claimed_at?: string
          confirmed_at?: string | null
          event_id?: string
          id?: string
          is_external_attendee?: boolean | null
          notes?: string | null
          pass_type?: Database["public"]["Enums"]["pass_type"]
          profile_id?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"] | null
          ticket_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_claims_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_limits: {
        Row: {
          description: string | null
          max_users: number
          tier: Database["public"]["Enums"]["member_tier"]
        }
        Insert: {
          description?: string | null
          max_users: number
          tier: Database["public"]["Enums"]["member_tier"]
        }
        Update: {
          description?: string | null
          max_users?: number
          tier?: Database["public"]["Enums"]["member_tier"]
        }
        Relationships: []
      }
      tier_track_packages: {
        Row: {
          annual_price: number | null
          base_price: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          tier_id: string
          track_id: string
          updated_at: string | null
        }
        Insert: {
          annual_price?: number | null
          base_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          tier_id: string
          track_id: string
          updated_at?: string | null
        }
        Update: {
          annual_price?: number | null
          base_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          tier_id?: string
          track_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_track_packages_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_track_packages_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "membership_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_brand_tags: {
        Row: {
          brand_tag_id: string
          track_id: string
        }
        Insert: {
          brand_tag_id: string
          track_id: string
        }
        Update: {
          brand_tag_id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_brand_tags_brand_tag_id_fkey"
            columns: ["brand_tag_id"]
            isOneToOne: false
            referencedRelation: "brand_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_brand_tags_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "membership_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
          is_external_attendee: boolean | null
          profile_id: string | null
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
          is_external_attendee?: boolean | null
          profile_id?: string | null
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
          is_external_attendee?: boolean | null
          profile_id?: string | null
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
            foreignKeyName: "vip_dinner_rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_link_user_to_business: {
        Args: {
          _business_id: string
          _display_name: string
          _email: string
          _is_member?: boolean
          _role?: Database["public"]["Enums"]["user_role"]
          _title?: string
          _user_id: string
        }
        Returns: string
      }
      get_primary_company: { Args: { _profile_id: string }; Returns: string }
      get_remaining_user_slots: {
        Args: { _business_id: string }
        Returns: number
      }
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      get_user_permissions: {
        Args: { _business_id: string; _profile_id: string }
        Returns: Json
      }
      has_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_moderator_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_user: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_business: { Args: { _business_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_team_admin: {
        Args: { _business_id: string; _profile_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _business_id: string; _profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "moderator"
      business_status: "pending" | "approved" | "rejected"
      claim_status: "pending" | "approved" | "rejected"
      company_type: "public" | "private" | "subsidiary"
      event_type: "flagship" | "regional" | "partner"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      member_tier:
        | "silver"
        | "gold"
        | "platinum"
        | "chairman"
        | "executive"
        | "industry"
        | "premier"
        | "sponsor"
      pass_type: "ga" | "pro" | "whale" | "custom"
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
      team_role: "owner" | "admin" | "member"
      user_role: "super_admin" | "company_admin" | "company_user"
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
      app_role: ["super_admin", "admin", "moderator"],
      business_status: ["pending", "approved", "rejected"],
      claim_status: ["pending", "approved", "rejected"],
      company_type: ["public", "private", "subsidiary"],
      event_type: ["flagship", "regional", "partner"],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      invite_status: ["pending", "accepted", "expired", "revoked"],
      member_tier: [
        "silver",
        "gold",
        "platinum",
        "chairman",
        "executive",
        "industry",
        "premier",
        "sponsor",
      ],
      pass_type: ["ga", "pro", "whale", "custom"],
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
      team_role: ["owner", "admin", "member"],
      user_role: ["super_admin", "company_admin", "company_user"],
    },
  },
} as const
