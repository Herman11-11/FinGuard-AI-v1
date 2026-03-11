import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Landmark, Shield, QrCode, Languages, LogOut, Menu, FileText, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import DocumentRegistration from './components/DocumentRegistration';
import DocumentVerification from './components/DocumentVerification';
import ThreePersonAuth from './components/ThreePersonAuth';

const AppShell = () => {
  const [language, setLanguage] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState('checking');

  const translations = {
    en: {
      dashboard: 'Dashboard',
      register: 'Register Document',
      verify: 'Verify Document',
      auth: '3-Person Auth',
      logout: 'Logout',
      ministry: 'Ministry of Lands - Tanzania',
      subtitle: 'Digital Trust Framework'
    },
    sw: {
      dashboard: 'Dashibodi',
      register: 'Sajili Hati',
      verify: 'Thibitisha Hati',
      auth: 'Uthibitisho wa Watu 3',
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
    '/auth': t.auth
  }[location.pathname] || t.dashboard;

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
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
    };
  }, []);

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
          <NavLink to="/auth" className={navItemClass} title={t.auth}>
            <Users className="h-5 w-5" />
            {sidebarOpen && <span>{t.auth}</span>}
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
          <button className="flex items-center space-x-3 hover:text-green-100 transition w-full">
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>{t.logout}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white/90 backdrop-blur border-b border-gray-200/70 official-watermark official-seal">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight font-display">{t.ministry}</h1>
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
            <Route path="/auth" element={<ThreePersonAuth language={language} />} />
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
