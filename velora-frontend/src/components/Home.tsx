import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, TrendingUp, Cpu, Search, Car, MessageSquare, Sparkles, Eye } from 'lucide-react';

/* Pure CSS glassmorphic car SVG */
const GlassCar = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '600px', ...style }}>
    {/* Car body */}
    <path d="M120 200 Q120 160 160 160 L260 160 Q280 100 340 80 L520 80 Q580 80 600 120 L660 160 Q700 160 720 180 L720 220 Q720 240 700 240 L140 240 Q120 240 120 220 Z" 
      fill="rgba(0, 243, 255, 0.04)" 
      stroke="rgba(0, 243, 255, 0.15)" 
      strokeWidth="1.5"
    />
    {/* Windshield */}
    <path d="M280 155 L340 85 L520 85 L580 120 L600 155 Z" 
      fill="rgba(0, 243, 255, 0.06)" 
      stroke="rgba(0, 243, 255, 0.2)" 
      strokeWidth="1"
    />
    {/* Center divider line */}
    <line x1="440" y1="85" x2="440" y2="155" stroke="rgba(0, 243, 255, 0.1)" strokeWidth="0.8" />
    {/* Wheels */}
    <circle cx="230" cy="240" r="40" fill="rgba(0, 243, 255, 0.03)" stroke="rgba(0, 243, 255, 0.2)" strokeWidth="1.5"/>
    <circle cx="230" cy="240" r="22" fill="none" stroke="rgba(0, 243, 255, 0.1)" strokeWidth="1"/>
    <circle cx="620" cy="240" r="40" fill="rgba(0, 243, 255, 0.03)" stroke="rgba(0, 243, 255, 0.2)" strokeWidth="1.5"/>
    <circle cx="620" cy="240" r="22" fill="none" stroke="rgba(0, 243, 255, 0.1)" strokeWidth="1"/>
    {/* Headlight glow */}
    <ellipse cx="700" cy="185" rx="15" ry="10" fill="rgba(0, 243, 255, 0.15)"/>
    {/* Taillight */}
    <ellipse cx="135" cy="195" rx="8" ry="12" fill="rgba(239, 68, 68, 0.12)"/>
    {/* Body line */}
    <line x1="160" y1="180" x2="700" y2="180" stroke="rgba(0, 243, 255, 0.08)" strokeWidth="0.8"/>
  </svg>
);

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/listings');
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      
      {/* --- HERO --- */}
      <section style={{ textAlign: 'center', padding: '7rem 0 4rem', position: 'relative', overflow: 'hidden' }}>
        {/* Glassmorphic car backgrounds */}
        <div className="float-animation" style={{ position: 'absolute', top: '15%', left: '-5%', opacity: 0.4, transform: 'scaleX(-1)' }}>
          <GlassCar />
        </div>
        <div className="float-animation" style={{ position: 'absolute', bottom: '5%', right: '-8%', opacity: 0.25, animationDelay: '3s' }}>
          <GlassCar />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 5 }}>
          <h1 style={{ fontSize: '3.8rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '1rem', lineHeight: 1.1 }}>
            Drive Smarter. <span className="text-glow">Trade Better.</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--silver)', maxWidth: '550px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            Pakistan's AI-powered marketplace for buying and selling cars with confidence.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ 
            maxWidth: '700px', 
            margin: '0 auto 3.5rem', 
            padding: '0.6rem', 
            borderRadius: '100px', 
            display: 'flex', 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 243, 255, 0.2)',
            boxShadow: '0 15px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ padding: '0 1.2rem', color: 'var(--electric-blue)' }}>
              <Search size={22} />
            </div>
            <input 
              type="text" 
              placeholder="Search brand, model, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1rem', flex: 1, outline: 'none', padding: '0.8rem 0' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '100px', padding: '0.8rem 2rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Search
            </button>
          </form>

          {/* Quick Action Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', maxWidth: '900px', margin: '0 auto' }}>
            {[
              { title: 'Sell Your Car', desc: 'Reach thousands of buyers', icon: <Car size={22} />, path: '/sell' },
              { title: 'AI Valuation', desc: 'Instant price prediction', icon: <Zap size={22} />, path: '/predict' },
              { title: 'Vision Scan', desc: 'Detect car condition', icon: <Eye size={22} />, path: '/detect' },
            ].map((item, i) => (
              <div key={i} onClick={() => navigate(item.path)} style={{ 
                padding: '1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'left',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)', transition: 'all 0.3s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,243,255,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ color: 'var(--electric-blue)', marginBottom: '0.8rem' }}>{item.icon}</div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem', fontWeight: '700' }}>{item.title}</h4>
                <p style={{ color: 'var(--silver)', fontSize: '0.8rem', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- COMPACT STATS BAR --- */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {[
            { val: '1,200+', label: 'Listings' },
            { val: '45k+', label: 'Predictions' },
            { val: '12k+', label: 'Users' },
            { val: '98%', label: 'Trust Rate' }
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>{s.val}</div>
              <div style={{ color: 'var(--electric-blue)', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURES (COMPACT) --- */}
      <section className="container" style={{ padding: '5rem 0' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '3rem' }}>
          Platform <span className="text-glow">Features</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {[
            { title: 'Smart Deals', desc: 'AI finds the best offers for you.', icon: <TrendingUp size={24} /> },
            { title: 'Negotiations', desc: 'Transparent AI-assisted bargaining.', icon: <MessageSquare size={24} /> },
            { title: 'Fraud Shield', desc: 'Every listing is verified by AI.', icon: <Shield size={24} /> },
            { title: 'Smart Match', desc: 'Find cars that fit your style.', icon: <Sparkles size={24} /> },
          ].map((f, i) => (
            <div key={i} style={{ 
              padding: '1.5rem', borderRadius: '16px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,243,255,0.2)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ color: 'var(--electric-blue)', marginBottom: '0.8rem' }}>{f.icon}</div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', fontWeight: '700' }}>{f.title}</h4>
              <p style={{ color: 'var(--silver)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="container" style={{ padding: '3rem 0 6rem' }}>
        <div style={{ 
          padding: '3rem', borderRadius: '28px', textAlign: 'center', 
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0, 243, 255, 0.15)',
          backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', opacity: 0.06 }}><Cpu size={200} /></div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '1rem' }}>Ready to <span className="text-glow">Trade?</span></h2>
          <p style={{ color: 'var(--silver)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Join 12,000+ drivers using Pakistan's smartest car platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/listings')} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Explore Cars</button>
            <button onClick={() => navigate('/sell')} className="btn btn-outline" style={{ padding: '0.8rem 2rem' }}>List Yours</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;