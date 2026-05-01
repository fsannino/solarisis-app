import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: "#FF7A00",
          soft: "#FFE8D2"
        },
        bg: "#FAF7F2",
        surface: "#FFFFFF",
        line: {
          DEFAULT: "#E8DFD0",
          strong: "#D4C7B0"
        },
        ink: {
          DEFAULT: "#1A1614",
          soft: "#6B5F54",
          faint: "#A89B8A"
        }
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        "30": "7.5rem"
      },
      borderRadius: {
        sm: "6px",
        md: "9px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        full: "9999px"
      },
      boxShadow: {
        sm: "0 2px 8px rgba(26,22,20,0.04)",
        md: "0 8px 24px rgba(26,22,20,0.06)",
        lg: "0 18px 40px rgba(26,22,20,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
