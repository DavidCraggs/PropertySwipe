import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration
 *
 * To set up:
 * 1. Go to https://supabase.com and create a free account
 * 2. Create a new project
 * 3. Go to Settings > API
 * 4. Copy your project URL and anon/public key
 * 5. Create .env.local file with:
 *    VITE_SUPABASE_URL=your-project-url
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 */

// Helper to safely get env vars in both Vite (browser) and Node (seed scripts)
const getEnvVar = (key: string): string => {
  // Check Vite's import.meta.env
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Check Node's process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase credentials not found. Running in localStorage mode.\n' +
    'To enable multi-device sync:\n' +
    '1. Create a Supabase project at https://supabase.com\n' +
    '2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

// Only create client if credentials are available, otherwise use placeholder
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

/**
 * Upload image to Supabase Storage
 * @param file File to upload
 * @param folder Folder path (e.g., 'properties', 'profiles')
 * @returns Public URL of uploaded image
 */
export const uploadImage = async (file: File | Blob, folder: string = 'properties'): Promise<string> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  // Generate unique filename
  const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('property-images')
    .getPublicUrl(data.path);

  return publicUrl;
};

/**
 * Convert base64 to File for upload
 */
export const base64ToFile = (base64: string, filename: string = 'image.jpg'): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * Delete image from Supabase Storage
 */
export const deleteImage = async (url: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  // Extract path from URL
  const urlObj = new URL(url);
  const path = urlObj.pathname.split('/property-images/')[1];

  if (path) {
    await supabase.storage.from('property-images').remove([path]);
  }
};

/**
 * Get the auth redirect URL for OAuth/magic link callbacks
 */
export const getAuthRedirectUrl = (): string => {
  const envUrl = getEnvVar('VITE_AUTH_REDIRECT_URL');
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') return `${window.location.origin}/auth/callback`;
  return 'http://localhost:5173/auth/callback';
};

/**
 * Get the current auth session (null if not signed in)
 */
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
