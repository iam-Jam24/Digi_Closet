import { Lock } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import Button from '../components/Button';

const featureInfo = {
  '/try-on': {
    title: 'AI Virtual Try-On',
    description: 'See how clothes look on you before buying. Upload your photo and try on any outfit virtually with our advanced AI vision technology.',
    icon: '👗',
  },
  '/fashion-critic': {
    title: 'AI Fashion Critic',
    description: 'Upload your outfit and receive instant AI-powered feedback on color coordination, styling, occasion suitability, and overall appearance.',
    icon: '💬',
  },
  '/ai-dna': {
    title: 'AI DNA',
    description: 'Discover your unique fashion DNA — a comprehensive style profile built by AI that understands your preferences, body type, and aesthetic.',
    icon: '🧬',
  },
  '/ai-advisor': {
    title: 'AI Fashion Advisor',
    description: 'Get personalized fashion suggestions based on your style, wardrobe, occasion, and budget. Your personal AI stylist, available 24/7.',
    icon: '💡',
  },
};

export default function ComingSoon() {
  const location = useLocation();
  const feature = featureInfo[location.pathname] || {
    title: 'Coming Soon',
    description: 'This feature is currently under development. Stay tuned!',
    icon: '🚀',
  };

  return (
    <div className="animate-fade-in flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-4">
        <div className="text-5xl mb-4">{feature.icon}</div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 rounded-full text-xs font-medium text-brand-500 mb-4">
          <Lock className="w-3 h-3" />
          Coming Soon
        </div>
        <h1 className="text-2xl font-bold text-brand-900 font-display mb-3">
          {feature.title}
        </h1>
        <p className="text-sm text-brand-500 leading-relaxed mb-8">
          {feature.description}
        </p>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
