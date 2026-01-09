import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { Session } from '@supabase/supabase-js';

export function useChat(session: Session | null, cargoId: string | null, onMessageReceived?: () => void) {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (!cargoId) {
            setMessages([]);
            return;
        }

        // Carregar mensagens iniciais (Histórico persistente da sessão)
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('cargo_id', cargoId)
                .order('timestamp', { ascending: true })
                .limit(50); // Carrega as últimas 50 mensagens

            if (data) {
                setMessages(data.map(m => ({
                    id: m.id,
                    text: m.text,
                    senderName: m.sender_name,
                    timestamp: new Date(m.timestamp),
                    isMe: session?.user?.id === m.user_id,
                    avatar: m.avatar
                })));
            }
        };

        fetchMessages();

        // Inscrever para novas mensagens
        const channel = supabase
            .channel(`chat_room:${cargoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `cargo_id=eq.${cargoId}`
            }, (payload) => {
                const newMessage = payload.new;

                // Adiciona mensagem
                setMessages(prev => [...prev, {
                    id: newMessage.id,
                    text: newMessage.text,
                    senderName: newMessage.sender_name,
                    timestamp: new Date(newMessage.timestamp),
                    isMe: session?.user?.id === newMessage.user_id,
                    avatar: newMessage.avatar
                }]);

                // Notifica que chegou mensagem nova (para badge)
                // Só notifica se a mensagem NÃO for minha (filtro opcional, mas badges geralmente são para msgs dos outros)
                if (session?.user?.id !== newMessage.user_id && onMessageReceived) {
                    onMessageReceived();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id, cargoId]); // onMessageReceived não precisa estar na dependência se for estável, mas cuidado

    const sendMessage = async (text: string, senderName: string, avatar?: string) => {
        if (!session?.user || !text.trim() || !cargoId) return;

        await supabase.from('messages').insert({
            user_id: session.user.id,
            text,
            sender_name: senderName,
            avatar,
            cargo_id: cargoId
        });
    };

    return { messages, sendMessage };
}
