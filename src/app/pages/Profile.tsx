import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Bell, Shield, Globe, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 pb-24">
        <User size={48} className="mb-4 opacity-40" />
        <p className="text-sm font-semibold">Connectez-vous pour voir votre profil</p>
        <button onClick={() => navigate('/auth')} className="mt-4 px-6 py-2.5 bg-slate-800 text-teal-400 rounded-xl text-sm font-bold">Se connecter</button>
      </div>
    );
  }

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || user.email?.[0].toUpperCase() || '?';
  const menuItems = [
    { icon: User, label: 'Informations personnelles', href: '#' },
    { icon: FileText, label: 'Mes notations', href: '/history' },
    { icon: Bell, label: 'Notifications', href: '#' },
    { icon: Shield, label: 'Sécurité', href: '#' },
    { icon: Globe, label: 'Langue', href: '#', value: 'Français' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white px-4 pt-12 pb-3 flex items-center gap-2.5 sticky top-0 z-40">
        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center"><User size={16} className="text-teal-400" /></div>
        <h1 className="text-base font-extrabold text-slate-800">Mon Profil</h1>
      </header>
      <div className="bg-white p-6 text-center border-b border-slate-100">
        <div className="w-24 h-24 rounded-full bg-slate-100 border-[3px] border-teal-400 flex items-center justify-center mx-auto mb-3 text-3xl font-extrabold text-slate-700">{initials}</div>
        <h3 className="text-xl font-extrabold text-slate-800">{profile?.full_name || 'Utilisateur'}</h3>
        <p className="text-[13px] text-slate-500 mt-1">{profile?.phone || user.email}</p>
      </div>
      <div className="mt-6">
        <p className="px-6 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Compte</p>
        <div className="mx-4 bg-white rounded-2xl overflow-hidden border border-slate-100">
          {menuItems.slice(0, 2).map((item) => (
            <button key={item.label} onClick={() => item.href !== '#' && navigate(item.href)} className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3"><item.icon size={18} className="text-slate-500" /><span className="text-sm font-semibold text-slate-800">{item.label}</span></div>
              <span className="text-slate-300 font-extrabold">&#x203A;</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <p className="px-6 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Préférences</p>
        <div className="mx-4 bg-white rounded-2xl overflow-hidden border border-slate-100">
          {menuItems.slice(2).map((item) => (
            <button key={item.label} onClick={() => item.href !== '#' && navigate(item.href)} className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3"><item.icon size={18} className="text-slate-500" /><span className="text-sm font-semibold text-slate-800">{item.label}</span></div>
              {item.value ? <span className="text-xs text-slate-400">{item.value}</span> : <span className="text-slate-300 font-extrabold">&#x203A;</span>}
            </button>
          ))}
        </div>
      </div>
      <button onClick={async () => { await signOut(); navigate('/auth'); }} className="mx-4 mt-8 mb-4 w-full py-4 bg-red-50 text-red-500 rounded-2xl text-sm font-extrabold border border-red-100 hover:bg-red-100 transition-colors">
        <LogOut size={16} className="inline mr-2 -mt-0.5" />Déconnexion
      </button>
    </div>
  );
}
