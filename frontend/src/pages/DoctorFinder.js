import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, Star, Filter } from 'lucide-react';
import Navigation from '@/components/Navigation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DoctorFinder() {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [view, setView] = useState('doctors');
  const [filters, setFilters] = useState({
    specialization: '',
    minRating: 0,
    emergencyOnly: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [view, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === 'doctors') {
        const params = {};
        if (filters.specialization) params.specialization = filters.specialization;
        if (filters.minRating > 0) params.min_rating = filters.minRating;
        
        const response = await axios.get(`${API}/doctors`, { params });
        setDoctors(response.data);
      } else {
        const params = {};
        if (filters.emergencyOnly) params.emergency_only = true;
        if (filters.minRating > 0) params.min_rating = filters.minRating;
        
        const response = await axios.get(`${API}/hospitals`, { params });
        setHospitals(response.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openMap = (lat, lng, name, placeName) => {
    if (!lat || !lng) {
      alert('Location coordinates not available for this facility');
      return;
    }
    
    // Use place name for better search if available, otherwise use coordinates
    const searchQuery = placeName 
      ? encodeURIComponent(placeName)
      : `${lat},${lng}`;
    
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA]">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-primary mb-4">
              Find Healthcare Providers
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Discover trusted doctors and hospitals near you
            </p>
          </div>

          <div className="card mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
              <div className="flex gap-2">
                <button
                  data-testid="view-doctors-btn"
                  onClick={() => setView('doctors')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    view === 'doctors' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-primary'
                  }`}
                >
                  Doctors
                </button>
                <button
                  data-testid="view-hospitals-btn"
                  onClick={() => setView('hospitals')}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    view === 'hospitals' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-primary'
                  }`}
                >
                  Hospitals
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Filters</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {view === 'doctors' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Specialization</label>
                  <input
                    data-testid="filter-specialization-input"
                    type="text"
                    value={filters.specialization}
                    onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                    placeholder="e.g., Cardiologist"
                    className="input-field"
                  />
                </div>
              )}

              {view === 'hospitals' && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      data-testid="filter-emergency-checkbox"
                      type="checkbox"
                      checked={filters.emergencyOnly}
                      onChange={(e) => setFilters({ ...filters, emergencyOnly: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-primary">Emergency Services Only</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-2">Minimum Rating</label>
                <select
                  data-testid="filter-rating-select"
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                  className="input-field"
                >
                  <option value={0}>All Ratings</option>
                  <option value={4.0}>4.0+</option>
                  <option value={4.5}>4.5+</option>
                  <option value={4.8}>4.8+</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {view === 'doctors' ? (
                doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <div key={doctor.id} data-testid={`doctor-card-${doctor.id}`} className="card">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-medium text-primary mb-1">{doctor.name}</h3>
                          <p className="text-sm text-accent font-medium">{doctor.specialization}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 text-primary fill-primary" />
                          <span className="text-sm font-medium text-primary">{doctor.rating}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                          <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{doctor.hospital}, {doctor.location}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>{doctor.operating_hours}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                          <a href={`tel:${doctor.contact}`} className="hover:text-primary transition-colors">
                            {doctor.contact}
                          </a>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <button
                          data-testid={`view-map-${doctor.id}`}
                          onClick={() => openMap(doctor.lat, doctor.lng, doctor.name, `${doctor.hospital}, ${doctor.location}`)}
                          className="btn-secondary flex-1 text-sm py-2"
                        >
                          View on Map
                        </button>
                        <a
                          href={`tel:${doctor.contact}`}
                          className="btn-primary flex-1 text-sm py-2 text-center"
                        >
                          Call Now
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No doctors found matching your criteria</p>
                  </div>
                )
              ) : (
                hospitals.length > 0 ? (
                  hospitals.map((hospital) => (
                    <div key={hospital.id} data-testid={`hospital-card-${hospital.id}`} className="card">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-medium text-primary mb-1">{hospital.name}</h3>
                          {hospital.emergency && (
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                              Emergency Services
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 text-primary fill-primary" />
                          <span className="text-sm font-medium text-primary">{hospital.rating}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                          <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{hospital.location}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>{hospital.operating_hours}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                          <a href={`tel:${hospital.contact}`} className="hover:text-primary transition-colors">
                            {hospital.contact}
                          </a>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <button
                          data-testid={`view-hospital-map-${hospital.id}`}
                          onClick={() => openMap(hospital.lat, hospital.lng, hospital.name, hospital.place_name || hospital.location)}
                          className="btn-secondary flex-1 text-sm py-2"
                        >
                          View on Map
                        </button>
                        <a
                          href={`tel:${hospital.contact}`}
                          className="btn-primary flex-1 text-sm py-2 text-center"
                        >
                          Call Now
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No hospitals found matching your criteria</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}