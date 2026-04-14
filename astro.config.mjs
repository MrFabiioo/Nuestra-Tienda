import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import preact from '@astrojs/preact';

import db from '@astrojs/db';

export default defineConfig({
  integrations: [tailwind(), preact(), db()],
  vite: {
    optimizeDeps: {
      include: ['chart.js'],
    },
    resolve: {
      alias: {
        '@data': '/src/data',
        '@layouts': '/src/layouts',
        '@interfaces': '/src/interfaces',
        '@utils': '/src/utils',
        '@components': '/src/components',
        '@svg': '/src/components/svgs',
      }
    }
  }
});