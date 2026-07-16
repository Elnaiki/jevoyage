import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function PersonalInfo() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  async function handleSave() {
    setLoading(true);

    const result = await updateProfile({
      full_name: fullName,
      phone,
    });

    setLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    alert("Profil mis à jour !");
  }

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    user?.email?.[0].toUpperCase() ||
    '?';

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="bg-white sticky top-0 z-40 border-b border-slate-100 px-4 pt-12 pb-4 flex items-center gap-3">

        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-lg font-bold">
          Informations personnelles
        </h1>

      </header>

      <div className="p-6">

        <div className="flex justify-center mb-8">

          <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-teal-400 flex items-center justify-center text-3xl font-bold text-slate-700">
            {initials}
          </div>

        </div>

        <div className="space-y-5">

          <div>

            <label className="text-sm font-semibold flex items-center gap-2 mb-2">
              <User size={16} />
              Nom complet
            </label>

            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
            />

          </div>

          <div>

            <label className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Mail size={16} />
              Email
            </label>

            <input
              disabled
              value={user?.email || ''}
              className="w-full rounded-xl bg-slate-100 border border-slate-200 px-4 py-3"
            />

          </div>

          <div>

            <label className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Phone size={16} />
              Téléphone
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
            />

          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full mt-8 bg-slate-800 text-teal-400 rounded-2xl py-4 font-bold flex justify-center items-center gap-2 hover:bg-slate-900 transition"
          >

            <Save size={18} />

            {loading ? "Enregistrement..." : "Enregistrer"}

          </button>

        </div>

      </div>

    </div>
  );
}