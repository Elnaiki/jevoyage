import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/history', icon: Clock, label: 'Historique' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith('/auth') || location.pathname.startsWith('/trip/') || location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50">
      <div className="max-w-lg mx-auto flex justify-around py-2 pb-6">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 transition-colors"
            >
              <Icon size={22} className={active ? 'text-teal-400' : 'text-slate-400'} />
              <span className={`text-[10px] font-bold ${active ? 'text-teal-400' : 'text-slate-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
