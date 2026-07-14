import { useNavigate } from 'react-router-dom';
import { ThumbsUp, Share2, MessageCircle, Users, Star } from 'lucide-react';
import type { Trip } from '../lib/types';

interface Props {
  trip: Trip;
  onLike: (tripId: string) => void;
}

const busTypeColors: Record<string, string> = {
  CLASSIC: 'bg-slate-100 text-slate-700 border-slate-200',
  VIP: 'bg-sky-50 text-sky-700 border-sky-200',
  PRESTIGE: 'bg-amber-50 text-amber-700 border-amber-200',
  NIGHT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

// Image par défaut si l'agence n'a pas encore uploadé de photo de bus
const DEFAULT_BUS_IMAGE = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripDate = new Date(d);
  tripDate.setHours(0, 0, 0, 0);
  if (tripDate.getTime() === today.getTime()) return "Aujourd'hui";
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tripDate.getTime() === tomorrow.getTime()) return 'Demain';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function TripCard({ trip, onLike }: Props) {
  const navigate = useNavigate();

  const busImage = trip.agency?.bus_image_url || DEFAULT_BUS_IMAGE;
  const seatsLow = trip.available_seats > 0 && trip.available_seats <= 5;
  const seatsFull = trip.available_seats <= 0;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/trip/${trip.id}`;
    const text = `${trip.from_city} → ${trip.to_city} le ${formatDate(trip.departure_time)} à ${formatTime(trip.departure_time)} — ${trip.price.toLocaleString('fr-FR')} FCFA avec ${trip.agency?.name}`;

    // Web Share API native (mobile) : ouvre le menu WhatsApp/SMS/etc. du téléphone
    if (navigator.share) {
      try {
        await navigator.share({ title: 'JeVoyage', text, url });
      } catch {
        // L'utilisateur a annulé le partage, on ne fait rien
      }
      return;
    }

    // Fallback desktop : copier le lien dans le presse-papier
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Lien copié ! Tu peux le coller où tu veux.');
    } catch {
      alert(url);
    }
  };

  return (
    <div
      className="bg-white mx-4 mb-3 rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.99]"
      onClick={() => navigate(`/trip/${trip.id}`)}
    >
      {/* Image du bus */}
      <div className="relative h-32 w-full">
        <img
          src={busImage}
          alt={`Bus ${trip.agency?.name}`}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_BUS_IMAGE; }}
        />
        <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold border ${
          busTypeColors[trip.bus_type] || busTypeColors.CLASSIC
        }`}>
          {trip.bus_type}
        </span>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            {/* Nom de l'agence : priorité visuelle n°1 */}
            <div className="text-[16px] font-extrabold text-slate-900 tracking-tight truncate leading-tight">
              {trip.agency?.name}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{trip.agency?.location}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Date : sortie du mini-badge, plus grande et plus lisible */}
            <span className={`text-[12px] font-extrabold px-3 py-1.5 rounded-lg whitespace-nowrap ${
              formatDate(trip.departure_time) === "Aujourd'hui"
                ? 'bg-teal-500 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {formatDate(trip.departure_time)}
            </span>
            <button
              className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={handleShare}
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Places restantes + note moyenne */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${
            seatsFull
              ? 'bg-red-50 text-red-600'
              : seatsLow
              ? 'bg-orange-50 text-orange-600'
              : 'bg-slate-50 text-slate-500'
          }`}>
            <Users size={11} />
            <span>{seatsFull ? 'Complet' : `${trip.available_seats} places`}</span>
          </div>
          {typeof trip.avg_rating === 'number' && trip.avg_rating > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-600">
              <Star size={11} fill="currentColor" />
              <span>{trip.avg_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between my-3">
          <div>
            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Départ</span>
            <div className="text-xl font-extrabold text-slate-800 leading-tight">{formatTime(trip.departure_time)}</div>
            <div className="text-[11px] font-semibold text-slate-700">{trip.from_city}</div>
          </div>
          <div className="flex-1 mx-3 mt-4 border-t-2 border-dashed border-slate-200" />
          <div className="text-right">
            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Arrivée</span>
            <div className="text-base font-bold text-slate-500 leading-tight">{formatTime(trip.arrival_time)}</div>
            <div className="text-[11px] font-semibold text-slate-700">{trip.to_city}</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <div className="text-[17px] font-extrabold text-slate-800">
            {trip.price.toLocaleString('fr-FR')} <span className="text-[10px] text-teal-500 font-bold">FCFA</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-400"
              onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}`); }}
            >
              <MessageCircle size={12} />
              <span>{trip.comment_count || 0}</span>
            </button>
            <button
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                trip.user_liked
                  ? 'bg-blue-50 text-blue-500'
                  : 'bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-500'
              }`}
              onClick={(e) => { e.stopPropagation(); onLike(trip.id); }}
            >
              <ThumbsUp size={13} fill={trip.user_liked ? 'currentColor' : 'none'} />
              <span>{trip.like_count || 0}</span>
            </button>
            <button
              className="bg-slate-800 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-slate-700 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.id}`); }}
            >
              Détails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}