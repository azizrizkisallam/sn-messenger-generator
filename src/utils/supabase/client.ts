import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  "https://sokjpskgbwhimkfnbzze.supabase.co";

const supabaseKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "sb_publishable_bYeZBop2Sr60OYdoS4sfyg_Xu_8qlj7";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
