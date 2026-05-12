import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envExamplePath = path.join(rootDir, '.env.example');
const envPath = path.join(rootDir, '.env');

console.log('Running postinstall setup...');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('\x1b[32m%s\x1b[0m', '✅ Created .env file from .env.example.');
    console.log('\x1b[33m%s\x1b[0m', '⚠️  Please fill in the required environment variables in your .env file before running the app.');
  } else {
    console.warn('\x1b[31m%s\x1b[0m', '❌ .env.example not found. Could not auto-generate .env');
  }
} else {
  console.log('\x1b[34m%s\x1b[0m', 'ℹ️  .env file already exists. Skipping creation.');
}

console.log('Setup complete!');
