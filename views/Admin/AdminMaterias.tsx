
import React, { useState } from 'react';
import { AppState, Nivel } from '../../types';

interface AdminMateriasProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
}

const AdminMaterias: React.FC<AdminMateriasProps> = ({ state, updateState }) => {
    const [selectedNivel, setSelectedNivel] = useState<Nivel | null>(null);
    const [nome, setNome] = useState('');
    const filtered = state.materias.filter(m => m.nivelCompativel === selectedNivel);

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
            <div className="flex gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <input className="flex-1 p-3 rounded-xl bg-slate-50 text-slate-900 text-sm focus:outline-none" placeholder="Nova Matéria..." value={nome} onChange={e => setNome(e.target.value)} />
                <button onClick={() => {
                    if (!nome) return;
                    updateState({ materias: [...state.materias, { id: Math.random().toString(36).substr(2, 9), nome, nivelCompativel: selectedNivel }] });
                    setNome('');
                }} className="bg-primary text-white px-8 rounded-xl font-bold text-xs uppercase tracking-widest">Adicionar</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filtered.map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
                        <span className="font-bold text-slate-900 text-sm">{m.nome}</span>
                        <button onClick={() => updateState({ materias: state.materias.filter(it => it.id !== m.id) })} className="text-red-300 hover:text-red-500"><span className="material-symbols-outlined text-base">delete</span></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminMaterias;
