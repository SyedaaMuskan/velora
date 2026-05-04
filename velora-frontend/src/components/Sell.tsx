import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Upload, Cpu, PlusCircle } from 'lucide-react';

const Sell: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '', make: '', model: '', year: '', mileage: '', fuel_type: '', transmission: '', engine_capacity: '', location: '', price: '', description: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles].slice(0, 5));
      e.target.value = ''; // reset so same file can be re-selected
    }
  };

  const handlePriceAnalysis = async () => {
    if (!formData.make || !formData.model || !formData.year || !formData.mileage) {
      alert('Please fill in Make, Model, Year, and Mileage first.'); return;
    }
    setAnalyzing(true); setAiAnalysis(null);
    try {
      const data = new FormData();
      data.append('make', formData.make); data.append('model', formData.model);
      data.append('year', formData.year); data.append('mileage_km', formData.mileage);
      data.append('fuel_type', formData.fuel_type || 'Petrol'); data.append('transmission', formData.transmission || 'Manual');
      data.append('engine_cc', formData.engine_capacity || '1300'); data.append('city', formData.location || 'Karachi');
      data.append('condition', 'Excellent'); data.append('registration_city', formData.location || 'Karachi');
      data.append('color', 'White'); data.append('num_owners', '1'); data.append('registered', 'Registered');
      if (formData.price) data.append('price', formData.price);
      const response = await axios.post(`${API_BASE_URL}/price-analysis`, data);
      setAiAnalysis(response.data);
      // Auto-fill price if user hasn't set one
      if (!formData.price && response.data?.analysis?.suggested_price) {
        setFormData(prev => ({ ...prev, price: String(Math.round(response.data.analysis.suggested_price)) }));
      }
    } catch (error) { alert('Failed to get AI price prediction.'); }
    finally { setAnalyzing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('make', formData.make); fd.append('model', formData.model);
      fd.append('year', formData.year); fd.append('mileage_km', formData.mileage);
      fd.append('fuel_type', formData.fuel_type); fd.append('transmission', formData.transmission);
      fd.append('engine_cc', formData.engine_capacity); fd.append('city', formData.location);
      fd.append('price', formData.price); fd.append('condition', 'Excellent');
      fd.append('registration_city', formData.location); fd.append('color', 'White');
      fd.append('num_owners', '1'); fd.append('registered', 'Registered');
      images.forEach((image, index) => { if (index < 5) fd.append(`image${index + 1}`, image); });
      await axios.post(`${API_BASE_URL}/create-listing`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      alert('Listing created successfully!');
      setFormData({ title: '', make: '', model: '', year: '', mileage: '', fuel_type: '', transmission: '', engine_capacity: '', location: '', price: '', description: '' });
      setImages([]); setAiAnalysis(null);
    } catch (error) { alert('Error creating listing. Please try again.'); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.8rem 1rem', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: 'white', fontSize: '0.9rem', outline: 'none', transition: '0.3s'
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--silver)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '1000px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Sell Your <span className="text-glow">Car</span></h1>
        <p style={{ color: 'var(--silver)', fontSize: '0.9rem' }}>Fill in the details and let our marketplace do the rest.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: aiAnalysis ? '1.2fr 0.8fr' : '1fr', gap: '2rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', backdropFilter: 'blur(8px)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Listing Title</label>
              <input name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g., Toyota Corolla 2018 Excellent Condition" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>Make</label><input name="make" value={formData.make} onChange={handleInputChange} required placeholder="Toyota" style={inputStyle} /></div>
              <div><label style={labelStyle}>Model</label><input name="model" value={formData.model} onChange={handleInputChange} required placeholder="Corolla" style={inputStyle} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>Year</label><input name="year" type="number" value={formData.year} onChange={handleInputChange} required min="1990" max="2025" style={inputStyle} /></div>
              <div><label style={labelStyle}>Mileage (km)</label><input name="mileage" type="number" value={formData.mileage} onChange={handleInputChange} required placeholder="50000" style={inputStyle} /></div>
              <div><label style={labelStyle}>Engine (cc)</label><input name="engine_capacity" type="number" value={formData.engine_capacity} onChange={handleInputChange} required placeholder="1600" style={inputStyle} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Fuel</label>
                <select name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} required style={inputStyle}>
                  <option value="">Select</option><option value="Petrol">Petrol</option><option value="Diesel">Diesel</option><option value="Hybrid">Hybrid</option><option value="Electric">Electric</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Transmission</label>
                <select name="transmission" value={formData.transmission} onChange={handleInputChange} required style={inputStyle}>
                  <option value="">Select</option><option value="Manual">Manual</option><option value="Automatic">Automatic</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>City</label><input name="location" value={formData.location} onChange={handleInputChange} required placeholder="Karachi" style={inputStyle} /></div>
              <div><label style={labelStyle}>Price (Rs.)</label><input name="price" type="number" value={formData.price} onChange={handleInputChange} required placeholder="2500000" style={inputStyle} /></div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Condition, features, history..."
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Photos</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} id="car-images" style={{ display: 'none' }} />
              <label htmlFor="car-images" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.2rem', borderRadius: '12px', border: '2px dashed rgba(0,243,255,0.2)', cursor: 'pointer', color: 'var(--silver)', fontSize: '0.85rem', background: 'rgba(0,243,255,0.02)', transition: '0.3s' }}>
                <Upload size={18} /> Click to upload (up to 5)
              </label>
              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.8rem' }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={URL.createObjectURL(img)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button type="button" onClick={handlePriceAnalysis} disabled={analyzing}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(0,243,255,0.3)', background: 'transparent', color: 'var(--electric-blue)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Cpu size={16} /> {analyzing ? 'Analyzing...' : 'AI Price Check'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ flex: 1, padding: '0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <PlusCircle size={16} /> {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>

        {/* AI Result Panel */}
        {aiAnalysis && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,243,255,0.15)', borderRadius: '24px', padding: '2rem', backdropFilter: 'blur(8px)', height: 'fit-content', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>AI Market Insights</h3>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '1px' }}>Suggested Price</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--electric-blue)' }}>Rs. {aiAnalysis.analysis.suggested_price.toLocaleString()}</div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--silver)', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>{aiAnalysis.tip}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--silver)', textTransform: 'uppercase' }}>Position</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '0.3rem' }}>{aiAnalysis.analysis.market_position}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--silver)', textTransform: 'uppercase' }}>Confidence</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--electric-blue)', marginTop: '0.3rem' }}>{aiAnalysis.analysis.confidence_score}%</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--electric-blue)', fontWeight: '700', marginBottom: '0.5rem' }}>Why this price?</div>
              <ul style={{ color: 'var(--silver)', paddingLeft: '1rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
                {aiAnalysis.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sell;