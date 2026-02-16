import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Users, MessageCircle, Search, MapPin, BookOpen, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <section className="hero-gradient pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-block mb-4">
                <span className="text-sm font-medium tracking-wide uppercase text-muted px-4 py-2 bg-white rounded-full">
                  Your Health, Our Priority
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-primary mb-6">
                Feel Better,
                <br />
                <span className="text-accent">Start Here</span>
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8 max-w-xl">
                Get instant AI-powered health assessments, find the right doctors, and manage your wellness journey—all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  data-testid="check-symptoms-btn"
                  onClick={() => navigate('/symptom-checker')}
                  className="btn-primary"
                >
                  Check Symptoms
                </button>
                <button
                  data-testid="find-doctors-btn"
                  onClick={() => navigate('/doctors')}
                  className="btn-secondary"
                >
                  Find Doctors
                </button>
              </div>
            </div>
            
            <div className="animate-fade-in-up animate-delay-2 relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1619253690419-4e3a7753c246?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHx3b21hbiUyMGxhdWdoaW5nJTIwb3V0ZG9vcnMlMjBwYXJrfGVufDB8fHx8MTc3MTIzMzQ0Mnww&ixlib=rb-4.1.0&q=85"
                  alt="Happy person outdoors"
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-xl hidden lg:block">
                <p className="handwritten text-3xl text-primary">24/7 Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-primary mb-4">
              Everything You Need for Better Health
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Comprehensive health tools powered by advanced AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div data-testid="feature-symptom-checker" className="card animate-fade-in-up animate-delay-1">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-medium text-primary mb-3">Symptom Checker</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                AI-powered analysis of your symptoms with instant recommendations
              </p>
            </div>

            <div data-testid="feature-doctor-finder" className="card animate-fade-in-up animate-delay-2">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-2xl font-medium text-primary mb-3">Find Doctors</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Search specialists by rating, location, and availability
              </p>
            </div>

            <div data-testid="feature-health-records" className="card animate-fade-in-up animate-delay-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-medium text-primary mb-3">Health Records</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Track your symptoms, medications, and doctor visits
              </p>
            </div>

            <div data-testid="feature-emergency" className="card animate-fade-in-up">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-2xl font-medium text-primary mb-3">Emergency</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Quick access to nearby emergency hospitals and services
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 hero-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1659353886973-ced1dfeab3ac?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHw0fHxmcmllbmRseSUyMGZlbWFsZSUyMGRvY3RvciUyMHNtaWxlfGVufDB8fHx8MTc3MTIzMzQ0Mnww&ixlib=rb-4.1.0&q=85"
                alt="Friendly doctor"
                className="w-full h-auto"
              />
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-primary mb-6">
                Trusted by Thousands
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground mb-8">
                HealthAdvisor combines cutting-edge AI technology with comprehensive medical databases to provide you with accurate health assessments and personalized recommendations.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary mb-1">AI-Powered Analysis</h4>
                    <p className="text-sm text-muted-foreground">Advanced algorithms analyze your symptoms instantly</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary mb-1">Location-Based Care</h4>
                    <p className="text-sm text-muted-foreground">Find nearby doctors and hospitals with ease</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary mb-1">Health Education</h4>
                    <p className="text-sm text-muted-foreground">Access preventive care tips and wellness advice</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-primary mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            Start your journey to better health today with our AI-powered health assistant
          </p>
          <button
            data-testid="cta-get-started-btn"
            onClick={() => navigate('/symptom-checker')}
            className="btn-primary text-lg px-10 py-4"
          >
            Get Started Now
          </button>
        </div>
      </section>

      <footer className="bg-primary text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">HealthAdvisor</h3>
              <p className="text-sm opacity-80">Your trusted companion for better health and wellness</p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><button onClick={() => navigate('/symptom-checker')}>Symptom Checker</button></li>
                <li><button onClick={() => navigate('/doctors')}>Find Doctors</button></li>
                <li><button onClick={() => navigate('/health-tips')}>Health Tips</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Resources</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><button onClick={() => navigate('/emergency')}>Emergency</button></li>
                <li><button onClick={() => navigate('/dashboard')}>Dashboard</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Disclaimer</h4>
              <p className="text-xs opacity-80">
                This service provides general health information only. Always consult healthcare professionals for medical advice.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm opacity-80">
            © 2025 HealthAdvisor. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}