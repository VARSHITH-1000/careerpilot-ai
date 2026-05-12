-- Run this in your Supabase Dashboard → SQL Editor
-- Creates the resumes table and sets up row-level security

-- 1. Create the resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  id            UUID PRIMARY KEY,
  user_id       TEXT NOT NULL,
  company_name  TEXT,
  job_title     TEXT,
  job_description TEXT,
  target_role   TEXT,
  pdf_path      TEXT,
  image_path    TEXT,
  feedback      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes (user_id);

-- 3. Enable Row Level Security
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- 4. Service role bypasses RLS (used by server-side Supabase client)
-- No extra policy needed — service_role key bypasses RLS by default.

-- 5. Create storage bucket for resume files (run once)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;
