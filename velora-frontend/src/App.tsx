import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, getWsUrl } from './api';
import Header from './components/Header';
import Home from './components/Home';
import Listings from './components/Listings';
import Predict from './components/Predict';
import Sell from './components/Sell';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import Messages from './components/Messages';
import ListingDetail from './components/ListingDetail';
import ImageDetection from './components/ImageDetection';
import Chatbot from './components/Chatbot';
import { Bell } from 'lucide-react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Fetch user profile to restore 'user' state
      axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser({ ...res.data, token });
      }).catch(() => {
        handleLogout();
      });
    }
  }, []);

  React.useEffect(() => {
    let ws: WebSocket | null = null;
    const token = localStorage.getItem('token');
    
    if (isLoggedIn && token) {
      ws = new WebSocket(getWsUrl(`/ws/${token}`));
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications(prev => [...prev, data]);
          
          // Auto-remove notification after 5 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n !== data));
          }, 5000);
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };
      
      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isLoggedIn]);

  const handleLogin = (userData: any) => {
    console.log('Login successful:', userData);
    setIsLoggedIn(true);
    setUser(userData);
    setShowLogin(false);
    localStorage.setItem('token', userData.token);
  };

  const handleLogout = () => {
    console.log('Logout');
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleSignup = (userData: any) => {
    console.log('Signup successful:', userData);
    setIsLoggedIn(true);
    setUser(userData);
    setShowSignup(false);
    localStorage.setItem('token', userData.token);
  };

  return (
    <div className="App">
      <div className="animated-bg"></div>
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onSignupClick={() => setShowSignup(true)}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/detect" element={<ImageDetection />} />
      </Routes>

      <Chatbot />

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}

      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSignup={handleSignup}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {notifications.map((notif, idx) => (
          <div key={idx} className="toast">
            <Bell size={18} />
            <div className="toast-content">
              <h4>{notif.type === 'price_alert' ? 'Price Drop!' : 'New Alert!'}</h4>
              <p>{notif.message}</p>
            </div>
            <button onClick={() => setNotifications(prev => prev.filter((_, i) => i !== idx))}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;