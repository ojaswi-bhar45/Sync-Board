import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMessages, sendMessage as sendMessageApi, getMyTeams } from '../api';
import { toast } from './Toast';

export default function ChatPanel({ projectId, projectName, isOpen: externalOpen, setIsOpen: externalSetOpen, onClose }) {
  const { token, user } = useAuth();
  const [internalOpen, internalSetOpen] = useState(true);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalSetOpen !== undefined ? externalSetOpen : internalOpen;
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || null);
  const [selectedProjectName, setSelectedProjectName] = useState(projectName || '');
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);

  const fetchMessages = useCallback(async (pid) => {
    if (!token || !pid) return;
    setLoading(true);
    try {
      const data = await getMessages(token, pid);
      setMessages(data.messages || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTeams = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getMyTeams(token);
      setTeams(data.teams || []);
    } catch {
    }
  }, [token]);

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
      setSelectedProjectName(projectName || '');
    }
  }, [projectId, projectName]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchMessages(selectedProjectId);
    } else if (isOpen) {
      fetchTeams();
    }
  }, [selectedProjectId, isOpen, fetchMessages, fetchTeams]);

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
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
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
        <button className="tool-btn" onClick={handleClose}><X size={18} /></button>
      </div>

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
