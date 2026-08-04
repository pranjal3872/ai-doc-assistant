"use client";

import React, { useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput = React.memo(function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder="Ask a question about this document..."
        disabled={disabled}
        aria-label="Ask a question about this document"
        className="w-full bg-surface-container border border-outline-variant rounded-lg p-3 text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none min-h-[80px] max-h-[160px] resize-none placeholder-on-surface-variant/40 transition-colors disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Send message"
        className="bg-primary text-on-primary p-3 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 self-end flex items-center justify-center cursor-pointer shadow-md"
      >
        <span className="material-symbols-outlined">send</span>
      </button>
    </form>
  );
});
