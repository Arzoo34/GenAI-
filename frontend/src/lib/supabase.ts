import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verify that the environment variables exist and are not placeholder strings
export const isSupabaseConfigured =
  typeof supabaseUrl === "string" &&
  supabaseUrl.trim() !== "" &&
  supabaseUrl !== "your_supabase_url_here" &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.trim() !== "" &&
  supabaseAnonKey !== "your_supabase_anon_key_here";

// Create client if configured, otherwise return null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
