import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';

export default function VerifySmsCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    setLoading(true);

    try {
      // Vérifier le code via Edge Function Supabase
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-sms-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone, code })
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Code invalide ou expiré');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/reset-password', { state: { phone } });
      }, 1500);
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
              <ShieldCheck size={32} className="text-teal-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Vérification</h1>
            <p className="text-sm text-slate-500">Entrez le code à 6 chiffres reçu par SMS</p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-800 mb-2">Code vérifié !</h2>
              <p className="text-sm text-slate-600">Vous allez être redirigé...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-xs font-bold text-slate-700 mb-2">
                  Code de vérification
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent transition-all text-center tracking-widest text-2xl"
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
                disabled={loading || code.length !== 6}
                className="w-full py-3 bg-slate-800 text-teal-400 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                {loading ? 'Vérification...' : 'Vérifier le code'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Renvoyer le code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
