import { useState } from 'react';

import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../lib/auth';

import { Bus, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';



export default function Signup() {

  const [fullName, setFullName] = useState('');

  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPass, setShowPass] = useState(false);

  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();

  const navigate = useNavigate();



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setError('');

    setLoading(true);



    try {

      if (!fullName.trim()) {

        setError('Nom complet requis');

        setLoading(false);

        return;

      }

      

      // Validation téléphone camerounais

      const phoneRegex = /^(\+237)?[2368]\d{8}$/;

      const normalizedPhone = phone.startsWith('+237') ? phone : `+237${phone}`;

      if (!phoneRegex.test(normalizedPhone)) {

        setError('Format de téléphone invalide. Exemple: +237699123456 ou 699123456');

        setLoading(false);

        return;

      }

      

      // Validation mot de passe

      if (password.length < 6) {

        setError('Le mot de passe doit contenir au moins 6 caractères');

        setLoading(false);

        return;

      }

      

      if (!/[A-Z]/.test(password)) {

        setError('Le mot de passe doit contenir au moins une majuscule');

        setLoading(false);

        return;

      }

      

      if (!/[0-9]/.test(password)) {

        setError('Le mot de passe doit contenir au moins un chiffre');

        setLoading(false);

        return;

      }

      

      if (password !== confirmPassword) {

        setError('Les mots de passe ne correspondent pas');

        setLoading(false);

        return;

      }



      const { error: err } = await signUp(normalizedPhone, password, fullName);

      if (err) {

        setError(err);

        setLoading(false);

        return;

      }



      setSuccess(true);

      setTimeout(() => {

        navigate('/');

      }, 2000);

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

          <h1 className="text-2xl font-extrabold text-slate-800">Nouveau compte</h1>

          <p className="text-sm text-slate-500 mt-1">Créez votre compte JeVoyage</p>

        </div>



        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3">

            <input

              type="text"

              placeholder="Nom complet"

              value={fullName}

              onChange={(e) => setFullName(e.target.value)}

              className="w-full bg-transparent outline-none font-semibold text-slate-800 placeholder:text-slate-400"

            />

          </div>



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



          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3">

            <input

              type={showPass ? 'text' : 'password'}

              placeholder="Confirmer le mot de passe"

              value={confirmPassword}

              onChange={(e) => setConfirmPassword(e.target.value)}

              className="w-full bg-transparent outline-none font-semibold text-slate-800 placeholder:text-slate-400"

            />

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

            {loading ? 'Chargement...' : 'Créer mon compte'}

          </button>

        </form>



        <p className="text-center text-slate-600 mt-6">

          Déjà inscrit ?{' '}

          <Link to="/login" className="text-teal-600 font-bold hover:text-teal-700">

            Se connecter

          </Link>

        </p>

      </div>

    </div>

  );

}