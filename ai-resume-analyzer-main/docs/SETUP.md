# NEXT AI — production setup

This app is a **React Router (SSR)** stack:

- **Firebase Authentication** (email/password) in the browser  
- **Firebase Admin** on the server to verify `Authorization: Bearer <ID token>`  
- **Supabase** Postgres + **private Storage** for resume PDFs and preview images  
- **Google Gemini** on the server for resume intelligence (API key never shipped to the client)

## 1. Prerequisites

- Node.js 20+  
- A [Firebase](https://console.firebase.google.com/) project with **Email/Password** sign-in enabled  
- A [Supabase](https://supabase.com/) project  
- A [Gemini API key](https://aistudio.google.com/app/apikey)

## 2. Supabase

1. In the SQL editor, run `supabase/migrations/001_resumes.sql`.
2. Create a **private** storage bucket named **`resumes`** (no public policies).
3. Copy **Project URL** and **service role** key (server only).

## 3. Firebase

1. Web app: copy the `firebaseConfig` values into `VITE_FIREBASE_*` in `.env`.
2. Service account: **Project settings → Service accounts → Generate new private key**.  
   Put the **entire JSON object on one line** into `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env` (not in `VITE_`).

## 4. Environment file

```bash
cp .env.example .env
```

Fill every variable in `.env`. **Never commit `.env`.**

## 5. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL, sign up, then run **New analysis**.

## 6. Production

```bash
npm run build
npm run start
```

Run the Node server with the same environment variables as development. Use your host’s secret manager for `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `FIREBASE_SERVICE_ACCOUNT_JSON`.

## Security checklist

- Do **not** expose `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `FIREBASE_SERVICE_ACCOUNT_JSON` to the client.  
- All resume CRUD and AI calls go through `/api/resumes` routes after Firebase token verification.  
- Storage objects are stored under `{firebase_uid}/{resume_id}/…` and served via **short-lived signed URLs**.
