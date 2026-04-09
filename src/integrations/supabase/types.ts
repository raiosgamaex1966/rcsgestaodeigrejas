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
      achievements: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          background_color: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_type: string | null
          link_url: string | null
          order_index: number | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_type?: string | null
          link_url?: string | null
          order_index?: number | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_type?: string | null
          link_url?: string | null
          order_index?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bible_favorites: {
        Row: {
          book: string
          chapter: number
          created_at: string | null
          id: string
          user_id: string
          verse: number
          verse_text: string | null
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string | null
          id?: string
          user_id: string
          verse: number
          verse_text?: string | null
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string | null
          id?: string
          user_id?: string
          verse?: number
          verse_text?: string | null
        }
        Relationships: []
      }
      bible_highlights: {
        Row: {
          book: string
          chapter: number
          color: string | null
          created_at: string | null
          id: string
          user_id: string
          verse: number
        }
        Insert: {
          book: string
          chapter: number
          color?: string | null
          created_at?: string | null
          id?: string
          user_id: string
          verse: number
        }
        Update: {
          book?: string
          chapter?: number
          color?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
          verse?: number
        }
        Relationships: []
      }
      bible_notes: {
        Row: {
          book: string
          chapter: number
          created_at: string | null
          id: string
          note: string
          updated_at: string | null
          user_id: string
          verse: number | null
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string | null
          id?: string
          note: string
          updated_at?: string | null
          user_id: string
          verse?: number | null
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string | null
          id?: string
          note?: string
          updated_at?: string | null
          user_id?: string
          verse?: number | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          bank_account: string | null
          bank_agency: string | null
          bank_holder_name: string | null
          bank_name: string | null
          created_at: string
          current_amount: number | null
          description: string | null
          end_date: string | null
          goal_amount: number
          icon: string | null
          id: string
          is_active: boolean | null
          pix_beneficiary_name: string | null
          pix_key: string | null
          pix_key_type: string | null
          pix_qrcode_url: string | null
          start_date: string | null
          title: string
          updated_at: string
          use_global_pix: boolean | null
        }
        Insert: {
          bank_account?: string | null
          bank_agency?: string | null
          bank_holder_name?: string | null
          bank_name?: string | null
          created_at?: string
          current_amount?: number | null
          description?: string | null
          end_date?: string | null
          goal_amount: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          pix_beneficiary_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qrcode_url?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
          use_global_pix?: boolean | null
        }
        Update: {
          bank_account?: string | null
          bank_agency?: string | null
          bank_holder_name?: string | null
          bank_name?: string | null
          created_at?: string
          current_amount?: number | null
          description?: string | null
          end_date?: string | null
          goal_amount?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          pix_beneficiary_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qrcode_url?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
          use_global_pix?: boolean | null
        }
        Relationships: []
      }
      cell_members: {
        Row: {
          cell_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          member_id: string
          role: string | null
        }
        Insert: {
          cell_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          member_id: string
          role?: string | null
        }
        Update: {
          cell_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          member_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cell_members_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cell_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cells: {
        Row: {
          address: string | null
          city: string | null
          co_leader_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          leader_id: string | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          neighborhood: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          co_leader_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          neighborhood?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          co_leader_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          neighborhood?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cells_co_leader_id_fkey"
            columns: ["co_leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cells_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_settings: {
        Row: {
          accent_color: string | null
          ai_enabled: boolean | null
          ai_model_chat: string | null
          ai_model_generation: string | null
          background_color: string | null
          burgundy_color: string | null
          church_name: string
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          expense_approval_threshold: number | null
          favicon_url: string | null
          foreground_color: string | null
          gold_color: string | null
          id: string
          logo_dark_url: string | null
          logo_url: string | null
          openai_api_key: string | null
          pix_beneficiary_name: string | null
          pix_instructions: string | null
          pix_key: string | null
          pix_key_type: string | null
          pix_qrcode_url: string | null
          primary_color: string | null
          pwa_background_color: string | null
          pwa_description: string | null
          pwa_icon_192_url: string | null
          pwa_icon_512_url: string | null
          pwa_name: string | null
          pwa_short_name: string | null
          pwa_theme_color: string | null
          require_council_approval_above: number | null
          secondary_color: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_og_image_url: string | null
          seo_title: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_whatsapp: string | null
          social_youtube: string | null
          tagline: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          ai_enabled?: boolean | null
          ai_model_chat?: string | null
          ai_model_generation?: string | null
          background_color?: string | null
          burgundy_color?: string | null
          church_name?: string
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          expense_approval_threshold?: number | null
          favicon_url?: string | null
          foreground_color?: string | null
          gold_color?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          openai_api_key?: string | null
          pix_beneficiary_name?: string | null
          pix_instructions?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qrcode_url?: string | null
          primary_color?: string | null
          pwa_background_color?: string | null
          pwa_description?: string | null
          pwa_icon_192_url?: string | null
          pwa_icon_512_url?: string | null
          pwa_name?: string | null
          pwa_short_name?: string | null
          pwa_theme_color?: string | null
          require_council_approval_above?: number | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          social_youtube?: string | null
          tagline?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          ai_enabled?: boolean | null
          ai_model_chat?: string | null
          ai_model_generation?: string | null
          background_color?: string | null
          burgundy_color?: string | null
          church_name?: string
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          expense_approval_threshold?: number | null
          favicon_url?: string | null
          foreground_color?: string | null
          gold_color?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          openai_api_key?: string | null
          pix_beneficiary_name?: string | null
          pix_instructions?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qrcode_url?: string | null
          primary_color?: string | null
          pwa_background_color?: string | null
          pwa_description?: string | null
          pwa_icon_192_url?: string | null
          pwa_icon_512_url?: string | null
          pwa_name?: string | null
          pwa_short_name?: string | null
          pwa_theme_color?: string | null
          require_council_approval_above?: number | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          social_youtube?: string | null
          tagline?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          id: string
          is_anonymous: boolean | null
          notes: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          instructor: string | null
          is_active: boolean | null
          is_featured: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          instructor?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          instructor?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          confirmed_at: string | null
          event_id: string
          id: string
          notes: string | null
          registered_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          registered_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          registered_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string | null
          email: string
          event_id: string
          full_name: string
          id: string
          notes: string | null
          payment_proof_url: string | null
          payment_status: string | null
          phone: string | null
          registered_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          event_id: string
          full_name: string
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          phone?: string | null
          registered_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          phone?: string | null
          registered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_public_registration: boolean | null
          category_id: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          event_pix_beneficiary: string | null
          event_pix_key: string | null
          event_pix_key_type: string | null
          event_pix_qrcode_url: string | null
          event_type: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_paid: boolean | null
          is_recurring: boolean | null
          location: string | null
          organizer_notes: string | null
          payment_external_url: string | null
          payment_instructions: string | null
          payment_type: string | null
          price: number | null
          public_slug: string | null
          recurrence_day: number | null
          recurrence_pattern: string | null
          registration_deadline: string | null
          registration_limit: number | null
          registration_status: string | null
          start_date: string
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allow_public_registration?: boolean | null
          category_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_pix_beneficiary?: string | null
          event_pix_key?: string | null
          event_pix_key_type?: string | null
          event_pix_qrcode_url?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_paid?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          organizer_notes?: string | null
          payment_external_url?: string | null
          payment_instructions?: string | null
          payment_type?: string | null
          price?: number | null
          public_slug?: string | null
          recurrence_day?: number | null
          recurrence_pattern?: string | null
          registration_deadline?: string | null
          registration_limit?: number | null
          registration_status?: string | null
          start_date: string
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allow_public_registration?: boolean | null
          category_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_pix_beneficiary?: string | null
          event_pix_key?: string | null
          event_pix_key_type?: string | null
          event_pix_qrcode_url?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_paid?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          organizer_notes?: string | null
          payment_external_url?: string | null
          payment_instructions?: string | null
          payment_type?: string | null
          price?: number | null
          public_slug?: string | null
          recurrence_day?: number | null
          recurrence_pattern?: string | null
          registration_deadline?: string | null
          registration_limit?: number | null
          registration_status?: string | null
          start_date?: string
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_approvals: {
        Row: {
          approval_level: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          expense_id: string
          id: string
          notes: string | null
          rejection_reason: string | null
          requested_at: string | null
          requested_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_level?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expense_id: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_level?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expense_id?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_approvals_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expense_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_entries: {
        Row: {
          account_id: string | null
          amount: number
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          due_date: string | null
          id: string
          is_recurring: boolean | null
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          recurrence_day: number | null
          rejection_reason: string | null
          requires_approval: boolean | null
          status: string | null
          supplier_name: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description: string
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurrence_day?: number | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          status?: string | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurrence_day?: number | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          status?: string | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          created_at: string | null
          current_balance: number
          description: string | null
          id: string
          initial_balance: number
          is_active: boolean | null
          is_default: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string | null
          current_balance?: number
          description?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string | null
          current_balance?: number
          description?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          notes: string | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          order_index: number | null
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          order_index?: number | null
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          order_index?: number | null
          type?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          account_id: string | null
          amount: number
          campaign_id: string | null
          category_id: string | null
          contributor_email: string | null
          contributor_name: string | null
          contributor_phone: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          payment_method: string | null
          receipt_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          campaign_id?: string | null
          category_id?: string | null
          contributor_email?: string | null
          contributor_name?: string | null
          contributor_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          campaign_id?: string | null
          category_id?: string | null
          contributor_email?: string | null
          contributor_name?: string | null
          contributor_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_progress: {
        Row: {
          completed_at: string | null
          id: string
          journey_id: string
          started_at: string | null
          status: string | null
          step_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          journey_id: string
          started_at?: string | null
          status?: string | null
          step_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          journey_id?: string
          started_at?: string | null
          status?: string | null
          step_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_progress_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          journey_id: string
          order_index: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          journey_id: string
          order_index?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          journey_id?: string
          order_index?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          order_index: number | null
          title: string
          video_url: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title: string
          video_url: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      member_history: {
        Row: {
          action_type: string
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          member_id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          member_id: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          member_id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pastoral_care: {
        Row: {
          attended_by: string | null
          created_at: string | null
          date: string | null
          description: string | null
          follow_up_date: string | null
          id: string
          member_id: string
          notes: string | null
          reason: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attended_by?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          follow_up_date?: string | null
          id?: string
          member_id: string
          notes?: string | null
          reason: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attended_by?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          follow_up_date?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          reason?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pastoral_care_attended_by_fkey"
            columns: ["attended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastoral_care_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_albums: {
        Row: {
          cover_url: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          event_id: string | null
          id: string
          is_published: boolean | null
          name: string
          photos_count: number | null
          updated_at: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_id?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          photos_count?: number | null
          updated_at?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_id?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          photos_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          album_id: string
          created_at: string | null
          description: string | null
          face_descriptors: Json | null
          faces_count: number | null
          id: string
          image_url: string
          sort_order: number | null
          thumbnail_url: string | null
        }
        Insert: {
          album_id: string
          created_at?: string | null
          description?: string | null
          face_descriptors?: Json | null
          faces_count?: number | null
          id?: string
          image_url: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          album_id?: string
          created_at?: string | null
          description?: string | null
          face_descriptors?: Json | null
          faces_count?: number | null
          id?: string
          image_url?: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      preachers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          avatar_url: string | null
          baptism_date: string | null
          birth_date: string | null
          conversion_date: string | null
          created_at: string
          current_mood: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          marital_status: string | null
          matricula: string | null
          member_since: string | null
          member_type: string | null
          mood_updated_at: string | null
          notes: string | null
          onboarding_skipped: boolean
          phone: string | null
          profession: string | null
          updated_at: string
          wedding_date: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avatar_url?: string | null
          baptism_date?: string | null
          birth_date?: string | null
          conversion_date?: string | null
          created_at?: string
          current_mood?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          marital_status?: string | null
          matricula?: string | null
          member_since?: string | null
          member_type?: string | null
          mood_updated_at?: string | null
          notes?: string | null
          onboarding_skipped?: boolean
          phone?: string | null
          profession?: string | null
          updated_at?: string
          wedding_date?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avatar_url?: string | null
          baptism_date?: string | null
          birth_date?: string | null
          conversion_date?: string | null
          created_at?: string
          current_mood?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          marital_status?: string | null
          matricula?: string | null
          member_since?: string | null
          member_type?: string | null
          mood_updated_at?: string | null
          notes?: string | null
          onboarding_skipped?: boolean
          phone?: string | null
          profession?: string | null
          updated_at?: string
          wedding_date?: string | null
        }
        Relationships: []
      }
      reading_activity: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          points_earned: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          book: string
          chapter: number
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          book: string
          chapter: number
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          book?: string
          chapter?: number
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_plan_day_progress: {
        Row: {
          completed_at: string | null
          day_id: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          day_id: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          day_id?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_day_progress_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "reading_plan_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_plan_day_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plan_days: {
        Row: {
          audio_url: string | null
          day_number: number
          devotional_content: string | null
          devotional_title: string | null
          id: string
          plan_id: string
          practical_action: string | null
          prayer: string | null
          readings: Json
          reflection: string | null
          title: string | null
          verse_reference: string | null
          verse_text: string | null
        }
        Insert: {
          audio_url?: string | null
          day_number: number
          devotional_content?: string | null
          devotional_title?: string | null
          id?: string
          plan_id: string
          practical_action?: string | null
          prayer?: string | null
          readings: Json
          reflection?: string | null
          title?: string | null
          verse_reference?: string | null
          verse_text?: string | null
        }
        Update: {
          audio_url?: string | null
          day_number?: number
          devotional_content?: string | null
          devotional_title?: string | null
          id?: string
          plan_id?: string
          practical_action?: string | null
          prayer?: string | null
          readings?: Json
          reflection?: string | null
          title?: string | null
          verse_reference?: string | null
          verse_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plan_progress: {
        Row: {
          completed_at: string | null
          current_day: number | null
          id: string
          is_active: boolean | null
          plan_id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_day?: number | null
          id?: string
          is_active?: boolean | null
          plan_id: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_day?: number | null
          id?: string
          is_active?: boolean | null
          plan_id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plan_saved: {
        Row: {
          id: string
          plan_id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          plan_id: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          plan_id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_saved_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          author: string | null
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          order_index: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          order_index?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          order_index?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      request_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["request_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["request_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["request_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          id: string
          is_urgent: boolean | null
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_urgent?: boolean | null
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_urgent?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sermon_drafts: {
        Row: {
          bible_references: string[] | null
          content: Json | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_ai_generated: boolean | null
          target_date: string | null
          theme: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bible_references?: string[] | null
          content?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_ai_generated?: boolean | null
          target_date?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bible_references?: string[] | null
          content?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_ai_generated?: boolean | null
          target_date?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sermons: {
        Row: {
          audio_url: string | null
          bible_references: string[] | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          preacher_id: string | null
          processed_at: string | null
          recorded_at: string | null
          summary: string | null
          theme_id: string | null
          thumbnail_url: string | null
          title: string
          topics: Json | null
          transcript: string | null
          updated_at: string
          video_url: string | null
          views: number | null
        }
        Insert: {
          audio_url?: string | null
          bible_references?: string[] | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          preacher_id?: string | null
          processed_at?: string | null
          recorded_at?: string | null
          summary?: string | null
          theme_id?: string | null
          thumbnail_url?: string | null
          title: string
          topics?: Json | null
          transcript?: string | null
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Update: {
          audio_url?: string | null
          bible_references?: string[] | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          preacher_id?: string | null
          processed_at?: string | null
          recorded_at?: string | null
          summary?: string | null
          theme_id?: string | null
          thumbnail_url?: string | null
          title?: string
          topics?: Json | null
          transcript?: string | null
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sermons_preacher_id_fkey"
            columns: ["preacher_id"]
            isOneToOne: false
            referencedRelation: "preachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermons_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          member_id: string
          role: string | null
          team_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          member_id: string
          role?: string | null
          team_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          member_id?: string
          role?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          leader_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          level: number | null
          longest_streak: number | null
          streak_freeze_available: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          xp_this_week: number | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          streak_freeze_available?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          xp_this_week?: number | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          streak_freeze_available?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          xp_this_week?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "visitante"
        | "membro"
        | "servo"
        | "ministro"
        | "midia"
        | "tesoureiro"
        | "conselho"
      request_status: "pending" | "in_progress" | "completed" | "cancelled"
      request_type:
        | "prayer"
        | "baptism"
        | "food_basket"
        | "visitation"
        | "pastoral"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "visitante",
        "membro",
        "servo",
        "ministro",
        "midia",
        "tesoureiro",
        "conselho",
      ],
      request_status: ["pending", "in_progress", "completed", "cancelled"],
      request_type: [
        "prayer",
        "baptism",
        "food_basket",
        "visitation",
        "pastoral",
      ],
    },
  },
} as const
