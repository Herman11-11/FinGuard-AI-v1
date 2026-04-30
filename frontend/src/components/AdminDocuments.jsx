import React, { useEffect, useState } from 'react';
import axios from '../lib/api';
import { auth, provider, signInWithPopup, signInWithEmailAndPassword } from '../firebase';
import { Database, Filter, ShieldCheck, LogIn } from 'lucide-react';

const AdminDocuments = ({ language = 'en' }) => {
  const [activeTab, setActiveTab] = useState('documents');
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [token, setToken] = useState(localStorage.getItem('finguard-token') || '');
  const [email, setEmail] = useState(localStorage.getItem('finguard-email') || '');
  const [password, setPassword] = useState('');
  const [requestId, setRequestId] = useState('');
  const [authReason, setAuthReason] = useState('');
  const [officers, setOfficers] = useState([]);
  const [approved, setApproved] = useState([]);
  const [accessGranted, setAccessGranted] = useState(false);
  const [officerPasswords, setOfficerPasswords] = useState({});
  const [authLoading, setAuthLoading] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState('');
  const [deletingLogId, setDeletingLogId] = useState('');
  const [passwordForms, setPasswordForms] = useState({});
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingOfficerId, setChangingOfficerId] = useState('');
  const [officerSettingsForms, setOfficerSettingsForms] = useState({});
  const [savingOfficerId, setSavingOfficerId] = useState('');
  const [showOfficerManagement, setShowOfficerManagement] = useState(false);

  const translations = {
    en: {
      title: 'Admin Records',
      subtitle: 'Registered users and their land documents.',
      deleteConfirm: 'Delete document {{recordId}}? This action cannot be undone.',
      deleteFailed: 'Failed to delete document',
      delete: 'Delete',
      deleting: 'Deleting...',
      deleteUnavailable: 'Only registered LAND records can be deleted',
      deleteThisRecord: 'Delete this record',
      deleteLog: 'Delete this log entry',
      deleteLogFailed: 'Failed to delete audit log',
      signedInAs: 'Signed in as:',
      totalRecords: 'Total Records',
      filtered: 'Filtered',
      officerManagementTitle: 'Officer Management',
      officerManagementSubtitle: 'After approval, update officer names, roles, or passwords here.',
      openOfficerManagement: 'Open Officer Management',
      officerManagementSummary: 'Update officer names, roles, and approval passwords.',
      close: 'Close',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm new password',
      changePassword: 'Change Password',
      officerName: 'Officer name',
      officerRole: 'Officer role',
      replacementPassword: 'New password (optional)',
      saveOfficer: 'Save Officer',
      savingOfficer: 'Saving...',
      officerSaved: 'Officer details updated successfully.',
      changingPassword: 'Updating...',
      passwordChanged: 'Password updated successfully.',
      passwordMismatch: 'New password and confirmation do not match.',
      passwordTooShort: 'New password must be at least 6 characters.',
      passwordEnterHint: 'Press Enter in confirm field to save'
    },
    sw: {
      title: 'Rekodi za Msimamizi',
      subtitle: 'Watumiaji waliosajiliwa na hati zao za ardhi.',
      deleteConfirm: 'Futa hati {{recordId}}? Hatua hii haiwezi kutenduliwa.',
      deleteFailed: 'Imeshindikana kufuta hati',
      delete: 'Futa',
      deleting: 'Inafutwa...',
      deleteUnavailable: 'Ni rekodi za LAND pekee zinaweza kufutwa',
      deleteThisRecord: 'Futa rekodi hii',
      deleteLog: 'Futa kumbukumbu hii ya ukaguzi',
      deleteLogFailed: 'Imeshindikana kufuta kumbukumbu ya ukaguzi',
      signedInAs: 'Umeingia kama:',
      totalRecords: 'Jumla ya Rekodi',
      filtered: 'Zilizochujwa',
      officerManagementTitle: 'Usimamizi wa Maafisa',
      officerManagementSubtitle: 'Baada ya idhini, badilisha majina, majukumu, au nywila za maafisa hapa.',
      openOfficerManagement: 'Fungua Usimamizi wa Maafisa',
      officerManagementSummary: 'Badilisha majina, majukumu, na nywila za idhini za maafisa.',
      close: 'Funga',
      currentPassword: 'Nywila ya sasa',
      newPassword: 'Nywila mpya',
      confirmPassword: 'Thibitisha nywila mpya',
      changePassword: 'Badili Nywila',
      officerName: 'Jina la afisa',
      officerRole: 'Jukumu la afisa',
      replacementPassword: 'Nywila mpya (si lazima)',
      saveOfficer: 'Hifadhi Afisa',
      savingOfficer: 'Inahifadhiwa...',
      officerSaved: 'Maelezo ya afisa yamehifadhiwa kwa mafanikio.',
      changingPassword: 'Inasasishwa...',
      passwordChanged: 'Nywila imebadilishwa kwa mafanikio.',
      passwordMismatch: 'Nywila mpya na uthibitisho havifanani.',
      passwordTooShort: 'Nywila mpya lazima iwe na angalau herufi 6.',
      passwordEnterHint: 'Bonyeza Enter kwenye sehemu ya uthibitisho kuhifadhi'
    }
  };

  const t = translations[language] || translations.en;

  const getFreshToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const cachedToken = localStorage.getItem('finguard-token') || token;
      const cachedEmail = localStorage.getItem('finguard-email') || email;
      if (!cachedToken) {
        throw new Error('No signed-in Firebase user');
      }
      setToken(cachedToken);
      setEmail(cachedEmail);
      return cachedToken;
    }

    const freshToken = await currentUser.getIdToken(true);
    const currentEmail = currentUser.email || '';

    setToken(freshToken);
    setEmail(currentEmail);
    localStorage.setItem('finguard-token', freshToken);
    localStorage.setItem('finguard-email', currentEmail);

    return freshToken;
  };

  const normalizeDocs = (payload) => {
    const rawDocs = Array.isArray(payload) ? payload : payload?.documents;
    if (!Array.isArray(rawDocs)) return [];

    return rawDocs.map((doc) => ({
      ...doc,
      plot_number: doc.plot_number || doc.plot || '',
    }));
  };

  const fetchDocs = async (authToken) => {
    setLoading(true);
    setError('');
    try {
      const bearerToken = authToken || await getFreshToken();
      const response = await axios.get('/api/admin/documents', {
        headers: { Authorization: `Bearer ${bearerToken}` }
      });
      setDocs(normalizeDocs(response.data));
    } catch (err) {
      setDocs([]);
      setError(err?.response?.data?.detail || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (authToken, nextStatus = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const bearerToken = authToken || await getFreshToken();
      const response = await axios.get('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${bearerToken}` },
        params: nextStatus && nextStatus !== 'all' ? { status: nextStatus } : {}
      });
      setLogs(Array.isArray(response.data?.logs) ? response.data.logs : []);
    } catch (err) {
      setLogs([]);
      setError(err?.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const response = await axios.get('/api/auth/officers');
      const nextOfficers = Array.isArray(response.data) ? response.data : [];
      setOfficers(nextOfficers);
      setOfficerSettingsForms((prev) =>
        nextOfficers.reduce((acc, officer) => {
          acc[officer.id] = {
            name: prev[officer.id]?.name ?? officer.name ?? '',
            role: prev[officer.id]?.role ?? officer.role ?? '',
            newPassword: ''
          };
          return acc;
        }, {})
      );
    } catch {
      setError((prev) => prev || 'Failed to load officers');
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(false);
    void fetchOfficers();
  }, [token]);

  const filtered = docs.filter((d) => {
    const hay = `${d.record_id} ${d.owner} ${d.plot_number} ${d.location} ${d.region} ${d.district}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const filteredLogs = logs.filter((log) => {
    const hay = `${log.request_id} ${log.document_id} ${log.reason} ${log.requester} ${log.status}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const totalCount = activeTab === 'documents' ? docs.length : logs.length;
  const filteredCount = activeTab === 'documents' ? filtered.length : filteredLogs.length;
  const approvedCount = approved.length;
  const awaitingCount = Math.max(0, officers.length - approvedCount);
  const summaryCards = [
    {
      icon: Database,
      label: t.totalRecords,
      value: totalCount,
      tone: 'stat-blue',
      note: 'Visible in the active admin view'
    },
    {
      icon: Filter,
      label: t.filtered,
      value: filteredCount,
      tone: 'stat-amber',
      note: 'Matching the current search and filters'
    },
    {
      icon: ShieldCheck,
      label: 'Approvals',
      value: `${approvedCount}/3`,
      tone: 'stat-green',
      note: accessGranted ? 'Database access is unlocked' : `${awaitingCount} officer approval${awaitingCount === 1 ? '' : 's'} remaining`
    }
  ];

  const canDeleteRecord = (documentId) => typeof documentId === 'string' && documentId.startsWith('LAND-');

  const handleReasonKeyDown = async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (!authLoading && authReason.trim()) {
      await startAccessRequest();
    }
  };

  const handleOfficerPasswordKeyDown = async (e, officerId) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const passwordValue = officerPasswords[officerId] || '';
    if (!authLoading && passwordValue.trim()) {
      await approveOfficer(officerId, passwordValue);
    }
  };

  const updatePasswordForm = (officerId, field, value) => {
    setPasswordForms((prev) => ({
      ...prev,
      [officerId]: {
        current: '',
        next: '',
        confirm: '',
        ...prev[officerId],
        [field]: value
      }
    }));
  };

  const handleChangeOfficerPassword = async (officer) => {
    const form = passwordForms[officer.id] || {};
    const currentPassword = form.current || '';
    const nextPassword = form.next || '';
    const confirmPassword = form.confirm || '';

    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword || !nextPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (nextPassword.length < 6) {
      setPasswordError(t.passwordTooShort);
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordError(t.passwordMismatch);
      return;
    }

    setChangingOfficerId(String(officer.id));
    try {
      const response = await axios.post('/api/auth/change-officer-password', {
        officer_id: officer.id,
        current_password: currentPassword,
        new_password: nextPassword
      });
      setPasswordMessage(response.data?.message || t.passwordChanged);
      setPasswordForms((prev) => ({
        ...prev,
        [officer.id]: { current: '', next: '', confirm: '' }
      }));
    } catch (err) {
      setPasswordError(err?.response?.data?.detail || 'Failed to change officer password');
    } finally {
      setChangingOfficerId('');
    }
  };

  const handlePasswordConfirmKeyDown = async (e, officer) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (!changingOfficerId) {
      await handleChangeOfficerPassword(officer);
    }
  };

  const updateOfficerSettingsForm = (officerId, field, value) => {
    setOfficerSettingsForms((prev) => ({
      ...prev,
      [officerId]: {
        name: '',
        role: '',
        newPassword: '',
        ...prev[officerId],
        [field]: value
      }
    }));
  };

  const handleSaveOfficerSettings = async (officer) => {
    const form = officerSettingsForms[officer.id] || {};
    const name = (form.name || '').trim();
    const role = (form.role || '').trim();
    const newPassword = form.newPassword || '';

    setPasswordMessage('');
    setPasswordError('');

    if (!name || !role) {
      setPasswordError('Officer name and role are required.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setPasswordError(t.passwordTooShort);
      return;
    }

    setSavingOfficerId(String(officer.id));
    try {
      const bearerToken = await getFreshToken();
      const response = await axios.patch(`/api/auth/officers/${officer.id}`, {
        name,
        role,
        ...(newPassword ? { new_password: newPassword } : {})
      }, {
        headers: { Authorization: `Bearer ${bearerToken}` }
      });
      setPasswordMessage(response.data?.message || t.officerSaved);
      await fetchOfficers();
    } catch (err) {
      setPasswordError(err?.response?.data?.detail || 'Failed to update officer');
    } finally {
      setSavingOfficerId('');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setEmail(result.user.email || '');
      setAccessGranted(false);
      setRequestId('');
      setOfficers([]);
      setApproved([]);
      setDocs([]);
      setLogs([]);
      localStorage.setItem('finguard-token', idToken);
      localStorage.setItem('finguard-email', result.user.email || '');
    } catch (err) {
      setError(err?.message || 'Google login failed');
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setEmail(result.user.email || '');
      setAccessGranted(false);
      setRequestId('');
      setOfficers([]);
      setApproved([]);
      setDocs([]);
      setLogs([]);
      localStorage.setItem('finguard-token', idToken);
      localStorage.setItem('finguard-email', result.user.email || '');
    } catch (err) {
      setError(err?.message || 'Email login failed');
    }
  };

  const startAccessRequest = async () => {
    const trimmedReason = authReason.trim();
    if (!trimmedReason) {
      setError('Please provide a reason before requesting access.');
      return;
    }

    setAuthLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/request', {
        document_id: 'ADMIN-DB',
        reason: trimmedReason
      });
      setRequestId(response.data?.request_id || '');
      setOfficers(Array.isArray(response.data?.officers) ? response.data.officers : []);
      setApproved([]);
      setAccessGranted(false);
      setOfficerPasswords({});
      setDocs([]);
      setLogs([]);
      setSelectedDoc(null);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to start access request');
    } finally {
      setAuthLoading(false);
    }
  };

  const approveOfficer = async (officerId, passwordValue) => {
    if (!requestId) return;
    setAuthLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/approve', {
        request_id: requestId,
        officer_id: officerId,
        password: passwordValue
      });
      const approvedIds = response.data?.approved_officers || [];
      setApproved(approvedIds);
      setOfficerPasswords((prev) => ({
        ...prev,
        [officerId]: ''
      }));
      if (response.data?.access_code) {
        // Access granted, load docs
        setAccessGranted(true);
        await fetchDocs();
        await fetchLogs();
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Approval failed');
    } finally {
      setAuthLoading(false);
    }
  };



  const handleDeleteLog = async (logId) => {
    const confirmed = window.confirm(t.deleteLog);
    if (!confirmed) return;

    setDeletingLogId(logId);
    setError('');
    try {
      const bearerToken = await getFreshToken();
      await axios.delete(`/api/admin/audit-logs/${logId}`, {
        headers: { Authorization: `Bearer ${bearerToken}` }
      });
      setLogs((prev) => prev.filter((log) => log.id !== logId));
      await fetchLogs(bearerToken);
    } catch (err) {
      setError(err?.response?.data?.detail || t.deleteLogFailed);
    } finally {
      setDeletingLogId('');
    }
  };

  const handleDeleteLogEntry = async (log) => {
    if (canDeleteRecord(log.document_id)) {
      await handleDeleteDocument(log.document_id);
      return;
    }
    await handleDeleteLog(log.id);
  };

  const handleDeleteDocument = async (recordId) => {
    const confirmed = window.confirm(t.deleteConfirm.replace('{{recordId}}', recordId));
    if (!confirmed) return;

    setDeletingRecordId(recordId);
    setError('');
    try {
      const bearerToken = await getFreshToken();
      await axios.delete(`/api/admin/documents/${recordId}`, {
        headers: { Authorization: `Bearer ${bearerToken}` }
      });

      setDocs((prev) => prev.filter((doc) => doc.record_id !== recordId));
      setLogs((prev) => prev.filter((log) => log.document_id !== recordId));
      setSelectedDoc((prev) => (prev?.record_id === recordId ? null : prev));
      await fetchDocs(bearerToken);
      await fetchLogs(bearerToken);
    } catch (err) {
      setError(err?.response?.data?.detail || t.deleteFailed);
    } finally {
      setDeletingRecordId('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-6">
      <div className="space-y-4">
        <div className="card p-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-700/70">Admin Workspace</div>
          <h2 className="mt-3 text-3xl font-semibold text-gray-800 font-display">{t.title}</h2>
          {token && (
            <div className="mt-3 text-sm text-gray-500">
              {t.signedInAs} <span className="font-medium text-gray-700 break-all">{email}</span>
            </div>
          )}
          <p className="text-gray-500 mt-2">{t.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-5 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className={`stat-emblem ${card.tone} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                    <p className="text-3xl font-semibold mt-1 font-display text-gray-900">{card.value}</p>
                    <p className="mt-1 text-sm text-gray-500 leading-relaxed">{card.note}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!token && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 font-display">Admin Login</h3>
              <p className="text-sm text-gray-500 mt-1">Sign in to start a protected admin session.</p>
            </div>
            <div className="stat-emblem stat-blue">
              <LogIn className="h-5 w-5" />
            </div>
          </div>
          <form onSubmit={handleEmailLogin} className="space-y-3 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 font-medium"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 font-medium"
            />
            <button type="submit" className="btn-primary px-6 py-3">Login with Email</button>
          </form>
          <button onClick={handleGoogleLogin} className="btn-ghost px-6 py-3">Continue with Google</button>
          {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
        </div>
      )}

      {token && (
        <>
          {!requestId && (
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 font-display">3‑Person Access Request</h3>
                  <p className="text-sm text-gray-500 mt-1">Start a protected admin session before viewing or editing records.</p>
                </div>
                <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">Approval required</div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={authReason}
                  onChange={(e) => setAuthReason(e.target.value)}
                  onKeyDown={handleReasonKeyDown}
                  placeholder="Reason (e.g., audit, legal review)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white/80"
                />
                <button
                  onClick={startAccessRequest}
                  className="btn-primary px-6 py-3"
                  disabled={authLoading || !authReason.trim()}
                >
                  Request Access
                </button>
              </div>
              {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
            </div>
          )}

          {requestId && !accessGranted && (
            <div className="card p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 font-display">Officer Approvals</h3>
                  <div className="text-sm text-gray-600 mt-1">Request ID: <span className="font-mono">{requestId}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-9 w-9 rounded-full border text-sm font-semibold flex items-center justify-center ${
                        approvedCount >= step
                          ? 'border-emerald-200 bg-emerald-500 text-white'
                          : 'border-gray-200 bg-gray-100 text-gray-500'
                      }`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {officers.map((o) => (
                  <div
                    key={o.id}
                    className={`rounded-2xl border p-4 transition shadow-sm ${
                      approved.includes(o.id)
                        ? 'border-green-200 bg-green-50/80'
                        : 'border-gray-200 bg-white/80'
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800">{o.name}</div>
                        <div className="text-xs text-gray-500">{o.role}</div>
                      </div>
                      {approved.includes(o.id) ? (
                        <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 w-fit">Approved</div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <input
                            type="password"
                            placeholder="Officer password"
                            className="w-full sm:w-64 px-3 py-2.5 border border-gray-300 rounded-lg bg-white/80"
                            value={officerPasswords[o.id] || ''}
                            onChange={(e) =>
                              setOfficerPasswords((prev) => ({
                                ...prev,
                                [o.id]: e.target.value
                              }))
                            }
                            onKeyDown={(e) => handleOfficerPasswordKeyDown(e, o.id)}
                          />
                          <button
                            onClick={() => approveOfficer(o.id, officerPasswords[o.id] || '')}
                            className="btn-primary px-4 py-2.5 whitespace-nowrap"
                            disabled={authLoading || !(officerPasswords[o.id] || '').trim()}
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
            </div>
          )}

          {accessGranted && (
            <div className="card-soft px-5 py-4 text-sm text-emerald-800">
              Access approved by 3 officers. Backend records and audit logs are now available below.
            </div>
          )}

          {accessGranted && (
            <div className="card p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-gray-400">Settings</div>
                <div className="text-base font-semibold text-gray-800 mt-2">{t.officerManagementTitle}</div>
                <div className="text-sm text-gray-500 mt-1">{t.officerManagementSummary}</div>
              </div>
              <button
                onClick={() => {
                  setPasswordError('');
                  setPasswordMessage('');
                  setShowOfficerManagement(true);
                }}
                className="btn-primary px-4 py-2.5 whitespace-nowrap"
              >
                {t.openOfficerManagement}
              </button>
            </div>
          )}

          {accessGranted && (
            <div className="card p-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'documents' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'logs' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Audit Logs
              </button>
              {activeTab === 'logs' && (
                <select
                  value={statusFilter}
                  onChange={async (e) => {
                    const nextStatus = e.target.value;
                    setStatusFilter(nextStatus);
                    await fetchLogs(undefined, nextStatus);
                  }}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="fraudulent">Fraudulent</option>
                </select>
              )}
            </div>
          )}

          <div className="card p-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'documents'
                  ? 'Search by record ID, owner, plot (e.g., PLT-2024-23), or location'
                  : 'Search by request ID, document ID, reason, requester, or status'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 font-medium"
            />
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-gray-400">{activeTab === 'documents' ? 'Registry records' : 'Audit trail'}</div>
                <h3 className="mt-2 text-lg font-semibold text-gray-800 font-display">
                  {activeTab === 'documents' ? 'Document register' : 'Audit log register'}
                </h3>
              </div>
              <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                {filteredCount} visible
              </div>
            </div>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              activeTab === 'documents' ? (
                <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                  <div className="max-h-[65vh] min-h-[24rem] overflow-y-auto overflow-x-auto">
                    <table className="w-full min-w-[960px] text-sm">
                      <thead className="sticky top-0 z-10 bg-white shadow-sm">
                        <tr className="text-left text-gray-500">
                          <th className="py-2">User / Owner</th>
                          <th className="py-2">Plot Number</th>
                          <th className="py-2">Record ID</th>
                          <th className="py-2">AI Signature</th>
                          <th className="py-2">Location</th>
                          <th className="py-2">Region</th>
                          <th className="py-2">Created</th>
                          <th className="py-2 pr-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((d) => (
                          <tr
                            key={d.id}
                            className="border-t divider-soft cursor-pointer hover:bg-gray-50/70"
                            onClick={() => setSelectedDoc(d)}
                          >
                            <td className="py-2 font-medium">{d.owner}</td>
                            <td className="py-2 font-mono text-xs">{d.plot_number}</td>
                            <td className="py-2 font-mono text-xs text-gray-600">{d.record_id}</td>
                            <td className="py-2">
                              {d.ai_signature ? (
                                <div>
                                  <div className="font-mono text-xs text-gray-700 break-all">
                                    {d.ai_signature}
                                  </div>
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    {d.ai_algorithm || 'AI fingerprint'}{d.ai_embedding_dim ? ` • ${d.ai_embedding_dim}d` : ''}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Not generated</span>
                              )}
                            </td>
                            <td className="py-2">{d.location}</td>
                            <td className="py-2">{d.region}</td>
                            <td className="py-2 text-gray-500">{d.created_at}</td>
                            <td className="py-2 pr-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(d.record_id);
                                }}
                                disabled={deletingRecordId === d.record_id}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingRecordId === d.record_id ? t.deleting : t.delete}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length === 0 && (
                    <div className="text-gray-500 mt-4 px-4 pb-4">
                      {accessGranted
                        ? 'No documents were returned by the backend.'
                        : 'Request and complete 3-person approval to load documents.'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                  <div className="max-h-[65vh] min-h-[24rem] overflow-y-auto overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-sm">
                      <thead className="sticky top-0 z-10 bg-white shadow-sm">
                        <tr className="text-left text-gray-500">
                          <th className="py-2">Status</th>
                          <th className="py-2">Request ID</th>
                          <th className="py-2">Document ID</th>
                          <th className="py-2">Reason</th>
                          <th className="py-2">Requester</th>
                          <th className="py-2">Approvals</th>
                          <th className="py-2">Created</th>
                          <th className="py-2 pr-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => {
                          const deletable = canDeleteRecord(log.document_id);
                          return (
                            <tr key={log.id} className="border-t divider-soft">
                              <td className="py-2">
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  log.status === 'fraudulent'
                                    ? 'bg-red-100 text-red-700'
                                    : log.status === 'approved'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-2 font-mono text-xs text-gray-600">{log.request_id}</td>
                              <td className="py-2 font-mono text-xs">{log.document_id}</td>
                              <td className="py-2">{log.reason}</td>
                              <td className="py-2">{log.requester}</td>
                              <td className="py-2">{log.approval_count}</td>
                              <td className="py-2 text-gray-500">{log.created_at}</td>
                              <td className="py-2 pr-3">
                                <button
                                  onClick={() => handleDeleteLogEntry(log)}
                                  disabled={deletable ? deletingRecordId === log.document_id : deletingLogId === log.id}
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  title={deletable ? t.deleteThisRecord : t.deleteLog}
                                >
                                  {(deletable ? deletingRecordId === log.document_id : deletingLogId === log.id) ? t.deleting : t.delete}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredLogs.length === 0 && (
                    <div className="text-gray-500 mt-4 px-4 pb-4">
                      {accessGranted
                        ? 'No audit logs matched the current filter.'
                        : 'Request and complete 3-person approval to load audit logs.'}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {selectedDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
              <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 font-display">Document Fingerprint Detail</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedDoc.record_id} • {selectedDoc.owner}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Owner</div>
                      <div className="mt-1 text-sm font-medium text-gray-800">{selectedDoc.owner}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Plot Number</div>
                      <div className="mt-1 text-sm font-medium text-gray-800">{selectedDoc.plot_number}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Region</div>
                      <div className="mt-1 text-sm font-medium text-gray-800">{selectedDoc.region}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Created</div>
                      <div className="mt-1 text-sm font-medium text-gray-800">{selectedDoc.created_at}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Full Document Hash</div>
                      <div className="mt-2 break-all font-mono text-xs text-gray-700">
                        {selectedDoc.full_fingerprint || 'Not available'}
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-emerald-700">AI Signature</div>
                      <div className="mt-2 break-all font-mono text-xs text-emerald-900">
                        {selectedDoc.ai_signature || 'Not generated'}
                      </div>
                      <div className="mt-3 text-xs text-emerald-800">
                        {selectedDoc.ai_algorithm || 'AI fingerprint not available'}
                        {selectedDoc.ai_embedding_dim ? ` • ${selectedDoc.ai_embedding_dim} dimensions` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {token && accessGranted && showOfficerManagement && (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-5xl items-start justify-center py-4">
            <div className="w-full card max-h-[calc(100vh-3rem)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-white">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 font-display">{t.officerManagementTitle}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t.officerManagementSubtitle}</p>
                </div>
                <button
                  onClick={() => setShowOfficerManagement(false)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {t.close}
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain max-h-[calc(100vh-8.5rem)] px-6 py-6 bg-[#fbfbf8]">
                <div className="space-y-6">
                  {officers.map((officer) => {
                    const passwordForm = passwordForms[officer.id] || { current: '', next: '', confirm: '' };
                    const settingsForm = officerSettingsForms[officer.id] || { name: officer.name || '', role: officer.role || '', newPassword: '' };
                    return (
                      <div key={`manage-${officer.id}`} className="card p-5 space-y-4">
                        <div>
                          <div className="font-medium text-gray-800">{officer.name}</div>
                          <div className="text-xs text-gray-500">{officer.role}</div>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                          <input
                            type="text"
                            placeholder={t.officerName}
                            value={settingsForm.name}
                            onChange={(e) => updateOfficerSettingsForm(officer.id, 'name', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                          />
                          <input
                            type="text"
                            placeholder={t.officerRole}
                            value={settingsForm.role}
                            onChange={(e) => updateOfficerSettingsForm(officer.id, 'role', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                          />
                          <input
                            type="password"
                            placeholder={t.replacementPassword}
                            value={settingsForm.newPassword}
                            onChange={(e) => updateOfficerSettingsForm(officer.id, 'newPassword', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                          />
                          <button
                            onClick={() => handleSaveOfficerSettings(officer)}
                            disabled={savingOfficerId === String(officer.id)}
                            className="btn-primary px-4 py-2.5 whitespace-nowrap disabled:opacity-50"
                          >
                            {savingOfficerId === String(officer.id) ? t.savingOfficer : t.saveOfficer}
                          </button>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                          <input
                            type="password"
                            placeholder={t.currentPassword}
                            value={passwordForm.current}
                            onChange={(e) => updatePasswordForm(officer.id, 'current', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                          />
                          <input
                            type="password"
                            placeholder={t.newPassword}
                            value={passwordForm.next}
                            onChange={(e) => updatePasswordForm(officer.id, 'next', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                          />
                          <input
                            type="password"
                            placeholder={t.confirmPassword}
                            value={passwordForm.confirm}
                            onChange={(e) => updatePasswordForm(officer.id, 'confirm', e.target.value)}
                            onKeyDown={(e) => handlePasswordConfirmKeyDown(e, officer)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                          />
                          <button
                            onClick={() => handleChangeOfficerPassword(officer)}
                            disabled={changingOfficerId === String(officer.id)}
                            className="btn-primary px-4 py-2.5 whitespace-nowrap disabled:opacity-50"
                          >
                            {changingOfficerId === String(officer.id) ? t.changingPassword : t.changePassword}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-gray-500">{t.passwordEnterHint}</div>
                {passwordMessage && <div className="mt-3 text-sm text-green-700">{passwordMessage}</div>}
                {passwordError && <div className="mt-3 text-sm text-red-600">{passwordError}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;
