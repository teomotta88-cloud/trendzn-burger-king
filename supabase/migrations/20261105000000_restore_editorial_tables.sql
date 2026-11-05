-- Ricostruisce le tabelle del piano editoriale (e la colonna posted_at di
-- trend_submissions) presenti nel progetto Supabase originale, ma assenti nel
-- nuovo progetto. Idempotente: si può rieseguire senza errori.
-- trend_submissions esiste già (drizzle/migrations/0000_restore_trend_submissions.sql).

-- ---------------------------------------------------------------------------
-- trend_submissions: colonna mancante rispetto allo schema originale
-- ---------------------------------------------------------------------------
ALTER TABLE public.trend_submissions
  ADD COLUMN IF NOT EXISTS posted_at timestamptz;

-- ---------------------------------------------------------------------------
-- Tabelle editorial_*
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.editorial_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);

CREATE TABLE IF NOT EXISTS public.editorial_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.editorial_plans(id) ON DELETE CASCADE,
  post_date date NOT NULL,
  canali text[] NOT NULL DEFAULT '{}',
  channel_copies jsonb NOT NULL DEFAULT '{}'::jsonb,
  copy_visual text,
  disclaimer text,
  formato text,
  obiettivo_media text,
  budget_media numeric,
  programmato boolean NOT NULL DEFAULT false,
  rubrica text,
  topic text,
  visual_type text,
  visual_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS editorial_posts_plan_id_idx ON public.editorial_posts (plan_id, post_date);

CREATE TABLE IF NOT EXISTS public.editorial_post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.editorial_posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS editorial_post_media_post_id_idx ON public.editorial_post_media (post_id, position);

CREATE TABLE IF NOT EXISTS public.editorial_post_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.editorial_posts(id) ON DELETE CASCADE,
  component text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, component)
);

CREATE TABLE IF NOT EXISTS public.editorial_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.editorial_posts(id) ON DELETE CASCADE,
  component text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS editorial_post_comments_post_id_idx ON public.editorial_post_comments (post_id, created_at);

CREATE TABLE IF NOT EXISTS public.editorial_published_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canale text NOT NULL,
  url text NOT NULL,
  caption text,
  published_date date NOT NULL,
  matched_post_id uuid REFERENCES public.editorial_posts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canale, url) -- richiesto da upsert(..., { onConflict: "canale,url" })
);

CREATE TABLE IF NOT EXISTS public.editorial_client_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canale text NOT NULL,
  handle text NOT NULL,
  url text NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  followers_count text,
  following_count text,
  posts_count text,
  scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ATTENZIONE: il portale non ha un login e scrive dal browser con la chiave
-- anon, quindi le tabelle editorial_* sono apribili in lettura/scrittura a
-- anon e authenticated (comportamento equivalente a quello che l'app si
-- aspetta). Da restringere quando verrà introdotta l'autenticazione.
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'editorial_plans','editorial_posts','editorial_post_media',
    'editorial_post_approvals','editorial_post_comments',
    'editorial_published_posts','editorial_client_channels'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "Open access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Open access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Storage: bucket pubblico "piano-editoriale" (immagini/video dei post)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('piano-editoriale', 'piano-editoriale', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "piano-editoriale read" ON storage.objects;
CREATE POLICY "piano-editoriale read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'piano-editoriale');

DROP POLICY IF EXISTS "piano-editoriale upload" ON storage.objects;
CREATE POLICY "piano-editoriale upload" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'piano-editoriale');
