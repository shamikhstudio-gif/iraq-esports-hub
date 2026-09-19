import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  'https://iwiufvpvvkkwmvaqohwz.supabase.co';

const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aXVmdnB2dmtrd212YXFvaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODU3MjgsImV4cCI6MjEwMzE2MTcyOH0.3_7iTmEKWd9MRINZ7GihfWSY4iz3QTOeY7n4KRw4fV8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});