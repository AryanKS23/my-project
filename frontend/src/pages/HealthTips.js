import React, { useState, useEffect } from 'react';
import { Heart, Activity, Apple, Brain } from 'lucide-react';
import Navigation from '@/components/Navigation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HealthTips() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'general', name: 'General Health', icon: Heart, color: 'bg-[#4A6741]' },
    { id: 'nutrition', name: 'Nutrition', icon: Apple, color: 'bg-[#D98E73]' },
    { id: 'exercise', name: 'Exercise', icon: Activity, color: 'bg-[#4A6741]' },
    { id: 'mental_health', name: 'Mental Health', icon: Brain, color: 'bg-[#D98E73]' }
  ];

  useEffect(() => {
    fetchTips();
  }, [selectedCategory]);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/health-tips`, {
        params: { category: selectedCategory }
      });
      setTips(response.data.tips);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA]">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-primary mb-4">
              Health Tips & Wellness
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Expert advice for a healthier, happier life
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  data-testid={`category-${category.id}`}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`card text-left transition-all ${
                    selectedCategory === category.id
                      ? 'ring-2 ring-primary scale-105'
                      : 'hover:scale-102'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full ${category.color}/10 flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${selectedCategory === category.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="text-lg font-medium text-primary">{category.name}</h3>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading tips...</p>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-3xl font-semibold text-primary mb-8">
                {categories.find(c => c.id === selectedCategory)?.name} Tips
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {tips.map((tip, index) => (
                  <div
                    key={index}
                    data-testid={`tip-${index}`}
                    className="p-6 bg-gradient-to-b from-white to-[#FAFAF9] rounded-xl border border-gray-100 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-base leading-relaxed text-muted-foreground">{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="card bg-gradient-to-br from-[#4A6741]/5 to-[#4A6741]/10">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-primary mb-2">Stay Hydrated</h3>
              <p className="text-sm text-muted-foreground">
                Drink water regularly throughout the day to maintain optimal body function and energy levels.
              </p>
            </div>

            <div className="card bg-gradient-to-br from-[#D98E73]/5 to-[#D98E73]/10">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-medium text-primary mb-2">Move Daily</h3>
              <p className="text-sm text-muted-foreground">
                Regular physical activity strengthens your body and improves mental well-being.
              </p>
            </div>

            <div className="card bg-gradient-to-br from-[#4A6741]/5 to-[#4A6741]/10">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-primary mb-2">Rest Well</h3>
              <p className="text-sm text-muted-foreground">
                Quality sleep is essential for physical recovery and mental health.
              </p>
            </div>
          </div>

          <div className="mt-12 card bg-[#F5F2EA]">
            <div className="text-center">
              <p className="handwritten text-4xl text-primary mb-4">Remember</p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Small, consistent changes lead to lasting health improvements. Start with one tip today and build from there!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}