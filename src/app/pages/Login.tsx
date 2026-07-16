import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Bus, Eye, EyeOff, Facebook } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithFacebook } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!phone.trim()) {
        setError('Numéro de téléphone requis');
        setLoading(false);
        return;
      }
      if (!password.trim()) {
        setError('Mot de passe requis');
        setLoading(false);
        return;
      }

      const { error: err } = await signIn(phone, password);
      if (err) {
        setError(err);
        setLoading(false);
        return;
      }
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-slate-100">
            <Bus size={40} className="text-teal-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Bon retour !</h1>
          <p className="text-sm text-slate-500 mt-1">Connectez-vous pour continuer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <input
              type="tel"
              placeholder="Numéro de téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent outline-none font-semibold text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none font-semibold text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="text-slate-400"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-teal-400 py-4 rounded-2xl font-extrabold text-base hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>

          <button
            type="button"
            onClick={async () => {
              const { error } = await signInWithFacebook();
              if (error) setError(error);
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-base hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Facebook size={20} />
            Continuer avec Facebook
          </button>
        </form>

        <div className="flex justify-between mt-4">
          <Link to="/forgot-password" className="text-sm text-teal-600 font-bold hover:text-teal-700">
            Mot de passe oublié ?
          </Link>
        </div>

        <p className="text-center text-slate-600 mt-6">
          Pas encore inscrit ?{' '}
          <Link to="/signup" className="text-teal-600 font-bold hover:text-teal-700">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}