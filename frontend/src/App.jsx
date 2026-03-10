import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Landmark, Shield, QrCode, Languages, LogOut, Menu, FileText, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import DocumentRegistration from './components/DocumentRegistration';
import DocumentVerification from './components/DocumentVerification';
import ThreePersonAuth from './components/ThreePersonAuth';

function App() {
  const [language, setLanguage] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-green-800 text-white transition-all duration-300 shadow-xl min-h-screen`}>
          <div className="p-4 flex items-center justify-between border-b border-green-700">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8" />
              {sidebarOpen && <span className="font-bold text-lg">FinGuard-AI</span>}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-green-700 rounded">
              <Menu className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="mt-6">
            <Link to="/" className="flex items-center space-x-3 px-4 py-3 hover:bg-green-700 transition">
              <Landmark className="h-5 w-5" />
              {sidebarOpen && <span>{t.dashboard}</span>}
            </Link>
            <Link to="/register" className="flex items-center space-x-3 px-4 py-3 hover:bg-green-700 transition">
              <FileText className="h-5 w-5" />
              {sidebarOpen && <span>{t.register}</span>}
            </Link>
            <Link to="/verify" className="flex items-center space-x-3 px-4 py-3 hover:bg-green-700 transition">
              <QrCode className="h-5 w-5" />
              {sidebarOpen && <span>{t.verify}</span>}
            </Link>
            <Link to="/auth" className="flex items-center space-x-3 px-4 py-3 hover:bg-green-700 transition">
              <Users className="h-5 w-5" />
              {sidebarOpen && <span>{t.auth}</span>}
            </Link>
          </nav>
          
          <div className="absolute bottom-0 w-64 border-t border-green-700 p-4" style={{ width: sidebarOpen ? '16rem' : '5rem' }}>
            <button 
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="flex items-center space-x-3 hover:text-green-200 transition w-full mb-4"
            >
              <Languages className="h-5 w-5" />
              {sidebarOpen && <span>{language === 'en' ? 'Kiswahili' : 'English'}</span>}
            </button>
            <button className="flex items-center space-x-3 hover:text-green-200 transition w-full">
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span>{t.logout}</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-800">{t.ministry}</h1>
              <p className="text-sm text-gray-500 mt-1">FinGuard-AI v1.0 - {t.subtitle}</p>
            </div>
          </header>

          <main className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard language={language} />} />
              <Route path="/register" element={<DocumentRegistration language={language} />} />
              <Route path="/verify" element={<DocumentVerification language={language} />} />
              <Route path="/auth" element={<ThreePersonAuth language={language} />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;