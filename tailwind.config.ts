import type { Config } from "tailwindcss";

const config: Config = {
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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#0B3C5D",
          accent: "#3FA7D6",
          cta: "#FF7A00",
          surface: "#F8FAFC",
          muted: "#64748B",
          ink: "#0F172A",
          "primary-dark": "#072a45",
        },
      },
      maxWidth: {
        content: "1280px",
        prose: "42rem",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(11, 60, 93, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04)",
        "card-hover":
          "0 12px 40px -8px rgba(11, 60, 93, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)",
        glass: "var(--shadow-glass)",
        glow: "var(--glow-accent)",
      },
      backgroundImage: {
        "gradient-mesh":
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(63,167,214,0.15), transparent), radial-gradient(ellipse 60% 50% at 100% 40%, rgba(11,60,93,0.4), transparent), linear-gradient(165deg, #0B3C5D 0%, #0f172a 50%, #0a1628 100%)",
        "gradient-cta":
          "linear-gradient(135deg, #FF7A00 0%, #e66e00 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #3FA7D6 0%, #0B3C5D 100%)",
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
