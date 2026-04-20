import React, { useState, useEffect } from 'react';
import { Phone, MapPin, AlertTriangle, Ambulance } from 'lucide-react';
import Navigation from '@/components/Navigation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Emergency() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergencyHospitals();
  }, []);

  const fetchEmergencyHospitals = async () => {
    try {
      const response = await axios.get(`${API}/hospitals`, {
        params: { emergency_only: true }
      });
      setHospitals(response.data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const openMap = (lat, lng, placeName, location) => {
    if (!lat || !lng) {
      alert('Location coordinates not available for this hospital');
      return;
    }
    
    // Use place name for precise location, otherwise fallback to coordinates
    const searchQuery = placeName 
      ? encodeURIComponent(placeName)
      : `${lat},${lng}`;
    
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-red-600 mb-4">
              Emergency Services
            </h1>
            <p className="text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              Quick access to Indian emergency services and nearby hospitals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Ambulance className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-1">Ambulance</p>
                  <div className="flex gap-2">
                    <a
                      data-testid="emergency-call-102"
                      href="tel:102"
                      className="text-2xl font-bold text-red-600 hover:text-red-700"
                    >
                      102
                    </a>
                    <span className="text-gray-400">/</span>
                    <a
                      data-testid="emergency-call-108"
                      href="tel:108"
                      className="text-2xl font-bold text-red-600 hover:text-red-700"
                    >
                      108
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-1">Police</p>
                  <a
                    data-testid="emergency-call-100"
                    href="tel:100"
                    className="text-2xl font-bold text-blue-600 hover:text-blue-700"
                  >
                    100
                  </a>
                </div>
              </div>
            </div>

            <div className="card bg-orange-50 border-orange-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-1">Fire</p>
                  <a
                    data-testid="emergency-call-101"
                    href="tel:101"
                    className="text-2xl font-bold text-orange-600 hover:text-orange-700"
                  >
                    101
                  </a>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-700">Finding emergency hospitals...</p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Nearby Emergency Hospitals ({hospitals.length})
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    data-testid={`emergency-hospital-${hospital.id}`}
                    className="card bg-white border-2 border-red-200 hover:border-red-400"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">{hospital.name}</h3>
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          24/7 Emergency Services
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 text-sm text-gray-700">
                        <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{hospital.location}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <Phone className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <a
                          href={`tel:${hospital.contact}`}
                          className="hover:text-red-600 transition-colors font-medium"
                        >
                          {hospital.contact}
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        data-testid={`emergency-map-${hospital.id}`}
                        onClick={() => openMap(hospital.lat, hospital.lng, hospital.place_name, hospital.location)}
                        className="flex-1 px-4 py-3 bg-white border-2 border-red-600 text-red-600 rounded-full font-medium hover:bg-red-50 transition-all"
                      >
                        Get Directions
                      </button>
                      <a
                        data-testid={`emergency-call-hospital-${hospital.id}`}
                        href={`tel:${hospital.contact}`}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all text-center"
                      >
                        Call Now
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 card bg-yellow-50 border-yellow-200">
            <h3 className="text-xl font-medium text-gray-900 mb-4">⚠️ Important Information</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                Call 102/108 immediately for medical emergencies and ambulance services
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                Call 100 for police assistance and 101 for fire emergencies
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                Keep this page bookmarked for quick access during emergencies
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                Always have your medical information and identification ready
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}