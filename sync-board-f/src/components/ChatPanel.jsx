import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const chatAreaRef = useRef(null);

  const [messages, setMessages] = useState([
    { id: 1, name: 'Sarah Chen', time: '10:42 AM', text: "I've added the new feature cards to the right side of the board.", avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d', isSelf: false },
    { id: 2, name: 'Mike Johnson', time: '10:45 AM', text: 'Looks good! Do we need to update the progress bar component as well?', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d', isSelf: false },
    { id: 3, name: 'Alex Rivera', time: '10:47 AM', text: "Yes, let's use the new accent color for the progress fill. I'll drop a sticky note about it.", isSelf: true }
  ]);

  // Auto scroll to bottom when new message is added
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now(),
      name: 'Alex Rivera',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputValue.trim(),
      isSelf: true
    };

    setMessages([...messages, newMsg]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <aside className="floating-chat-panel">
      <div className="panel-header">
        <div className="panel-title">
          <MessageSquare size={18} className="text-muted" />
          Live Discussion
        </div>
        <button className="tool-btn" onClick={() => setIsOpen(false)}><X size={18} /></button>
      </div>

      <div className="chat-area" ref={chatAreaRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.isSelf ? 'self' : ''}`}>
            {!msg.isSelf && (
              <div className="msg-avatar">
                <img src={msg.avatar} alt={msg.name} />
              </div>
            )}
            <div className="msg-content">
              <div className="msg-header">
                {!msg.isSelf && <span className="msg-name">{msg.name}</span>}
                <span className="msg-time">{msg.time}</span>
              </div>
              <div className="msg-bubble">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Type a message..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="send-btn" onClick={handleSendMessage}>
            <Send size={14} style={{ marginLeft: '-2px' }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
