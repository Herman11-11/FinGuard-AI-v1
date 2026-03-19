import React, { useEffect, useRef, useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Fingerprint, Scan, Upload, Clock, Hash } from 'lucide-react';
import axios from 'axios';

const DocumentVerification = ({ language }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanMethod, setScanMethod] = useState('upload'); // 'upload' or 'scan'
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const translations = {
    en: {
      title: 'Document Verification',
      subtitle: 'Check if a land document is authentic or forged',
      uploadTab: 'Upload Document',
      scanTab: 'Scan QR Code',
      dragDrop: 'Drag & drop document here, or click to select',
      supported: 'Supported: JPG, PNG, PDF',
      verify: 'Verify Authenticity',
      verifying: 'Verifying...',
      authentic: '✅ AUTHENTIC DOCUMENT',
      forged: '❌ FORGED DOCUMENT',
      tampered: '⚠️ DOCUMENT TAMPERED',
      confidence: 'Confidence Score',
      details: 'Verification Details',
      hash: 'Digital Fingerprint',
      timestamp: 'Issued',
      issuer: 'Issued By',
      location: 'Location',
      owner: 'Owner',
      plot: 'Plot Number',
      scanQR: 'Scan QR Code',
      placeQR: 'Place QR code in front of camera',
      startCamera: 'Start Camera',
      stopCamera: 'Stop Camera',
      noMatch: 'No matching document found',
      fraudWarning: 'This document appears to be fraudulent',
      genuine: 'This is an official Ministry of Lands document',
      verifiedAt: 'Verified at',
      verifier: 'Verified by'
    },
    sw: {
      title: 'Uthibitisho wa Hati',
      subtitle: 'Angalia kama hati ya ardhi ni halisi au bandia',
      uploadTab: 'Pakia Hati',
      scanTab: 'Skana QR Code',
      dragDrop: 'Buruta na uweke hati hapa, au bonyeza kuchagua',
      supported: 'Yanayokubalika: JPG, PNG, PDF',
      verify: 'Thibitisha Ukweli',
      verifying: 'Inathibitisha...',
      authentic: '✅ HATI HALISI',
      forged: '❌ HATI BANDIA',
      tampered: '⚠️ HATI IMEBADILISHWA',
      confidence: 'Kiwango cha Uhakika',
      details: 'Maelezo ya Uthibitisho',
      hash: 'Alama ya Dijitali',
      timestamp: 'Iliyotolewa',
      issuer: 'Iliyotolewa Na',
      location: 'Mahali',
      owner: 'Mmiliki',
      plot: 'Nambari ya Kiwanja',
      scanQR: 'Skana QR Code',
      placeQR: 'Weka QR code mbele ya kamera',
      startCamera: 'Washa Kamera',
      stopCamera: 'Zima Kamera',
      noMatch: 'Hakuna hati inayolingana',
      fraudWarning: 'Hati hii inaonekana kuwa bandia',
      genuine: 'Hii ni hati rasmi ya Wizara ya Ardhi',
      verifiedAt: 'Imethibitishwa',
      verifier: 'Imethibitishwa Na'
    }
  };

  const t = translations[language];

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (err) {
      setCameraError(language === 'en' ? 'Camera permission denied or not available' : 'Kamera haipatikani au ruhusa imekataliwa');
      setCameraOn(false);
    }
  };

  useEffect(() => {
    if (scanMethod === 'upload') {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMethod]);

  const setSelectedFile = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setSelectedFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    setSelectedFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleVerify = async () => {
    if (!file) return;
    
    setVerifying(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/documents/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Verification failed');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-800 font-display">{t.title}</h2>
        <p className="text-gray-500 mt-2">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 p-1 bg-white/80 rounded-xl border border-gray-200/70 w-fit">
        <button
          onClick={() => setScanMethod('upload')}
          className={`px-4 py-2 font-medium transition-colors rounded-lg ${
            scanMethod === 'upload'
              ? 'text-green-700 bg-green-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          {t.uploadTab}
        </button>
        <button
          onClick={() => setScanMethod('scan')}
          className={`px-4 py-2 font-medium transition-colors rounded-lg ${
            scanMethod === 'scan'
              ? 'text-green-700 bg-green-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Scan className="h-4 w-4 inline mr-2" />
          {t.scanTab}
        </button>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Upload/Scan */}
        <div className="space-y-6">
          {scanMethod === 'upload' ? (
            <div className="card p-8">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors bg-white/60"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {preview ? (
                  <div className="space-y-4">
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                    <p className="text-sm text-gray-600">{file?.name}</p>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setResult(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">{t.dragDrop}</p>
                    <p className="text-sm text-gray-400 mt-2">{t.supported}</p>
                  </label>
                )}
              </div>

              {file && (
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full mt-6 btn-primary px-6 py-3 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {verifying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>{t.verifying}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>{t.verify}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="card p-8">
              <h3 className="text-lg font-semibold mb-4">{t.scanQR}</h3>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200/70 overflow-hidden">
                {cameraOn ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <Scan className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">{t.placeQR}</p>
              {cameraError && (
                <div className="mt-3 text-sm text-red-600 text-center">{cameraError}</div>
              )}
              {!cameraOn ? (
                <button onClick={startCamera} className="w-full mt-4 btn-primary px-6 py-3">
                  {t.startCamera}
                </button>
              ) : (
                <button onClick={stopCamera} className="w-full mt-4 btn-ghost px-6 py-3">
                  {t.stopCamera}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl flex items-center space-x-2 border border-red-200/70">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="card p-8">
          {result ? (
            <div className="space-y-6">
              {/* Result Header */}
              <div className={`text-center p-6 rounded-xl ${
                result.is_authentic ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {result.is_authentic ? (
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                )}
                
                <h3 className={`text-2xl font-bold ${
                  result.is_authentic ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.is_authentic ? t.authentic : t.forged}
                </h3>
                
                {!result.is_authentic && result.confidence < 0.5 && (
                  <p className="text-red-600 text-sm mt-2">{t.fraudWarning}</p>
                )}
              </div>

              {/* Confidence Meter */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{t.confidence}</span>
                  <span className="font-bold">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      result.confidence > 0.9 ? 'bg-green-500' :
                      result.confidence > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Document Details */}
              <div className="border-t divider-soft pt-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  {t.details}
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b divider-soft">
                    <span className="text-gray-500">{t.owner}</span>
                    <span className="font-medium">{result.details.owner}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b divider-soft">
                    <span className="text-gray-500">{t.plot}</span>
                    <span className="font-medium">{result.details.plot}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b divider-soft">
                    <span className="text-gray-500">{t.location}</span>
                    <span className="font-medium">{result.details.location}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b divider-soft">
                    <span className="text-gray-500">{t.issuer}</span>
                    <span className="font-medium">{result.details.issuer || 'Ministry of Lands'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b divider-soft">
                    <span className="text-gray-500">{t.timestamp}</span>
                    <span className="font-medium">{result.details.issue_date}</span>
                  </div>
                </div>
              </div>

              {/* Hash Match Status */}
              <div className={`p-3 rounded-xl ${
                result.details.hash_match ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <Fingerprint className={`h-5 w-5 ${
                    result.details.hash_match ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm ${
                    result.details.hash_match ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.details.hash_match 
                      ? '✓ Digital fingerprint matches records' 
                      : '✗ Digital fingerprint does not match'}
                  </span>
                </div>
              </div>

              {/* Verification Timestamp */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {t.verifiedAt}: {new Date().toLocaleTimeString()}
                </span>
                <span>{t.verifier}: System AI</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>{language === 'en' 
                  ? 'Upload a document to verify' 
                  : 'Pakia hati kuthibitisha'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DocumentVerification;
