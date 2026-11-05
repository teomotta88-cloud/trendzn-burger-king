CREATE TABLE public.trend_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  submitted_by text NOT NULL DEFAULT 'manual',
  raw_email text,
  title text,
  tags text[],
  category text,
  industry text,
  section text NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trend_submissions TO anon, authenticated;
GRANT ALL ON public.trend_submissions TO service_role;
ALTER TABLE public.trend_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read approved trend submissions" ON public.trend_submissions FOR SELECT TO anon, authenticated USING (status = 'approved');