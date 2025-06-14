import React from 'react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: string;
  role: 'user' | 'assistant';
}

// Utility to replace **text** with <strong>text</strong>
function renderBold(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, role }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }}
    className={`
      max-w-[80%] font-body p-3 rounded-2xl border border-[#E5EBD5] shadow-sm whitespace-pre-line
      ${role === 'user' ? 'bg-white text-[#527055] self-end ml-auto' : 'bg-white text-[#527055] self-start mr-auto'}
    `}
  >
    <span dangerouslySetInnerHTML={{ __html: renderBold(message) }} />
  </motion.div>
);

export default MessageBubble; 