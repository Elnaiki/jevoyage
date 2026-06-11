import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../app/lib/supabase';
import {
  Bus, Users, FileText, Star, ThumbsUp, MessageSquare,
  Plus, Pencil, Trash2, LayoutDashboard, LogOut, Settings, X
} from 'lucide-react';

/* ========== ADMIN AUTH ========== */
interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s); setUser(s?.user ?? null); setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s); setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return <AdminAuthContext.Provider value={{ user, session, loading, signIn, signOut }}>{children}</AdminAuthContext.Provider>;
}

function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

/* ========== TYPES ========== */
interface Agency { id: string; name: string; location: string; city: string; phone: string; description: string; logo_url: string; }
interface Trip { id: string; agency_id: string; from_city: string; to_city: string; departure_time: string; arrival_time: string; price: number; bus_type: string; driver_name: string; driver_phone: string; available_seats: number; total_seats: number; status: string; agency?: Agency; }
interface Profile { id: string; full_name: string; phone: string; avatar_url: string; is_admin?: boolean; }
interface TripComment { id: string; trip_id: string; user_id: string; content: string; created_at: string; profiles?: { full_name: string }; trip?: { from_city: string; to_city: string }; }
interface TripRating { id: string; trip_id: string; user_id: string; rating_overall: number; rating_agency: number; rating_agent: number; created_at: string; trip?: { from_city: string; to_city: string }; }

/* ========== ADMIN LOGIN ========== */
function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-slate-700">
            <Bus size={32} className="text-teal-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin JeVoyage</h1>
          <p className="text-sm text-slate-400 mt-1">Panneau de contrôle</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" placeholder="Email admin" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-semibold placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-semibold placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500" />
          {error && <div className="bg-red-900/50 text-red-300 text-sm font-semibold px-4 py-2.5 rounded-xl">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-teal-500 text-slate-900 py-3.5 rounded-xl font-extrabold hover:bg-teal-400 transition-colors disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========== SIDEBAR ========== */
function Sidebar({ active, onNavigate, onLogout }: { active: string; onNavigate: (page: string) => void; onLogout: () => void }) {
  const items = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { key: 'agencies', icon: Bus, label: 'Agences' },
    { key: 'trips', icon: FileText, label: 'Voyages' },
    { key: 'users', icon: Users, label: 'Utilisateurs' },
    { key: 'comments', icon: MessageSquare, label: 'Commentaires' },
    { key: 'ratings', icon: Star, label: 'Notations' },
  ];
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center"><Bus size={20} className="text-teal-400" /></div>
          <div><h2 className="text-sm font-extrabold">JeVoyage</h2><p className="text-[10px] text-slate-400 uppercase font-bold">Administration</p></div>
        </div>
      </div>
      <nav className="flex-1 py-4">
        {items.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => onNavigate(key)}
            className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors ${active === key ? 'bg-teal-500/10 text-teal-400 border-r-2 border-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Icon size={18} />{label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
          <LogOut size={18} />Déconnexion
        </button>
      </div>
    </aside>
  );
}

/* ========== DASHBOARD ========== */
function Dashboard() {
  const [stats, setStats] = useState({ agencies: 0, trips: 0, users: 0, comments: 0, ratings: 0, likes: 0 });
  useEffect(() => {
    Promise.all([
      supabase.from('agencies').select('id', { count: 'exact', head: true }),
      supabase.from('trips').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('trip_comments').select('id', { count: 'exact', head: true }),
      supabase.from('trip_ratings').select('id', { count: 'exact', head: true }),
      supabase.from('trip_likes').select('id', { count: 'exact', head: true }),
    ]).then(([a, t, u, c, r, l]) => {
      setStats({ agencies: a.count || 0, trips: t.count || 0, users: u.count || 0, comments: c.count || 0, ratings: r.count || 0, likes: l.count || 0 });
    });
  }, []);

  const cards = [
    { label: 'Agences', value: stats.agencies, icon: Bus, color: 'bg-teal-500/10 text-teal-400' },
    { label: 'Voyages', value: stats.trips, icon: FileText, color: 'bg-sky-500/10 text-sky-400' },
    { label: 'Utilisateurs', value: stats.users, icon: Users, color: 'bg-amber-500/10 text-amber-400' },
    { label: 'Commentaires', value: stats.comments, icon: MessageSquare, color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Notations', value: stats.ratings, icon: Star, color: 'bg-rose-500/10 text-rose-400' },
    { label: 'Likes', value: stats.likes, icon: ThumbsUp, color: 'bg-blue-500/10 text-blue-400' },
  ];

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-6">Tableau de bord</h2>
      <div className="grid grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}><Icon size={20} /></div>
            <div className="text-2xl font-extrabold text-slate-800">{value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== GENERIC TABLE ========== */
function DataTable<T extends { id: string }>({ data, columns, onEdit, onDelete, onAdd, addLabel }: {
  data: T[]; columns: { key: string; label: string; render?: (row: T) => React.ReactNode }[];
  onEdit?: (row: T) => void; onDelete?: (row: T) => void; onAdd?: () => void; addLabel?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="text-sm font-bold text-slate-600">{data.length} résultat(s)</div>
        {onAdd && <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-600 transition-colors"><Plus size={14} />{addLabel || 'Ajouter'}</button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50">{columns.map(c => <th key={c.key} className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase">{c.label}</th>)}{(onEdit || onDelete) && <th className="text-right px-4 py-3 font-bold text-slate-500 text-xs uppercase">Actions</th>}</tr></thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                {columns.map(c => <td key={c.key} className="px-4 py-3 font-medium text-slate-700">{c.render ? c.render(row) : (row as any)[c.key]}</td>)}
                {(onEdit || onDelete) && <td className="px-4 py-3 text-right">
                  {onEdit && <button onClick={() => onEdit(row)} className="p-1.5 text-slate-400 hover:text-teal-500 transition-colors"><Pencil size={15} /></button>}
                  {onDelete && <button onClick={() => onDelete(row)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>}
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========== MODAL ========== */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-extrabold text-slate-800">{title}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ========== AGENCIES PAGE ========== */
function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [form, setForm] = useState({ name: '', location: '', city: '', phone: '', description: '', logo_url: '' });

  const fetchAgencies = useCallback(async () => {
    const { data } = await supabase.from('agencies').select('*').order('name');
    setAgencies(data || []);
  }, []);
  useEffect(() => { fetchAgencies(); }, [fetchAgencies]);

  const openAdd = () => { setEditing(null); setForm({ name: '', location: '', city: '', phone: '', description: '', logo_url: '' }); setShowModal(true); };
  const openEdit = (a: Agency) => { setEditing(a); setForm({ name: a.name, location: a.location, city: a.city, phone: a.phone, description: a.description, logo_url: a.logo_url }); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await supabase.from('agencies').update(form).eq('id', editing.id);
    else await supabase.from('agencies').insert(form);
    setShowModal(false); fetchAgencies();
  };

  const handleDelete = async (a: Agency) => {
    if (!confirm(`Supprimer ${a.name} ?`)) return;
    await supabase.from('agencies').delete().eq('id', a.id); fetchAgencies();
  };

  const fields = [
    { key: 'name', label: 'Nom' }, { key: 'city', label: 'Ville' },
    { key: 'location', label: 'Adresse' }, { key: 'phone', label: 'Téléphone' },
    { key: 'logo_url', label: 'URL Logo', span: 2 },
  ];

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-6">Agences</h2>
      <DataTable data={agencies} onEdit={openEdit} onDelete={handleDelete} onAdd={openAdd} addLabel="Nouvelle agence"
        columns={[{ key: 'name', label: 'Nom' }, { key: 'city', label: 'Ville' }, { key: 'location', label: 'Adresse' }, { key: 'phone', label: 'Téléphone' }]} />
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier agence' : 'Nouvelle agence'}>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
              <label className="text-xs font-bold text-slate-500 mb-1 block">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-300" />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-300" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200">Annuler</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600">Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}

/* ========== TRIPS PAGE ========== */
function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [form, setForm] = useState({ agency_id: '', from_city: '', to_city: '', departure_time: '', arrival_time: '', price: 0, bus_type: 'CLASSIC', driver_name: '', driver_phone: '', available_seats: 49, total_seats: 49, status: 'scheduled' });

  const fetchTrips = useCallback(async () => {
    const { data } = await supabase.from('trips').select('*, agency:agencies(*)').order('departure_time', { ascending: false });
    setTrips(data || []);
  }, []);

  useEffect(() => {
    supabase.from('agencies').select('*').order('name').then(({ data }) => setAgencies(data || []));
    fetchTrips();
  }, [fetchTrips]);

  const fmtDt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const statusBadge = (s: string) => {
    const m: Record<string, string> = { scheduled: 'bg-teal-50 text-teal-600', completed: 'bg-slate-100 text-slate-500', cancelled: 'bg-red-50 text-red-500' };
    return m[s] || m.scheduled;
  };

  const openAdd = () => { setEditing(null); setForm({ agency_id: agencies[0]?.id || '', from_city: '', to_city: '', departure_time: '', arrival_time: '', price: 0, bus_type: 'CLASSIC', driver_name: '', driver_phone: '', available_seats: 49, total_seats: 49, status: 'scheduled' }); setShowModal(true); };
  const openEdit = (t: Trip) => { setEditing(t); setForm({ agency_id: t.agency_id, from_city: t.from_city, to_city: t.to_city, departure_time: t.departure_time.slice(0, 16), arrival_time: t.arrival_time.slice(0, 16), price: t.price, bus_type: t.bus_type, driver_name: t.driver_name, driver_phone: t.driver_phone, available_seats: t.available_seats, total_seats: t.total_seats, status: t.status }); setShowModal(true); };

  const handleSave = async () => {
    const payload = { ...form, departure_time: form.departure_time + ':00+01', arrival_time: form.arrival_time + ':00+01' };
    if (editing) await supabase.from('trips').update(payload).eq('id', editing.id);
    else await supabase.from('trips').insert(payload);
    setShowModal(false); fetchTrips();
  };

  const handleDelete = async (t: Trip) => {
    if (!confirm(`Supprimer voyage ${t.from_city} → ${t.to_city} ?`)) return;
    await supabase.from('trips').delete().eq('id', t.id); fetchTrips();
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-6">Voyages</h2>
      <DataTable data={trips} onEdit={openEdit} onDelete={handleDelete} onAdd={openAdd} addLabel="Nouveau voyage"
        columns={[
          { key: 'agency', label: 'Agence', render: (t) => t.agency?.name || '-' },
          { key: 'route', label: 'Trajet', render: (t) => `${t.from_city} → ${t.to_city}` },
          { key: 'departure_time', label: 'Départ', render: (t) => fmtDt(t.departure_time) },
          { key: 'price', label: 'Prix', render: (t) => `${t.price.toLocaleString('fr-FR')} F` },
          { key: 'bus_type', label: 'Type' },
          { key: 'driver_name', label: 'Chauffeur' },
          { key: 'status', label: 'Statut', render: (t) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusBadge(t.status)}`}>{t.status}</span> },
          { key: 'seats', label: 'Places', render: (t) => `${t.available_seats}/${t.total_seats}` },
        ]} />
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier voyage' : 'Nouveau voyage'}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Agence</label>
            <select value={form.agency_id} onChange={e => setForm({ ...form, agency_id: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none">
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {[
            { key: 'from_city', label: 'Ville départ' }, { key: 'to_city', label: 'Ville arrivée' },
            { key: 'departure_time', label: 'Départ', type: 'datetime-local' }, { key: 'arrival_time', label: 'Arrivée', type: 'datetime-local' },
            { key: 'price', label: 'Prix (FCFA)', type: 'number' }, { key: 'bus_type', label: 'Type bus' },
            { key: 'driver_name', label: 'Chauffeur' }, { key: 'driver_phone', label: 'Tel chauffeur' },
            { key: 'available_seats', label: 'Places dispo', type: 'number' }, { key: 'total_seats', label: 'Places total', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-slate-500 mb-1 block">{f.label}</label>
              {f.key === 'bus_type' ? (
                <select value={form.bus_type} onChange={e => setForm({ ...form, bus_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none">
                  {['CLASSIC', 'VIP', 'PRESTIGE', 'NIGHT'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-300" />
              )}
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Statut</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none">
              {['scheduled', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200">Annuler</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600">Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}

/* ========== USERS PAGE ========== */
function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  useEffect(() => { supabase.from('profiles').select('*').order('full_name').then(({ data }) => setUsers(data || [])); }, []);

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-6">Utilisateurs</h2>
      <DataTable data={users} columns={[
        { key: 'full_name', label: 'Nom' },
        { key: 'phone', label: 'Téléphone' },
        { key: 'id', label: 'ID', render: (u) => <span className="text-xs text-slate-400 font-mono">{u.id.slice(0, 8)}...</span> },
      ]} />
    </div>
  );
}

/* ========== COMMENTS PAGE ========== */
function CommentsPage() {
  const [comments, setComments] = useState<TripComment[]>([]);
  useEffect(() => { supabase.from('trip_comments').select('*, profiles:user_id(full_name), trip:trips(from_city, to_city)').order('created_at', { ascending: false }).then(({ data }) => setComments((data as any) || [])); }, []);

  const handleDelete = async (c: TripComment) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await supabase.from('trip_comments').delete().eq('id', c.id);
    setComments(prev => prev.filter(x => x.id !== c.id));
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-6">Commentaires</h2>
      <DataTable data={comments} onDelete={handleDelete} columns={[
        { key: 'profiles', label: 'Utilisateur', render: (c) => c.profiles?.full_name || 'Anonyme' },
        { key: 'trip', label: 'Voyage', render: (c) => c.trip ? `${c.trip.from_city} → ${c.trip.to_city}` : '-' },
        { key: 'content', label: 'Commentaire' },
        { key: 'created_at', label: 'Date', render: (c) => new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
      ]} />
    </div>
  );
}

/* ========== RATINGS PAGE ========== */
function RatingsPage() {
  const [ratings, setRatings] = useState<TripRating[]>([]);
  useEffect(() => { supabase.from('trip_ratings').select('*, trip:trips(from_city, to_city)').order('created_at', { ascending: false }).then(({ data }) => setRatings((data as any) || [])); }, []);

  const starCell = (v: number) => (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= v ? '#F59E0B' : '#E2E8F0'} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>)}
    </span>
  );

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-6">Notations</h2>
      <DataTable data={ratings} columns={[
        { key: 'trip', label: 'Voyage', render: (r) => r.trip ? `${r.trip.from_city} → ${r.trip.to_city}` : '-' },
        { key: 'rating_overall', label: 'Voyage', render: (r) => starCell(r.rating_overall) },
        { key: 'rating_agency', label: 'Agence', render: (r) => starCell(r.rating_agency) },
        { key: 'rating_agent', label: 'Agent', render: (r) => starCell(r.rating_agent) },
        { key: 'created_at', label: 'Date', render: (r) => new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) },
      ]} />
    </div>
  );
}

/* ========== MAIN ADMIN ========== */
function AdminInner() {
  const { user, loading, signOut } = useAdminAuth();
  const [page, setPage] = useState('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!user) { setCheckingAdmin(false); return; }
    supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle().then(({ data }) => {
      setIsAdmin(data?.is_admin === true);
      setCheckingAdmin(false);
    });
  }, [user]);

  if (loading || checkingAdmin) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-teal-300 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <AdminLogin />;
  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-red-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <Bus size={32} className="text-red-400" />
      </div>
      <h1 className="text-2xl font-extrabold text-white mb-2">Acces refuse</h1>
      <p className="text-sm text-slate-400 mb-6">Vous n'avez pas les droits administrateur.</p>
      <button onClick={signOut} className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">Deconnexion</button>
    </div>
  );

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />, agencies: <AgenciesPage />, trips: <TripsPage />,
    users: <UsersPage />, comments: <CommentsPage />, ratings: <RatingsPage />,
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block"><Sidebar active={page} onNavigate={p => setPage(p)} onLogout={signOut} /></div>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 z-50 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2"><Bus size={20} className="text-teal-400" /><span className="text-sm font-extrabold text-white">Admin JeVoyage</span></div>
        <button onClick={() => setMobileMenu(!mobileMenu)} className="text-white"><Settings size={20} /></button>
      </div>
      {mobileMenu && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenu(false)}>
          <div className="w-64 min-h-screen bg-slate-900" onClick={e => e.stopPropagation()}>
            <Sidebar active={page} onNavigate={p => { setPage(p); setMobileMenu(false); }} onLogout={signOut} />
          </div>
        </div>
      )}
      <main className="flex-1 md:p-8 p-4 pt-16 md:pt-8 overflow-y-auto">{pages[page] || <Dashboard />}</main>
    </div>
  );
}

export default function Admin() {
  return <AdminAuthProvider><AdminInner /></AdminAuthProvider>;
}
