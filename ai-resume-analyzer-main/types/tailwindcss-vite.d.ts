// @tailwindcss/vite v4 does not ship TypeScript declaration files.
// This declaration tells TypeScript the module exists and exports a Vite plugin factory.
declare module "@tailwindcss/vite" {
  import type { Plugin } from "vite";
  function tailwindcss(): Plugin;
  export default tailwindcss;
}
