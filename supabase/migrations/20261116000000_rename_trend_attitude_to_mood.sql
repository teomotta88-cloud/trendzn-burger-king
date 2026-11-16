-- King Attitude è stata rinominata King Mood: sposta le righe già salvate
-- con la vecchia sezione. Idempotente.
UPDATE public.trend_submissions
SET section = 'trend-mood'
WHERE section = 'trend-attitude';
