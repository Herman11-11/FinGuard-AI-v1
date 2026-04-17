import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Users, Clock } from 'lucide-react';
import axios from 'axios';

const Dashboard = ({ language }) => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    verifiedToday: 0,
    pendingAuth: 0,
    fraudulentDetected: 0,
    systemHealth: {
      apiResponse: 0,
      databaseLoad: 0,
      storageUsed: 0,
      storageTotal: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/stats');
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };
    
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  
  const translations = {
    en: {
      welcome: 'Welcome back, Officer John',
      lastLogin: 'Last login',
      totalDocs: 'Total Documents',
      verified: 'Registered Today',
      pending: 'Pending Requests',
      fraudulent: 'Fraudulent Detected',
      recentActivity: 'Recent Activity',
      systemStatus: 'System Status',
      allSystemsOperational: 'All systems operational',
      viewAll: 'View All',
      stats: 'System Statistics',
      fromYesterday: 'from yesterday',
      noActivity: 'No recent activity yet',
      loading: 'Loading...'
    },
    sw: {
      welcome: 'Karibu, Afisa John',
      lastLogin: 'Mara ya mwisho',
      totalDocs: 'Jumla ya Hati',
      verified: 'Zilizosajiliwa Leo',
      pending: 'Maombi Yanayosubiri',
      fraudulent: 'Zilizogunduliwa Bandia',
      recentActivity: 'Shughuli za Hivi Karibuni',
      systemStatus: 'Hali ya Mfumo',
      allSystemsOperational: 'Mfumo unafanya kazi vizuri',
      viewAll: 'Angalia Zote',
      stats: 'Takwimu za Mfumo',
      fromYesterday: 'kutoka jana',
      noActivity: 'Hakuna shughuli mpya',
      loading: 'Inapakia...'
    }
  };

  const t = translations[language];

  const formatValue = (value, fallback = '—') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number') return value.toLocaleString();
    return value;
  };

  const statCards = [
    { 
      icon: FileText, 
      label: t.totalDocs, 
      value: formatValue(stats.totalDocuments), 
      tone: 'stat-blue'
    },
    { 
      icon: CheckCircle, 
      label: t.verified, 
      value: formatValue(stats.verifiedToday), 
      tone: 'stat-green'
    },
    { 
      icon: Users, 
      label: t.pending, 
      value: formatValue(stats.pendingAuth), 
      tone: 'stat-amber'
    },
    { 
      icon: AlertTriangle, 
      label: t.fraudulent, 
      value: formatValue(stats.fraudulentDetected), 
      tone: 'stat-rose'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t.loading}</div>
      </div>
    );
  }

  const lastLoginText = stats.lastLogin
    ? new Date(stats.lastLogin).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="space-y-6">
      {/* Premium Government Band */}
      <div className="premium-band p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500">Ministry of Lands</p>
            <h3 className="text-2xl font-semibold text-gray-900 font-display mt-1">
              National Digital Land Registry
            </h3>
            <div className="gold-rule w-40 mt-3"></div>
            <p className="text-sm text-gray-600 mt-3">
              Official recordkeeping and verification for land ownership and title deeds.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-gray-800 font-display">{t.welcome}</h2>
          <p className="text-gray-500 mt-1 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {t.lastLogin}: {lastLoginText}
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium flex items-center border border-emerald-200/70 shadow-sm">
          {t.systemStatus}: {t.allSystemsOperational}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-semibold mt-2 font-display">{stat.value}</p>
                </div>
                <div className={`stat-emblem ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t.recentActivity}</h3>
          <button className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
            {t.viewAll} →
          </button>
        </div>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {Array.isArray(stats.recentActivity) && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b divider-soft last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">{t.noActivity}</div>
          )}
        </div>
      </div>

      {/* System Health from Backend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h4 className="font-medium text-gray-700 mb-3">API Response Time</h4>
          <p className="text-3xl font-bold text-gray-800">
            {formatValue(stats.systemHealth.apiResponse)}
            {stats.systemHealth.apiResponse !== null && (
              <span className="text-sm font-normal text-gray-500 ml-1">ms</span>
            )}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{
                width: stats.systemHealth.apiResponse ? `${Math.min(100, (200 - stats.systemHealth.apiResponse) / 2)}%` : '0%'
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Faster than 95% of requests</p>
        </div>
        <div className="card p-6">
          <h4 className="font-medium text-gray-700 mb-3">Database Load</h4>
          <p className="text-3xl font-bold text-gray-800">
            {formatValue(stats.systemHealth.databaseLoad)}
            {stats.systemHealth.databaseLoad !== null && (
              <span className="text-sm font-normal text-gray-500 ml-1">%</span>
            )}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: stats.systemHealth.databaseLoad ? `${stats.systemHealth.databaseLoad}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Normal operating range</p>
        </div>
        <div className="card p-6">
          <h4 className="font-medium text-gray-700 mb-3">Storage Used</h4>
          <p className="text-3xl font-bold text-gray-800">
            {formatValue(stats.systemHealth.storageUsed)}
            {stats.systemHealth.storageUsed !== null && (
              <span className="text-sm font-normal text-gray-500 ml-1">GB</span>
            )}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width:
                  stats.systemHealth.storageUsed && stats.systemHealth.storageTotal
                    ? `${(stats.systemHealth.storageUsed / stats.systemHealth.storageTotal) * 100}%`
                    : '0%'
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.systemHealth.storageTotal && stats.systemHealth.storageUsed
              ? `${stats.systemHealth.storageTotal - stats.systemHealth.storageUsed} GB available`
              : 'Storage details unavailable'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
