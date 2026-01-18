import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#78BDBF",
          50: "#E8F5F5",
          100: "#D1EBEC",
          200: "#A3D7D9",
          300: "#78BDBF",
          400: "#5AACAF",
          500: "#469A9D",
          600: "#387B7D",
          700: "#2A5C5E",
          800: "#1C3D3F",
          900: "#0E1F1F",
        },
        background: "#000000",
        surface: {
          DEFAULT: "#111111",
          elevated: "#1a1a1a",
        },
        border: "#2a2a2a",
        text: {
          primary: "#ffffff",
          secondary: "#a0a0a0",
        },
        success: {
          DEFAULT: "#22c55e",
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
        },
        warning: {
          DEFAULT: "#f59e0b",
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        },
        danger: {
          DEFAULT: "#ef4444",
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: "16px",
      },
      spacing: {
        "touch": "44px",
      },
      minHeight: {
        "touch": "44px",
      },
      minWidth: {
        "touch": "44px",
      },
    },
  },
  plugins: [],
};

export default config;
