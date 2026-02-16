import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim() && !image) {
      alert('Please enter symptoms or upload an image');
      return;
    }

    setLoading(true);
    setResults(null);
    setImageAnalysis(null);

    try {
      if (symptoms.trim()) {
        const response = await axios.post(`${API}/symptom-analysis`, {
          symptoms: symptoms
        });
        setResults(response.data);
      }

      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        const imageResponse = await axios.post(`${API}/symptom-image-analysis`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setImageAnalysis(imageResponse.data.analysis);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA]">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-primary mb-4">
              Symptom Checker
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Describe your symptoms or upload an image for AI-powered health analysis
            </p>
          </div>

          <div className="card mb-8">
            <div className="space-y-6">
              <div>
                <label data-testid="symptom-input-label" className="block text-sm font-medium text-primary mb-2">
                  Describe Your Symptoms
                </label>
                <textarea
                  data-testid="symptom-input-textarea"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="E.g., fever, headache, sore throat..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-primary mb-2">
                  Or Upload an Image (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <label
                    data-testid="upload-image-btn"
                    className="btn-secondary cursor-pointer inline-flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {image && (
                    <span className="text-sm text-muted-foreground">{image.name}</span>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      data-testid="image-preview"
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-xs rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              <button
                data-testid="analyze-symptoms-btn"
                onClick={analyzeSymptoms}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Symptoms'
                )}
              </button>
            </div>
          </div>

          {results && (
            <div data-testid="analysis-results" className="card mb-8 animate-fade-in-up">
              <h2 className="text-2xl font-medium text-primary mb-6">Analysis Results</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-medium text-primary">Possible Conditions</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.possible_conditions.map((condition, idx) => (
                      <span
                        key={idx}
                        data-testid={`condition-${idx}`}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${results.severity === 'high' ? 'bg-red-500' : results.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    </div>
                    <h3 className="text-xl font-medium text-primary">Severity Level</h3>
                  </div>
                  <span
                    data-testid="severity-level"
                    className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getSeverityColor(results.severity)}`}
                  >
                    {results.severity.toUpperCase()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-accent" />
                    <h3 className="text-xl font-medium text-primary">Recommendations</h3>
                  </div>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, idx) => (
                      <li key={idx} data-testid={`recommendation-${idx}`} className="flex items-start gap-2 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 text-primary">👨‍⚕️</div>
                    <h3 className="text-xl font-medium text-primary">Suggested Specialists</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.suggested_specialists.map((specialist, idx) => (
                      <span
                        key={idx}
                        data-testid={`specialist-${idx}`}
                        className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium"
                      >
                        {specialist}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <button
                    data-testid="find-doctors-results-btn"
                    onClick={() => navigate('/doctors')}
                    className="btn-primary"
                  >
                    Find Doctors
                  </button>
                </div>
              </div>
            </div>
          )}

          {imageAnalysis && (
            <div data-testid="image-analysis-results" className="card animate-fade-in-up">
              <h2 className="text-2xl font-medium text-primary mb-4">Image Analysis</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {imageAnalysis}
              </p>
            </div>
          )}

          {!results && !loading && (
            <div className="card">
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium text-primary mb-2">Disclaimer</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  This tool provides general health information only and should not replace professional medical advice. Always consult with a healthcare provider for accurate diagnosis and treatment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}