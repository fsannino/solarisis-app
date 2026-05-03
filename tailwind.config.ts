import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Paleta da marca (estável — a fonte da verdade do design)
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
        },

        // Tokens shadcn (referenciados por componentes ui/*)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))"
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
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: [animate]
};

export default config;
