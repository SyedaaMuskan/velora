import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Users, Car, Activity, ShieldAlert } from 'lucide-react';

interface PlatformStats {
  total_listings: number;
  total_users: number;
  active_listings: number;
}

interface TopPerformer {
  id: number;
  brand: string;
  price?: number;
  views?: number;
  clicks?: number;
}

interface AdminData {
  platform_stats: PlatformStats;
  top_performers: {
    most_viewed: TopPerformer[];
    most_clicked: TopPerformer[];
  };
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/analytics/admin-dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (err: any) {
      console.error('Admin error:', err);
      setError(err.response?.data?.detail || 'Failed to load admin dashboard. You might not have permission.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div><p>Loading Admin Dashboard...</p></div></div>;

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <ShieldAlert size={64} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ color: 'white' }}>Access Denied</h2>
        <p style={{ color: 'var(--silver)', marginTop: '1rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="section-title">Admin <span>Dashboard</span></h1>

      {data && (
        <>
          <h2 style={{ color: 'white', marginBottom: '1.5rem', marginTop: '2rem' }}>Platform Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <div className="insight-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--silver)' }}>
                <Users size={20} /> Total Users
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginTop: '0.5rem' }}>
                {data.platform_stats.total_users}
              </div>
            </div>
            
            <div className="insight-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--silver)' }}>
                <Car size={20} /> Total Listings
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginTop: '0.5rem' }}>
                {data.platform_stats.total_listings}
              </div>
            </div>

            <div className="insight-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--silver)' }}>
                <Activity size={20} /> Active Listings
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--electric-blue)', marginTop: '0.5rem' }}>
                {data.platform_stats.active_listings}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="car-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Most Viewed Listings</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {data.top_performers.most_viewed.map(item => (
                  <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span>ID #{item.id} - {item.brand}</span>
                    <span style={{ color: 'var(--electric-blue)' }}>{item.views} views</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="car-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Most Clicked Listings</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {data.top_performers.most_clicked.map(item => (
                  <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span>ID #{item.id} - {item.brand}</span>
                    <span style={{ color: 'var(--electric-blue)' }}>{item.clicks} clicks</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '3rem' }}>
            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Manage All Listings</h2>
            <div className="car-card" style={{ padding: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem' }}>ID</th>
                    <th style={{ padding: '1rem' }}>Car</th>
                    <th style={{ padding: '1rem' }}>Price</th>
                    <th style={{ padding: '1rem' }}>Views</th>
                    <th style={{ padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.top_performers.most_viewed, ...data.top_performers.most_clicked].map((car, idx) => (
                    <tr key={`${car.id}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '1rem' }}>#{car.id}</td>
                      <td style={{ padding: '1rem' }}>{car.brand}</td>
                      <td style={{ padding: '1rem' }}>Rs. {car.price?.toLocaleString() || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{car.views || car.clicks || 0}</td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          onClick={async () => {
                            if(window.confirm('Delete this listing?')) {
                              const token = localStorage.getItem('token');
                              await axios.delete(`${API_BASE_URL}/listing/${car.id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              fetchAdminData();
                            }
                          }}
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', color: '#ef4444', borderColor: '#ef4444' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
