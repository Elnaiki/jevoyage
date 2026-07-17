import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { phone, newPassword } = await req.json()

    if (!phone || !newPassword) {
      return new Response(JSON.stringify({ error: 'Numéro de téléphone et nouveau mot de passe requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the user ID by phone using the RPC function
    const { data: userId, error: rpcError } = await supabase.rpc('get_user_id_by_phone', {
      phone_param: phone
    })

    if (rpcError) {
      console.error('Erreur RPC:', rpcError)
      return new Response(JSON.stringify({ error: 'Erreur lors de la recherche de l\'utilisateur' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!userId) {
      console.error('Utilisateur non trouvé pour téléphone:', phone)
      return new Response(JSON.stringify({ error: 'Utilisateur non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Erreur mise à jour mot de passe:', updateError)
      return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour du mot de passe' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Mot de passe mis à jour avec succès' 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erreur serveur:', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
