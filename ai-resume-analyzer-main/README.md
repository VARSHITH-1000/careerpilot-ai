<div align="center">
  <br />
    <a href="https://www.youtube.com/watch?v=iYOz165wGkQ" target="_blank">
      <img src="public/readme/hero.webp" alt="Project Banner">
    </a>
  <br />

  <div>
    <img alt="Static Badge" src="https://img.shields.io/badge/React-4c84f3?style=for-the-badge&logo=react&logoColor=white">
        <img src="https://img.shields.io/badge/-Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
        <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="TypeScript" />
    <img alt="Static Badge" src="https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=firebase&logoColor=white">
    <img alt="Static Badge" src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white">
    <img alt="Static Badge" src="https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white">
  </div>

  <h3 align="center">AI Resume Analyzer</h3>

   <div align="center">
     Build this project step by step with our detailed tutorial on <a href="https://www.youtube.com/watch?v=XUkNR-JfHwo" target="_blank"><b>JavaScript Mastery</b></a> YouTube. Join the JSM family!
    </div>
</div>

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 🔗 [Assets](#links)
6. 🚀 [More](#more)

## 🚨 Tutorial

This repository contains the code corresponding to an in-depth tutorial available on our YouTube channel, <a href="https://www.youtube.com/@javascriptmastery/videos" target="_blank"><b>JavaScript Mastery</b></a>.

If you prefer visual learning, this is the perfect resource for you. Follow our tutorial to learn how to build projects like these step-by-step in a beginner-friendly manner!

<a href="https://www.youtube.com/watch?v=iYOz165wGkQ" target="_blank"><img src="https://github.com/sujatagunale/EasyRead/assets/151519281/1736fca5-a031-4854-8c09-bc110e3bc16d" /></a>

## <a name="introduction">✨ Introduction</a>

**NEXT AI — Intelligent Career Copilot** is a production-oriented resume intelligence platform: Firebase email/password auth, Supabase Postgres + private file storage, and server-side Gemini analysis—no third-party “all-in-one” browser SDKs.

If you're getting started and need assistance or face any bugs, join our active Discord community with over **50k+** members. It's a place where people help each other out.

<a href="https://discord.com/invite/n6EdbFJ" target="_blank"><img src="https://github.com/sujatagunale/EasyRead/assets/151519281/618f4872-1e10-42da-8213-1d69e486d02e" /></a>

## <a name="tech-stack">⚙️ Tech Stack</a>

- **[React](https://react.dev/)** is a popular open‑source JavaScript library for building user interfaces using reusable components and a virtual DOM, enabling efficient, dynamic single-page and native apps.
- **[React Router v7](https://reactrouter.com/)** is the go‑to routing library for React apps, offering nested routes, data loaders/actions, error boundaries, code splitting, and SSR support.
- **[Firebase Authentication](https://firebase.google.com/docs/auth)** for email/password sign-in and ID tokens verified on the server.
- **[Supabase](https://supabase.com/)** for PostgreSQL and private object storage (resume PDF + preview image).
- **[Groq & Llama 3.1](https://groq.com/)** as the primary high-speed, cost-efficient inference engine for advanced research gap analysis and resume matching.
- **[Google Gemini](https://ai.google.dev/)** as the multimodal fallback model.
- **[LangChain](https://www.langchain.com/)** powering the python-based RAG architecture for semantic search, metadata extraction, and gap analysis.
- **[Tailwind CSS & Framer Motion](https://tailwindcss.com/)** for a modern, animated, glassmorphic UI.
- **[TypeScript](https://www.typescriptlang.org/)** for robust end-to-end type safety.
- **[Vite](https://vite.dev/)** as the core build tool and dev server.

## <a name="features">🔋 Features</a>

👉 **Advanced AI Resume Intelligence**: Detailed section-wise analysis, dynamic ATS scoring, JD match percentage, recruiter impression score, missing skills detection, and actionable formatting/grammar feedback.
👉 **Research Gap Analysis Engine**: A dedicated python-backed RAG service that fetches live academic papers (Semantic Scholar), extracts methodologies, identifies dataset trends, maps out future scopes, and surfaces unexplored research gaps.
👉 **Interactive Visual Analytics**: Modern Recharts and Framer Motion powered methodology heatmaps, concept clustering grids, and dynamic radar charts showcasing skill coverage.
👉 **Secure Ecosystem**: Robust server-side verification using Firebase Admin, Supabase Postgres data syncing, and private object storage with temporary signed URLs.
👉 **Scalable Backend Architecture**: Seamless API fallback handling between Groq (Llama-3.1) and Gemini, ensuring uptime and cost efficiency during heavy token workloads.

## <a name="quick-start">🤸 Quick Start</a>

**Prerequisites:** Git, Node.js 20+, npm.

**Install & configure**

```bash
cd ai-resume-analyzer-main
npm install
cp .env.example .env
```

Configure Firebase, Supabase, and Gemini as described in **[docs/SETUP.md](./docs/SETUP.md)** (SQL migration, `resumes` storage bucket, environment variables).

**Run**

```bash
npm run dev
```

**Production build**

```bash
npm run build
npm run start
```

Open the dev server URL printed in the terminal (typically [http://localhost:5173](http://localhost:5173)).

## <a name="links">🔗 Assets</a>

Assets and snippets used in the project can be found in the **[video kit](https://jsm.dev/resumind-kit)**.

<a href="https://jsm.dev/resumind-kit" target="_blank">
  <img src="public/readme/videokit.webp" alt="Video Kit Banner">
</a>

## <a name="more">🚀 More</a>

**Advance your skills with Next.js Pro Course**

Enjoyed creating this project? Dive deeper into our PRO courses for a richer learning adventure. They're packed with
detailed explanations, cool features, and exercises to boost your skills. Give it a go!

<a href="https://jsm.dev/resumind-courses" target="_blank">
  <img src="public/readme/jsmpro.webp" alt="Project Banner">
</a>
