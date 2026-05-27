import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#06080c",
          900: "#0b1020",
          800: "#111a2e",
          700: "#1a2743"
        }
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(255,255,255,0.06), 0 12px 40px rgba(0,0,0,0.55)"
      }
    }
  },
  plugins: []
} satisfies Config;

