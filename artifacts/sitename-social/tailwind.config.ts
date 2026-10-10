import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        danger: "var(--danger)",
      },
      borderRadius: { card: "16px" },
      fontFamily: { sans: ["var(--font-inter)", "var(--font-georgian)", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;
