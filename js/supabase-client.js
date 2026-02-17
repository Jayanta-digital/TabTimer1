// Supabase Client Initialization

// Import Supabase from CDN (add this script tag to your HTML):
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabase = null;

/**
 * Initialize Supabase client
 */
function initializeSupabase() {
  // ✅ The CDN exposes the library as window.supabase (object with createClient)
  const supabaseLib = window.supabase || window.supabaseJs;

  if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
    console.error('❌ Supabase library not loaded. Make sure the CDN script is included BEFORE config.js.');
    return null;
  }

  try {
    supabase = supabaseLib.createClient(
      CONFIG.supabase.url,
      CONFIG.supabase.anonKey
    );
    
    console.log('✅ Supabase client initialized');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    return null;
  }
}

/**
 * Get Supabase client instance
 */
function getSupabase() {
  if (!supabase) {
    supabase = initializeSupabase();
  }
  return supabase;
}

/**
 * Check if Supabase is initialized
 */
function isSupabaseReady() {
  return supabase !== null;
}

/**
 * Subscribe to real-time changes
 * @param {string} table - Table name
 * @param {string} event - Event type (INSERT, UPDATE, DELETE, or *)
 * @param {function} callback - Callback function
 * @param {object} filter - Optional filter
 */
function subscribeToChanges(table, event, callback, filter = {}) {
  const client = getSupabase();
  if (!client) return null;

  let subscription = client
    .channel(`${table}-changes`)
    .on('postgres_changes', {
      event: event,
      schema: 'public',
      table: table,
      ...filter
    }, callback);

  subscription.subscribe();
  
  return subscription;
}

/**
 * Unsubscribe from real-time changes
 */
function unsubscribe(subscription) {
  if (subscription) {
    subscription.unsubscribe();
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initializeSupabase();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSupabase,
    isSupabaseReady,
    subscribeToChanges,
    unsubscribe
  };
}
