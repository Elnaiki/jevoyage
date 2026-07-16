import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Twilio client
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
  console.error('Missing Twilio credentials');
  process.exit(1);
}

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

// Route pour envoyer le SMS de réinitialisation
app.post('/api/send-reset-sms', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    }

    console.log('=== Envoi SMS pour:', phone, '===');

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Code généré:', code);

    // Définir l'expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Stocker le code dans Supabase
    const { error: dbError } = await supabase
      .from('password_reset_codes')
      .insert({
        phone: phone,
        code: code,
        expires_at: expiresAt
      });

    if (dbError) {
      console.error('Erreur base de données:', dbError);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde du code' });
    }

    console.log('Code stocké avec succès');

    // Envoyer le SMS via Twilio
    const message = `Votre code de réinitialisation JeVoyage est: ${code}. Ce code expire dans 10 minutes.`;
    const toPhone = phone.startsWith('+') ? phone : `+237${phone}`;

    console.log('Envoi SMS à:', toPhone);

    try {
      const twilioResponse = await twilioClient.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: toPhone
      });

      console.log('SMS envoyé avec succès, SID:', twilioResponse.sid);

      return res.json({ 
        success: true, 
        message: 'SMS envoyé avec succès',
        sid: twilioResponse.sid
      });

    } catch (twilioError) {
      console.error('Erreur Twilio:', twilioError);
      return res.status(500).json({ 
        error: "Erreur lors de l'envoi du SMS", 
        details: twilioError.message 
      });
    }

  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour réinitialiser le mot de passe
app.post('/api/reset-password', async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({ error: 'Numéro de téléphone et nouveau mot de passe requis' });
    }

    console.log('=== Réinitialisation mot de passe pour:', phone, '===');

    // Get the user ID by phone using the RPC function
    const { data: userId, error: rpcError } = await supabase.rpc('get_user_id_by_phone', {
      phone_param: phone
    });

    if (rpcError) {
      console.error('Erreur RPC:', rpcError);
      return res.status(500).json({ error: 'Erreur lors de la recherche de l\'utilisateur' });
    }

    if (!userId) {
      console.error('Utilisateur non trouvé pour téléphone:', phone);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    console.log('Utilisateur trouvé, ID:', userId);

    // Update the user's password using admin API via the client
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Erreur mise à jour mot de passe:', updateError);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
    }

    console.log('Mot de passe mis à jour avec succès');

    return res.json({ 
      success: true, 
      message: 'Mot de passe mis à jour avec succès' 
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend SMS running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
