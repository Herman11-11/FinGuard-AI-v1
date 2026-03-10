import React, { useState } from 'react';
import { Upload, FileText, Fingerprint, Shield, AlertCircle, Scan } from 'lucide-react';
import axios from 'axios';

const DocumentRegistration = ({ language }) => {
  const [formData, setFormData] = useState({
    owner: '',
    plot_number: '',
    location: '',
    area: '',
    region: 'Dar es Salaam',
    district: ''
  });
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  const regions = [
    'Dar es Salaam', 'Arusha', 'Mwanza', 'Mbeya', 
    'Dodoma', 'Zanzibar', 'Tanga', 'Morogoro',
    'Kilimanjaro', 'Tabora', 'Kigoma', 'Shinyanga'
  ];

  const translations = {
    en: {
      title: 'Register New Title Deed',
      subtitle: 'Create a digitally protected land document with AI fingerprint',
      owner: 'Owner Full Name',
      plot: 'Plot Number',
      location: 'Location/Area',
      area: 'Area (Square Meters)',
      region: 'Region',
      district: 'District',
      documentImage: 'Document Image',
      uploadDoc: 'Upload Title Deed',
      dragDrop: 'Drag & drop document here, or click to select',
      supported: 'Supported: JPG, PNG, PDF',
      next: 'Next: Generate Fingerprint',
      back: 'Back',
      register: 'Register Document',
      processing: 'Processing...',
      fingerprint: 'Digital Fingerprint Generated',
      success: 'Document registered successfully!',
      hashValue: 'SHA-256 Hash',
      recordId: 'Record ID',
      print: 'Print QR Code',
      registerAnother: 'Register Another',
      selectRegion: 'Select Region',
      required: 'Required',
      error: 'Error registering document',
      downloadPDF: 'Download PDF'
    },
    sw: {
      title: 'Sajili Hati Mpya ya Ardhi',
      subtitle: 'Unda hati ya ardhi iliyolindwa kwa alama ya dijitali',
      owner: 'Jina Kamili la Mmiliki',
      plot: 'Nambari ya Kiwanja',
      location: 'Mahali/Eneo',
      area: 'Eneo (Mita za Mraba)',
      region: 'Mkoa',
      district: 'Wilaya',
      documentImage: 'Picha ya Hati',
      uploadDoc: 'Pakia Hati',
      dragDrop: 'Buruta na uweke hati hapa, au bonyeza kuchagua',
      supported: 'Yanayokubalika: JPG, PNG, PDF',
      next: 'Inayofuata: Tengeneza Alama',
      back: 'Nyuma',
      register: 'Sajili Hati',
      processing: 'Inachakata...',
      fingerprint: 'Alama ya Dijitali Imetengenezwa',
      success: 'Hati imesajiliwa kikamilifu!',
      hashValue: 'Alama SHA-256',
      recordId: 'Namba ya Rekodi',
      print: 'Chapisha QR Code',
      registerAnother: 'Sajili Nyingine',
      selectRegion: 'Chagua Mkoa',
      required: 'Inahitajika',
      error: 'Hitilafu katika usajili',
      downloadPDF: 'Pakua PDF'
    }
  };

  const t = translations[language];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData();
    data.append('file', file);
    data.append('owner', formData.owner);
    data.append('plot_number', formData.plot_number);
    data.append('location', formData.location);
    data.append('area', formData.area);
    data.append('region', formData.region);
    data.append('district', formData.district);

    try {
      const response = await axios.post('http://localhost:8000/api/documents/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(response.data);
      setStep(3);
    } catch (err) {
      setError(t.error);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      owner: '',
      plot_number: '',
      location: '',
      area: '',
      region: 'Dar es Salaam',
      district: ''
    });
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStep(1);
  };

  const printQR = () => {
    if (!result?.mini_qr) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Document QR Code - Ministry of Lands Tanzania</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 40px; background: white; }
            .container { max-width: 400px; margin: 0 auto; border: 2px solid #ddd; padding: 30px; border-radius: 10px; }
            h2 { color: #166534; }
            .qr { width: 200px; height: 200px; margin: 20px auto; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Ministry of Lands - Tanzania</h2>
            <h3>Official Title Deed</h3>
            <p><strong>Record ID:</strong> ${result.record_id}</p>
            <img class="qr" src="data:image/png;base64,${result.mini_qr}" />
            <p>Scan this QR code to verify authenticity</p>
            <div class="footer">
              <p>FinGuard-AI - Digital Trust Framework</p>
              <p>Issued: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">{t.title}</h2>
        <p className="text-gray-500 mt-2">{t.subtitle}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1">
            <div className={`h-2 rounded-full ${
              step >= i ? 'bg-green-500' : 'bg-gray-200'
            }`} />
            <p className={`text-xs mt-2 ${
              step >= i ? 'text-green-600' : 'text-gray-400'
            }`}>
              {i === 1 ? (language === 'en' ? 'Details' : 'Maelezo') :
               i === 2 ? (language === 'en' ? 'Upload' : 'Pakua') :
               (language === 'en' ? 'Fingerprint' : 'Alama')}
            </p>
          </div>
        ))}
      </div>

      {/* Step 1: Form */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.owner} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.plot} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="plot_number"
                  value={formData.plot_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., PLT-2024-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.location} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.area} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.region} <span className="text-red-500">*</span>
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.district}
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.owner || !formData.plot_number || !formData.location || !formData.area}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{t.next}</span>
                <Upload className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Upload Document */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">{t.uploadDoc}</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
            />
            
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <p className="text-sm text-gray-600">{file?.name}</p>
              </div>
            ) : (
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t.dragDrop}</p>
                <p className="text-sm text-gray-400 mt-2">{t.supported}</p>
              </label>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.back}
            </button>
            
            {file && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>{t.processing}</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" />
                    <span>{t.register}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Success & Fingerprint */}
      {step === 3 && result && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{t.success}</h3>
            <p className="text-gray-500 mt-2">{t.fingerprint}</p>
          </div>

          {/* QR Code Display */}
          {result.qr_code && (
            <div className="mb-8 text-center">
              <div className="bg-white p-4 rounded-lg inline-block border-2 border-gray-200">
                <img 
                  src={`data:image/png;base64,${result.qr_code}`} 
                  alt="Document QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-3 flex items-center justify-center">
                <Scan className="h-4 w-4 mr-2 text-green-600" />
                {language === 'en' 
                  ? 'Scan with phone to verify document' 
                  : 'Skana kwa simu kuthibitisha hati'}
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">{t.recordId}</p>
                <p className="font-mono text-sm bg-white p-3 rounded-lg border">{result.record_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.hashValue}</p>
                <p className="font-mono text-xs bg-white p-3 rounded-lg border break-all">{result.fingerprint}</p>
              </div>
              
              {/* Mini QR for printing */}
              {result.mini_qr && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500 mb-3">
                    {language === 'en' ? 'QR Code for Printing' : 'QR Code ya Kuchapisha'}
                  </p>
                  <div className="flex items-center space-x-4">
                    <img 
                      src={`data:image/png;base64,${result.mini_qr}`} 
                      alt="Print QR"
                      className="w-20 h-20 border-2 border-gray-300 rounded"
                    />
                    <div className="text-xs text-gray-500">
                      <p>✓ Stick on title deed</p>
                      <p>✓ Scan to verify</p>
                      <p>✓ Tamper-proof</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {t.registerAnother}
            </button>
            
            {/* Download PDF Button */}
            <a
              href={`http://localhost:8000/api/documents/pdf/${result.record_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <span>📄</span>
              <span>{t.downloadPDF}</span>
            </a>
            
            <button 
              onClick={printQR}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <span>🖨️</span>
              <span>{t.print}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRegistration;