import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  listing_id: number;
  message: string;
  is_offer: boolean;
  offer_amount: number | null;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
  listing_title?: string;
}

interface Conversation {
  listing_id: number;
  other_user_id: number;
  other_user_name: string;
  listing_title: string;
  last_message: ChatMessage;
}

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<{ listing_id: number, other_user_id: number, other_user_name: string, listing_title: string } | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const listingIdFromUrl = searchParams.get('listing');
  const receiverIdFromUrl = searchParams.get('receiver');

  const getUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    } catch { return null; }
  };

  const myUserId = getUserId();

  useEffect(() => { fetchInbox(); }, []);

  useEffect(() => {
    if (listingIdFromUrl && receiverIdFromUrl) {
      setActiveChat({ listing_id: Number(listingIdFromUrl), other_user_id: Number(receiverIdFromUrl), other_user_name: '', listing_title: '' });
    }
  }, [listingIdFromUrl, receiverIdFromUrl]);

  useEffect(() => {
    if (activeChat) fetchHistory(activeChat.listing_id, activeChat.other_user_id);
  }, [activeChat]);

  const fetchInbox = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/chat/inbox`, { headers: { Authorization: `Bearer ${token}` } });
      const msgs: ChatMessage[] = response.data;
      const convos = new Map<string, Conversation>();
      if (listingIdFromUrl && receiverIdFromUrl) {
        const lid = Number(listingIdFromUrl); const rid = Number(receiverIdFromUrl);
        convos.set(`${lid}-${rid}`, { listing_id: lid, other_user_id: rid, other_user_name: '', listing_title: '', last_message: { id: 0, sender_id: 0, receiver_id: 0, listing_id: lid, message: 'Start a conversation...', is_offer: false, offer_amount: null, created_at: new Date().toISOString() } });
      }
      msgs.forEach(msg => {
        const otherId = msg.sender_id === myUserId ? msg.receiver_id : msg.sender_id;
        const otherName = msg.sender_id === myUserId ? msg.receiver_name : msg.sender_name;
        convos.set(`${msg.listing_id}-${otherId}`, { listing_id: msg.listing_id, other_user_id: otherId, other_user_name: otherName || 'User', listing_title: msg.listing_title || 'Listing', last_message: msg });
      });
      setConversations(Array.from(convos.values()));
    } catch (error) { console.error('Error fetching inbox:', error); }
    finally { setLoading(false); }
  };

  const fetchHistory = async (listingId: number, otherUserId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/chat/history/${listingId}/${otherUserId}`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(response.data);
    } catch (error) { console.error('Error fetching history:', error); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/chat/send?receiver_id=${activeChat.other_user_id}&listing_id=${activeChat.listing_id}&message=${encodeURIComponent(messageText)}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessageText('');
      fetchHistory(activeChat.listing_id, activeChat.other_user_id);
    } catch (error) { console.error('Error sending message:', error); }
  };

  if (!myUserId) {
    return <div className="container" style={{ textAlign: 'center', paddingTop: '5rem', color: 'var(--silver)' }}><h2>Please login to view messages.</h2></div>;
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' }}>
        <span className="text-glow">Messages</span>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: '550px' }}>
        {/* Sidebar */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)' }}>
          <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem', fontWeight: '700', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Conversations
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? <p style={{ padding: '1.5rem', color: 'var(--silver)', fontSize: '0.85rem' }}>Loading...</p> :
              conversations.length === 0 ? <p style={{ padding: '1.5rem', color: 'var(--silver)', fontSize: '0.85rem' }}>No messages yet.</p> :
              conversations.map(c => (
                <div key={`${c.listing_id}-${c.other_user_id}`}
                  onClick={() => setActiveChat({ listing_id: c.listing_id, other_user_id: c.other_user_id, other_user_name: c.other_user_name, listing_title: c.listing_title })}
                  style={{ padding: '1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: '0.2s',
                    background: activeChat?.listing_id === c.listing_id && activeChat?.other_user_id === c.other_user_id ? 'rgba(0,243,255,0.05)' : 'transparent',
                    borderLeft: activeChat?.listing_id === c.listing_id && activeChat?.other_user_id === c.other_user_id ? '3px solid var(--electric-blue)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,243,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UserIcon size={16} color="var(--electric-blue)" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{c.other_user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--electric-blue)' }}>{c.listing_title}</div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--silver)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: '2.8rem' }}>
                    {c.last_message.message}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)' }}>
          {activeChat ? (
            <>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <MessageSquare size={18} color="var(--electric-blue)" />
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                  {activeChat.other_user_name} &middot; <span style={{ color: 'var(--silver)', fontWeight: '400' }}>{activeChat.listing_title}</span>
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {history.map(msg => {
                  const isMine = msg.sender_id === myUserId;
                  return (
                    <div key={msg.id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '65%', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.65rem', color: isMine ? 'var(--electric-blue)' : 'var(--silver)', marginBottom: '0.2rem', textAlign: isMine ? 'right' : 'left', fontWeight: 'bold' }}>
                        {isMine ? 'You' : msg.sender_name}
                      </div>
                      <div style={{
                        background: isMine ? 'var(--electric-blue)' : 'rgba(255,255,255,0.08)',
                        padding: '0.8rem 1rem', borderRadius: '14px',
                        borderBottomRightRadius: isMine ? 0 : '14px',
                        borderBottomLeftRadius: isMine ? '14px' : 0,
                        color: isMine ? 'black' : 'white', fontSize: '0.9rem'
                      }}>
                        {msg.message}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--silver)', marginTop: '0.2rem', textAlign: isMine ? 'right' : 'left', opacity: 0.7 }}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  )
                })}
              </div>

              <form onSubmit={sendMessage} style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.8rem' }}>
                <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '0.85rem', outline: 'none' }}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '100px', padding: '0 1.2rem', display: 'flex', alignItems: 'center' }}>
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--silver)', gap: '1rem' }}>
              <MessageSquare size={48} style={{ opacity: 0.2 }} />
              <span style={{ fontSize: '0.9rem' }}>Select a conversation to start chatting</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
