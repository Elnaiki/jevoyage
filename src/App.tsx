import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/lib/auth';
import BottomNav from './app/components/BottomNav';
import Auth from './app/pages/Auth';
import Login from './app/pages/Login';
import Signup from './app/pages/Signup';
import ForgotPassword from './app/pages/ForgotPassword';
import VerifySmsCode from './app/pages/VerifySmsCode';
import ResetPassword from './app/pages/ResetPassword';
import Home from './app/pages/Home';
import TripDetail from './app/pages/TripDetail';
import History from './app/pages/History';
import Profile from './app/pages/Profile';
import Admin from './admin/Admin';
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-teal-300 border-t-transparent rounded-full animate-spin" /></div>;
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissedAt = localStorage.getItem('pwa_dismissed');
      if (!dismissedAt || Date.now() - Number(dismissedAt) > 86400000) {
        setShowBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showBanner || dismissed || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  return (
    <div className="fixed top-4 left-4 right-4 max-w-lg mx-auto bg-slate-800 text-white rounded-2xl p-4 z-[60] shadow-xl flex items-center gap-3 animate-slide-down">
      <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center shrink-0">
        <Download size={20} className="text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-extrabold">Installer JeVoyage</div>
        <div className="text-xs text-slate-400">Acces rapide hors ligne</div>
      </div>
      <button onClick={handleInstall} className="px-3 py-1.5 bg-teal-500 text-slate-900 rounded-xl text-xs font-bold hover:bg-teal-400 transition-colors">
        Installer
      </button>
      <button onClick={() => { setDismissed(true); setShowBanner(false); localStorage.setItem('pwa_dismissed', String(Date.now())); }} className="text-slate-400 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/*" element={
            <div className="max-w-lg mx-auto min-h-screen bg-slate-50 relative">
              <InstallBanner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={
                  <div className="min-h-screen">
                    <Login />
                  </div>
                } />
                <Route path="/signup" element={
                  <div className="min-h-screen">
                    <Signup />
                  </div>
                } />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-sms-code" element={<VerifySmsCode />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Home />} />
                <Route path="/trip/:id" element={<TripDetail />} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Routes>
                <Route path="/login" element={null} />
                <Route path="/signup" element={null} />
                <Route path="/forgot-password" element={null} />
                <Route path="/verify-sms-code" element={null} />
                <Route path="/reset-password" element={null} />
                <Route path="/*" element={<BottomNav />} />
              </Routes>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
