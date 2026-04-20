import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Landmark, Shield, QrCode, Languages, LogOut, Menu, FileText, Moon, Sun, Database } from 'lucide-react';
import Dashboard from './components/Dashboard';
import DocumentRegistration from './components/DocumentRegistration';
import DocumentVerification from './components/DocumentVerification';
import AdminDocuments from './components/AdminDocuments';
import Login from './components/Login';
import { auth, provider, signInWithPopup, signOut } from './firebase';
import { onAuthStateChanged, getRedirectResult, signInWithRedirect, setPersistence, browserLocalPersistence } from 'firebase/auth';

const AppShell = () => {
  const [language, setLanguage] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState('checking');
  const [darkMode, setDarkMode] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const translations = {
    en: {
      dashboard: 'Dashboard',
      register: 'Register Document',
      verify: 'Verify Document',
      auth: '3-Person Auth',
      admin: 'Admin DB',
      logout: 'Logout',
      ministry: 'Ministry of Lands - Tanzania',
      subtitle: 'Digital Trust Framework'
    },
    sw: {
      dashboard: 'Dashibodi',
      register: 'Sajili Hati',
      verify: 'Thibitisha Hati',
      auth: 'Uthibitisho wa Watu 3',
      admin: 'Hifadhidata',
      logout: 'Toka',
      ministry: 'Wizara ya Ardhi - Tanzania',
      subtitle: 'Mfumo wa Uaminifu Dijitali'
    }
  };

  const t = translations[language];
  const activeTitle = {
    '/': t.dashboard,
    '/register': t.register,
    '/verify': t.verify,
    '/auth': t.admin,
    '/admin': t.admin
  }[location.pathname] || t.dashboard;
  const republicLabel = language === 'en' ? 'Republic of Tanzania' : 'Jamhuri ya Muungano wa Tanzania';

  useEffect(() => {
    const stored = localStorage.getItem('finguard-theme');
    if (stored === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const persistUserToken = async (u) => {
      if (!u) {
        localStorage.removeItem('finguard-token');
        localStorage.removeItem('finguard-email');
        return;
      }
      try {
        const idToken = await u.getIdToken();
        localStorage.setItem('finguard-token', idToken);
        localStorage.setItem('finguard-email', u.email || '');
      } catch (err) {
        console.error('Failed to persist auth token:', err);
      }
    };

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      void persistUserToken(u);
    });

    // Handle redirect login (fallback if popup blocked)
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setUser(result.user);
        void persistUserToken(result.user);
      }
    }).catch(() => {
      setAuthError('Sign-in failed. Please try again.');
    });

    let mounted = true;
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!mounted) return;
        setSystemStatus(response.ok ? 'online' : 'offline');
      } catch (err) {
        if (!mounted) return;
        setSystemStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
      unsub();
    };
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finguard-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finguard-theme', 'light');
    }
  };

  const handleGlobalLogout = () => {
    signOut(auth);
    localStorage.removeItem('finguard-token');
    localStorage.removeItem('finguard-email');
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Firebase Google sign-in failed:', err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, provider);
      } else if (err?.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in Firebase. Use http://localhost:5173 or add 127.0.0.1 to Authorized Domains.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setAuthError('Google sign-in is not enabled in Firebase Authentication.');
      } else if (err?.code === 'auth/network-request-failed') {
        setAuthError('Network request failed during sign-in. Check your internet connection and try again.');
      } else {
        setAuthError(err?.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen app-shell flex items-center justify-center">
        <div className="card p-6 text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onGoogleLogin={handleGoogleLogin} loading={authLoading} error={authError} />;
  }

  const navItemClass = ({ isActive }) =>
    [
      'flex items-center space-x-3 px-4 py-3 rounded-xl transition',
      isActive
        ? 'bg-white/15 text-white shadow-inner'
        : 'text-green-100/90 hover:bg-white/10 hover:text-white'
    ].join(' ');

  return (
    <div className="min-h-screen app-shell flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} sidebar text-white transition-all duration-300 shadow-2xl border-r border-green-900/40 flex flex-col`}>
        <div className="p-5 flex items-center justify-between border-b border-green-700/60">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8" />
            {sidebarOpen && <span className="font-semibold text-lg tracking-wide">FinGuard-AI</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-white/10 rounded-lg">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 space-y-1 px-3">
          <NavLink to="/" end className={navItemClass} title={t.dashboard}>
            <Landmark className="h-5 w-5" />
            {sidebarOpen && <span>{t.dashboard}</span>}
          </NavLink>
          <NavLink to="/register" className={navItemClass} title={t.register}>
            <FileText className="h-5 w-5" />
            {sidebarOpen && <span>{t.register}</span>}
          </NavLink>
          <NavLink to="/verify" className={navItemClass} title={t.verify}>
            <QrCode className="h-5 w-5" />
            {sidebarOpen && <span>{t.verify}</span>}
          </NavLink>
          <NavLink to="/admin" className={navItemClass} title={t.admin}>
            <Database className="h-5 w-5" />
            {sidebarOpen && <span>{t.admin}</span>}
          </NavLink>
        </nav>

        <div className="mt-auto border-t border-green-700/60 p-4" style={{ width: sidebarOpen ? '16rem' : '5rem' }}>
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center space-x-3 hover:text-green-100 transition w-full mb-4"
          >
            <Languages className="h-5 w-5" />
            {sidebarOpen && <span>{language === 'en' ? 'Kiswahili' : 'English'}</span>}
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-3 hover:text-green-100 transition w-full mb-4"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button onClick={handleGlobalLogout} className="flex items-center space-x-3 hover:text-green-100 transition w-full">
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>{t.logout}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto night-vision">
        <header className="bg-white/90 backdrop-blur border-b border-gray-200/70 official-watermark">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight font-display">{t.ministry}</h1>
              <p className="text-xs uppercase tracking-wider text-gray-500 mt-1">{republicLabel}</p>
              <p className="text-sm text-gray-600 mt-1">FinGuard-AI v1.0 • {t.subtitle}</p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-xs uppercase tracking-wider text-gray-400">{activeTitle}</span>
              <div className="h-6 w-px bg-gray-200" />
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm ${
                systemStatus === 'online'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                  : systemStatus === 'offline'
                    ? 'bg-red-50 text-red-700 border-red-200/70'
                    : 'bg-gray-50 text-gray-600 border-gray-200/70'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  systemStatus === 'online'
                    ? 'bg-emerald-600 animate-pulse'
                    : systemStatus === 'offline'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                }`} />
                {systemStatus === 'online' ? 'System Online' : systemStatus === 'offline' ? 'System Offline' : 'Checking'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard language={language} />} />
            <Route path="/register" element={<DocumentRegistration language={language} />} />
            <Route path="/verify" element={<DocumentVerification language={language} />} />
            <Route path="/auth" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminDocuments />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
