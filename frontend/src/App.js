import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import Landing from '@/pages/Landing';
import SymptomChecker from '@/pages/SymptomChecker';
import DoctorFinder from '@/pages/DoctorFinder';
import Dashboard from '@/pages/Dashboard';
import Emergency from '@/pages/Emergency';
import HealthTips from '@/pages/HealthTips';
import PatientRecords from '@/pages/PatientRecords';
import Chatbot from '@/components/Chatbot';

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/symptom-checker" element={<SymptomChecker />} />
          <Route path="/doctors" element={<DoctorFinder />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/health-tips" element={<HealthTips />} />
          <Route path="/patient-records" element={<PatientRecords />} />
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </div>
  );
}