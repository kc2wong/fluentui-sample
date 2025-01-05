import esbuild from 'esbuild';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { copy } from 'esbuild-plugin-copy';

// Load `.env` variables
const environment = process.env.NODE_ENV || 'development';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const envFilePath = path.resolve(__dirname, `.env.${environment}`);
const dotenvConfig = dotenv.config({ path: envFilePath }).parsed || {};

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
