import { ArrowLeft, Lock, Smartphone, ShieldCheck, Trash2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Security() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-100 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-lg font-bold">
          Sécurité
        </h1>
      </header>

      <div className="p-4">

        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100">

          <MenuItem
            icon={<Lock size={20} />}
            title="Modifier le mot de passe"
            subtitle="Choisissez un nouveau mot de passe"
            onClick={() => navigate("/change-password")}
          />

          <MenuItem
            icon={<Smartphone size={20} />}
            title="Appareils connectés"
            subtitle="Consulter vos sessions actives"
            onClick={() => navigate("/connected-devices")}
          />

          <MenuItem
            icon={<ShieldCheck size={20} />}
            title="Authentification à deux facteurs"
            subtitle="Renforcez la sécurité de votre compte"
          />

        </div>
        

        <button
          className="mt-8 w-full bg-red-50 border border-red-100 rounded-2xl py-4 flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-100 transition"
        >
          <Trash2 size={18} />
          Supprimer mon compte
        </button>

      </div>

    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

function MenuItem({ icon, title, subtitle, onClick}: MenuItemProps) {
  return (
    <button
  onClick={onClick}
  className="w-full flex items-center justify-between px-5 py-4 border-b last:border-0 hover:bg-slate-50 transition"
>

      <div className="flex items-center gap-3">

        <div className="text-slate-600">
          {icon}
        </div>

        <div className="text-left">

          <p className="font-semibold text-slate-800">
            {title}
          </p>

          <p className="text-xs text-slate-500">
            {subtitle}
          </p>

        </div>

      </div>

      <ChevronRight className="text-slate-300" size={18} />

    </button>
  );
}