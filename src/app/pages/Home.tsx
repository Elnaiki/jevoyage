import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import TripCard from '../components/TripCard';
import type { Trip } from '../lib/types';

const filters = [
  { key: 'all', label: 'Tous les bus' },
  { key: 'vip', label: 'VIP Uniquement' },
  { key: 'budget', label: 'Moins de 5000' },
  { key: 'morning', label: 'Matin' },
  { key: 'night', label: 'Nuit' },
];

function filterTrips(trips: Trip[], filter: string): Trip[] {
  return trips.filter((t) => {
    if (new Date(t.departure_time) < new Date()) return false;
    switch (filter) {
      case 'vip': return t.bus_type === 'VIP' || t.bus_type === 'PRESTIGE';
      case 'budget': return t.price < 5000;
      case 'morning': {
        const h = new Date(t.departure_time).getHours();
        return h >= 5 && h < 12;
      }
      case 'night': {
        const h = new Date(t.departure_time).getHours();
        return h >= 20 || h < 5;
      }
      default: return true;
    }
  });
}

function groupByDate(trips: Trip[]): Record<string, Trip[]> {
  const groups: Record<string, Trip[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  trips.forEach((trip) => {
    const d = new Date(trip.departure_time);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Aujourd'hui";
    else if (d.getTime() === tomorrow.getTime()) label = 'Demain';
    else label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(trip);
  });
  return groups;
}

export default function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('trips')
      .select('*, agency:agencies(*)')
      .gte('departure_time', now)
      .order('departure_time', { ascending: true });

    if (error || !data) { setLoading(false); return; }

    const tripsWithCounts = await Promise.all(
      data.map(async (trip) => {
        const [likeRes, commentRes, userLikeRes] = await Promise.all([
          supabase.from('trip_likes').select('id', { count: 'exact', head: true }).eq('trip_id', trip.id),
          supabase.from('trip_comments').select('id', { count: 'exact', head: true }).eq('trip_id', trip.id),
          user
            ? supabase.from('trip_likes').select('id').eq('trip_id', trip.id).eq('user_id', user.id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        return {
          ...trip,
          like_count: likeRes.count || 0,
          comment_count: commentRes.count || 0,
          user_liked: !!userLikeRes.data,
        } as Trip;
      })
    );
    setTrips(tripsWithCounts);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleLike = useCallback(async (tripId: string) => {
    if (!user) { navigate('/auth'); return; }
    const existing = await supabase
      .from('trip_likes')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing.data) {
      await supabase.from('trip_likes').delete().eq('id', existing.data.id);
    } else {
      await supabase.from('trip_likes').insert({ trip_id: tripId });
    }
    fetchTrips();
  }, [user, navigate, fetchTrips]);

  let filtered = filterTrips(trips, activeFilter);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.from_city.toLowerCase().includes(q) ||
        t.to_city.toLowerCase().includes(q) ||
        t.agency?.name.toLowerCase().includes(q)
    );
  }
  const grouped = groupByDate(filtered);
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white px-4 pt-12 pb-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
            <Bus size={18} className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 leading-tight">JeVoyage</h1>
            <p className="text-[9px] text-teal-500 font-bold uppercase tracking-wider">Voyagez serein</p>
          </div>
        </div>
        <button
          onClick={() => navigate(user ? '/profile' : '/auth')}
          className="w-9 h-9 rounded-full bg-slate-100 border-2 border-teal-400 flex items-center justify-center text-[11px] font-extrabold text-slate-700"
        >
          {user ? initials : '?'}
        </button>
      </header>

      <div className="bg-white px-4 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-300 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-100 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeFilter === f.key
                ? 'bg-slate-800 text-teal-400'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {loading ? (
          <div className="flex flex-col items-center py-20 text-slate-400">
            <div className="w-8 h-8 border-[3px] border-teal-300 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold">Chargement des voyages...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-slate-400">
            <Bus size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-semibold">Aucun voyage disponible</p>
            <p className="text-xs mt-1">Essayez un autre filtre</p>
          </div>
        ) : (
          Object.entries(grouped).map(([label, groupTrips]) => (
            <div key={label}>
              <h3 className="px-5 pt-5 pb-2 text-sm font-extrabold text-slate-800">{label}</h3>
              {groupTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onLike={handleLike} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
