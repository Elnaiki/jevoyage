import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation format téléphone camerounais
    const phoneRegex = /^(\+237)?[2368]\d{8}$/;
    const normalizedPhone = phone.startsWith('+237') ? phone : `+237${phone}`;
    
    if (!phoneRegex.test(normalizedPhone)) {
      setError('Format de téléphone invalide. Exemple: +237699123456 ou 699123456');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/send-reset-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: normalizedPhone })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Rediriger vers la page de vérification après 2 secondes
        setTimeout(() => {
          navigate('/verify-sms-code', { state: { phone: normalizedPhone } });
        }, 2000);
      } else {
        setError(data.error || 'Erreur lors de l\'envoi du SMS');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-semibold">Retour</span>
        </button>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={32} className="text-teal-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Mot de passe oublié ?</h1>
            <p className="text-sm text-slate-500">Entrez votre numéro pour recevoir un code de réinitialisation</p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-800 mb-2">SMS envoyé !</h2>
              <p className="text-sm text-slate-600">Vous allez être redirigé vers la page de vérification...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237699123456"
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full py-3 bg-slate-800 text-teal-400 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le code'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
