import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Server-only Supabase client. Uses the service-role key, which has full
// bucket access — never expose this client to the browser.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Upload a Buffer to a Supabase Storage bucket and return the public URL.
 * Buckets must be created (and made public) ahead of time in the Supabase dashboard.
 */
export const uploadToBucket = async ({ bucket, key, buffer, contentType = 'image/webp' }) => {
  const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType,
    upsert: false, // we always use a unique filename, so collisions = bug
    cacheControl: '604800', // 7 days
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
};
