import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("/auth", "routes/auth.tsx"),
  route("/upload", "routes/upload.tsx"),
  route("/resume/:id", "routes/resume.tsx"),
  route("/settings", "routes/settings.tsx"),
  route("api/resumes", "routes/api.resumes.tsx"),
  route("api/resumes/:id", "routes/api.resumes.$id.tsx"),
  route("research", "routes/research.tsx", [
    index("routes/research.library.tsx"),
    route("library", "routes/research.library.tsx", { id: "research-library" }),
    route("chat", "routes/research.chat.tsx"),
    route("explore", "routes/research.explore.tsx"),
  ]),
] satisfies RouteConfig;
