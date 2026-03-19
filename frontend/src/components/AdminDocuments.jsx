import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth, provider, signInWithPopup, signOut, signInWithEmailAndPassword } from '../firebase';
import { useNavigate } from 'react-router-dom';

const AdminDocuments = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const [token, setToken] = useState(localStorage.getItem('finguard-token') || '');
  const [email, setEmail] = useState(localStorage.getItem('finguard-email') || '');
  const [password, setPassword] = useState('');
  const [requestId, setRequestId] = useState('');
  const [authReason, setAuthReason] = useState('');
  const [officers, setOfficers] = useState([]);
  const [approved, setApproved] = useState([]);
  const [authLoading, setAuthLoading] = useState(false);

  const fetchDocs = async (authToken) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/admin/documents', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setDocs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setDocs([]);
      setError(err?.response?.data?.detail || 'Failed to load documents');
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

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setEmail(result.user.email || '');
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
      localStorage.setItem('finguard-token', idToken);
      localStorage.setItem('finguard-email', result.user.email || '');
    } catch (err) {
      setError(err?.message || 'Email login failed');
    }
  };

  const handleLogout = () => {
    setToken('');
    setEmail('');
    localStorage.removeItem('finguard-token');
    localStorage.removeItem('finguard-email');
    navigate('/admin');
  };

  const startAccessRequest = async () => {
    setAuthLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/request', {
        document_id: 'ADMIN-DB',
        reason: authReason || 'audit'
      });
      setRequestId(response.data?.request_id || '');
      setOfficers(Array.isArray(response.data?.officers) ? response.data.officers : []);
      setApproved([]);
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
      if (response.data?.access_code) {
        // Access granted, load docs
        fetchDocs(token);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Approval failed');
    } finally {
      setAuthLoading(false);
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
              <div className="card-soft px-3 py-2">Total Records: <span className="font-semibold">{docs.length}</span></div>
              <div className="card-soft px-3 py-2">Filtered: <span className="font-semibold">{filtered.length}</span></div>
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
                <button onClick={startAccessRequest} className="btn-primary px-6 py-2" disabled={authLoading}>
                  Request Access
                </button>
              </div>
              {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
            </div>
          )}

          {requestId && approved.length < 3 && (
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
                          onChange={(e) => (o._pw = e.target.value)}
                        />
                        <button
                          onClick={() => approveOfficer(o.id, o._pw || '')}
                          className="btn-primary px-4 py-2"
                          disabled={authLoading}
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

          <div className="card p-6 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by record ID, owner, plot (e.g., PLT-2024-23), or location"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white/80 font-medium"
            />
          </div>

          <div className="card p-6">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2">User / Owner</th>
                      <th className="py-2">Plot Number</th>
                      <th className="py-2">Record ID</th>
                      <th className="py-2">Location</th>
                      <th className="py-2">Region</th>
                      <th className="py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => (
                      <tr key={d.id} className="border-t divider-soft">
                        <td className="py-2 font-medium">{d.owner}</td>
                        <td className="py-2 font-mono text-xs">{d.plot_number}</td>
                        <td className="py-2 font-mono text-xs text-gray-600">{d.record_id}</td>
                        <td className="py-2">{d.location}</td>
                        <td className="py-2">{d.region}</td>
                        <td className="py-2 text-gray-500">{d.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-gray-500 mt-4">No documents found.</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDocuments;
