import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatProjectId, setChatProjectId] = useState(null);
  const [chatProjectName, setChatProjectName] = useState('');

  const startChat = (projectId, projectName) => {
    setChatProjectId(projectId);
    setChatProjectName(projectName || '');
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatProjectId(null);
    setChatProjectName('');
    setChatOpen(false);
  };

  return (
    <ChatContext.Provider value={{ chatOpen, chatProjectId, chatProjectName, setChatOpen, startChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
