import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode prevents "transport invoke timed out" errors during development
  // and speeds up the visual feedback loop.
  ssr: false,
} satisfies Config;
