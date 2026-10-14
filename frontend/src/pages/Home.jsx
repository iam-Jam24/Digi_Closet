import { Link } from 'react-router-dom';
import {
  Sparkles, Shirt, Wand2, Palette, CalendarHeart, Wallet,
  Camera, Bot, ArrowRight, MessageSquare,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const features = [
  { icon: Wand2, title: 'AI Outfit Recommendations', description: 'Get outfit combinations built from the clothes you already own, matched to occasion and weather.' },
  { icon: Shirt, title: 'Digital Wardrobe', description: 'Catalog every item you own with photos, categories, colors, and occasions in one organized closet.' },
  { icon: MessageSquare, title: 'AI Fashion Critic', description: 'Upload a look and get constructive, respectful feedback on color, balance, and styling.' },
  { icon: Sparkles, title: 'Smart Clothes Finder', description: 'Search and filter a real product catalog by category, style, color, brand, and budget.' },
  { icon: Wallet, title: 'Budget Shopping Assistant', description: 'Build a shopping list that respects your budget and prioritizes versatile pieces.' },
  { icon: Camera, title: 'Virtual Try-On', description: 'Preview how a garment might look on you before you commit to a purchase.' },
  { icon: CalendarHeart, title: 'Occasion-Based Styling', description: 'Dedicated outfit guidance for college, office, parties, weddings, dates, and more.' },
  { icon: Palette, title: 'Color Combination Analyzer', description: 'Understand which colors pair well together with plain-language, practical advice.' },
  { icon: Bot, title: 'AI Fashion Chatbot', description: 'Ask natural questions about your wardrobe and get grounded, honest answers.' },
];

export default function Home() {
  return (
    <div>
      <section className="home-hero">
        <span className="home-hero__badge"><Sparkles size={14} /> AI-Powered Fashion Companion</span>
        <h1 className="home-hero__title">
          Your closet, <span>made intelligent</span>
        </h1>
        <p className="home-hero__subtitle">
          Digi Closet organizes your wardrobe, recommends outfits from clothes you already own,
          and helps you shop smarter — all in one place.
        </p>
        <div className="home-hero__actions">
          <Link to="/register">
            <Button size="lg">Get Started Free <ArrowRight size={16} /></Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__header">
          <h2 className="home-section__title">Everything you need to dress smarter</h2>
          <p className="home-section__subtitle">
            Ten connected tools that work together — from your digital wardrobe to AI-powered styling advice.
          </p>
        </div>
        <div className="home-feature-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} hover className="home-feature-card">
              <div className="home-feature-card__icon"><Icon size={22} /></div>
              <h3 className="home-feature-card__title">{title}</h3>
              <p className="home-feature-card__description">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <Card className="home-cta__card">
          <h2 className="home-cta__title">Ready to organize your style?</h2>
          <p className="home-cta__subtitle">Create a free account and start building your digital wardrobe today.</p>
          <Link to="/register">
            <Button size="lg">Create Your Account <ArrowRight size={16} /></Button>
          </Link>
        </Card>
      </section>

      <footer className="home-footer">
        © 2026 Digi Closet. All rights reserved.
      </footer>
    </div>
  );
}
