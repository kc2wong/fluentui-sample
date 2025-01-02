import esbuild from 'esbuild';
import dotenv from 'dotenv';
import { copy } from 'esbuild-plugin-copy';

// Load `.env` variables
const dotenvConfig = dotenv.config().parsed || {};

// Merge `process.env` with `dotenv` variables
const env = {
  ...dotenvConfig, // Values from `.env` file
  ...process.env, // Values set directly in the build command
};

const envKeys = Object.keys(env).reduce((acc, key) => {
  acc[`process.env.${key}`] = JSON.stringify(env[key]);
  return acc;
}, {});

// Build process
esbuild
  .build({
    entryPoints: ['./src/index.tsx'],
    bundle: true,
    minify: true,
    sourcemap: true,
    outdir: 'dist',
    define: {
      'process.env.NODE_ENV': '"production"',
      ...envKeys,
    },
    loader: {
      '.css': 'text',
      '.png': 'file',
      '.svg': 'file',
    },
    target: ['es2015'],
    plugins: [
      copy({
        // Plugin options
        resolveFrom: 'cwd',
        assets: [
          {
            from: './public/*', // Source files
            to: './dist/', // Destination directory
          },
        ],
      }),
    ],
  })
  .catch(() => process.exit(1));
