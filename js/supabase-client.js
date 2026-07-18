// Supabase Client Initialization for Certificate Manager

const SUPABASE_URL = "https://acdhivloqtqborszgkgv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZGhpdmxvcXRxYm9yc3pna2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODk4MTQsImV4cCI6MjA5OTk2NTgxNH0.oHHzE33sxqz4KSUyZYRXPvlXYrTGiJTO8A8sw4drtVY";

// Save library reference to avoid namespace conflicts
const supabaseLib = window.supabase;

if (!supabaseLib) {
  console.error("Supabase library not found. Please ensure the CDN script is loaded first.");
}

// Initialize Supabase Client
const supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Override window.supabase with the initialized client instance
window.supabase = supabaseClient;
