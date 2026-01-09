import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminWebhooks: React.FC = () => {
    const [email, setEmail] = useState('');
    const [event, setEvent] = useState('assinatura renovada');
    const [product, setProduct] = useState('Concurseiro Pro');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Load Logs
    useEffect(() => {
        fetchLogs();
    }, [refreshTrigger]);

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('webhook_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        if (data) setLogs(data);
    };

    const handleSimulate = async () => {
        if (!email) return alert('Digite um email!');
        setLoading(true);

        try {
            const payload = {
                email,
                evento: event,
                produto: product,
                token: 'sy1usrcynbl' // Token de segurança correto
            };

            // Chama a Edge Function real
            const { data, error } = await supabase.functions.invoke('kiwify-webhook', {
                body: payload
            });

            if (error) {
                throw error;
            }

            alert(`Simulação enviada!\nResposta: ${JSON.stringify(data)}`);
            setRefreshTrigger(p => p + 1); // Atualiza logs
        } catch (err: any) {
            console.error(err);
            alert(`Erro ao simular: ${err.message || 'Falha na requisição'}.\n\nCertifique-se de que a função 'kiwify-webhook' foi deployada usando 'supabase functions deploy kiwify-webhook'.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl">webhook</span>
                    Integração Kiwify
                </h2>
                <p className="text-slate-500 font-medium mt-1">
                    Gerencie a integração de pagamentos e simule eventos de webhook.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Simulator Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 lg:col-span-1 h-fit">
                    <div className="flex items-center gap-2 mb-6 text-slate-800">
                        <span className="material-symbols-outlined text-blue-500">science</span>
                        <h3 className="font-bold uppercase tracking-wide text-sm">Simulador de Eventos</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email do Cliente</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="ex: cliente@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Evento</label>
                            <select
                                value={event}
                                onChange={e => setEvent(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                            >
                                <option value="assinatura renovada">Assinatura Renovada (Aprova PRO)</option>
                                <option value="assinatura aprovada">Assinatura Aprovada (Aprova PRO)</option>
                                <option value="assinatura cancelada">Assinatura Cancelada (Remove PRO)</option>
                                <option value="assinatura atrasada">Assinatura Atrasada (Remove PRO)</option>
                                <option value="reembolsado">Reembolsado (Remove PRO)</option>
                            </select>
                        </div>

                        <div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Produto</label>
                                <select
                                    value={product}
                                    onChange={e => setProduct(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                >
                                    <option value="Concurseiro Pro">Concurseiro Pro</option>
                                    <option value="Starter">Starter</option>
                                    <option value="Pro">Pro</option>
                                    <option value="Master">Master</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSimulate}
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined text-xl">play_circle</span>
                            )}
                            {loading ? 'Processando...' : 'Simular Webhook'}
                        </button>
                    </div>
                </div>

                {/* Logs Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-slate-800">
                            <span className="material-symbols-outlined text-green-500">history</span>
                            <h3 className="font-bold uppercase tracking-wide text-sm">Últimos Eventos Processados</h3>
                        </div>
                        <button onClick={() => fetchLogs()} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-primary">
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Data/Hora</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Evento</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Plano Aplicado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 font-medium">Nenhum log encontrado.</td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 text-xs font-medium text-slate-500">
                                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold text-slate-700">{log.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.evento.includes('renovada') || log.evento.includes('aprovada')
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {log.evento}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.plano_aplicado === 'pro'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {log.plano_aplicado || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Endpoint Info */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div>
                    <h4 className="font-bold text-amber-400 uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">link</span>
                        Endpoint do Webhook
                    </h4>
                    <p className="text-slate-300 text-sm mb-1">Copie a URL abaixo e configure na Kiwify.</p>
                    <code className="bg-black/30 px-3 py-1.5 rounded text-xs font-mono text-emerald-400 break-all select-all">
                        {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kiwify-webhook`}
                    </code>
                </div>
                <div className="shrink-0 flex gap-3">
                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs text-slate-400">
                        Token: <span className="font-mono text-white ml-2">sy1usrcynbl</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminWebhooks;
