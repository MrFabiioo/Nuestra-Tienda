/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors:{
        'guacamole-a': '#3E6102',
        'guacamole-b': '#568203',
        'guacamole-c': '#697F03',
        'guacamole-d': '#82A903',
        'guacamole-e': '#84A903',
        'guacamole-f': '#CDB902',
        'guacamole-g': '#A98403',
        'guacamole-h': '#956303',
      }
    },
  },
  plugins: [],
};