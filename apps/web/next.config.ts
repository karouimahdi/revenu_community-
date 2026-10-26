import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Lean production image for the docker-compose bonus (B6) — bundles only
  // the deps next start actually needs, instead of the full node_modules tree.
  output: 'standalone',
  // npm workspaces root, not apps/web — otherwise file tracing picks the
  // wrong lockfile boundary and the standalone bundle misses hoisted deps.
  // `__dirname` isn't available — Next loads this config as ESM regardless
  // of package.json's "type" — so this relies on npm workspace scripts
  // always running with cwd set to the workspace directory (apps/web).
  outputFileTracingRoot: path.join(process.cwd(), '../../'),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
