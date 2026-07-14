import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ThumbsUp, MessageCircle, Phone, User, MapPin, Users, Share2, Clock,
  Snowflake, Wifi, Usb, Droplets, ShieldCheck, CalendarClock, ChevronRight, MessageSquareText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import StarRating from '../components/StarRating';
import type { Trip, TripComment, TripRating } from '../lib/types';

// Image par défaut si l'agence n'a pas encore uploadé de photo de bus
const DEFAULT_BUS_IMAGE = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60';

// Mapping des équipements possibles -> icône + libellé affiché
const AMENITY_MAP: Record<string, { label: string; icon: typeof Snowflake }> = {
  clim: { label: 'Climatisation', icon: Snowflake },
  wifi: { label: 'Wifi à bord', icon: Wifi },
  toilettes: { label: 'Toilettes', icon: Droplets },
  usb: { label: 'Prises USB', icon: Usb },
};

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

  // Nouvelles données : autres horaires de l'agence + stats de confiance
  const [otherTrips, setOtherTrips] = useState<Trip[]>([]);
  const [agencyTripCount, setAgencyTripCount] = useState(0);

  // Protections anti double-clic pendant qu'une requête est en cours
  const [likePending, setLikePending] = useState(false);
  const [commentPending, setCommentPending] = useState(false);
  const [ratingPending, setRatingPending] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;

    // 1. On récupère d'abord le voyage, car agency_id/from_city/to_city
    // sont nécessaires pour les requêtes suivantes (autres horaires, stats agence)
    const tripRes = await supabase.from('trips').select('*, agency:agencies(*)').eq('id', id).maybeSingle();
    if (!tripRes.data) { setLoading(false); return; }
    const currentTrip = tripRes.data as Trip;
    setTrip(currentTrip);

    const [commentsRes, ratingsRes, likeCountRes, userLikeRes, userRatingRes, otherTripsRes, agencyCountRes] = await Promise.all([
      supabase.from('trip_comments').select('*, profiles:user_id(full_name)').eq('trip_id', id).order('created_at', { ascending: false }),
      supabase.from('trip_ratings').select('*').eq('trip_id', id),
      supabase.from('trip_likes').select('id', { count: 'exact', head: true }).eq('trip_id', id),
      user ? supabase.from('trip_likes').select('id').eq('trip_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      user ? supabase.from('trip_ratings').select('*').eq('trip_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      // Autres horaires : même agence, même trajet, à venir, en excluant le voyage courant
      supabase.from('trips').select('*')
        .eq('agency_id', currentTrip.agency_id)
        .eq('from_city', currentTrip.from_city)
        .eq('to_city', currentTrip.to_city)
        .neq('id', id)
        .gte('departure_time', new Date().toISOString())
        .order('departure_time', { ascending: true })
        .limit(3),
      // Nombre total de voyages proposés par l'agence (badge de confiance)
      supabase.from('trips').select('id', { count: 'exact', head: true }).eq('agency_id', currentTrip.agency_id),
    ]);

    setComments((commentsRes.data || []) as unknown as TripComment[]);
    setRatings(ratingsRes.data || []);
    setLikeCount(likeCountRes.count || 0);
    setUserLiked(!!userLikeRes.data);
    setOtherTrips((otherTripsRes.data || []) as Trip[]);
    setAgencyTripCount(agencyCountRes.count || 0);
    if (userRatingRes.data) {
      setUserRating(userRatingRes.data as TripRating);
      setRatingOverall((userRatingRes.data as TripRating).rating_overall);
      setRatingAgency((userRatingRes.data as TripRating).rating_agency);
      setRatingAgent((userRatingRes.data as TripRating).rating_agent);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleShare = async () => {
    if (!trip || !id) return;
    const url = `${window.location.origin}/trip/${id}`;
    const text = `${trip.from_city} → ${trip.to_city} le ${fmtDateShare(trip.departure_time)} à ${fmtTime(trip.departure_time)} — ${trip.price.toLocaleString('fr-FR')} FCFA avec ${trip.agency?.name}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'JeVoyage', text, url });
      } catch {
        // L'utilisateur a annulé le partage, on ne fait rien
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Lien copié ! Tu peux le coller où tu veux.');
    } catch {
      alert(url);
    }
  };

  const handleLike = async () => {
    if (!user) { navigate('/auth'); return; }
    if (likePending) return;
    setLikePending(true);

    const prevLiked = userLiked;
    const prevCount = likeCount;

    try {
      if (userLiked) {
        setUserLiked(false); setLikeCount(c => c - 1);
        const { error } = await supabase.from('trip_likes').delete().eq('trip_id', id!).eq('user_id', user.id);
        if (error) throw error;
      } else {
        setUserLiked(true); setLikeCount(c => c + 1);
        const { error } = await supabase.from('trip_likes').insert({ trip_id: id, user_id: user.id });
        if (error) throw error;
      }
    } catch {
      setUserLiked(prevLiked);
      setLikeCount(prevCount);
      alert("L'action n'a pas pu être enregistrée, réessaie.");
    } finally {
      setLikePending(false);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim() || commentPending) return;
    setCommentPending(true);
    const content = newComment.trim();
    setNewComment('');

    try {
      const { error } = await supabase.from('trip_comments').insert({ trip_id: id, user_id: user.id, content });
      if (error) throw error;
      await fetchData();
    } catch {
      setNewComment(content);
      alert("Le commentaire n'a pas pu être envoyé, réessaie.");
    } finally {
      setCommentPending(false);
    }
  };

  const handleRating = async () => {
    if (!user || ratingOverall === 0 || ratingPending) return;
    setRatingPending(true);

    try {
      if (userRating) {
        const { error } = await supabase.from('trip_ratings').update({
          rating_overall: ratingOverall, rating_agency: ratingAgency, rating_agent: ratingAgent,
        }).eq('id', userRating.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trip_ratings').insert({
          trip_id: id, user_id: user.id, rating_overall: ratingOverall, rating_agency: ratingAgency, rating_agent: ratingAgent,
        });
        if (error) throw error;
      }
      await fetchData();
    } catch {
      alert("La notation n'a pas pu être enregistrée, réessaie.");
    } finally {
      setRatingPending(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-teal-300 border-t-transparent rounded-full animate-spin" /></div>;
  if (!trip) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Voyage introuvable</div>;

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtDateShare = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const fmtDateShort = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  // Format relatif pour les commentaires : "à l'instant", "il y a 5 min", "il y a 2h", sinon date
  const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH}h`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const avgOverall = ratings.length ? ratings.reduce((s, r) => s + r.rating_overall, 0) / ratings.length : 0;
  const avgAgency = ratings.length ? ratings.reduce((s, r) => s + r.rating_agency, 0) / ratings.length : 0;
  const avgAgent = ratings.length ? ratings.reduce((s, r) => s + r.rating_agent, 0) / ratings.length : 0;
  const seatsPercent = trip.total_seats > 0 ? ((trip.total_seats - trip.available_seats) / trip.total_seats) * 100 : 0;
  const durationMs = new Date(trip.arrival_time).getTime() - new Date(trip.departure_time).getTime();
  const durationH = Math.floor(durationMs / 3600000);
  const durationM = Math.round((durationMs % 3600000) / 60000);
  const durationLabel = durationH > 0
    ? `${durationH}h${durationM > 0 ? durationM : ''}`
    : `${durationM}min`;

  const busImage = trip.agency?.bus_image_url || DEFAULT_BUS_IMAGE;

  // Ancienneté de l'agence, calculée depuis agencies.created_at
  const agencyYears = trip.agency?.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(trip.agency.created_at).getTime()) / (365 * 24 * 3600 * 1000)))
    : null;

  // Formatage du numéro pour le lien WhatsApp (garde uniquement les chiffres,
  // ajoute l'indicatif Cameroun si le numéro est saisi en local sur 9 chiffres)
  const whatsappNumber = trip.agency?.phone
    ? (() => {
        const digits = trip.agency!.phone!.replace(/\D/g, '');
        return digits.length === 9 ? `237${digits}` : digits;
      })()
    : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white px-4 pt-12 pb-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-slate-700" />
        </button>
        <h1 className="text-base font-extrabold text-slate-800">Détails du voyage</h1>
        <button onClick={handleShare} className="ml-auto w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Share2 size={16} className="text-slate-600" />
        </button>
      </header>

      {/* Image du bus */}
      <div className="relative h-44 w-full">
        <img
          src={busImage}
          alt={`Bus ${trip.agency?.name}`}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_BUS_IMAGE; }}
        />
        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border bg-slate-100 text-slate-700 border-slate-200">
          {trip.bus_type}
        </span>
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="text-base font-extrabold text-slate-800">{trip.agency?.name}</div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500">{trip.agency?.location}</span>
            </div>
            {/* Badge de confiance agence */}
            {(agencyTripCount > 0 || agencyYears !== null) && (
              <div className="flex items-center gap-1 mt-1.5">
                <ShieldCheck size={12} className="text-teal-500" />
                <span className="text-[10px] font-bold text-teal-600">
                  {agencyTripCount} voyage{agencyTripCount > 1 ? 's' : ''} proposé{agencyTripCount > 1 ? 's' : ''}
                  {agencyYears !== null && agencyYears > 0 ? ` · ${agencyYears} an${agencyYears > 1 ? 's' : ''} sur JeVoyage` : ''}
                </span>
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-600 shrink-0">{fmtDate(trip.departure_time)}</span>
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
            <span>{durationLabel}</span>
          </div>
        </div>
      </div>

      {/* Équipements du bus */}
      {trip.amenities && trip.amenities.length > 0 && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-800 mb-3">Équipements</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {trip.amenities.map((key) => {
              const info = AMENITY_MAP[key];
              if (!info) return null;
              const Icon = info.icon;
              return (
                <div key={key} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                  <Icon size={16} className="text-teal-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600">{info.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact agence */}
      {trip.agency?.phone && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-800 mb-3">Contacter l'agence</h3>
          <div className="flex gap-2.5">
            <a href={`tel:${trip.agency.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-teal-400 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
              <Phone size={14} /> Appeler
            </a>
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                <MessageSquareText size={14} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

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

      {/* Conditions d'annulation */}
      {trip.cancellation_policy && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-800 mb-2">Conditions d'annulation</h3>
          <p className="text-xs font-medium text-slate-500 leading-relaxed">{trip.cancellation_policy}</p>
        </div>
      )}

      {/* Autres horaires de la même agence */}
      {otherTrips.length > 0 && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-1.5">
            <CalendarClock size={15} className="text-teal-500" /> Autres horaires disponibles
          </h3>
          <div className="space-y-2">
            {otherTrips.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/trip/${t.id}`)}
                className="w-full flex items-center justify-between bg-slate-50 rounded-xl px-3.5 py-3 hover:bg-slate-100 transition-colors"
              >
                <div className="text-left">
                  <div className="text-sm font-extrabold text-slate-800">{fmtTime(t.departure_time)}</div>
                  <div className="text-[10px] font-semibold text-slate-400">{fmtDateShort(t.departure_time)}</div>
                </div>
                <div className="text-xs font-bold text-slate-600">{t.available_seats} places</div>
                <div className="text-sm font-extrabold text-teal-600">{t.price.toLocaleString('fr-FR')} FCFA</div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-4 mt-3 bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={handleLike} disabled={likePending} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${userLiked ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500'}`}>
            <ThumbsUp size={16} fill={userLiked ? 'currentColor' : 'none'} /><span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-sm font-bold">
            <MessageCircle size={16} /><span>{comments.length}</span>
          </div>
        </div>

        {/* Commentaires - nouveau design en bulles */}
        <div className="space-y-2.5 mb-4 max-h-72 overflow-y-auto pr-1">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-extrabold text-teal-600 shrink-0 mt-0.5">
                {(c.profiles as any)?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
              </div>
              <div className="flex-1 min-w-0 bg-slate-50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-slate-700 truncate">{(c.profiles as any)?.full_name || 'Anonyme'}</span>
                  <span className="text-[9px] font-semibold text-slate-400 shrink-0">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-[12px] text-slate-600 mt-1 break-words leading-snug">{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-6">
              <MessageCircle size={22} className="text-slate-200 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-400">Aucun commentaire pour l'instant</p>
            </div>
          )}
        </div>

        {user && (
          <div className="flex gap-2">
            <input type="text" placeholder="Ajouter un commentaire..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              disabled={commentPending}
              className="flex-1 bg-slate-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-300 disabled:opacity-60" />
            <button onClick={handleComment} disabled={!newComment.trim() || commentPending} className="px-4 py-2.5 bg-slate-800 text-teal-400 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-slate-700 transition-colors">
              {commentPending ? '...' : 'Envoyer'}
            </button>
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
            <button onClick={handleRating} disabled={ratingOverall === 0 || ratingPending} className="w-full mt-3 py-2.5 bg-slate-800 text-teal-400 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-slate-700 transition-colors">
              {ratingPending ? 'Envoi...' : userRating ? 'Mettre à jour' : 'Soumettre la notation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}