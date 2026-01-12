
import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { useChat } from '../hooks/useChat';
import { supabase } from '../lib/supabase';
import ProGuard from './ProGuard';

interface ChatPanelProps {
  state: AppState;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  onUnreadMessage?: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ state, onClose, setActiveTab, onUnreadMessage }) => {
  const [session, setSession] = useState<any>(null);

  // Filtra cargos salvos pelo usuário para preencher o dropdown
  const myCargos = state.cargos.filter(c => state.myCargosIds.includes(c.id));

  // Seleciona automaticamente o primeiro cargo salvo, ou nulo se não tiver
  const [selectedCargoId, setSelectedCargoId] = useState<string | null>(
    myCargos.length > 0 ? myCargos[0].id : null
  );

  const { messages, sendMessage } = useChat(session, selectedCargoId, onUnreadMessage);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  // Remove auto-selection logic (previously here)

  // Scroll sempre embaixo quando mensagens mudam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !session?.user || !selectedCargoId) return;

    sendMessage(inputValue, state.userProfile.name, state.userProfile.profilePicture);
    setInputValue('');
  };

  return (
    <div className="fixed inset-x-4 bottom-24 z-[60] flex flex-col bg-white sm:inset-auto sm:bottom-24 sm:right-6 h-[85vh] max-h-[85vh] sm:h-[580px] w-auto sm:w-[370px] rounded-[32px] border border-slate-200 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">

      <ProGuard state={state} title="Chat da Comunidade" onClose={onClose}>
        {/* Header - Com Seletor de Sala */}
        <div className="flex items-center justify-between bg-white px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {selectedCargoId ? (
              <button
                onClick={() => setSelectedCargoId(null)}
                className="mr-1 -ml-2 p-1 rounded-full text-slate-400 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            ) : (
              <span className="material-symbols-outlined text-primary text-xl">forum</span>
            )}

            <div className="flex flex-col">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
                {selectedCargoId
                  ? myCargos.find(c => c.id === selectedCargoId)?.nome
                  : 'Comunidade'}
              </h3>
              {selectedCargoId && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sala de Bate-Papo</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-slate-600 active:scale-90 transition-transform">close</button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden bg-[#F8FAFC]">

          {!selectedCargoId ? (
            /* LISTA DE SALAS (CARGOS) */
            <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
              {myCargos.length > 0 ? (
                <>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Suas Salas</p>
                  {myCargos.map(cargo => (
                    <button
                      key={cargo.id}
                      onClick={() => setSelectedCargoId(cargo.id)}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/50 hover:shadow-md transition-all text-left group flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-700 text-sm group-hover:text-primary transition-colors">{cargo.nome}</span>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-70">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-slate-400">lock_person</span>
                  </div>
                  <p className="text-xs font-black text-slate-500 uppercase mb-2">Sem acesso a salas</p>
                  <p className="text-[11px] font-medium text-slate-400">Adicione cargos aos seus favoritos para desbloquear as salas de bate-papo exclusivas.</p>
                  <button
                    onClick={() => { onClose(); setActiveTab('concursos'); }}
                    className="mt-6 px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    Ver Concursos
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* CHAT ROOM VIEW */
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 hide-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma mensagem ainda</p>
                    <p className="text-[9px] font-medium text-slate-300">Seja o primeiro a falar!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                      <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        {!msg.isMe && (
                          <div className="mb-1 ml-1 flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{msg.senderName}</span>
                          </div>
                        )}
                        <div className={`rounded-[20px] px-4 py-3 text-xs font-medium leading-relaxed shadow-sm ${msg.isMe
                          ? 'bg-primary text-white rounded-tr-none shadow-primary/20'
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                          }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-slate-100 p-4 shrink-0 animate-in slide-in-from-bottom-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <input
                      type="text"
                      placeholder="Envie uma mensagem..."
                      className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 active:scale-90 disabled:opacity-30 transition-all"
                    disabled={!inputValue.trim()}
                  >
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </ProGuard>
    </div>
  );
};

export default ChatPanel;
