
import React, { useState } from 'react';
import { AppState, Nivel } from '../../types';
import { supabase } from '../../lib/supabase';

interface AdminMateriasProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
    onRefresh: () => void;
}

const AdminMaterias: React.FC<AdminMateriasProps> = ({ state, updateState, onRefresh }) => {
    const [selectedNivel, setSelectedNivel] = useState<Nivel | null>(null);
    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(false);

    const filtered = state.materias.filter(m => m.nivelCompativel === selectedNivel);

    const handleAdd = async () => {
        if (!nome || !selectedNivel) return;
        setLoading(true);
        try {
            await supabase.from('materias').insert({
                nome: nome,
                nivel_compativel: selectedNivel
            });
            onRefresh();
            setNome('');
        } catch (error) {
            console.error('Error adding materia:', error);
            alert('Erro ao adicionar matéria');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {

        setLoading(true);
        try {
            await supabase.from('materias').delete().eq('id', id);
            onRefresh();
        } catch (error) {
            console.error('Error deleting materia:', error);
            alert('Erro ao excluir matéria');
        } finally {
            setLoading(false);
        }
    };

    if (!selectedNivel) return (
        <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.values(Nivel).map(n => (
                <button key={n} onClick={() => setSelectedNivel(n)} className="bg-white p-12 rounded-[40px] border border-slate-200 hover:border-primary transition-all flex flex-col items-center group shadow-sm">
                    <span className="material-symbols-outlined text-5xl mb-4 text-primary group-hover:scale-110 transition-transform">school</span>
                    <h4 className="font-black text-slate-900 uppercase tracking-widest">{n}</h4>
                </button>
            ))}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button onClick={() => setSelectedNivel(null)} className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest"><span className="material-symbols-outlined text-sm">arrow_back</span> VOLTAR</button>
            <div className="flex gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm relative">
                {loading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-3xl"><div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div></div>}
                <input className="flex-1 p-3 rounded-xl bg-slate-50 text-slate-900 text-sm focus:outline-none" placeholder="Nova Matéria..." value={nome} onChange={e => setNome(e.target.value)} disabled={loading} />
                <button onClick={handleAdd} className="bg-primary text-white px-8 rounded-xl font-bold text-xs uppercase tracking-widest" disabled={loading}>Adicionar</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filtered.map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
                        <span className="font-bold text-slate-900 text-sm">{m.nome}</span>
                        <button onClick={() => handleDelete(m.id)} className="text-red-300 hover:text-red-500"><span className="material-symbols-outlined text-base">delete</span></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminMaterias;
