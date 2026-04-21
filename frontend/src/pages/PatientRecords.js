import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PatientRecords() {
  // Get user ID from auth system first, fallback to old system
  const authUser = JSON.parse(localStorage.getItem('user_data') || '{}');
  const [userId, setUserId] = useState(
    authUser.id || localStorage.getItem('healthadvisor_user_id') || ''
  );
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [documentType, setDocumentType] = useState('Medical Report');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [setupInProgress, setSetupInProgress] = useState(false);

  // Auto-create profile if authenticated user doesn't have health profile
  useEffect(() => {
    const autoSetupProfile = async () => {
      if (!userId && authUser.name && authUser.email && !setupInProgress) {
        setSetupInProgress(true);
        try {
          const response = await axios.post(`${API}/users`, {
            name: authUser.name,
            email: authUser.email
          });
          const newUserId = response.data.id;
          localStorage.setItem('healthadvisor_user_id', newUserId);
          setUserId(newUserId);
        } catch (error) {
          // Profile might already exist, try to find it
          setMessage({ type: 'info', text: 'Setting up your profile...' });
        } finally {
          setSetupInProgress(false);
        }
      }
    };
    autoSetupProfile();
  }, [authUser.name, authUser.email, userId, setupInProgress]);

  const fetchDocuments = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API}/patient-documents/${userId}`);
      setDocuments(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load documents' });
    }
  }, [userId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File too large. Maximum size is 10MB' });
        return;
      }
      
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      setMessage({ type: '', text: '' });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileChange(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const uploadDocument = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    if (!userId) {
      setMessage({ type: 'error', text: 'Please create a profile first from the Dashboard' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', userId);
      formData.append('document_type', documentType);
      formData.append('allergies', allergies);
      formData.append('notes', notes);

      await axios.post(`${API}/patient-documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: 'Document uploaded successfully!' });
      setSelectedFile(null);
      setPreview(null);
      setDocumentType('Medical Report');
      setAllergies('');
      setNotes('');
      fetchDocuments();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to upload document. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUploading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA]">
        <Navigation />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <AlertCircle className="w-16 h-16 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-primary mb-4">Setup Required</h2>
              <p className="text-muted-foreground mb-6">
                To upload medical documents, please complete your profile setup first.
              </p>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    // Auto-create profile from auth data
                    if (authUser.name && authUser.email) {
                      try {
                        const response = await axios.post(`${API}/users`, {
                          name: authUser.name,
                          email: authUser.email
                        });
                        const newUserId = response.data.id;
                        localStorage.setItem('healthadvisor_user_id', newUserId);
                        setUserId(newUserId);
                        window.location.reload();
                      } catch (error) {
                        alert('Failed to create profile. Please try again.');
                      }
                    }
                  }}
                  className="btn-primary w-full"
                >
                  Setup Profile Now
                </button>
                <p className="text-xs text-muted-foreground">
                  This will link your medical records to your account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA]">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-primary mb-4">
              Patient Medical Records
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Upload and manage your medical reports, prescriptions, and health documents
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="text-2xl font-medium text-primary mb-6">Upload New Document</h2>
              
              <div
                data-testid="upload-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer mb-6"
                onClick={() => document.getElementById('file-input').click()}
              >
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-12 h-12 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-primary">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-primary font-medium mb-2">Drag & drop or click to upload</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG, PDF (Max 10MB)</p>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Document Type</label>
                  <select
                    data-testid="document-type-select"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Medical Report">Medical Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Test">Lab Test</option>
                    <option value="X-Ray/Scan">X-Ray/Scan</option>
                    <option value="Insurance">Insurance Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Allergies (comma-separated)
                  </label>
                  <input
                    data-testid="allergies-input"
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g., Penicillin, Peanuts, Dust"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Notes (Optional)</label>
                  <textarea
                    data-testid="notes-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional information about this document..."
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              {message.text && (
                <div
                  className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              )}

              <button
                data-testid="upload-document-btn"
                onClick={uploadDocument}
                disabled={!selectedFile || uploading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>

            <div className="card">
              <h2 className="text-2xl font-medium text-primary mb-6">
                Your Documents ({documents.length})
              </h2>
              
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      data-testid={`document-${doc.id}`}
                      className="p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-primary mb-1">{doc.document_type}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{doc.file_name}</p>
                          {doc.allergies && doc.allergies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {doc.allergies.map((allergy, i) => (
                                <span
                                  key={`${doc.id}-allergy-${i}`}
                                  className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs"
                                >
                                  {allergy}
                                </span>
                              ))}
                            </div>
                          )}
                          {doc.notes && (
                            <p className="text-xs text-muted-foreground italic">{doc.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(doc.uploaded_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 card bg-blue-50 border-blue-200">
            <h3 className="text-xl font-medium text-primary mb-4">🔒 Security & Privacy</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                All documents are securely stored and encrypted
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                Your medical records are private and only accessible to you
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                We never share your health information with third parties
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}