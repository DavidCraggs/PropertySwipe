/**
 * Load environment variables for seed scripts
 * Since seed scripts run in Node.js (not Vite), we need to load dotenv
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from project root
config({ path: join(__dirname, '../../.env') });

// Make Vite env variables available for Node.js scripts
if (!process.env.VITE_SUPABASE_URL) {
    console.error('❌ ERROR: VITE_SUPABASE_URL is not set in .env file');
    console.error('Please create a .env file in the project root with your Supabase credentials.');
    console.error('See .env.example for the template.');
    process.exit(1);
}

if (!process.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ ERROR: VITE_SUPABASE_ANON_KEY is not set in .env file');
    console.error('Please create a .env file in the project root with your Supabase credentials.');
    console.error('See .env.example for the template.');
    process.exit(1);
}

// Make them available via import.meta.env for compatibility with existing code
const mockEnv = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    MODE: 'development',
    DEV: true,
    PROD: false,
    SSR: false,
};

// Polyfill import.meta.env for Node.js environment
// @ts-ignore - This is intentional for Node.js compatibility
if (typeof import.meta.env === 'undefined') {
    // @ts-ignore
    import.meta.env = mockEnv;
}

export { mockEnv as env };
