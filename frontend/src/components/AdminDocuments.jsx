import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth, provider, signInWithPopup, signOut, signInWithEmailAndPassword } from '../firebase';
import { useNavigate } from 'react-router-dom';

const AdminDocuments = () => {
  const navigate = useNavigate();
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

  const getFreshToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No signed-in Firebase user');
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

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(false);
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
      setError('Google login failed');
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

  const handleLogout = () => {
    signOut(auth).finally(() => {
      setToken('');
      setEmail('');
      setAccessGranted(false);
      setRequestId('');
      setOfficers([]);
      setApproved([]);
      setOfficerPasswords({});
      setDocs([]);
      setLogs([]);
      setSelectedDoc(null);
      localStorage.removeItem('finguard-token');
      localStorage.removeItem('finguard-email');
      navigate('/admin');
    });
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

  const handleDeleteDocument = async (recordId) => {
    const confirmed = window.confirm(`Delete document ${recordId}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingRecordId(recordId);
    setError('');
    try {
      const bearerToken = await getFreshToken();
      await axios.delete(`/api/admin/documents/${recordId}`, {
        headers: { Authorization: `Bearer ${bearerToken}` }
      });

      setDocs((prev) => prev.filter((doc) => doc.record_id !== recordId));
      setSelectedDoc((prev) => (prev?.record_id === recordId ? null : prev));
      await fetchLogs(bearerToken);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to delete document');
    } finally {
      setDeletingRecordId('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-gray-800 font-display">Admin Records</h2>
        <p className="text-gray-500 mt-2">Registered users and their land documents.</p>
      </div>

      {!token && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 font-display">Admin Login</h3>
          <form onSubmit={handleEmailLogin} className="space-y-3 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white/80 font-medium"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white/80 font-medium"
            />
            <button type="submit" className="btn-primary px-6 py-2">Login with Email</button>
          </form>
          <button onClick={handleGoogleLogin} className="btn-ghost px-6 py-2">Continue with Google</button>
          {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
        </div>
      )}

      {token && (
        <>
          <div className="card p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={handleLogout} className="btn-ghost px-4 py-2 w-fit">Logout</button>
              <div className="text-sm text-gray-600">
                Signed in as: <span className="font-medium">{email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="card-soft px-3 py-2">Total Records: <span className="font-semibold">{totalCount}</span></div>
              <div className="card-soft px-3 py-2">Filtered: <span className="font-semibold">{filteredCount}</span></div>
            </div>
          </div>

          {!requestId && (
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 font-display">3‑Person Access Request</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={authReason}
                  onChange={(e) => setAuthReason(e.target.value)}
                  placeholder="Reason (e.g., audit, legal review)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white/80"
                />
                <button
                  onClick={startAccessRequest}
                  className="btn-primary px-6 py-2"
                  disabled={authLoading || !authReason.trim()}
                >
                  Request Access
                </button>
              </div>
              {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
            </div>
          )}

          {requestId && !accessGranted && (
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 font-display">Officer Approvals</h3>
              <div className="text-sm text-gray-600 mb-4">Request ID: <span className="font-mono">{requestId}</span></div>
              <div className="space-y-3">
                {officers.map((o) => (
                  <div key={o.id} className="flex flex-col md:flex-row md:items-center gap-3 border border-gray-200 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="font-medium">{o.name}</div>
                      <div className="text-xs text-gray-500">{o.role}</div>
                    </div>
                    {approved.includes(o.id) ? (
                      <div className="text-green-700 text-sm">Approved</div>
                    ) : (
                      <>
                        <input
                          type="password"
                          placeholder="Officer password"
                          className="px-3 py-2 border border-gray-300 rounded-lg bg-white/80"
                          value={officerPasswords[o.id] || ''}
                          onChange={(e) =>
                            setOfficerPasswords((prev) => ({
                              ...prev,
                              [o.id]: e.target.value
                            }))
                          }
                        />
                        <button
                          onClick={() => approveOfficer(o.id, officerPasswords[o.id] || '')}
                          className="btn-primary px-4 py-2"
                          disabled={authLoading || !(officerPasswords[o.id] || '').trim()}
                        >
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
            </div>
          )}

          {accessGranted && (
            <div className="card-soft p-4 mb-6 text-sm text-green-800">
              Access approved by 3 officers. Backend records and audit logs are now available below.
            </div>
          )}

          {accessGranted && (
            <div className="card p-3 mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'documents' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'logs' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
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
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="fraudulent">Fraudulent</option>
                </select>
              )}
            </div>
          )}

          <div className="card p-6 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'documents'
                  ? 'Search by record ID, owner, plot (e.g., PLT-2024-23), or location'
                  : 'Search by request ID, document ID, reason, requester, or status'
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white/80 font-medium"
            />
          </div>

          <div className="card p-6">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              activeTab === 'documents' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2">User / Owner</th>
                        <th className="py-2">Plot Number</th>
                        <th className="py-2">Record ID</th>
                        <th className="py-2">AI Signature</th>
                        <th className="py-2">Location</th>
                        <th className="py-2">Region</th>
                        <th className="py-2">Created</th>
                        <th className="py-2">Action</th>
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
                          <td className="py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(d.record_id);
                              }}
                              disabled={deletingRecordId === d.record_id}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingRecordId === d.record_id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="text-gray-500 mt-4">
                      {accessGranted
                        ? 'No documents were returned by the backend.'
                        : 'Request and complete 3-person approval to load documents.'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2">Status</th>
                        <th className="py-2">Request ID</th>
                        <th className="py-2">Document ID</th>
                        <th className="py-2">Reason</th>
                        <th className="py-2">Requester</th>
                        <th className="py-2">Approvals</th>
                        <th className="py-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLogs.length === 0 && (
                    <div className="text-gray-500 mt-4">
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
    </div>
  );
};

export default AdminDocuments;
