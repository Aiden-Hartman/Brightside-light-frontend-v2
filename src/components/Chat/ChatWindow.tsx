import React from 'react';

interface ChatWindowProps {
  children: React.ReactNode;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ children }) => (
  <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4">{children}</div>
);

export default ChatWindow; 