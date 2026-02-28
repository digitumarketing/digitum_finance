import { createClient } from '@supabase/supabase-js';



// HARD-LOCKED CONFIGURATION: Do not use import.meta.env here 

// This prevents Bolt from auto-switching your database.

const supabaseUrl = 'https://cfuschemltpuelbqqnbh.supabase.co'; 

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdXNjaGVtbHRwdWVsYnFxbmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDk4MjIsImV4cCI6MjA4MzAyNTgyMn0.dEy4682tKl4oT2HY7wOKkHZZ2rSWsq-8X68sA0RxezA';

const supabaseServiceRoleKey = 'YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE';



if (!supabaseUrl || !supabaseAnonKey) {

  throw new Error('Missing Supabase configuration strings');

}



// Create Supabase client with enhanced session persistence

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {

  auth: {

    persistSession: true,

    autoRefreshToken: true,

    detectSessionInUrl: true,

    flowType: 'pkce',

    storage: window.localStorage,

    storageKey: 'supabase.auth.token',

    debug: false,

    refreshTokenRetryLimit: 10,

    sessionRefreshMarginSeconds: 7200, 

  },

  global: {

    headers: {

      'X-Client-Info': 'digitum-finance@1.0.0',

    },

  },

  realtime: {

    params: {

      eventsPerSecond: 2,

    },

  },

});



// Admin client for administrative operations

export const supabaseAdmin = supabaseServiceRoleKey 

  ? createClient(supabaseUrl, supabaseServiceRoleKey, {

      auth: {

        autoRefreshToken: false,

        persistSession: false,

      },

    })

  : null;