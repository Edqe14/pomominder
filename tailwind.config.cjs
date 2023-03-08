/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        'pale-red': '#923737',
        'pale-teal': '#2d6a6e',
        'pale-blue': '#2e5a79',
      },
    },
  },
  plugins: [],
};
