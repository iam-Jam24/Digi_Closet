import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Shirt,
  Camera,
  Layers,
  Star,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Sparkle,
  Dna,
  MessageSquare,
  Cpu,
  Share2,
  Lock,
  Grid,
  Zap,
} from 'lucide-react';
import aiModelHero from '../assets/ai-model-hero.svg';

const studioWorkflows = [
  {
    title: 'E-commerce & Virtual Try-On',
    subtitle: 'Everything your brand & wardrobe needs to sell.',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1080&auto=format&fit=crop',
    link: '/try-on',
    badge: 'AI Fitting Engine',
    items: ['Product to Model Generation', 'Virtual Garment Try-On', 'Model Swapping & Fitting', 'Ghost Mannequin Extraction'],
  },
  {
    title: 'AI Fashion Design & Curation',
    subtitle: 'Explore creative directions & personal style DNA.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1080&auto=format&fit=crop',
    link: '/ai-dna',
    badge: 'Genomic Style Studio',
    items: ['Neural AI Fashion Design', 'Sketch to Garment Render', 'Fabric & Textile Swapping', 'Flat Sketch Generation'],
  },
  {
    title: 'Editorial Motion & Video',
    subtitle: 'Set your high-fashion visuals in motion.',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1080&auto=format&fit=crop',
    link: '/fashion-critic',
    badge: 'Motion Engine',
    items: ['Lookbook Video Generation', '360° Product Rotation', 'Editorial Campaign Ads', 'UGC Style Videos'],
  },
  {
    title: 'HD Finish & Ultra Resolution',
    subtitle: 'Finish & export before you publish.',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1080&auto=format&fit=crop',
    link: '/products',
    badge: '4K Render Pipeline',
    items: ['4K Resolution Enhancement', 'Color Tone Matcher', 'Textile Texture Upscaling', 'High-Res Export'],
  },
];

const platformCapabilities = [
  { icon: Cpu, text: 'Bulk Generation Engine' },
  { icon: Layers, text: 'Capsule Closet Projects' },
  { icon: Sparkles, text: 'AI Stylist & Vision v4.2' },
  { icon: Share2, text: 'Shopify & Store Sync' },
  { icon: Zap, text: 'Claude & Gemini Integration' },
  { icon: Lock, text: 'Encrypted Vault & API' },
];

const techPackFeatures = [
  {
    title: 'Neural AI Fills It In',
    description: 'Point the AI at any garment design — exact measurements, grading, and material compositions are automatically extracted.',
  },
  {
    title: 'Fully Custom Templates',
    description: 'Add, move, or hide any section across your digital wardrobe. Build the exact tech pack brief your manufacturer requests.',
  },
  {
    title: 'Size Charts & Grading',
    description: 'Automated measurements across XS to 4XL in your own brand labels, inches, or centimeters.',
  },
  {
    title: 'Bill of Materials (BOM)',
    description: 'Catalog fabrics, trims, zippers, and hardware suppliers with instant pricing estimates.',
  },
  {
    title: 'Annotated Fashion Flats',
    description: 'Scale, rotate, and annotate 2D vector sketches on a free canvas with automatic seam callouts.',
  },
  {
    title: 'High-Res PDF Export',
    description: 'Export complete production packages with pixel-perfect pagination ready for factory dispatch.',
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-[#0a0a0a] selection:bg-[#0a0a0a] selection:text-white font-sans">
      {/* Top Floating Glass Header (Light Aesthetic Style) */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center py-3 px-4">
        <div className="w-full max-w-7xl h-14 px-6 rounded-full bg-white/85 backdrop-blur-md border border-stone-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif-luxury text-lg font-bold tracking-[0.15em] uppercase text-stone-950">
              DIGI CLOSET <span className="font-light text-xs tracking-[0.25em] text-stone-500 ml-1">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-[0.12em] text-stone-600">
            <Link to="/products" className="hover:text-stone-950 transition-colors">Products</Link>
            <Link to="/try-on" className="hover:text-stone-950 transition-colors">Virtual Try-On</Link>
            <Link to="/ai-dna" className="hover:text-stone-950 transition-colors">Style DNA</Link>
            <Link to="/fashion-critic" className="hover:text-stone-950 transition-colors">Fashion Critic</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-stone-900 border border-stone-300 rounded-full hover:bg-stone-100 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white bg-stone-950 rounded-full hover:bg-stone-800 transition-transform active:scale-95 shadow-sm"
            >
              Try Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section — Aesthetic Light Theme with Beautiful Girl Model */}
      <section className="relative min-h-[90vh] flex items-center pt-28 pb-20 px-6 overflow-hidden bg-gradient-to-b from-[#f7f4ef] via-[#faf8f5] to-[#f4f1eb]">
        {/* Soft Ambient Light Glow Blobs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-stone-200/50 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-950/5 border border-stone-300/70 text-stone-900 text-xs font-mono tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Next-Gen Aesthetic AI Fashion Studio</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif-luxury text-stone-950 tracking-tight leading-[1.02]">
              Run your <br />
              <span className="italic font-light text-stone-800">fashion brand</span> <br />
              with AI.
            </h1>

            <p className="text-lg sm:text-xl text-stone-600 font-light max-w-xl leading-relaxed tracking-wide">
              One unified studio where you design AI garments, fit photorealistic models, run virtual try-ons, and generate production tech packs in seconds.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link to="/register">
                <button className="group px-8 py-4 bg-stone-950 hover:bg-stone-800 text-white font-medium text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link to="/products">
                <button className="px-8 py-4 bg-white border border-stone-300 hover:border-stone-950 text-stone-950 font-medium text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-full shadow-2xs">
                  <span>Explore Catalog</span>
                </button>
              </Link>
            </div>

            {/* Micro Specs Pills */}
            <div className="pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-6 text-left font-mono">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Engine</p>
                <p className="text-xs font-semibold text-stone-900">AI Fitting v4.2</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Models</p>
                <p className="text-xs font-semibold text-stone-900">Neural Style DNA</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Quality</p>
                <p className="text-xs font-semibold text-stone-900">4K Render Pipeline</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual — Featuring Beautiful Girl Model */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative Frame */}
              <div className="absolute -inset-3 border border-amber-300/40 rounded-3xl pointer-events-none" />

              {/* Main Model Image Card */}
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] group">
                <img
                  src={aiModelHero}
                  alt="Abstract illustration of an AI-fitted garment"
                  className="w-full h-full object-cover filter contrast-[1.03] group-hover:scale-105 transition-transform duration-700"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-80" />

                {/* Floating Frosted Glass Badge - Top Right */}
                <div className="absolute top-5 right-5 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full text-xs font-mono tracking-widest text-stone-900 flex items-center gap-2 border border-stone-200 shadow-sm">
                  <Sparkle className="w-3.5 h-3.5 text-amber-600" />
                  <span>AI FIT SCORE: 99.4%</span>
                </div>

                {/* Floating Glass Card - Bottom Left */}
                <div className="absolute bottom-5 left-5 right-5 p-5 bg-white/90 backdrop-blur-md rounded-xl border border-stone-200/90 shadow-lg space-y-1.5 text-stone-900">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 uppercase tracking-widest">
                    <span>Virtual Fitting Ready</span>
                    <span className="text-amber-700 font-semibold">Bespoke Look</span>
                  </div>
                  <h3 className="text-lg font-serif-luxury font-bold text-stone-950">Tailored Ivory Silk Ensemble</h3>
                  <p className="text-xs text-stone-600 font-light">
                    Photorealistic draping, warm ambient lighting, 4K rendering.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Fashion Studio Category Grid */}
      <section className="py-20 lg:py-28 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 border-b border-stone-200 pb-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-300 px-3.5 py-1 text-xs font-medium text-stone-800 bg-white">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold">4.8</span>
              <span className="text-stone-500">Global AI Fashion Ratings</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif-luxury font-bold text-stone-950">
              AI Fashion Studio
            </h2>
            <p className="mt-3 text-base text-stone-600 max-w-2xl font-light leading-relaxed">
              One workspace where your brand designs AI clothing, generates AI models for your products, and runs instant virtual try-ons — everything created opens seamlessly in the next workflow.
            </p>
          </div>

          <Link to="/register">
            <button className="px-6 py-3.5 bg-stone-950 text-white hover:bg-stone-800 text-xs uppercase tracking-[0.15em] font-medium transition-all flex items-center gap-2 rounded-full shadow-md">
              <span>Open AI Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* 4 Workflows Grid Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {studioWorkflows.map((flow) => (
            <div
              key={flow.title}
              className="group bg-white border border-stone-200 hover:border-stone-900 transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl rounded-xl"
            >
              <div>
                <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                  <img
                    src={flow.image}
                    alt={flow.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-stone-950 rounded-full text-[10px] font-mono tracking-widest uppercase border border-stone-200">
                    {flow.badge}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-serif-luxury font-bold text-stone-950 mb-1">{flow.title}</h3>
                  <p className="text-xs text-stone-500 mb-4 font-light">{flow.subtitle}</p>
                  
                  <div className="h-px w-full bg-stone-200 mb-4" />

                  <ul className="space-y-2 text-xs text-stone-600 font-light">
                    {flow.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  to={flow.link}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-950 group-hover:translate-x-1 transition-transform"
                >
                  <span>Launch Workflow</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Platform Capability Tiles Bar */}
        <div className="mt-8 p-4 bg-stone-100/70 border border-stone-200 rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {platformCapabilities.map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-start gap-2 bg-white p-4 border border-stone-200/80 rounded-xl shadow-2xs">
                <Icon className="w-5 h-5 text-stone-700" />
                <p className="text-xs font-medium text-stone-900 leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tech Pack & Style Genome Section */}
      <section className="py-20 lg:py-28 bg-stone-950 text-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-8">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#e5c158] mb-2">
                PRODUCTION-READY ENGINE
              </p>
              <h2 className="text-4xl sm:text-5xl font-serif-luxury font-bold">
                AI Tech Pack & Style Genome Generator
              </h2>
              <p className="mt-3 text-base text-stone-400 max-w-2xl font-light leading-relaxed">
                Turn a finished garment design into an automated factory brief. Let the AI generate measurements, grading, and bills of materials in seconds.
              </p>
            </div>

            <Link to="/register">
              <button className="px-6 py-3.5 bg-[#e5c158] text-stone-950 hover:bg-[#fce0a2] text-xs uppercase tracking-[0.15em] font-medium transition-all flex items-center gap-2 rounded-full">
                <span>Generate Tech Pack</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Visual Preview Frame */}
            <div className="lg:col-span-5 bg-stone-900 border border-white/10 p-6 rounded-2xl flex flex-col justify-between min-h-[420px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#e5c158]">
                  <span>TECH_PACK_SPEC_v4.2</span>
                  <span>CONFIDENTIAL</span>
                </div>
                <div className="aspect-[4/3] bg-stone-950 border border-white/5 rounded-xl overflow-hidden relative group">
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop"
                    alt="Aesthetic Model Garment Spec"
                    className="w-full h-full object-cover filter contrast-125 opacity-85 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-xs">
                    <p className="font-semibold text-white">Silk Blend Evening Trench</p>
                    <p className="text-[10px] text-stone-400">Spec: Seam Allowance 1.5cm • Grading XS-XXL</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs font-mono text-stone-400 flex justify-between">
                <span>STATUS: READY FOR FACTORY</span>
                <span className="text-[#e5c158]">EXPORT PDF</span>
              </div>
            </div>

            {/* 6 Feature Matrix */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {techPackFeatures.map((feat) => (
                <div key={feat.title} className="p-6 bg-stone-900/60 border border-white/5 rounded-xl space-y-2 hover:border-white/20 transition-colors">
                  <h3 className="text-base font-serif-luxury font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-stone-400 font-light leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Banner */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="bg-stone-900 text-white p-10 lg:p-16 rounded-3xl border border-stone-800 relative overflow-hidden">
          <div className="max-w-2xl space-y-6 relative z-10">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#e5c158]">CONNECTED WORKFLOWS</span>
            <h2 className="text-4xl sm:text-5xl font-serif-luxury font-bold">
              Integrated with your sales channels & AI agents.
            </h2>
            <p className="text-sm text-stone-300 font-light leading-relaxed">
              Connect your digital wardrobe, Shopify store, social channels, and Gemini AI agents. Push virtual try-ons directly to your product catalog.
            </p>
            <div className="pt-2">
              <Link to="/register">
                <button className="px-6 py-3.5 bg-white text-stone-950 hover:bg-stone-100 text-xs uppercase tracking-[0.15em] font-medium transition-all inline-flex items-center gap-2 rounded-full">
                  <span>Connect Platforms</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-white/10 relative z-10">
            <div className="space-y-2">
              <h3 className="text-lg font-serif-luxury font-bold text-white">Shopify Sync</h3>
              <p className="text-xs text-stone-400 font-light">Sync product catalogs and automatically map AI try-on models to SKUs.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif-luxury font-bold text-white">Social & Lookbooks</h3>
              <p className="text-xs text-stone-400 font-light">Publish high-resolution editorial campaigns directly to Instagram and web lookbooks.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif-luxury font-bold text-white">Gemini & Claude MCP</h3>
              <p className="text-xs text-stone-400 font-light">Execute AI fashion queries, fitting models, and style DNA prompts inside chat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-stone-200 text-xs font-mono text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-serif-luxury font-bold text-stone-900 text-sm tracking-widest uppercase">
              DIGI CLOSET AI
            </span>
            <span>— AI FASHION STUDIO</span>
          </div>

          <p className="tracking-widest">© 2026 DIGI CLOSET. ALL RIGHTS RESERVED.</p>

          <div className="flex gap-6 tracking-widest">
            <a href="#" className="hover:text-stone-900 transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-stone-900 transition-colors">TERMS</a>
            <a href="#" className="hover:text-stone-900 transition-colors">STUDIO</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
