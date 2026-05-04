import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Camera, Upload, AlertCircle, CheckCircle, Shield } from 'lucide-react';

interface DetectionReport {
  condition: string;
  damage_status: string;
  confidence: number;
}

const ImageDetection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DetectionReport | null>(null);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setReport(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post(`${API_BASE_URL}/detect-car-condition`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReport(response.data);
    } catch (err) {
      console.error('Detection error:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '1000px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>AI <span className="text-glow">Vision Scan</span></h1>
        <p style={{ color: 'var(--silver)', fontSize: '0.9rem' }}>Upload a car photo and our AI will detect condition, damage, and provide a confidence report.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Upload Panel */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {preview ? (
            <div style={{ width: '100%', marginBottom: '1.5rem', position: 'relative' }}>
              <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '16px', maxHeight: '280px', objectFit: 'cover' }} />
              <button onClick={() => { setFile(null); setPreview(null); setReport(null); }}
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}
              >&times;</button>
            </div>
          ) : (
            <label style={{ width: '100%', height: '280px', border: '2px dashed rgba(0,243,255,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '1.5rem', color: 'var(--silver)', transition: '0.3s', background: 'rgba(0,243,255,0.02)' }}>
              <Camera size={40} style={{ marginBottom: '1rem', color: 'var(--electric-blue)' }} />
              <span style={{ fontSize: '0.9rem' }}>Click to upload car photo</span>
              <span style={{ fontSize: '0.75rem', marginTop: '0.3rem', opacity: 0.6 }}>JPG, PNG up to 10MB</span>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          )}

          <button onClick={handleUpload} disabled={!file || loading} className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem' }}>
            {loading ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'black' }}></div> : <Upload size={18} />}
            {loading ? 'Scanning...' : 'Analyze Image'}
          </button>
        </div>

        {/* Report Panel */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', backdropFilter: 'blur(8px)' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Shield size={18} color="var(--electric-blue)" /> Analysis Report
          </h3>

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {!report && !error && !loading && (
            <div style={{ color: 'var(--silver)', textAlign: 'center', padding: '3rem 0', fontSize: '0.85rem' }}>
              Upload an image to generate the AI report.
            </div>
          )}

          {loading && (
            <div style={{ color: 'var(--silver)', textAlign: 'center', padding: '3rem 0', fontSize: '0.85rem' }}>
              Inspecting for dents, scratches, and condition...
            </div>
          )}

          {report && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.2rem', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Condition</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={20} color="var(--electric-blue)" /> {report.condition}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.2rem', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Damage Status</div>
                <div style={{ fontSize: '1.1rem', color: report.damage_status !== 'None' ? '#ef4444' : '#22c55e', fontWeight: '600' }}>
                  {report.damage_status}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Confidence</div>
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(report.confidence * 100)}%`, background: 'var(--electric-blue)', height: '100%', borderRadius: '4px', transition: 'width 1s ease' }}></div>
                </div>
                <div style={{ textAlign: 'right', marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--electric-blue)', fontWeight: 'bold' }}>
                  {Math.round(report.confidence * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageDetection;
