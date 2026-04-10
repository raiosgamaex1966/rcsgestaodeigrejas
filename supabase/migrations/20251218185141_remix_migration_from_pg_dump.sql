CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user',
    'visitante',
    'membro',
    'servo',
    'ministro',
    'midia'
);


--
-- Name: request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: request_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_type AS ENUM (
    'prayer',
    'baptism',
    'food_basket',
    'visitation',
    'pastoral'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text DEFAULT 'Trophy'::text,
    points_reward integer DEFAULT 0,
    criteria jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bible_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bible_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    book text NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    verse_text text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bible_highlights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bible_highlights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    book text NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    color text DEFAULT '#FEF08A'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bible_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bible_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    book text NOT NULL,
    chapter integer NOT NULL,
    verse integer,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    goal_amount numeric(10,2) NOT NULL,
    current_amount numeric(10,2) DEFAULT 0,
    icon text DEFAULT 'Heart'::text,
    is_active boolean DEFAULT true,
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    use_global_pix boolean DEFAULT true,
    pix_key text,
    pix_key_type text DEFAULT 'CNPJ'::text,
    pix_beneficiary_name text,
    pix_qrcode_url text,
    bank_name text,
    bank_agency text,
    bank_account text,
    bank_holder_name text
);


--
-- Name: church_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.church_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    church_name text DEFAULT 'Minha Igreja'::text NOT NULL,
    tagline text DEFAULT 'Conectando você a Deus'::text,
    description text DEFAULT 'Aplicativo oficial da igreja'::text,
    logo_url text,
    logo_dark_url text,
    favicon_url text,
    primary_color text DEFAULT '243 60% 48%'::text,
    secondary_color text DEFAULT '47 84% 52%'::text,
    accent_color text DEFAULT '243 60% 48%'::text,
    background_color text DEFAULT '40 33% 98%'::text,
    foreground_color text DEFAULT '243 30% 15%'::text,
    gold_color text DEFAULT '47 84% 52%'::text,
    burgundy_color text DEFAULT '0 54% 33%'::text,
    pwa_name text DEFAULT 'RCS Gestão de Igrejas'::text,
    pwa_short_name text DEFAULT 'RCS Gestão'::text,
    pwa_description text DEFAULT 'Aplicativo oficial da igreja'::text,
    pwa_theme_color text DEFAULT '#4338ca'::text,
    pwa_background_color text DEFAULT '#faf8f5'::text,
    pwa_icon_192_url text,
    pwa_icon_512_url text,
    seo_title text DEFAULT 'RCS Gestão de Igrejas - Aplicativo da Igreja'::text,
    seo_description text DEFAULT 'Bíblia, ministrações, planos de leitura e mais.'::text,
    seo_keywords text DEFAULT 'igreja, bíblia, ministrações, cristão'::text,
    seo_og_image_url text,
    contact_email text,
    contact_phone text,
    contact_address text,
    website_url text,
    social_facebook text,
    social_instagram text,
    social_youtube text,
    social_whatsapp text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    pix_key text,
    pix_key_type text DEFAULT 'CNPJ'::text,
    pix_beneficiary_name text,
    pix_qrcode_url text,
    pix_instructions text DEFAULT 'Escaneie o QR Code ou copie a chave PIX para fazer sua contribuição'::text,
    openai_api_key text,
    ai_enabled boolean DEFAULT false,
    ai_model_chat text DEFAULT 'gpt-4o-mini'::text,
    ai_model_generation text DEFAULT 'gpt-4o'::text
);


--
-- Name: contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid,
    user_id uuid,
    amount numeric(10,2) NOT NULL,
    is_anonymous boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: course_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#6366f1'::text,
    icon text DEFAULT 'BookOpen'::text,
    is_active boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: course_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    completed_at timestamp with time zone DEFAULT now()
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category_id uuid,
    thumbnail_url text,
    instructor text,
    difficulty text DEFAULT 'medium'::text,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_attendees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_attendees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    confirmed_at timestamp with time zone DEFAULT now()
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    event_type text DEFAULT 'culto'::text NOT NULL,
    location text,
    start_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    is_recurring boolean DEFAULT false,
    recurrence_pattern text,
    recurrence_day integer,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    image_url text
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    duration_minutes integer DEFAULT 0,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: preachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    title text,
    bio text,
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reading_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action_type text NOT NULL,
    points_earned integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reading_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    book text NOT NULL,
    chapter integer NOT NULL,
    read_at timestamp with time zone DEFAULT now()
);


--
-- Name: reading_plan_day_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_plan_day_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    day_id uuid NOT NULL,
    completed_at timestamp with time zone DEFAULT now()
);


--
-- Name: reading_plan_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_plan_days (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    day_number integer NOT NULL,
    title text,
    readings jsonb NOT NULL,
    reflection text,
    devotional_title text,
    devotional_content text,
    practical_action text,
    prayer text,
    audio_url text,
    verse_reference text,
    verse_text text
);


--
-- Name: reading_plan_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_plan_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    current_day integer DEFAULT 1,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    is_active boolean DEFAULT true
);


--
-- Name: reading_plan_saved; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_plan_saved (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    saved_at timestamp with time zone DEFAULT now()
);


--
-- Name: reading_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    duration_days integer NOT NULL,
    difficulty text DEFAULT 'medium'::text,
    category text,
    thumbnail_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tags text[],
    author text,
    is_featured boolean DEFAULT false,
    order_index integer DEFAULT 0
);


--
-- Name: request_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    changed_by uuid,
    old_status public.request_status,
    new_status public.request_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type public.request_type NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    message text NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status,
    assigned_to uuid,
    is_urgent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sermon_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sermon_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    content jsonb,
    bible_references text[],
    is_ai_generated boolean DEFAULT false,
    duration_minutes integer,
    theme text,
    target_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sermons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sermons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    preacher_id uuid,
    theme_id uuid,
    duration_minutes integer,
    audio_url text,
    video_url text,
    thumbnail_url text,
    transcript text,
    bible_references text[],
    views integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    is_published boolean DEFAULT true,
    recorded_at date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    summary text,
    topics jsonb,
    processed_at timestamp with time zone
);


--
-- Name: themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#6366f1'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_gamification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_gamification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_points integer DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    level integer DEFAULT 1,
    xp_this_week integer DEFAULT 0,
    last_activity_date date,
    streak_freeze_available integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: bible_favorites bible_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_favorites
    ADD CONSTRAINT bible_favorites_pkey PRIMARY KEY (id);


--
-- Name: bible_favorites bible_favorites_user_id_book_chapter_verse_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_favorites
    ADD CONSTRAINT bible_favorites_user_id_book_chapter_verse_key UNIQUE (user_id, book, chapter, verse);


--
-- Name: bible_highlights bible_highlights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_highlights
    ADD CONSTRAINT bible_highlights_pkey PRIMARY KEY (id);


--
-- Name: bible_highlights bible_highlights_user_id_book_chapter_verse_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_highlights
    ADD CONSTRAINT bible_highlights_user_id_book_chapter_verse_key UNIQUE (user_id, book, chapter, verse);


--
-- Name: bible_notes bible_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_notes
    ADD CONSTRAINT bible_notes_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: church_settings church_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.church_settings
    ADD CONSTRAINT church_settings_pkey PRIMARY KEY (id);


--
-- Name: contributions contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);


--
-- Name: course_categories course_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_categories
    ADD CONSTRAINT course_categories_pkey PRIMARY KEY (id);


--
-- Name: course_progress course_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_progress
    ADD CONSTRAINT course_progress_pkey PRIMARY KEY (id);


--
-- Name: course_progress course_progress_user_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_progress
    ADD CONSTRAINT course_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: event_attendees event_attendees_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_attendees event_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: preachers preachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preachers
    ADD CONSTRAINT preachers_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reading_activity reading_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_activity
    ADD CONSTRAINT reading_activity_pkey PRIMARY KEY (id);


--
-- Name: reading_history reading_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_history
    ADD CONSTRAINT reading_history_pkey PRIMARY KEY (id);


--
-- Name: reading_plan_day_progress reading_plan_day_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_day_progress
    ADD CONSTRAINT reading_plan_day_progress_pkey PRIMARY KEY (id);


--
-- Name: reading_plan_day_progress reading_plan_day_progress_user_id_day_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_day_progress
    ADD CONSTRAINT reading_plan_day_progress_user_id_day_id_key UNIQUE (user_id, day_id);


--
-- Name: reading_plan_days reading_plan_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_days
    ADD CONSTRAINT reading_plan_days_pkey PRIMARY KEY (id);


--
-- Name: reading_plan_days reading_plan_days_plan_id_day_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_days
    ADD CONSTRAINT reading_plan_days_plan_id_day_number_key UNIQUE (plan_id, day_number);


--
-- Name: reading_plan_progress reading_plan_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_progress
    ADD CONSTRAINT reading_plan_progress_pkey PRIMARY KEY (id);


--
-- Name: reading_plan_progress reading_plan_progress_user_id_plan_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_progress
    ADD CONSTRAINT reading_plan_progress_user_id_plan_id_key UNIQUE (user_id, plan_id);


--
-- Name: reading_plan_saved reading_plan_saved_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_saved
    ADD CONSTRAINT reading_plan_saved_pkey PRIMARY KEY (id);


--
-- Name: reading_plan_saved reading_plan_saved_user_id_plan_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_saved
    ADD CONSTRAINT reading_plan_saved_user_id_plan_id_key UNIQUE (user_id, plan_id);


--
-- Name: reading_plans reading_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plans
    ADD CONSTRAINT reading_plans_pkey PRIMARY KEY (id);


--
-- Name: request_history request_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_history
    ADD CONSTRAINT request_history_pkey PRIMARY KEY (id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: sermon_drafts sermon_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sermon_drafts
    ADD CONSTRAINT sermon_drafts_pkey PRIMARY KEY (id);


--
-- Name: sermons sermons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sermons
    ADD CONSTRAINT sermons_pkey PRIMARY KEY (id);


--
-- Name: themes themes_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_name_key UNIQUE (name);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_user_id_achievement_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);


--
-- Name: user_gamification user_gamification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT user_gamification_pkey PRIMARY KEY (id);


--
-- Name: user_gamification user_gamification_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT user_gamification_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: bible_notes update_bible_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bible_notes_updated_at BEFORE UPDATE ON public.bible_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: campaigns update_campaigns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: church_settings update_church_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_church_settings_updated_at BEFORE UPDATE ON public.church_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: courses update_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: preachers update_preachers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_preachers_updated_at BEFORE UPDATE ON public.preachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reading_plans update_reading_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reading_plans_updated_at BEFORE UPDATE ON public.reading_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: requests update_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sermon_drafts update_sermon_drafts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sermon_drafts_updated_at BEFORE UPDATE ON public.sermon_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sermons update_sermons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sermons_updated_at BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_gamification update_user_gamification_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON public.user_gamification FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bible_favorites bible_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_favorites
    ADD CONSTRAINT bible_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bible_highlights bible_highlights_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_highlights
    ADD CONSTRAINT bible_highlights_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bible_notes bible_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bible_notes
    ADD CONSTRAINT bible_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contributions contributions_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: contributions contributions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: course_progress course_progress_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_progress
    ADD CONSTRAINT course_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_progress course_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_progress
    ADD CONSTRAINT course_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: courses courses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.course_categories(id) ON DELETE SET NULL;


--
-- Name: event_attendees event_attendees_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reading_activity reading_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_activity
    ADD CONSTRAINT reading_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reading_history reading_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_history
    ADD CONSTRAINT reading_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reading_plan_day_progress reading_plan_day_progress_day_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_day_progress
    ADD CONSTRAINT reading_plan_day_progress_day_id_fkey FOREIGN KEY (day_id) REFERENCES public.reading_plan_days(id) ON DELETE CASCADE;


--
-- Name: reading_plan_day_progress reading_plan_day_progress_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_day_progress
    ADD CONSTRAINT reading_plan_day_progress_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.reading_plans(id) ON DELETE CASCADE;


--
-- Name: reading_plan_day_progress reading_plan_day_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_day_progress
    ADD CONSTRAINT reading_plan_day_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reading_plan_days reading_plan_days_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_days
    ADD CONSTRAINT reading_plan_days_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.reading_plans(id) ON DELETE CASCADE;


--
-- Name: reading_plan_progress reading_plan_progress_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_progress
    ADD CONSTRAINT reading_plan_progress_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.reading_plans(id) ON DELETE CASCADE;


--
-- Name: reading_plan_progress reading_plan_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_progress
    ADD CONSTRAINT reading_plan_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reading_plan_saved reading_plan_saved_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan_saved
    ADD CONSTRAINT reading_plan_saved_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.reading_plans(id) ON DELETE CASCADE;


--
-- Name: request_history request_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_history
    ADD CONSTRAINT request_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: request_history request_history_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_history
    ADD CONSTRAINT request_history_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;


--
-- Name: requests requests_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: requests requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sermons sermons_preacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sermons
    ADD CONSTRAINT sermons_preacher_id_fkey FOREIGN KEY (preacher_id) REFERENCES public.preachers(id) ON DELETE SET NULL;


--
-- Name: sermons sermons_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sermons
    ADD CONSTRAINT sermons_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE SET NULL;


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_gamification user_gamification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT user_gamification_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: achievements Achievements are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);


--
-- Name: campaigns Active campaigns are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active campaigns are viewable by everyone" ON public.campaigns FOR SELECT USING ((is_active = true));


--
-- Name: courses Active courses are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active courses are viewable by everyone" ON public.courses FOR SELECT USING ((is_active = true));


--
-- Name: events Active events are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active events are viewable by everyone" ON public.events FOR SELECT USING ((is_active = true));


--
-- Name: lessons Active lessons are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active lessons are viewable by everyone" ON public.lessons FOR SELECT USING ((is_active = true));


--
-- Name: reading_plans Active plans are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active plans are viewable by everyone" ON public.reading_plans FOR SELECT USING ((is_active = true));


--
-- Name: achievements Admins can manage achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage achievements" ON public.achievements USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: event_attendees Admins can manage attendees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage attendees" ON public.event_attendees USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: campaigns Admins can manage campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage campaigns" ON public.campaigns USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: course_categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.course_categories USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: church_settings Admins can manage church settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage church settings" ON public.church_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: courses Admins can manage courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage courses" ON public.courses USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: events Admins can manage events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage events" ON public.events USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lessons Admins can manage lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage lessons" ON public.lessons USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reading_plan_days Admins can manage plan days; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plan days" ON public.reading_plan_days USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reading_plans Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.reading_plans USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: preachers Admins can manage preachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage preachers" ON public.preachers USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: request_history Admins can manage request history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage request history" ON public.request_history USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: requests Admins can manage requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage requests" ON public.requests USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sermons Admins can manage sermons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sermons" ON public.sermons USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: themes Admins can manage themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage themes" ON public.themes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contributions Admins can view all contributions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all contributions" ON public.contributions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: courses Admins can view all courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all courses" ON public.courses FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lessons Admins can view all lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all lessons" ON public.lessons FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: requests Admins can view all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all requests" ON public.requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sermons Admins can view all sermons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all sermons" ON public.sermons FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: course_categories Categories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Categories are viewable by everyone" ON public.course_categories FOR SELECT USING (true);


--
-- Name: church_settings Church settings viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Church settings viewable by everyone" ON public.church_settings FOR SELECT USING (true);


--
-- Name: reading_plan_days Plan days are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Plan days are viewable by everyone" ON public.reading_plan_days FOR SELECT USING (true);


--
-- Name: preachers Preachers are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Preachers are viewable by everyone" ON public.preachers FOR SELECT USING (true);


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: user_gamification Public leaderboard view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public leaderboard view" ON public.user_gamification FOR SELECT USING (true);


--
-- Name: sermons Published sermons are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published sermons are viewable by everyone" ON public.sermons FOR SELECT USING ((is_published = true));


--
-- Name: themes Themes are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Themes are viewable by everyone" ON public.themes FOR SELECT USING (true);


--
-- Name: event_attendees Users can confirm own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can confirm own attendance" ON public.event_attendees FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: contributions Users can create contributions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create contributions" ON public.contributions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: sermon_drafts Users can create own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own drafts" ON public.sermon_drafts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: requests Users can create requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create requests" ON public.requests FOR INSERT WITH CHECK (((auth.uid() = user_id) OR (user_id IS NULL)));


--
-- Name: sermon_drafts Users can delete own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own drafts" ON public.sermon_drafts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: course_progress Users can delete own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own progress" ON public.course_progress FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_achievements Users can insert own achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reading_activity Users can insert own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own activity" ON public.reading_activity FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_gamification Users can insert own gamification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own gamification" ON public.user_gamification FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: course_progress Users can insert own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own progress" ON public.course_progress FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reading_plan_day_progress Users can manage own day progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own day progress" ON public.reading_plan_day_progress USING ((auth.uid() = user_id));


--
-- Name: bible_favorites Users can manage own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own favorites" ON public.bible_favorites USING ((auth.uid() = user_id));


--
-- Name: bible_highlights Users can manage own highlights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own highlights" ON public.bible_highlights USING ((auth.uid() = user_id));


--
-- Name: reading_history Users can manage own history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own history" ON public.reading_history USING ((auth.uid() = user_id));


--
-- Name: bible_notes Users can manage own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own notes" ON public.bible_notes USING ((auth.uid() = user_id));


--
-- Name: reading_plan_progress Users can manage own plan progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own plan progress" ON public.reading_plan_progress USING ((auth.uid() = user_id));


--
-- Name: reading_plan_saved Users can manage own saved plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own saved plans" ON public.reading_plan_saved USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: event_attendees Users can remove own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove own attendance" ON public.event_attendees FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: sermon_drafts Users can update own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own drafts" ON public.sermon_drafts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_gamification Users can update own gamification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own gamification" ON public.user_gamification FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: event_attendees Users can view event attendees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view event attendees" ON public.event_attendees FOR SELECT USING (true);


--
-- Name: user_achievements Users can view own achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reading_activity Users can view own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own activity" ON public.reading_activity FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: contributions Users can view own contributions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own contributions" ON public.contributions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: sermon_drafts Users can view own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own drafts" ON public.sermon_drafts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_gamification Users can view own gamification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own gamification" ON public.user_gamification FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: course_progress Users can view own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own progress" ON public.course_progress FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: requests Users can view own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requests" ON public.requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

--
-- Name: bible_favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bible_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: bible_highlights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;

--
-- Name: bible_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: church_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: contributions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

--
-- Name: course_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: course_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: event_attendees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: preachers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.preachers ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reading_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_plan_day_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reading_plan_day_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_plan_days; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reading_plan_days ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_plan_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reading_plan_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_plan_saved; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reading_plan_saved ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: request_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.request_history ENABLE ROW LEVEL SECURITY;

--
-- Name: requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

--
-- Name: sermon_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sermon_drafts ENABLE ROW LEVEL SECURITY;

--
-- Name: sermons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

--
-- Name: themes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_gamification; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


