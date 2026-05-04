import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { MapPin, ShieldAlert, MessageSquare, Heart, Edit, Trash2 } from 'lucide-react';

interface ListingData {
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
  color: string;
  condition: string;
  engine_cc: number;
  num_owners: number;
  registered: string;
  detected_condition?: string;
  damage_report?: string;
  vision_confidence?: number;
  fraud_score: number;
  is_fraudulent: boolean;
  owner_id: number;
  owner_name?: string;
  image_url?: string;
  all_images?: string[];
  images: { id: number; image_path: string }[];
}

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('suspicious');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    fetchListing();
    trackClick();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/listing/${id}`);
      setListing(response.data);
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
      checkIfSaved();
    }
  };

  const checkIfSaved = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/user/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const saved = response.data.some((c: any) => c.id === Number(id));
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking saved status', error);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please login to save cars.');
      
      const response = await axios.post(`${API_BASE_URL}/user/save/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(!isSaved);
      alert(response.data.message);
    } catch (error) {
      console.error('Error saving car', error);
    }
  };

  const trackClick = async () => {
    try {
      await axios.post(`${API_BASE_URL}/listing/${id}/click`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please login to report.');
      
      await axios.post(`${API_BASE_URL}/trust/report`, {
        listing_id: Number(id),
        reason: reportReason,
        details: reportDetails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Report submitted successfully.');
      setShowReport(false);
    } catch (error) {
      console.error('Reporting error', error);
      alert('Failed to submit report.');
    }
  };

  const [activeImg, setActiveImg] = useState(0);

  // Check if current user is the owner
  const getMyId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])).user_id; } catch { return null; }
  };
  const myId = getMyId();
  const isOwner = listing?.owner_id === myId;

  const handleEditPrice = async () => {
    const newPrice = prompt('Enter new price (Rs.):');
    if (!newPrice || isNaN(Number(newPrice))) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/listing/${id}?price=${newPrice}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Price updated!');
      fetchListing();
    } catch { alert('Failed to update price.'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/listing/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      alert('Listing deleted.');
      navigate('/listings');
    } catch { alert('Failed to delete.'); }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div><p>Loading Listing...</p></div></div>;
  if (!listing) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--silver)' }}><h2>Listing not found</h2></div>;

  const allImages = listing.images && listing.images.length > 0
    ? listing.images.map(img => `${API_BASE_URL}/${img.image_path}`)
    : [listing.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>
          {listing.year} {listing.brand} <span className="text-glow">{listing.model}</span>
        </h1>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={handleSave} style={{ background: 'transparent', border: `1px solid ${isSaved ? '#ef4444' : 'rgba(255,255,255,0.15)'}`, color: isSaved ? '#ef4444' : 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
          </button>
          <button onClick={() => navigate(`/messages?listing=${id}&receiver=${listing.owner_id}`)} className="btn btn-primary" style={{ borderRadius: '100px', padding: '0.5rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={16} /> Message Seller
          </button>
          <button onClick={() => setShowReport(true)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={16} /> Report
          </button>
          {isOwner && (
            <>
              <button onClick={handleEditPrice} style={{ background: 'transparent', border: '1px solid rgba(0,243,255,0.3)', color: 'var(--electric-blue)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Edit size={16} /> Edit Price
              </button>
              <button onClick={handleDelete} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main Content */}
        <div>
          {/* Image Gallery */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1rem', marginBottom: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <img
              src={allImages[activeImg]}
              alt="Car"
              style={{ width: '100%', borderRadius: '14px', height: '380px', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'; }}
            />
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', overflowX: 'auto' }}>
                {allImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`thumb-${idx}`}
                    onClick={() => setActiveImg(idx)}
                    style={{
                      width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer',
                      border: activeImg === idx ? '2px solid var(--electric-blue)' : '2px solid transparent',
                      opacity: activeImg === idx ? 1 : 0.6, transition: '0.3s'
                    }}
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=200&q=60'; }}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Specifications</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--silver)' }}>
              <div><strong>Mileage:</strong> {listing.mileage.toLocaleString()} km</div>
              <div><strong>Engine:</strong> {listing.engine_cc} cc</div>
              <div><strong>Fuel:</strong> {listing.fuel_type}</div>
              <div><strong>Transmission:</strong> {listing.transmission}</div>
              <div><strong>Color:</strong> {listing.color}</div>
              <div><strong>Condition:</strong> {listing.condition}</div>
              <div><strong>Registered:</strong> {listing.registered}</div>
              <div><strong>Owners:</strong> {listing.num_owners}</div>
              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} /> Location: {listing.location}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="car-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--silver)', fontSize: '1rem', marginBottom: '0.5rem' }}>Listed Price</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>
              Rs. {listing.price ? listing.price.toLocaleString() : 'N/A'}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem', color: 'var(--silver)' }}>
              <small style={{ display: 'block', marginBottom: '0.2rem' }}>Seller</small>
              <div style={{ color: 'white', fontWeight: 'bold' }}>{listing.owner_name || 'Velora User'}</div>
            </div>
            
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--silver)' }}>AI Suggested Price</span>
                <span style={{ fontWeight: 'bold', color: 'var(--electric-blue)' }}>Rs. {listing.ai_price?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="car-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} /> Trust & Safety Report
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--silver)', marginBottom: '0.5rem' }}>Risk Score</div>
              <div style={{ width: '100%', background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${listing.fraud_score}%`, background: listing.fraud_score > 40 ? '#ef4444' : '#10b981', height: '100%' }}></div>
              </div>
              <small style={{ color: listing.fraud_score > 40 ? '#ef4444' : '#10b981', display: 'block', marginTop: '0.5rem' }}>
                {listing.fraud_score > 40 ? 'High Risk' : 'Low Risk'} ({listing.fraud_score}/100)
              </small>
            </div>

            {listing.detected_condition && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>AI Vision Intelligence</h4>
                <p style={{ color: 'var(--silver)', fontSize: '0.9rem' }}><strong>Detected Condition:</strong> {listing.detected_condition}</p>
                <p style={{ color: 'var(--silver)', fontSize: '0.9rem' }}><strong>Confidence:</strong> {Math.round((listing.vision_confidence || 0) * 100)}%</p>
                {listing.damage_report && (
                   <p style={{ color: 'var(--silver)', fontSize: '0.8rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                     {listing.damage_report}
                   </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReport && (
        <div className="modal active">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowReport(false)}>&times;</button>
            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Report Listing</h2>
            <form onSubmit={handleReport}>
              <div className="form-group">
                <label>Reason</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} required>
                  <option value="suspicious">Suspicious / Potential Fraud</option>
                  <option value="fake">Fake Information</option>
                  <option value="spam">Spam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Details</label>
                <textarea rows={4} value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} required placeholder="Please provide more details..."></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
