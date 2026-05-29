import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, StickyNote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { getMessages, sendMessage as sendMessageApi, getMyTeams, createCanvasElement } from '../api';
import { toast } from './Toast';

export default function ChatPanel({ projectId: propProjectId, projectName: propProjectName, isAdmin: propIsAdmin }) {
  const { token, user } = useAuth();
  const { chatOpen, chatProjectId, chatProjectName, setChatOpen, startChat } = useChat();
  const projectId = propProjectId || chatProjectId;
  const projectName = propProjectName || chatProjectName;
  const isAdmin = propIsAdmin;

  const [internalOpen, internalSetOpen] = useState(true);
  const isOpen = propProjectId !== undefined ? internalOpen : chatOpen;
  const setIsOpen = propProjectId !== undefined ? internalSetOpen : setChatOpen;
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || null);
  const [selectedProjectName, setSelectedProjectName] = useState(projectName || '');
  const [stickyInput, setStickyInput] = useState(false);
  const [stickyText, setStickyText] = useState('');
  const [stickySaving, setStickySaving] = useState(false);
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      Promise.resolve().then(() => {
        setSelectedProjectId(projectId);
        setSelectedProjectName(projectName || '');
      });
    }
  }, [projectId, projectName]);

  useEffect(() => {
    if (selectedProjectId) {
      let cancelled = false;
      Promise.resolve().then(() => { if (!cancelled) setLoading(true); });
      getMessages(token, selectedProjectId).then(data => {
        if (!cancelled) setMessages(data.messages || []);
      }).catch(err => {
        if (!cancelled) toast(err.message, 'error');
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => { cancelled = true; };
    } else if (isOpen) {
      getMyTeams(token).then(data => {
        setTeams(data.teams || []);
      }).catch(() => {});
    }
  }, [selectedProjectId, isOpen, token]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !token || !selectedProjectId) return;
    setSending(true);
    try {
      const data = await sendMessageApi(token, selectedProjectId, inputValue.trim());
      setMessages((prev) => [...prev, data.message]);
      setInputValue('');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectTeam = (e) => {
    const pid = e.target.value;
    if (!pid) return;
    const team = teams.find((t) => t._id === pid);
    setSelectedProjectId(pid);
    setSelectedProjectName(team?.title || '');
    startChat?.(pid, team?.title);
  };

  const handleCreateSticky = async () => {
    if (!stickyText.trim() || !token || !selectedProjectId) return;
    setStickySaving(true);
    try {
      const colors = ['yellow', 'blue', 'pink', 'green'];
      await createCanvasElement(token, selectedProjectId, {
        type: 'sticky',
        color: colors[Math.floor(Math.random() * colors.length)],
        title: stickyText.trim(),
        content: '',
        top: 100 + Math.random() * 300,
        left: 100 + Math.random() * 500,
        rotation: (Math.random() - 0.5) * 6,
      });
      toast('Sticky note created!');
      setStickyText('');
      setStickyInput(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setStickySaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
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
          {selectedProjectId ? (
            <span className="truncate max-w-[140px]">{selectedProjectName || 'Chat'}</span>
          ) : (
            <span>Team Chat</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && selectedProjectId && (
            <button
              className="tool-btn"
              onClick={() => { setStickyInput(!stickyInput); setStickyText(''); }}
              title="Add sticky note to canvas"
            >
              <StickyNote size={16} />
            </button>
          )}
          <button className="tool-btn" onClick={handleClose}><X size={18} /></button>
        </div>
      </div>

      {stickyInput && isAdmin && selectedProjectId && (
        <div className="chat-sticky-input" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={stickyText}
              onChange={(e) => setStickyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSticky(); }}
              placeholder="Feature name for sticky note..."
              style={{
                flex: 1,
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 13,
                color: 'var(--text-main)',
                outline: 'none',
              }}
              autoFocus
            />
            <button
              onClick={handleCreateSticky}
              disabled={stickySaving || !stickyText.trim()}
              className="tool-btn"
              style={{ color: 'var(--accent-color)' }}
            >
              {stickySaving ? <Loader2 size={14} className="feed-spinner" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}

      {!selectedProjectId && teams.length > 0 && (
        <div className="chat-team-selector">
          <select
            value=""
            onChange={handleSelectTeam}
            className="chat-team-select"
          >
            <option value="">Select a team to chat...</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="chat-area" ref={chatAreaRef}>
        {loading ? (
          <div className="chat-loading">
            <Loader2 size={20} className="feed-spinner" />
          </div>
        ) : !selectedProjectId ? (
          <div className="chat-empty">
            <MessageSquare size={24} className="text-muted" />
            <p className="chat-empty-text">Select a team to start chatting</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <MessageSquare size={24} className="text-muted" />
            <p className="chat-empty-text">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender?._id === user?._id || msg.sender === user?._id;
            return (
              <div key={msg._id} className={`chat-message ${isSelf ? 'self' : ''}`}>
                {!isSelf && (
                  <div className="msg-avatar">
                    <span>{(msg.sender?.username || 'U')[0].toUpperCase()}</span>
                  </div>
                )}
                <div className="msg-content">
                  <div className="msg-header">
                    {!isSelf && <span className="msg-name">{msg.sender?.username || 'Unknown'}</span>}
                    <span className="msg-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="msg-bubble">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedProjectId && (
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button className="send-btn" onClick={handleSendMessage} disabled={sending || !inputValue.trim()}>
              {sending ? <Loader2 size={14} className="feed-spinner" /> : <Send size={14} style={{ marginLeft: '-2px' }} />}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
