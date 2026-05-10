import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: "#061c0e",
          DEFAULT: "#0a5c2e",
          light: "#0f7a3d",
        },
        gold: "#FFD700",
        turnering: "#1a56db",
        matchtips: "#7c3aed",
        kaos: "#e11d48",
        safe: "#16a34a",
        devil: "#ea580c",
        crazy: "#dc2626",
        joker: "#a855f7",
      },
      fontFamily: {
        bebas: ["var(--font-bebas)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "pitch-lines": `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 79px,
            rgba(255,255,255,0.04) 79px,
            rgba(255,255,255,0.04) 80px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 79px,
            rgba(255,255,255,0.04) 79px,
            rgba(255,255,255,0.04) 80px
          )
        `,
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        bounce_in: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        bounce_in: "bounce_in 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
