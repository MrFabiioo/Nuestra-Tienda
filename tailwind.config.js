/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily:{
        'unique': ['"Space Mono"', 'monospace'],
      },
      colors:{
        'guacamole-a': '#3E6102',
        'guacamole-b': '#568203',
        'guacamole-c': '#697F03',
        'guacamole-d': '#82A903',
        'guacamole-e': '#84A903',
        'guacamole-f': '#CDB902',
        'guacamole-g': '#A98403',
        'guacamole-h': '#956303',
        'guacamole-fondo':'#74ac22',
        'guacamole-icons':'#492e06',
        'guacamole-pulpa':'#dcd329',
        'black-medium':'#2f3237',
        'black-dark':'#111213',
        'white-medium':'#f1f3f9',
      }
    },
  },
  plugins: [],
};