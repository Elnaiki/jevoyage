import { Link } from 'react-router-dom';
import { Bus, LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-slate-100">
            <Bus size={40} className="text-teal-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">JeVoyage</h1>
          <p className="text-sm text-slate-500 mt-2">Votre compagnon de voyage</p>
        </div>

        <div className="space-y-3">
          <Link
            to="/login"
            className="w-full bg-slate-800 text-teal-400 py-4 rounded-2xl font-extrabold text-base hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Se connecter
          </Link>

          <Link
            to="/signup"
            className="w-full bg-teal-500 text-slate-900 py-4 rounded-2xl font-extrabold text-base hover:bg-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            Créer un compte
          </Link>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          En continuant, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  );
}
