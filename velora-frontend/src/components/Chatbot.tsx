import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { MessageCircle, X, Send } from 'lucide-react';

interface ChatMsg {
  sender: 'user' | 'bot';
  text: string;
  isError?: boolean;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { sender: 'bot', text: 'Hi there! I am the Velora AI Assistant. Ask me anything about car prices or our platform!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/chatbot`, { message: userMsg });
      const responseText = res.data.response;
      const isError = responseText.includes('Error') || responseText.includes('trouble connecting');
      
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: responseText,
        isError: isError
      }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I am having trouble connecting to the server. Please ensure the backend is running.',
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--electric-blue)',
          color: 'black',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,212,255,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '6.5rem',
          right: '2rem',
          width: '350px',
          height: '450px',
          background: '#1a1a1a',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', background: 'rgba(0,212,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
            Velora AI Assistant
          </div>
          
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  background: msg.sender === 'user' ? 'var(--electric-blue)' : (msg.isError ? 'rgba(239, 68, 68, 0.1)' : '#333'),
                  color: msg.sender === 'user' ? 'black' : 'white',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  borderBottomRightRadius: msg.sender === 'user' ? 0 : '12px',
                  borderBottomLeftRadius: msg.sender === 'user' ? '12px' : 0,
                  fontSize: '0.9rem',
                  border: msg.isError ? '1px solid #ef4444' : 'none'
                }}>
                  {msg.isError && <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.7rem', marginBottom: '0.2rem' }}>SYSTEM ERROR</div>}
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#333', padding: '0.8rem', borderRadius: '12px', fontSize: '0.9rem' }}>
                Typing...
              </div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
            />
            <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--electric-blue)', cursor: 'pointer' }}>
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
