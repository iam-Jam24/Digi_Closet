import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Heart, User, Menu, X, Plus, Equal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useReveal from '../hooks/useReveal';
import Wordmark from '../components/Wordmark';
import '../styles/home.css';

const img = (name) => `/images/editorial/${name}.jpg`;

const NAV_LINKS = [
  { href: '#wardrobe', label: 'Wardrobe' },
  { href: '#try-on', label: 'AI Stylist' },
  { href: '#features', label: 'Discover' },
];

// The four headline features get full editorial spreads.
const SPREADS = [
  {
    id: 'wardrobe',
    name: 'AI Digital Wardrobe',
    title: 'Every piece you own, beautifully catalogued.',
    text: 'Photograph a piece and it is named, sorted and tagged by colour, season and occasion.',
    image: img('neutral-rail'),
    to: '/wardrobe',
  },
  {
    id: 'outfit-generator',
    name: 'AI Outfit Generator',
    title: 'New combinations. Same you.',
    text: 'Complete outfits built from your own clothes, for the occasion, mood and weather you choose.',
    image: img('flatlay-blazer'),
    to: '/outfits',
  },
  {
    id: 'virtual-try-on',
    name: 'AI Virtual Try-On',
    title: 'See yourself in something new.',
    text: 'Pick pieces from your wardrobe and see them on you: your face, your pose, a new look.',
    image: img('white-coat-peach'),
    to: '/try-on',
  },
  {
    id: 'style-makeover',
    name: 'AI Style Makeover',
    title: 'A new perspective on your style.',
    text: 'Three considered directions for the outfit you are wearing, each one generated on you.',
    image: img('dark-jacket-watch'),
    to: '/makeover',
  },
];

const INDEX = [
  { name: 'AI Personal Colour Template', text: 'The colours that feel like you, read from a single portrait.', image: img('knit-rail'), to: '/colors' },
  { name: 'AI Fashion Chatbot', text: 'A personal style conversation, whenever you need one.', image: img('shirt-and-tie'), to: '/chat' },
  { name: 'AI Smart Clothes Finder', text: 'Describe your next favourite piece. Find it in real stores.', image: img('white-shirts-rail'), to: '/shopping/finder' },
  { name: 'Weather-Based Recommendations', text: 'Dress for what’s outside, every morning.', image: img('flatlay-knit-beanie'), to: '/recommendations' },
  { name: 'Smart Outfit Planner', text: 'A week, well dressed. One look per day.', image: img('flatlay-boots-belt'), to: '/planner' },
  { name: 'Wardrobe Gap Analysis', text: 'Make every piece count, and know exactly what’s missing.', image: img('white-brown-rail'), to: '/insights' },
];

const STEPS = [
  { number: '01', title: 'Build your wardrobe.', text: 'Photograph your clothes. Each piece is named, sorted and tagged for you.', image: img('flatlay-denim-knit') },
  { number: '02', title: 'Discover your style.', text: 'Find your colours, get an honest second opinion and new ways to wear what you own.', image: img('flatlay-knitwear') },
  { number: '03', title: 'Create your look.', text: 'Generate outfits, try them on and plan the week ahead.', image: img('knit-dress-bag') },
];

// Entries without an href render as plain text until a real page or account exists.
const FOOTER_LINKS = [
  { label: 'About', href: '#intro' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Contact', href: null },
  { label: 'Privacy Policy', href: null },
  { label: 'Terms and Conditions', href: null },
];
const SOCIAL_LINKS = [
  { label: 'Instagram', href: null },
  { label: 'Pinterest', href: null },
  { label: 'LinkedIn', href: null },
];

function FooterLink({ label, href }) {
  return href ? <a href={href}>{label}</a> : <span>{label}</span>;
}

function SiteNav() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Searches stores through the Clothes Finder (sign-in required).
  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shopping/finder?q=${encodeURIComponent(q)}` : '/shopping/finder');
  };

  return (
    <nav className={`site-nav ${open ? 'site-nav--open' : ''}`} aria-label="Main">
      <div className="site-nav__left">
        <Wordmark />
        <ul className="site-nav__links">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}><a href={href} onClick={() => setOpen(false)}>{label}</a></li>
          ))}
          <li className="site-nav__mobile-auth">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn--dark btn--md">Open your studio</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--outline btn--md">Sign in</Link>
                <Link to="/register" className="btn btn--dark btn--md">Get started</Link>
              </>
            )}
          </li>
        </ul>
      </div>
      <div className="site-nav__right">
        <form className="site-nav__search" onSubmit={handleSearch} role="search">
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search clothes" />
          <button type="submit" aria-label="Search"><Search size={16} strokeWidth={1.5} /></button>
        </form>
        <Link to="/saved" className="site-nav__icon" aria-label="Wishlist"><Heart size={19} strokeWidth={1.4} /></Link>
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="site-nav__icon" aria-label={isAuthenticated ? 'Your studio' : 'Sign in'}>
          <User size={19} strokeWidth={1.4} />
        </Link>
        <button type="button" className="site-nav__toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
}

// Four people, four ways of dressing. Each panel opens the Outfit Generator
// with the matching style preset.
const HERO_MODELS = [
  { image: 'camel-coat-studio', style: 'Classic', preset: 'Classic', alt: 'Man in a camel overcoat and roll-neck' },
  { image: 'white-blazer-studio', style: 'Old Money', preset: 'Classic', alt: 'Woman in a tailored white blazer' },
  { image: 'black-gown', style: 'Evening', preset: 'Formal', alt: 'Woman in a black evening gown' },
  { image: 'street-cargo-cap', style: 'Streetwear', preset: 'Streetwear', alt: 'Woman in a crop top, cargo trousers and cap' },
];

function Hero() {
  return (
    <section className="hero">
      <div className="hero__frame">
        <SiteNav />
        <div className="hero__stage">
          <div className="hero__panels">
            {HERO_MODELS.map(({ image, style, preset, alt }) => (
              <Link key={image} to={`/outfits?style=${encodeURIComponent(preset)}`} className="hero__panel">
                <img src={img(image)} alt={alt} />
                <span className="hero__panel-label">{style}</span>
              </Link>
            ))}
          </div>
          <div className="hero__content">
            <span className="hero__pill">Digital fashion studio</span>
            <h1 className="hero__title"><span className="hero__title-sans">Your Style</span> <em>Your Signature.</em></h1>
            <p className="hero__lead">An intelligent wardrobe. A personal stylist. Endless ways to express yourself.</p>
            <div className="hero__actions">
              <Link to="/register" className="hero__btn hero__btn--solid">Start your style journey</Link>
              <Link to="/wardrobe" className="hero__btn">Explore your wardrobe</Link>
            </div>
          </div>
          <p className="hero__corner hero__corner--left">Wardrobe · Stylist · Try-On</p>
          <a href="#intro" className="hero__corner hero__corner--right">Discover the studio <ArrowRight size={13} /></a>
        </div>
      </div>
    </section>
  );
}

function Spread({ feature, index }) {
  return (
    <article id={feature.id} className={`spread reveal ${index % 2 ? 'spread--reverse' : ''}`}>
      <div className="spread__image img-zoom"><img src={feature.image} alt="" loading="lazy" /></div>
      <div className="spread__text">
        <span className="spread__number">{String(index + 1).padStart(2, '0')}</span>
        <span className="eyebrow">{feature.name}</span>
        <h3 className="spread__title">{feature.title}</h3>
        <p>{feature.text}</p>
        <Link to={feature.to} className="link-arrow">Explore <ArrowRight size={14} /></Link>
      </div>
    </article>
  );
}

export default function Home() {
  const pageRef = useRef(null);
  useReveal(pageRef);

  return (
    <div className="landing" ref={pageRef}>
      <Hero />

      {/* Brand introduction */}
      <section id="intro" className="intro">
        <div className="intro__text reveal">
          <span className="eyebrow">Style, reimagined.</span>
          <h2 className="landing-title">Get more from<br /><em>what you own.</em></h2>
          <p>Your wardrobe is full of possibilities. Discover new combinations, refine your personal style, and make every outfit count.</p>
          <Link to="/register" className="link-arrow">Begin your wardrobe <ArrowRight size={14} /></Link>
        </div>
        <div className="intro__image img-zoom reveal"><img src={img('sage-jacket-studio')} alt="Man in a sage zip jacket against a warm wooden backdrop" loading="lazy" /></div>
        <div className="intro__detail img-zoom reveal"><img src={img('accessories-flatlay')} alt="" loading="lazy" /></div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <header className="section-head reveal">
          <span className="eyebrow">Ten ways to wear it</span>
          <h2 className="landing-title">The art of<br />getting dressed.</h2>
        </header>

        <div className="spreads">
          {SPREADS.map((feature, index) => <Spread key={feature.id} feature={feature} index={index} />)}
        </div>

        <div className="feature-index">
          {INDEX.map((feature, index) => (
            <Link key={feature.name} to={feature.to} className="feature-index__item reveal">
              <div className="feature-index__image img-zoom"><img src={feature.image} alt="" loading="lazy" /></div>
              <span className="feature-index__number">{String(index + 5).padStart(2, '0')}</span>
              <h3 className="feature-index__name">{feature.name}</h3>
              <p>{feature.text}</p>
              <span className="link-arrow">Explore <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Virtual try-on */}
      <section id="try-on" className="showcase">
        <header className="section-head section-head--center reveal">
          <span className="eyebrow">AI Virtual Try-On</span>
          <h2 className="landing-title">The perfect fit.<br /><em>Before the first wear.</em></h2>
          <p>Choose pieces from your own wardrobe and see them on you, with your face, pose and proportions kept intact.</p>
        </header>
        <div className="tryon-strip reveal">
          <figure className="tryon-strip__panel">
            <div className="img-zoom"><img src={img('black-tee-portrait')} alt="" loading="lazy" /></div>
            <figcaption>Your photo</figcaption>
          </figure>
          <Plus className="tryon-strip__sign" size={22} strokeWidth={1.25} aria-hidden="true" />
          <figure className="tryon-strip__panel tryon-strip__panel--pieces">
            <div className="img-zoom"><img src={img('leather-jacket-flat')} alt="" loading="lazy" /></div>
            <div className="img-zoom"><img src={img('laced-boots')} alt="" loading="lazy" /></div>
            <figcaption>From your wardrobe</figcaption>
          </figure>
          <Equal className="tryon-strip__sign" size={22} strokeWidth={1.25} aria-hidden="true" />
          <figure className="tryon-strip__panel tryon-strip__panel--result">
            <div className="img-zoom"><img src={img('leather-jacket-model')} alt="" loading="lazy" /></div>
            <figcaption>Your new look</figcaption>
          </figure>
        </div>
        <p className="showcase__note">Illustrative example. In the app, the result is generated from your own photo.</p>
        <div className="showcase__cta"><Link to="/try-on" className="btn btn--dark btn--lg">Experience virtual try-on</Link></div>
      </section>

      {/* Style makeover */}
      <section className="makeover-feature">
        <div className="makeover-feature__text reveal">
          <span className="eyebrow">AI Style Makeover</span>
          <h2 className="landing-title">Refine the way<br />you show up.</h2>
          <ul className="makeover-feature__list">
            <li><span>The outfit</span> Colour, fit and layering that build on what you’re already wearing.</li>
            <li><span>Watches &amp; rings</span> Finishing details chosen for the look, not added for the sake of it.</li>
            <li><span>Glasses &amp; shoes</span> The pieces that change a silhouette most.</li>
            <li><span>Seen on you</span> Each direction generated on your own photo.</li>
          </ul>
          <Link to="/makeover" className="link-arrow">Start a makeover <ArrowRight size={14} /></Link>
        </div>
        <div className="makeover-feature__collage reveal">
          <div className="makeover-feature__main img-zoom"><img src={img('grey-blazer-portrait')} alt="" loading="lazy" /></div>
          <figure className="img-zoom"><img src={img('watch-hand')} alt="" loading="lazy" /><figcaption>Watch</figcaption></figure>
          <figure className="img-zoom"><img src={img('jewellery-flatlay')} alt="" loading="lazy" /><figcaption>Rings</figcaption></figure>
          <figure className="img-zoom"><img src={img('sunglasses')} alt="" loading="lazy" /><figcaption>Glasses</figcaption></figure>
          <figure className="img-zoom"><img src={img('monk-shoes')} alt="" loading="lazy" /><figcaption>Shoes</figcaption></figure>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="how">
        <header className="section-head reveal">
          <span className="eyebrow">How it works</span>
          <h2 className="landing-title">Three steps.</h2>
        </header>
        <ol className="how__steps">
          {STEPS.map((step) => (
            <li key={step.number} className="how__step reveal">
              <div className="how__image img-zoom"><img src={step.image} alt="" loading="lazy" /></div>
              <span className="how__number">{step.number}.</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="final-cta__image"><img src={img('suits-rail')} alt="" loading="lazy" /></div>
        <div className="final-cta__text reveal">
          <h2 className="landing-title">Your next look<br />starts here.</h2>
          <p>Make your wardrobe work smarter. Find your style, one outfit at a time.</p>
          <Link to="/register" className="btn btn--primary btn--lg">Get started</Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer__top">
          <Wordmark tone="light" />
          <p>Your personal digital fashion studio.</p>
        </div>
        <div className="site-footer__links">
          <ul>{FOOTER_LINKS.map((link) => <li key={link.label}><FooterLink {...link} /></li>)}</ul>
          <ul>{SOCIAL_LINKS.map((link) => <li key={link.label}><FooterLink {...link} /></li>)}</ul>
        </div>
        <p className="site-footer__legal">© {new Date().getFullYear()} DigiCloset. Photography via Unsplash.</p>
      </footer>
    </div>
  );
}
