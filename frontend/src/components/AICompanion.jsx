import React, { useState, useRef, useEffect } from 'react';
import { askCompanion } from '../api/aiAPI';

const THEME = {
  gold: '#c19a49',
  woodDark: '#3d2b1f',
  parchment: '#e8d5a3',
  parchLight: '#f5e6c8',
  parchDark: '#c4a96a',
  text: '#3d2b1f',
};

const AICompanion = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am your AI Companion. 👋 Do you have any questions about your rights?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await askCompanion(userMessage, context);
      setMessages(prev => [...prev, { role: 'ai', text: response.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Oops! I am having trouble thinking right now. 🙈' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      {isOpen && (
        <div style={S.chatBox}>
          <div style={S.header}>
            <span style={{ fontSize: '18px' }}>🤖 AI Companion</span>
            <button style={S.closeBtn} onClick={() => setIsOpen(false)}>✖</button>
          </div>
          
          <div style={S.messages}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                ...S.messageRow,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  ...S.bubble,
                  background: msg.role === 'user' ? THEME.gold : THEME.parchLight,
                  color: THEME.text
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={S.messageRow}>
                <div style={{ ...S.bubble, background: THEME.parchLight }}>...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={S.inputArea}>
            <input 
              style={S.input} 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..." 
            />
            <button style={S.sendBtn} onClick={handleSend}>Send</button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button style={S.fab} onClick={() => setIsOpen(true)}>
          <div style={S.fabIcon}>🤖</div>
        </button>
      )}
    </div>
  );
};

const S = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    fontFamily: "'VT323', monospace",
  },
  fab: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(180deg, #e8c252, #c19a49)',
    border: '3px solid #3d2b1f',
    boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'rpgBounce 2s infinite',
  },
  fabIcon: {
    fontSize: '32px',
  },
  chatBox: {
    width: '320px',
    height: '450px',
    background: THEME.parchment,
    border: '4px solid ' + THEME.woodDark,
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '6px 6px 0 rgba(0,0,0,0.4)',
    overflow: 'hidden'
  },
  header: {
    background: THEME.woodDark,
    color: THEME.parchLight,
    padding: '10px 15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '4px solid #2a1a0e',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '10px'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px'
  },
  messages: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: 'rgba(193,154,73,0.1)'
  },
  messageRow: {
    display: 'flex',
    width: '100%'
  },
  bubble: {
    maxWidth: '80%',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '20px',
    boxShadow: '2px 2px 0 rgba(61,43,31,0.2)',
    border: '2px solid rgba(61,43,31,0.2)'
  },
  inputArea: {
    display: 'flex',
    padding: '10px',
    borderTop: '2px dashed ' + THEME.woodDark,
    background: THEME.parchDark,
    gap: '8px'
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    border: '2px solid ' + THEME.woodDark,
    borderRadius: '4px',
    background: THEME.parchLight,
    outline: 'none'
  },
  sendBtn: {
    padding: '0 15px',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '10px',
    background: THEME.woodDark,
    color: THEME.parchLight,
    border: '2px solid #2a1a0e',
    cursor: 'pointer',
    borderRadius: '4px'
  }
};

export default AICompanion;
