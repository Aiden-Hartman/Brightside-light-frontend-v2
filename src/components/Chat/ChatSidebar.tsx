import React from 'react';

interface ChatSidebarProps {
  children: React.ReactNode;
  className?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ children, className = '' }) => (
  <aside className={`w-96 h-[60vh] flex flex-col z-20 ${className}`}>
    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-[#678969] shadow-xl p-4 flex flex-col justify-between h-[90vh]">
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5EBD5] bg-gradient-to-r from-dark-green-start to-dark-green-end rounded-t-2xl px-4 py-3">
        <h2 className="text-lg font-display text-white" style={{letterSpacing: '0.01em'}}>Chat with the Brightside AI</h2>
      </div>
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  </aside>
);

export default ChatSidebar; 