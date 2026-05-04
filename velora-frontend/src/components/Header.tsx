import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Cpu, Eye, PlusCircle, MessageSquare, LayoutDashboard, ShieldAlert, LogOut } from 'lucide-react';

interface HeaderProps {
  isLoggedIn: boolean;
  user: any;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  user,
  onLoginClick,
  onSignupClick,
  onLogout
}) => {
  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 4rem)',
    maxWidth: '1400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.8rem 2rem',
    background: 'rgba(10, 10, 18, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '100px',
    zIndex: 1000,
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
  };

  const linkStyle: React.CSSProperties = {
    color: 'var(--silver)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    fontWeight: '500',
    padding: '0.5rem 0.8rem',
    borderRadius: '100px',
    transition: 'all 0.3s',
  };

  return (
    <header style={{ height: '80px' }}>
      <nav style={navStyle}>
        <Link to="/" style={{ textDecoration: 'none', color: 'white', fontWeight: '900', fontSize: '1.5rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--electric-blue)' }}>V</span>ELORA
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Link to="/" style={linkStyle}><Home size={16} /> Home</Link>
          <Link to="/listings" style={linkStyle}><Search size={16} /> Explore</Link>
          <Link to="/predict" style={linkStyle}><Cpu size={16} /> Valuate</Link>
          <Link to="/detect" style={linkStyle}><Eye size={16} /> Vision</Link>
          <Link to="/sell" style={linkStyle}><PlusCircle size={16} /> Sell</Link>
          {isLoggedIn && (
            <>
              <Link to="/messages" style={linkStyle}><MessageSquare size={16} /> Chat</Link>
              <Link to="/dashboard" style={linkStyle}><LayoutDashboard size={16} /> Hub</Link>
              {user?.user_type === 'Admin' && (
                <Link to="/admin-dashboard" style={{...linkStyle, color: '#ef4444'}}><ShieldAlert size={16} /> Admin</Link>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {!isLoggedIn ? (
            <>
              <button onClick={onLoginClick} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '100px', fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s' }}>Login</button>
              <button onClick={onSignupClick} style={{ background: 'var(--electric-blue)', border: 'none', color: 'black', padding: '0.5rem 1.2rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>Sign Up</button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ color: 'var(--silver)', fontSize: '0.85rem' }}>{user?.name || user?.email}</span>
              <button onClick={onLogout} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;