import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, X, Send, BookOpen } from 'lucide-react';

export const HRChatbot: React.FC = () => {
  const { chatHistory, sendChatMessage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    
    sendChatMessage(inputText);
    setInputText('');
  };

  const handlePresetQuery = (text: string) => {
    sendChatMessage(text);
  };

  return (
    <div className="chatbot-widget">
      {/* Expanded chat window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#10B981',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px #10B981'
                }}
              />
              <span className="font-bold" style={{ fontSize: 'var(--fs-body-sm)' }}>
                AI HR Copilot (RAG)
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="chatbot-messages">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}
              >
                {/* Message text */}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                
                {/* Citation section (if RAG retrieved document) */}
                {msg.citations && (
                  <div className="chat-citation-box">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <BookOpen size={10} /> Citations:
                    </span>
                    {msg.citations.map((cite, index) => (
                      <span key={index} className="chat-citation-item" title={cite}>
                        {cite}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div
                  style={{
                    fontSize: '9px',
                    color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                    marginTop: '4px',
                    textAlign: msg.sender === 'user' ? 'right' : 'left'
                  }}
                >
                  {msg.timestamp}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion presets */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              fontSize: 'var(--fs-caption)'
            }}
          >
            <button
              onClick={() => handlePresetQuery('What is the annual leave policy?')}
              style={{
                backgroundColor: 'var(--gray-100)',
                border: '1px solid var(--border-color)',
                borderRadius: '9999px',
                padding: '4px 10px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-50)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
            >
              🌴 Leave Policies
            </button>
            <button
              onClick={() => handlePresetQuery('When does the payroll execute?')}
              style={{
                backgroundColor: 'var(--gray-100)',
                border: '1px solid var(--border-color)',
                borderRadius: '9999px',
                padding: '4px 10px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-50)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
            >
              💰 Payroll Dates
            </button>
          </div>

          {/* Input Box Form */}
          <form onSubmit={handleSend} className="chatbot-input-container">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask policies, check-ins, or status..."
              className="chatbot-input"
            />
            <button
              type="submit"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--secondary-600)',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Send Message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Floating violet button trigger */}
      <div className="chatbot-button" onClick={() => setIsOpen(!isOpen)} title="Toggle HR Assistant">
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </div>
    </div>
  );
};
