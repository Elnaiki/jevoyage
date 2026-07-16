import { useState } from "react";
import { ArrowLeft, Bell, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Notifications() {
  const navigate = useNavigate();

  const { profile } = useAuth();

  const [booking, setBooking] = useState(profile?.notify_booking ?? true);
  const [travelReminder, setTravelReminder] = useState(profile?.notify_trip_reminder ?? true);
  const [email, setEmail] = useState(profile?.notify_email ?? true);
  const [sms, setSms] = useState(profile?.notify_sms ?? false);

  const { updateProfile } = useAuth();

async function handleSave() {

  const result = await updateProfile({

    notify_booking: booking,

    notify_trip_reminder: travelReminder,

    notify_email: email,

    notify_sms: sms,

  });

  if (result.error) {

    alert(result.error);

    return;

  }

  alert("Préférences enregistrées !");
}

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="bg-white sticky top-0 z-40 border-b border-slate-100 px-4 pt-12 pb-4 flex items-center gap-3">

        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-lg font-bold">
          Notifications
        </h1>

      </header>

      <div className="p-4">

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

          <NotificationItem
            title="Réservations"
            description="Recevoir les confirmations de réservation"
            checked={booking}
            onChange={setBooking}
          />

          <NotificationItem title="Rappels de voyage" description="Être averti avant l'heure de départ de votre bus" checked={travelReminder} onChange={setTravelReminder}
          />

          <NotificationItem
            title="Emails"
            description="Recevoir les emails de JeVoyage"
            checked={email}
            onChange={setEmail}
          />

          <NotificationItem
            title="SMS"
            description="Recevoir les SMS liés à vos voyages"
            checked={sms}
            onChange={setSms}
          />

        </div>

        <button
          onClick={handleSave}
          className="w-full mt-8 bg-slate-800 text-teal-400 rounded-2xl py-4 font-bold flex justify-center items-center gap-2 hover:bg-slate-900 transition"
        >
          <Save size={18} />
          Enregistrer
        </button>

      </div>

    </div>
  );
}

interface NotificationItemProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function NotificationItem({
  title,
  description,
  checked,
  onChange,
}: NotificationItemProps) {
  return (
    <div className="flex justify-between items-center px-5 py-5 border-b last:border-b-0">

      <div className="flex items-start gap-3">

        <Bell className="text-slate-500 mt-1" size={18} />

        <div>

          <p className="font-semibold text-slate-800">
            {title}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {description}
          </p>

        </div>

      </div>

      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full transition ${
          checked ? "bg-teal-500" : "bg-slate-300"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transform transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>

    </div>
  );
}