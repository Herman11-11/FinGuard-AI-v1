import React, { useState } from 'react';
import { Shield, Fingerprint, Users, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const ThreePersonAuth = ({ language }) => {
  const [step, setStep] = useState(1); // 1: request, 2: approvals, 3: access
  const [documentId, setDocumentId] = useState('');
  const [reason, setReason] = useState('');
  const [officers, setOfficers] = useState([
    { id: 1, name: 'Officer Sarah', password: '', approved: false },
    { id: 2, name: 'Officer Michael', password: '', approved: false },
    { id: 3, name: 'Supervisor David', password: '', approved: false }
  ]);
  const [showPassword, setShowPassword] = useState({});
  const [requestId, setRequestId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [error, setError] = useState('');

  const translations = {
    en: {
      title: '3-Person Authentication Terminal',
      subtitle: 'Secure access to document fingerprints - requires 3 officer approvals',
      documentId: 'Document ID / Plot Number',
      reason: 'Reason for Access',
      selectReason: 'Select reason',
      courtCase: 'Court Case',
      investigation: 'Investigation',
      verification: 'Verification',
      other: 'Other',
      requestAccess: 'Request Access',
      approvalsNeeded: 'Approvals Needed',
      officers: 'Authorized Officers',
      enterPassword: 'Enter Password',
      approve: 'Approve',
      approved: 'Approved',
      waiting: 'Waiting for approval...',
      accessGranted: 'Access Granted',
      accessCode: 'Access Code',
      fingerprint: 'Document Fingerprint',
      copyCode: 'Copy Code',
      expiresIn: 'Expires in 24 hours',
      newRequest: 'New Request',
      securityAlert: 'This action will be logged in audit system'
    },
    sw: {
      title: 'Kituo cha Uthibitisho cha Watu 3',
      subtitle: 'Upatikanaji wa alama za dijitali - unahitaji idhini ya maafisa 3',
      documentId: 'Namba ya Hati / Kiwanja',
      reason: 'Sababu ya Upatikanaji',
      selectReason: 'Chagua sababu',
      courtCase: 'Kesi ya Mahakama',
      investigation: 'Uchunguzi',
      verification: 'Uthibitisho',
      other: 'Nyingine',
      requestAccess: 'Omba Upatikanaji',
      approvalsNeeded: 'Idhini Zinazohitajika',
      officers: 'Maafisa Walioidhinishwa',
      enterPassword: 'Weka Nenosiri',
      approve: 'Idhinisha',
      approved: 'Imeidhinishwa',
      waiting: 'Inasubiri idhini...',
      accessGranted: 'Upatikanaji Umeruhusiwa',
      accessCode: 'Namba ya Upatikanaji',
      fingerprint: 'Alama ya Hati',
      copyCode: 'Nakili Namba',
      expiresIn: 'Inaisha kwa saa 24',
      newRequest: 'Ombi Jipya',
      securityAlert: 'Kitendo hiki kitarekodiwa kwenye mfumo'
    }
  };

  const t = translations[language];

  const handleOfficerApproval = (officerId, password) => {
    // In production, verify against actual officer passwords
    // For demo, any password works
    
    setOfficers(officers.map(officer => 
      officer.id === officerId 
        ? { ...officer, approved: true, password: '••••••' }
        : officer
    ));

    // Check if all 3 approved
    const allApproved = officers.every(o => o.id === officerId ? true : o.approved);
    if (allApproved) {
      // Generate access code and fingerprint
      setAccessCode('ACC-' + Math.random().toString(36).substring(2, 10).toUpperCase());
      setFingerprint('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
      setStep(3);
    }
  };

  const toggleShowPassword = (officerId) => {
    setShowPassword({
      ...showPassword,
      [officerId]: !showPassword[officerId]
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-8 w-8 text-green-600" />
          <h2 className="text-3xl font-bold text-gray-800">{t.title}</h2>
        </div>
        <p className="text-gray-500">{t.subtitle}</p>
        <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{t.securityAlert}</span>
        </div>
      </div>

      {/* Step 1: Request Access */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h3 className="text-xl font-semibold mb-6">Request Document Access</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.documentId}
              </label>
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., PLT-001 or LAND-ABC123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.reason}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">{t.selectReason}</option>
                <option value="court">{t.courtCase}</option>
                <option value="investigation">{t.investigation}</option>
                <option value="verification">{t.verification}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>

            {reason === 'other' && (
              <input
                type="text"
                placeholder="Specify reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            )}

            <button
              onClick={() => {
                setStep(2);
                setRequestId('REQ-' + Math.random().toString(36).substring(2, 10).toUpperCase());
              }}
              disabled={!documentId || !reason}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.requestAccess}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 3-Person Approvals */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Request Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              Request ID: <span className="font-mono font-bold">{requestId}</span>
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Document: {documentId} | Reason: {reason}
            </p>
          </div>

          {/* Approvals Needed */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">{t.approvalsNeeded}</h3>
              <div className="flex items-center space-x-2">
                {[1,2,3].map((i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      officers.filter(o => o.approved).length >= i
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {i}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              {officers.filter(o => o.approved).length} of 3 approved
            </p>

            {/* Officers List */}
            <div className="space-y-4">
              {officers.map((officer) => (
                <div
                  key={officer.id}
                  className={`border rounded-lg p-4 ${
                    officer.approved
                      ? 'bg-green-50 border-green-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{officer.name}</span>
                    </div>
                    {officer.approved ? (
                      <span className="text-green-600 text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t.approved}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">{t.waiting}</span>
                    )}
                  </div>

                  {!officer.approved && (
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword[officer.id] ? 'text' : 'password'}
                          placeholder={t.enterPassword}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
                          onChange={(e) => {
                            const newPassword = e.target.value;
                            if (newPassword.length >= 3) {
                              handleOfficerApproval(officer.id, newPassword);
                            }
                          }}
                        />
                        <button
                          onClick={() => toggleShowPassword(officer.id)}
                          className="absolute right-3 top-2.5 text-gray-400"
                        >
                          {showPassword[officer.id] ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        {t.approve}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Access Granted */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{t.accessGranted}</h3>
            <p className="text-gray-500 mt-2">3-person authentication complete</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">{t.accessCode}</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 font-mono text-lg bg-white p-3 rounded border">
                    {accessCode}
                  </code>
                  <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    {t.copyCode}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{t.expiresIn}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">{t.fingerprint}</p>
                <div className="font-mono text-xs bg-white p-3 rounded border break-all">
                  {fingerprint}
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-700">
                  Document: {documentId} | Request: {requestId}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setStep(1);
              setDocumentId('');
              setReason('');
              setOfficers(officers.map(o => ({ ...o, approved: false, password: '' })));
            }}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            {t.newRequest}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThreePersonAuth;