import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Users, Clock, ArrowUp, ArrowDown } from 'lucide-react';
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
        const response = await axios.get('http://localhost:8000/api/stats');
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
      lastLogin: 'Last login: Today at 09:45 AM',
      totalDocs: 'Total Documents',
      verified: 'Verified Today',
      pending: 'Pending Auth',
      fraudulent: 'Fraudulent Detected',
      recentActivity: 'Recent Activity',
      systemStatus: 'System Status',
      allSystemsOperational: '✅ All systems operational',
      viewAll: 'View All',
      stats: 'System Statistics',
      fromYesterday: 'from yesterday',
      loading: 'Loading...'
    },
    sw: {
      welcome: 'Karibu, Afisa John',
      lastLogin: 'Mara ya mwisho: Leo 09:45',
      totalDocs: 'Jumla ya Hati',
      verified: 'Zilizothibitishwa Leo',
      pending: 'Zinasubiri Uthibitisho',
      fraudulent: 'Zilizogunduliwa Bandia',
      recentActivity: 'Shughuli za Hivi Karibuni',
      systemStatus: 'Hali ya Mfumo',
      allSystemsOperational: '✅ Mfumo unafanya kazi vizuri',
      viewAll: 'Angalia Zote',
      stats: 'Takwimu za Mfumo',
      fromYesterday: 'kutoka jana',
      loading: 'Inapakia...'
    }
  };

  const t = translations[language];

  const statCards = [
    { 
      icon: FileText, 
      label: t.totalDocs, 
      value: stats.totalDocuments.toLocaleString(), 
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    { 
      icon: CheckCircle, 
      label: t.verified, 
      value: stats.verifiedToday.toString(), 
      color: 'bg-green-500',
      change: '+8%',
      trend: 'up'
    },
    { 
      icon: Users, 
      label: t.pending, 
      value: stats.pendingAuth.toString(), 
      color: 'bg-yellow-500',
      change: '-3%',
      trend: 'down'
    },
    { 
      icon: AlertTriangle, 
      label: t.fraudulent, 
      value: stats.fraudulentDetected.toString(), 
      color: 'bg-red-500',
      change: '+1',
      trend: 'up'
    },
  ];

  const activities = [
    { 
      time: '10:30 AM', 
      action: language === 'en' ? 'Document PLT-001 verified' : 'Hati PLT-001 imethibitishwa',
      user: language === 'en' ? 'Officer John' : 'Afisa John', 
      status: 'success' 
    },
    { 
      time: '10:15 AM', 
      action: language === 'en' ? '3-person auth completed' : 'Uthibitisho wa watu 3 umekamilika',
      user: language === 'en' ? 'Sarah, Mike, David' : 'Sarah, Mike, David', 
      status: 'auth' 
    },
    { 
      time: '09:45 AM', 
      action: language === 'en' ? 'Forged document detected' : 'Hati bandia imegunduliwa',
      user: language === 'en' ? 'System Alert' : 'Arifa ya Mfumo', 
      status: 'warning' 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{t.welcome}</h2>
          <p className="text-gray-500 mt-1 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {t.lastLogin}
          </p>
        </div>
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          {t.systemStatus}: {t.allSystemsOperational}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.trend === 'up' ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} {t.fromYesterday}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t.recentActivity}</h3>
          <button className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
            {t.viewAll} →
          </button>
        </div>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'auth' ? 'bg-blue-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Health from Backend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h4 className="font-medium text-gray-700 mb-3">API Response Time</h4>
          <p className="text-3xl font-bold text-gray-800">{stats.systemHealth.apiResponse}<span className="text-sm font-normal text-gray-500 ml-1">ms</span></p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, (200 - stats.systemHealth.apiResponse) / 2)}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Faster than 95% of requests</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h4 className="font-medium text-gray-700 mb-3">Database Load</h4>
          <p className="text-3xl font-bold text-gray-800">{stats.systemHealth.databaseLoad}<span className="text-sm font-normal text-gray-500 ml-1">%</span></p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.systemHealth.databaseLoad}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Normal operating range</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h4 className="font-medium text-gray-700 mb-3">Storage Used</h4>
          <p className="text-3xl font-bold text-gray-800">{stats.systemHealth.storageUsed}<span className="text-sm font-normal text-gray-500 ml-1">GB</span></p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.systemHealth.storageUsed / stats.systemHealth.storageTotal) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">{stats.systemHealth.storageTotal - stats.systemHealth.storageUsed} GB available</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;