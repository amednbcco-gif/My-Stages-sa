/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0a192f",
          800: "#0f2540",
          700: "#14365f",
        },
        gold: {
          DEFAULT: "#d4af37",
          light: "#f0b429",
          soft: "#fde68a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
