import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Fingerprint, Mail, ArrowRight, Sparkles } from 'lucide-react';

const Login = ({ onLogin, language = 'en' }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState('google');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const glassRef = useRef(null);

  // Mouse tracker effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (glassRef.current) {
        const rect = glassRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      if (onLogin) onLogin();
    }, 1000);
  };

  const handleEmailSignIn = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (onLogin) onLogin();
    }, 1000);
  };

  const translations = {
    en: {
      badge: 'Secure Government Portal',
      title: 'Ministry of Lands',
      subtitle: 'United Republic of Tanzania',
      email: 'Email',
      password: 'Password',
      emailPlaceholder: 'officer@lands.go.tz',
      passwordPlaceholder: 'Enter your password',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      continueWithGoogle: 'Continue with Google',
      or: 'or',
      security: '256-bit encryption • Multi-party verification • All access logged',
      welcomeBack: 'Welcome Back',
      access: 'Authorized personnel only'
    },
    sw: {
      badge: 'Lango Salama la Serikali',
      title: 'Wizara ya Ardhi',
      subtitle: 'Jamhuri ya Muungano wa Tanzania',
      email: 'Barua Pepe',
      password: 'Nywila',
      emailPlaceholder: 'afisa@ardhi.go.tz',
      passwordPlaceholder: 'Weka nywila yako',
      signIn: 'Ingia',
      signingIn: 'Inaingia...',
      continueWithGoogle: 'Endelea na Google',
      or: 'au',
      security: '256-bit encryption • Uthibitisho wa vyama vingi • Kila ingizo linarekodiwa',
      welcomeBack: 'Karibu Tena',
      access: 'Watumishi pekee'
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="relative w-full max-w-5xl">
        <div className="grid md:grid-cols-2 min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Left Panel - Ministry Branding with Subtle Mouse Tracker */}
          <div 
            ref={glassRef}
            className="relative p-12 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-green-900 to-green-800"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.08) 0%, rgba(21, 128, 61, 0.95) 50%, rgba(6, 78, 59, 1) 100%)`
            }}
          >
            {/* Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}
            />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <span className="text-white font-bold text-xl tracking-wider">FinGuard‑AI</span>
              </div>
              
              <div className="space-y-2 mb-12">
                <div className="inline-block px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full text-white/80 text-xs border border-white/10">
                  <Sparkles className="h-3 w-3 inline mr-1 text-yellow-300/70" />
                  {t.badge}
                </div>
                <h1 className="text-4xl font-light text-white">{t.title}</h1>
                <div className="w-16 h-0.5 bg-yellow-400/70"></div>
                <p className="text-green-100/80 text-sm">{t.subtitle}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center space-x-3 text-green-100/70 text-xs">
                <Lock className="h-3 w-3" />
                <span>{t.security}</span>
              </div>
            </div>
          </div>

          {/* Right Panel - White Background */}
          <div className="p-12 bg-white flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              {/* Welcome Message */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.welcomeBack}</h2>
                <p className="text-gray-500 text-sm">{t.access}</p>
              </div>

              {/* Login Method Toggle */}
              <div className="flex space-x-2 mb-6 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setLoginMethod('google')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    loginMethod === 'google' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Google
                </button>
                <button
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    loginMethod === 'email' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Email
                </button>
              </div>

              {/* Google Sign In */}
              {loginMethod === 'google' && (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full group relative flex items-center justify-center space-x-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-green-600 hover:shadow-lg transition-all duration-200 bg-white disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-green-600" />
                      <span className="text-gray-600">{t.signingIn}</span>
                    </div>
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span className="text-gray-700 font-medium">{t.continueWithGoogle}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              )}

              {/* Email Sign In */}
              {loginMethod === 'email' && (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <label className="block text-gray-600 text-xs mb-2">{t.email}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all"
                        placeholder={t.emailPlaceholder}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 text-xs mb-2">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all"
                        placeholder={t.passwordPlaceholder}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-xl font-medium hover:from-green-800 hover:to-green-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg group"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                        <span>{t.signingIn}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.signIn}</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              {loginMethod === 'google' && (
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">{t.or}</span>
                  </div>
                </div>
              )}

              {/* Email option when on Google tab */}
              {loginMethod === 'google' && (
                <button
                  onClick={() => setLoginMethod('email')}
                  className="w-full text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  Sign in with email instead
                </button>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  FinGuard‑AI v1.0 | Ministry of Lands, Tanzania
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;