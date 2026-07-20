import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!

serve(async (req) => {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Numéro de téléphone requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Définir l'expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Stocker le code dans Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error: dbError } = await supabase
      .from('password_reset_codes')
      .insert({
        phone: phone,
        code: code,
        expires_at: expiresAt
      })

    if (dbError) {
      console.error('Erreur base de données:', dbError)
      return new Response(JSON.stringify({ error: 'Erreur lors de la sauvegarde du code' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Envoyer le SMS via Twilio
    const message = `Votre code de réinitialisation JeVoyage est: ${code}. Ce code expire dans 10 minutes.`
    const toPhone = phone.startsWith('+') ? phone : `+237${phone}`

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: toPhone,
          From: twilioPhoneNumber,
          Body: message,
        }),
      }
    )

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text()
      console.error('Erreur Twilio:', errorText)
      return new Response(JSON.stringify({ 
        error: "Erreur lors de l'envoi du SMS", 
        details: errorText 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const twilioData = await twilioResponse.json()

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'SMS envoyé avec succès',
      sid: twilioData.sid
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
