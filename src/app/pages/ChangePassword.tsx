import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
  if (!user?.email) {
    alert("Utilisateur non connecté.");
    return;
  }

  if (!currentPassword) {
    alert("Veuillez saisir votre mot de passe actuel.");
    return;
  }

  if (newPassword.length < 6) {
    alert("Le nouveau mot de passe doit contenir au moins 6 caractères.");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Les nouveaux mots de passe ne correspondent pas.");
    return;
  }

  setLoading(true);

  // Vérifie que l'ancien mot de passe est correct
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    setLoading(false);
    alert("Ancien mot de passe incorrect.");
    return;
  }

  // Met à jour le mot de passe
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  setLoading(false);

  if (updateError) {
    alert(updateError.message);
    return;
  }

  alert("Mot de passe modifié avec succès !");
  navigate(-1);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="bg-white sticky top-0 z-40 border-b border-slate-100 px-4 pt-12 pb-4 flex items-center gap-3">

        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-lg font-bold">
          Modifier le mot de passe
        </h1>

      </header>

      <div className="p-5 space-y-5">

        <div>
          <label className="font-semibold text-sm">
            Mot de passe actuel
          </label>

          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full mt-2 rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="font-semibold text-sm">
            Nouveau mot de passe
          </label>

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full mt-2 rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="font-semibold text-sm">
            Confirmer le mot de passe
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mt-2 rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className="w-full bg-slate-800 text-teal-400 rounded-2xl py-4 font-bold mt-6"
        >
          {loading ? "Modification..." : "Modifier le mot de passe"}
        </button>

      </div>

    </div>
  );
}