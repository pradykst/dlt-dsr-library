import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/native-okf/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f7f6f1",
        ink: "#20242a",
        muted: "#667085",
        line: "#d8d6cc",
        blue: "#4f6f91",
        green: "#5f7f67",
        purple: "#77658f",
        amber: "#a77b37"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["var(--font-serif)", "serif"]
      },
      boxShadow: {
        research: "0 10px 30px rgba(34, 38, 44, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
