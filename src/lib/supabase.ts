import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Cấu hình Supabase bị thiếu! Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const googleProvider = 'google'; // Placeholder for consistency in OAuth
