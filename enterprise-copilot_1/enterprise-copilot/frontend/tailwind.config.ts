import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0B1220",
        surface: "#F7F8FA",
        border: "#E4E7EC",
        ink: "#101828",
        muted: "#667085",
        accent: "#2F6FED",
        cite: "#B45309",
        "cite-bg": "#FEF3E2",
      },
      fontFamily: {
        heading: ["var(--font-plex)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
