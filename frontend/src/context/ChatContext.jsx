import React, { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [activeChatConfig, setActiveChatConfig] = useState(null);
  // activeChatConfig = { otherUserId, otherUserName, otherUserRole, otherUserAvatar, conversationId? }

  const openChat = useCallback((config) => {
    setActiveChatConfig(config);
  }, []);

  const closeChat = useCallback(() => {
    setActiveChatConfig(null);
  }, []);

  return (
    <ChatContext.Provider value={{ activeChatConfig, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
};
