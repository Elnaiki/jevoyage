import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'Numéro de téléphone et code requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier si le code existe et n'est pas expiré
    const { data: codeData, error: fetchError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (fetchError) {
      console.error('Erreur base de données:', fetchError)
      return new Response(JSON.stringify({ error: 'Erreur lors de la vérification du code' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!codeData) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Code invalide ou expiré' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Supprimer le code après vérification réussie
    await supabase
      .from('password_reset_codes')
      .delete()
      .eq('id', codeData.id)

    return new Response(JSON.stringify({ 
      valid: true,
      message: 'Code vérifié avec succès' 
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
