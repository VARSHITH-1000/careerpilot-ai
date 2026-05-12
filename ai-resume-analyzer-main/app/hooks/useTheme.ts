/**
 * Barrel: tools that resolve `useTheme` to `.ts` first get this file;
 * JSX implementation is in `theme.tsx`.
 */
export type { ThemeMode } from "./theme";
export { ThemeProvider, readStoredTheme, useTheme } from "./theme";
