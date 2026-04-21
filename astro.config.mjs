import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

import preact from '@astrojs/preact';

import db from '@astrojs/db';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [tailwind(), preact(), db()],
  server: {
    host: true,
  },
  vite: {
    optimizeDeps: {
      include: [
        'chart.js',
        '@astrojs/preact/client-dev.js',
        '@nanostores/preact',
        'js-cookie',
        'nanostores',
        'preact/hooks',
      ],
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
