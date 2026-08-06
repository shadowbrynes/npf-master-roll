/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          dark: '#030712',
          navy: '#0b1329',
          gold: '#d97706',
          emerald: '#059669',
          cyan: '#0891b2'
        }
      }
    },
  },
  plugins: [],
};
