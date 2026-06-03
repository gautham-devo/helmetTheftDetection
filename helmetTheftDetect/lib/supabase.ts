import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoczdzegcfhcgkajflhw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvY3pkemVnY2ZoY2drYWpmbGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjgzODYsImV4cCI6MjA4NTk0NDM4Nn0.SMJnHWU17DVM_0IlAuLjjE8fjjymm9DOQWz_ik-tpjY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});