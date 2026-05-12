-- Run in Supabase SQL editor or via Supabase CLI.
-- Create a private storage bucket named "resumes" (no public access).

create extension if not exists "pgcrypto";

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  company_name text,
  job_title text,
  job_description text,
  target_role text not null,
  pdf_path text not null,
  image_path text not null,
  feedback jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resumes_user_id_created_at_idx
  on public.resumes (user_id, created_at desc);

comment on table public.resumes is 'Resume analyses; access controlled by application server (Firebase UID + service role).';
