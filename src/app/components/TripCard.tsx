import { useNavigate } from 'react-router-dom';
import { ThumbsUp, Share2, MessageCircle } from 'lucide-react';
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

const borderColors: Record<string, string> = {
  CLASSIC: 'border-l-teal-400',
  VIP: 'border-l-sky-500',
  PRESTIGE: 'border-l-amber-500',
  NIGHT: 'border-l-indigo-500',
};

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

  return (
    <div
      className={`bg-white mx-4 mb-3 rounded-2xl p-5 border-l-[5px] ${borderColors[trip.bus_type] || 'border-l-teal-400'} shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.99]`}
      onClick={() => navigate(`/trip/${trip.id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold text-slate-800 truncate">{trip.agency?.name}</div>
          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{trip.agency?.location}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg ${
            formatDate(trip.departure_time) === "Aujourd'hui"
              ? 'bg-teal-50 text-teal-600'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {formatDate(trip.departure_time)}
          </span>
          <button
            className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between my-3">
        <div>
          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Départ</span>
          <div className="text-xl font-extrabold text-slate-800 leading-tight">{formatTime(trip.departure_time)}</div>
          <div className="text-[11px] font-semibold text-slate-700">{trip.from_city}</div>
        </div>
        <div className="flex-1 mx-3 mt-4 border-t-2 border-dashed border-slate-200 relative">
          <span className={`absolute -top-[10px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold border ${
            busTypeColors[trip.bus_type] || busTypeColors.CLASSIC
          }`}>
            {trip.bus_type}
          </span>
        </div>
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
  );
}
