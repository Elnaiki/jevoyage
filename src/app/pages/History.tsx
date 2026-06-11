import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TripRating } from '../lib/types';

interface TripWithAgency {
  id: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  agency: { name: string } | null;
}

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<(TripRating & { trip?: TripWithAgency })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('trip_ratings')
      .select('*, trip:trips(id, from_city, to_city, departure_time, agency:agencies(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRatings((data as any) || []);
        setLoading(false);
      });
  }, [user]);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white px-4 pt-12 pb-3 flex items-center gap-2.5 sticky top-0 z-40">
        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center"><Clock size={16} className="text-teal-400" /></div>
        <h1 className="text-base font-extrabold text-slate-800">Mon Historique</h1>
      </header>
      <div className="p-4 space-y-3">
        {!user ? (
          <div className="text-center py-16 text-slate-400">
            <Clock size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">Connectez-vous pour voir votre historique</p>
            <button onClick={() => navigate('/auth')} className="mt-4 px-6 py-2.5 bg-slate-800 text-teal-400 rounded-xl text-sm font-bold">Se connecter</button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-[3px] border-teal-300 border-t-transparent rounded-full animate-spin" /></div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Star size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">Aucun voyage noté</p>
            <p className="text-xs mt-1">Notez des voyages pour les retrouver ici</p>
          </div>
        ) : (
          ratings.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-100 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => r.trip && navigate(`/trip/${r.trip.id}`)}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Star size={20} className="text-amber-500" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-extrabold text-slate-800">{r.trip?.from_city} → {r.trip?.to_city}</div>
                  <div className="text-[11px] text-slate-500">{r.trip?.agency?.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{r.trip?.departure_time ? fmtDate(r.trip.departure_time) : ''}</div>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] font-bold text-slate-500">Voyage: {r.rating_overall}/5</span>
                    <span className="text-[10px] font-bold text-slate-500">Agence: {r.rating_agency}/5</span>
                    <span className="text-[10px] font-bold text-slate-500">Agent: {r.rating_agent}/5</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
