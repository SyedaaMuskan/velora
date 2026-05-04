import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Cpu, TrendingUp } from 'lucide-react';

interface PredictionResult {
  prediction: number;
  message: string;
}

const Predict: React.FC = () => {
  const [formData, setFormData] = useState({
    make: '', model: '', year: '', mileage: '', fuel_type: '', transmission: '', engine_capacity: '', location: ''
  });
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        make: formData.make, model: formData.model,
        year: parseInt(formData.year) || 2018, mileage_km: parseFloat(formData.mileage) || 50000,
        fuel_type: formData.fuel_type, transmission: formData.transmission,
        engine_cc: parseInt(formData.engine_capacity) || 1600, city: formData.location,
        num_owners: 1, registered: "Registered", condition: "Excellent", color: "White", registration_city: formData.location
      };
      const response = await axios.post(`${API_BASE_URL}/predict`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrediction(response.data);
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Error getting prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.8rem 1rem', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: 'white', fontSize: '0.9rem', outline: 'none', transition: '0.3s'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--silver)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '900px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>AI <span className="text-glow">Valuation</span></h1>
        <p style={{ color: 'var(--silver)', fontSize: '0.9rem' }}>Enter your car details and let our neural network predict the market value.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: prediction ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', backdropFilter: 'blur(8px)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Make</label>
                <input name="make" value={formData.make} onChange={handleInputChange} required placeholder="Toyota" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Model</label>
                <input name="model" value={formData.model} onChange={handleInputChange} required placeholder="Corolla" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Year</label>
                <input name="year" type="number" value={formData.year} onChange={handleInputChange} required min="1990" max="2025" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mileage (km)</label>
                <input name="mileage" type="number" value={formData.mileage} onChange={handleInputChange} required placeholder="50000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fuel</label>
                <select name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} required style={inputStyle}>
                  <option value="">Select</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Transmission</label>
                <select name="transmission" value={formData.transmission} onChange={handleInputChange} required style={inputStyle}>
                  <option value="">Select</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Engine (cc)</label>
                <input name="engine_capacity" type="number" value={formData.engine_capacity} onChange={handleInputChange} required placeholder="1600" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input name="location" value={formData.location} onChange={handleInputChange} required placeholder="Karachi" style={inputStyle} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.9rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
              <Cpu size={18} /> {loading ? 'Processing...' : 'Get Valuation'}
            </button>
          </form>
        </div>

        {prediction && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,243,255,0.15)', borderRadius: '24px', padding: '2rem', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ color: 'var(--electric-blue)', marginBottom: '1rem' }}><TrendingUp size={40} /></div>
            <div style={{ fontSize: '0.8rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Estimated Market Value</div>
            <div style={{ fontSize: '3rem', fontWeight: '900', color: 'white', marginBottom: '1rem' }}>
              Rs. {prediction.prediction.toLocaleString()}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', color: 'var(--silver)', fontSize: '0.85rem' }}>
              {prediction.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predict;