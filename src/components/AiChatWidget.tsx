import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api.ts';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Minimize2,
  HelpCircle,
  Loader2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  'Jadwal Pembukaan & Penutupan',
  'Lokasi 3 Posko Kontingen',
  'Penjelasan Angka 171 & 76',
  'Jumlah Atlet & Personel',
  '12 Daerah Tuan Rumah',
];

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Sampurasun! Saya adalah Asisten AI KONI Kota Bandung untuk PORPROV XV Jabar 2026. Ada yang bisa saya bantu terkait jadwal, posko, regulasi cabor, medali, atau kontingen Bandung?',
      timestamp: 'Baru saja',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await api.askAi(textToSend);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.answer || 'Mohon maaf, saat ini asisten tidak dapat memberikan jawaban.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Maaf, terjadi kendala saat menghubungkan ke asisten. Silakan periksa jaringan dan coba lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          id="chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-200 ring-4 ring-emerald-500/20 group cursor-pointer"
          title="Tanya Asisten AI KONI Kota Bandung"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full ring-2 ring-emerald-600" />
          </div>
          <span className="text-xs font-bold tracking-wide pr-1">Asisten AI KONI</span>
        </button>
      )}

      {/* Floating Chat Container */}
      {isOpen && (
        <div
          id="chat-widget-container"
          className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold flex items-center gap-1.5">
                  Asisten AI KONI Kota Bandung
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                </h4>
                <p className="text-[10px] text-emerald-200">PORPROV XV Jabar 2026 • Juara Umum</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer"
                title="Tutup Obrolan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prompt Suggestion Pills */}
          <div className="bg-slate-50 border-b border-slate-100 p-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold px-1 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Topik:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="text-[10px] font-medium px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 shrink-0 whitespace-nowrap transition cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 items-start ${isAi ? '' : 'justify-end'}`}
                >
                  {isAi && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
                      AI
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl max-w-[82%] text-xs leading-relaxed shadow-xs ${
                      isAi
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        : 'bg-emerald-600 text-white rounded-tr-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 ${
                        isAi ? 'text-slate-400' : 'text-emerald-200'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                  {!isAi && (
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs animate-pulse">
                  AI
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-slate-500 shadow-xs flex items-center gap-2 rounded-tl-xs text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Sedang memproses jawaban...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Tanyakan jadwal, atlet, posko, target..."
              disabled={loading}
              className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition cursor-pointer"
              title="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
