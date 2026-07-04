import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, Phone, User, MapPin, Users, Share2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import StarRating from '../components/StarRating';
import type { Trip, TripComment, TripRating } from '../lib/types';

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [comments, setComments] = useState<TripComment[]>([]);
  const [ratings, setRatings] = useState<TripRating[]>([]);
  const [userRating, setUserRating] = useState<TripRating | null>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingAgency, setRatingAgency] = useState(0);
  const [ratingAgent, setRatingAgent] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [tripRes, commentsRes, ratingsRes, likeCountRes, userLikeRes, userRatingRes] = await Promise.all([
      supabase.from('trips').select('*, agency:agencies(*)').eq('id', id).maybeSingle(),
      supabase.from('trip_comments').select('*, profiles:user_id(full_name)').eq('trip_id', id).order('created_at', { ascending: false }),
      supabase.from('trip_ratings').select('*').eq('trip_id', id),
      supabase.from('trip_likes').select('id', { count: 'exact', head: true }).eq('trip_id', id),
      user ? supabase.from('trip_likes').select('id').eq('trip_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      user ? supabase.from('trip_ratings').select('*').eq('trip_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    if (tripRes.data) setTrip(tripRes.data);
    setComments((commentsRes.data || []) as unknown as TripComment[]);
    setRatings(ratingsRes.data || []);
    setLikeCount(likeCountRes.count || 0);
    setUserLiked(!!userLikeRes.data);
    if (userRatingRes.data) {
      setUserRating(userRatingRes.data as TripRating);
      setRatingOverall((userRatingRes.data as TripRating).rating_overall);
      setRatingAgency((userRatingRes.data as TripRating).rating_agency);
      setRatingAgent((userRatingRes.data as TripRating).rating_agent);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLike = async () => {
    if (!user) { navigate('/auth'); return; }
    if (userLiked) {
      await supabase.from('trip_likes').delete().eq('trip_id', id!).eq('user_id', user.id);
      setUserLiked(false); setLikeCount(c => c - 1);
    } else {
      await supabase.from('trip_likes').insert({ trip_id: id });
      setUserLiked(true); setLikeCount(c => c + 1);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;
    await supabase.from('trip_comments').insert({ trip_id: id, content: newComment.trim() });
    setNewComment('');
    fetchData();
  };

  const handleRating = async () => {
    if (!user || ratingOverall === 0) return;
    if (userRating) {
      await supabase.from('trip_ratings').update({
        rating_overall: ratingOverall, rating_agency: ratingAgency, rating_agent: ratingAgent,
      }).eq('id', userRating.id);
    } else {
      await supabase.from('trip_ratings').insert({
        trip_id: id, rating_overall: ratingOverall, rating_agency: ratingAgency, rating_agent: ratingAgent,
      });
    }
    fetchData();
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-teal-300 border-t-transparent rounded-full animate-spin" /></div>;
  if (!trip) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Voyage introuvable</div>;

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const avgOverall = ratings.length ? ratings.reduce((s, r) => s + r.rating_overall, 0) / ratings.length : 0;
  const avgAgency = ratings.length ? ratings.reduce((s, r) => s + r.rating_agency, 0) / ratings.length : 0;
  const avgAgent = ratings.length ? ratings.reduce((s, r) => s + r.rating_agent, 0) / ratings.length : 0;
  const seatsPercent = trip.total_seats > 0 ? ((trip.total_seats - trip.available_seats) / trip.total_seats) * 100 : 0;
  const durationMs = new Date(trip.arrival_time).getTime() - new Date(trip.departure_time).getTime();
  const durationH = Math.floor(durationMs / 3600000);
  const durationM = Math.round((durationMs % 3600000) / 60000);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white px-4 pt-12 pb-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-slate-700" />
        </button>
        <h1 className="text-base font-extrabold text-slate-800">Détails du voyage</h1>
        <button className="ml-auto w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Share2 size={16} className="text-slate-600" />
        </button>
      </header>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="text-base font-extrabold text-slate-800">{trip.agency?.name}</div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500">{trip.agency?.location}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-600">{fmtDate(trip.departure_time)}</span>
        </div>
        <div className="flex items-center justify-between my-5">
          <div>
            <span className="text-[8px] font-extrabold text-slate-400 uppercase">Départ</span>
            <div className="text-3xl font-extrabold text-slate-800 leading-none">{fmtTime(trip.departure_time)}</div>
            <div className="text-sm font-semibold text-slate-700 mt-0.5">{trip.from_city}</div>
          </div>
          <div className="flex-1 mx-4 mt-5 border-t-2 border-dashed border-slate-200 relative">
            <span className="absolute -top-[10px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">{trip.bus_type}</span>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-extrabold text-slate-400 uppercase">Arrivée</span>
            <div className="text-xl font-bold text-slate-500 leading-none">{fmtTime(trip.arrival_time)}</div>
            <div className="text-sm font-semibold text-slate-700 mt-0.5">{trip.to_city}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold text-slate-800">
            {trip.price.toLocaleString('fr-FR')} <span className="text-sm text-teal-500 font-bold">FCFA</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Clock size={12} />
            <span>{durationH}h{durationM > 0 ? `${durationM}` : ''}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-800 mb-3">Chauffeur</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><User size={22} className="text-slate-400" /></div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-800">{trip.driver_name}</div>
            {trip.driver_phone && (
              <div className="flex items-center gap-1 mt-1"><Phone size={11} className="text-teal-500" /><span className="text-[11px] font-semibold text-slate-500">{trip.driver_phone}</span></div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-800 mb-3">Places disponibles</h3>
        <div className="flex items-center gap-3">
          <Users size={18} className="text-teal-500" />
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-slate-500">{trip.available_seats} places restantes</span>
              <span className="text-slate-400">{trip.total_seats} total</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${seatsPercent}%`, backgroundColor: seatsPercent > 80 ? '#EF4444' : seatsPercent > 50 ? '#F59E0B' : '#2DD4BF' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${userLiked ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500'}`}>
            <ThumbsUp size={16} fill={userLiked ? 'currentColor' : 'none'} /><span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-sm font-bold">
            <MessageCircle size={16} /><span>{comments.length}</span>
          </div>
        </div>
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                {(c.profiles as any)?.full_name?.split(' ').map((n: string) => n[0]).join('') || '??'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-700">{(c.profiles as any)?.full_name || 'Anonyme'}</div>
                <div className="text-[12px] text-slate-600 mt-0.5 break-words">{c.content}</div>
                <div className="text-[9px] text-slate-400 mt-1">{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-xs text-slate-400 text-center py-3">Aucun commentaire</p>}
        </div>
        {user && (
          <div className="flex gap-2">
            <input type="text" placeholder="Ajouter un commentaire..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              className="flex-1 bg-slate-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-300" />
            <button onClick={handleComment} disabled={!newComment.trim()} className="px-4 py-2.5 bg-slate-800 text-teal-400 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-slate-700 transition-colors">Envoyer</button>
          </div>
        )}
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-800 mb-3">Notation</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-slate-50 rounded-xl p-3">
            <div className="text-lg font-extrabold text-slate-800">{avgOverall.toFixed(1)}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Voyage</div>
            <StarRating value={Math.round(avgOverall)} readonly size={14} />
          </div>
          <div className="text-center bg-slate-50 rounded-xl p-3">
            <div className="text-lg font-extrabold text-slate-800">{avgAgency.toFixed(1)}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Agence</div>
            <StarRating value={Math.round(avgAgency)} readonly size={14} />
          </div>
          <div className="text-center bg-slate-50 rounded-xl p-3">
            <div className="text-lg font-extrabold text-slate-800">{avgAgent.toFixed(1)}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Agent</div>
            <StarRating value={Math.round(avgAgent)} readonly size={14} />
          </div>
        </div>
        {user && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-[11px] font-bold text-slate-600 mb-3">{userRating ? 'Modifier votre notation' : 'Noter ce voyage'}</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">Qualité voyage</span><StarRating value={ratingOverall} onChange={setRatingOverall} size={18} /></div>
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">Qualité agence</span><StarRating value={ratingAgency} onChange={setRatingAgency} size={18} /></div>
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">Agent billets</span><StarRating value={ratingAgent} onChange={setRatingAgent} size={18} /></div>
            </div>
            <button onClick={handleRating} disabled={ratingOverall === 0} className="w-full mt-3 py-2.5 bg-slate-800 text-teal-400 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-slate-700 transition-colors">
              {userRating ? 'Mettre à jour' : 'Soumettre la notation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}