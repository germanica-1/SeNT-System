import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { adminId } = await req.json()

    if (!adminId) {
      return new Response(
        JSON.stringify({ error: 'Admin ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // First, delete from auth.users (this will cascade to public.users due to trigger)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(adminId)

    if (authError) {
      console.error('Error deleting from auth:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete admin from authentication system' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Also delete from public.users table as a backup (in case trigger doesn't work)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', adminId)

    if (userError) {
      console.error('Error deleting from users table:', userError)
      // Don't return error here since auth deletion succeeded
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admin deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in delete-admin function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})