import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, disabled }) => (
  <form
    className="chat-input flex gap-2 mt-4 items-center bg-white/70 p-2 rounded-full border border-[#E5EBD5] shadow-inner"
    onSubmit={e => {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }}
  >
    <input
      type="text"
      className="flex-grow bg-transparent outline-none px-3 font-body text-sm text-[#527055] placeholder:text-[#527055]/40"
      placeholder="Ask a question..."
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete="off"
    />
    <button
      type="submit"
      className="bg-dark-green-start text-white rounded-full px-4 py-2 font-body transition disabled:opacity-50 disabled:hover:brightness-100 hover:bg-orange-cream hover:text-white"
      disabled={disabled || !value.trim()}
    >
      Send
    </button>
  </form>
);

export default ChatInput; 