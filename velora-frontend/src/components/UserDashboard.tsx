import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Eye, MousePointerClick, TrendingUp, Bell, LayoutDashboard, Heart, Car, ShieldCheck } from 'lucide-react';

interface Analytics {
  total_views: number;
  total_clicks: number;
  price_competitiveness: number;
  listing_count: number;
  performance_summary: string;
  listings: any[];
  saved_listings: any[];
}

interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  link: string;
}

const UserDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [analyticsRes, notifRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/analytics/user-dashboard`, { headers }),
        axios.get(`${API_BASE_URL}/notifications`, { headers }).catch(() => ({ data: [] }))
      ]);

      setAnalytics(analyticsRes.data);
      setNotifications(notifRes.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure? This listing will be removed from Velora.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/listing/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Delete error', error);
    }
  };

  const handleUpdatePrice = async (id: number) => {
    const newPrice = prompt('Enter new price (Rs.):');
    if (!newPrice || isNaN(Number(newPrice))) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/listing/${id}?price=${newPrice}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Update error', error);
    }
  };

  const handleUnsave = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/user/save/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Unsave error', error);
    }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div><p>Loading Your Command Center...</p></div></div>;

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', textTransform: 'uppercase' }}>Command <span className="text-glow">Center</span></h1>
        <p style={{ color: 'var(--silver)' }}>Welcome back. Here is your platform overview.</p>
      </div>

      <div className="dashboard-layout">
        {/* --- SIDEBAR --- */}
        <aside className="dash-sidebar">
          <div className={`dash-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={20} /> Overview
          </div>
          <div className={`dash-nav-item ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
            <Car size={20} /> My Listings
          </div>
          <div className={`dash-nav-item ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
            <Heart size={20} /> Wishlist
          </div>
          <div className={`dash-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <Bell size={20} /> Notifications {notifications.filter(n => !n.is_read).length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem', marginLeft: 'auto' }}>{notifications.filter(n => !n.is_read).length}</span>}
          </div>
        </aside>

        {/* --- CONTENT AREA --- */}
        <main>
          {activeTab === 'overview' && analytics && (
            <div className="animate-in">
              <div className="stat-grid">
                <div className="stat-card premium-glass glow-active">
                  <div style={{ color: 'var(--electric-blue)', marginBottom: '0.5rem' }}><Eye size={24} /></div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.total_views}</div>
                  <div style={{ color: 'var(--silver)', fontSize: '0.8rem' }}>Total Views</div>
                </div>
                <div className="stat-card premium-glass">
                  <div style={{ color: 'var(--electric-blue)', marginBottom: '0.5rem' }}><MousePointerClick size={24} /></div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.total_clicks}</div>
                  <div style={{ color: 'var(--silver)', fontSize: '0.8rem' }}>Total Engagements</div>
                </div>
                <div className="stat-card premium-glass">
                  <div style={{ color: 'var(--electric-blue)', marginBottom: '0.5rem' }}><TrendingUp size={24} /></div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.price_competitiveness}%</div>
                  <div style={{ color: 'var(--silver)', fontSize: '0.8rem' }}>Market Index</div>
                </div>
              </div>

              <div className="premium-glass" style={{ padding: '2rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}><ShieldCheck size={100} /></div>
                <h3 style={{ marginBottom: '1rem' }}>Performance Summary</h3>
                <p style={{ color: 'var(--silver)', lineHeight: 1.6 }}>{analytics.performance_summary}</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setActiveTab('listings')} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Manage Inventory</button>
                  <button onClick={() => setActiveTab('notifications')} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>View Alerts</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="animate-in">
              <h2 style={{ marginBottom: '2rem' }}>My Inventory</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {analytics?.listings.map(car => (
                  <div key={car.id} className="premium-glass" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', gap: '1rem' }}>
                    <img src={car.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80'} style={{ width: '120px', height: '120px', objectFit: 'cover' }} alt="car" />
                    <div style={{ padding: '1rem', flex: 1 }}>
                      <h4 style={{ margin: 0 }}>{car.brand} {car.model}</h4>
                      <div style={{ color: 'var(--electric-blue)', fontSize: '0.9rem', margin: '0.5rem 0' }}>Rs. {car.price.toLocaleString()}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(`/listing/${car.id}`)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(0,243,255,0.3)', background: 'transparent', color: 'var(--electric-blue)', cursor: 'pointer' }}>View / Edit</button>
                        <button onClick={() => handleUpdatePrice(car.id)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Price</button>
                        <button onClick={() => handleDelete(car.id)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wishlist' && (
             <div className="animate-in">
                <h2 style={{ marginBottom: '2rem' }}>Saved for Later</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {analytics?.saved_listings.map(car => (
                    <div key={car.id} className="premium-glass" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', gap: '1rem' }}>
                      <img src={car.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80'} style={{ width: '120px', height: '120px', objectFit: 'cover' }} alt="car" />
                      <div style={{ padding: '1rem', flex: 1 }}>
                        <h4 style={{ margin: 0 }}>{car.brand} {car.model}</h4>
                        <div style={{ color: 'var(--electric-blue)', fontSize: '0.9rem', margin: '0.5rem 0' }}>Rs. {car.price.toLocaleString()}</div>
                        <button onClick={() => handleUnsave(car.id)} className="btn btn-outline" style={{ marginTop: '0.5rem', fontSize: '0.7rem', padding: '0.3rem 0.6rem', width: '100%' }}>Unsave</button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-in">
              <h2 style={{ marginBottom: '2rem' }}>System Alerts</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notifications.map(notif => (
                  <div key={notif.id} className="premium-glass" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: notif.is_read ? 'none' : '4px solid var(--electric-blue)', opacity: notif.is_read ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <h4 style={{ margin: 0 }}>{notif.title}</h4>
                       <small style={{ color: 'var(--silver)' }}>{new Date(notif.created_at).toLocaleDateString()}</small>
                    </div>
                    <p style={{ color: 'var(--silver)', margin: '0.5rem 0', fontSize: '0.9rem' }}>{notif.message}</p>
                    {!notif.is_read && <button onClick={() => markAsRead(notif.id)} className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>Mark as Read</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
