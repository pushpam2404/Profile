import { getViteConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default getViteConfig({
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
