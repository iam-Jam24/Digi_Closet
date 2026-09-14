import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Shirt, Camera, UserCircle, Plus, ArrowRight,
  Sparkles, MessageSquare, Dna, Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wardrobeCount, setWardrobeCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data } = await api.get('/wardrobe');
        setWardrobeCount(data.data.count);
      } catch {
        // silently fail — stat just shows 0
      }
    };
    fetchCounts();
  }, []);

  const statCards = [
    { icon: Heart, label: 'Saved Looks', value: '0', color: 'bg-rose-50 text-rose-600' },
    { icon: Shirt, label: 'Wardrobe Items', value: String(wardrobeCount), color: 'bg-sky-50 text-sky-600' },
    { icon: Camera, label: 'Try-Ons', value: '0', color: 'bg-violet-50 text-violet-600' },
    { icon: UserCircle, label: 'Style Profile', value: 'Not completed', color: 'bg-amber-50 text-amber-600' },
  ];

  const quickActions = [
    { label: 'Add Wardrobe Item', icon: Plus, onClick: () => navigate('/wardrobe') },
    { label: 'Update Profile', icon: UserCircle, onClick: () => navigate('/profile') },
    { label: 'Explore Products', icon: ArrowRight, onClick: () => navigate('/products') },
  ];

  const comingSoon = [
    {
      icon: Sparkles,
      title: 'AI Virtual Try-On',
      description: 'See how clothes look on you before you buy. Powered by AI vision technology.',
    },
    {
      icon: MessageSquare,
      title: 'AI Fashion Critic',
      description: 'Get instant feedback on your outfits — color coordination, styling, and more.',
    },
    {
      icon: Dna,
      title: 'AI DNA',
      description: 'Discover your unique style DNA. A personalized fashion profile built by AI.',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 font-display">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-brand-500 mt-1">
          Let&apos;s make your next outfit your best one.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-brand-400 font-medium">{label}</p>
              <p className="text-lg font-bold text-brand-900 mt-0.5 truncate">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-brand-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(({ label, icon: Icon, onClick }) => (
            <Button key={label} variant="outline" size="md" onClick={onClick}>
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <h2 className="text-lg font-semibold text-brand-900 mb-4">Coming Soon</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {comingSoon.map(({ icon: Icon, title, description }) => (
            <Card key={title} hover className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Lock className="w-4 h-4 text-brand-300" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="text-sm font-semibold text-brand-900 mb-1">{title}</h3>
              <p className="text-xs text-brand-500 leading-relaxed">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
