import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { MapPin, Fuel, Settings, Calendar, Heart, Search } from 'lucide-react';

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  ai_price: number;
  location: string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  image_url?: string;
  fraud_score: number;
}

const Listings: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const query = searchParams.get('search');
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(query || '');

  useEffect(() => {
    fetchListings();
    fetchSavedIds();
  }, [query]);

  const fetchSavedIds = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/user/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedIds(response.data.map((c: any) => c.id));
    } catch (error) {
      console.error('Error fetching saved ids:', error);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let url = `${API_BASE_URL}/listings`;
      if (query) {
        url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`;
      }
      const response = await axios.get(url, { headers });
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please login to save cars.');
      await axios.post(`${API_BASE_URL}/user/save/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSavedIds();
    } catch (error) {
      console.error('Error saving car:', error);
    }
  };

  const handleLocalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      navigate(`/listings?search=${encodeURIComponent(localSearch.trim())}`);
    } else {
      navigate('/listings');
    }
  };

  const getDealTag = (actual: number | null, ai: number | null) => {
    if (!actual || !ai) return null;
    const diff = ((actual - ai) / ai) * 100;
    if (diff <= -10) return { text: 'Great Deal', color: '#22c55e' };
    if (diff <= 10) return { text: 'Fair Price', color: 'var(--electric-blue)' };
    return { text: 'Overpriced', color: '#ef4444' };
  };

  if (loading) {
    return <div className="container"><div className="loading"><div className="spinner"></div><p>Loading listings...</p></div></div>;
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Page Header with inline search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>
          {query ? <>Results for "<span className="text-glow">{query}</span>"</> : <>Explore <span className="text-glow">Inventory</span></>}
        </h1>
        <form onSubmit={handleLocalSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" value={localSearch} onChange={e => setLocalSearch(e.target.value)}
            placeholder="Search..." 
            style={{ padding: '0.6rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '0.85rem', outline: 'none', width: '200px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: '100px', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}><Search size={16} /></button>
        </form>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--silver)', marginBottom: '2rem' }}>
        {cars.length} vehicles found
      </div>

      {cars.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--silver)', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2>No cars found.</h2>
          <p style={{ marginTop: '0.5rem' }}>Try different keywords or browse all listings.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {cars.map((car) => {
          const deal = getDealTag(car.price, car.ai_price);
          return (
            <div key={car.id} onClick={() => navigate(`/listing/${car.id}`)}
              style={{ cursor: 'pointer', position: 'relative', borderRadius: '20px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,243,255,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Heart button */}
              <div onClick={(e) => handleSave(e, car.id)}
                style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', zIndex: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: '0.5rem', borderRadius: '50%', display: 'flex', cursor: 'pointer', transition: '0.3s' }}
              >
                <Heart size={18} color={savedIds.includes(car.id) ? '#ef4444' : 'white'} fill={savedIds.includes(car.id) ? '#ef4444' : 'none'} />
              </div>

              {/* Deal tag */}
              {deal && (
                <div style={{ position: 'absolute', top: '0.8rem', left: '0.8rem', zIndex: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '0.3rem 0.8rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 'bold', color: deal.color, border: `1px solid ${deal.color}30` }}>
                  {deal.text}
                </div>
              )}

              <img
                src={car.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80'}
                alt={`${car.brand} ${car.model}`}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80'; }}
              />

              <div style={{ padding: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{car.brand} {car.model}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--silver)' }}>{car.year}</span>
                  </div>
                  {car.fraud_score < 30 && (
                    <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '100px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>Verified</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.8rem', fontSize: '0.8rem', color: 'var(--silver)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Fuel size={14} /> {car.fuel_type}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Settings size={14} /> {car.transmission}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {car.mileage ? `${(car.mileage/1000).toFixed(0)}k km` : 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--silver)', marginBottom: '1rem' }}>
                  <MapPin size={14} /> {car.location}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--silver)' }}>Listed Price</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white' }}>Rs. {car.price ? car.price.toLocaleString() : 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--silver)' }}>AI Value</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--electric-blue)' }}>{car.ai_price ? `Rs. ${car.ai_price.toLocaleString()}` : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Listings;