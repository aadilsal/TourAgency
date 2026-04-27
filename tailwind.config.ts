import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        background: "var(--bg)",
        foreground: "var(--fg)",
        panel: "var(--panel)",
        "panel-elevated": "var(--panel-elevated)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        muted: "var(--muted)",
        havezic: {
          primary: "var(--havezic-primary)",
          "primary-hover": "var(--havezic-primary-hover)",
          secondary: "var(--havezic-secondary)",
          "secondary-hover": "var(--havezic-secondary-hover)",
          text: "var(--havezic-text)",
          "text-light": "var(--havezic-text-light)",
          accent: "var(--havezic-accent)",
          border: "var(--havezic-border)",
          background: "var(--havezic-background)",
          "background-light": "var(--havezic-background-light)",
        },
        brand: {
          primary: "#0B1220",
          accent: "#F6B01E",
          cta: "#FF7A00",
          sun: "#F6B01E",
          forest: "#2E7D32",
          surface: "#F8FAFC",
          muted: "#64748B",
          ink: "#0F172A",
          "primary-dark": "#070B12",
        },
      },
      maxWidth: {
        content: "1280px",
        prose: "42rem",
        havezic: "var(--havezic-container)",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(11, 60, 93, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04)",
        "card-hover":
          "0 12px 40px -8px rgba(11, 60, 93, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)",
        glass: "var(--shadow-panel)",
        glow: "var(--glow-accent)",
      },
      backgroundImage: {
        "gradient-mesh":
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(246,176,30,0.14), transparent), radial-gradient(ellipse 60% 50% at 100% 40%, rgba(255,122,0,0.10), transparent), radial-gradient(ellipse 55% 45% at 0% 80%, rgba(46,125,50,0.10), transparent), linear-gradient(165deg, #0B1220 0%, #070B12 55%, #05070c 100%)",
        "gradient-cta":
          "linear-gradient(135deg, #FF7A00 0%, #e66e00 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #F6B01E 0%, #FF7A00 55%, #2E7D32 100%)",
      },
      backdropBlur: {
        glass: "20px",
        "glass-lg": "24px",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
