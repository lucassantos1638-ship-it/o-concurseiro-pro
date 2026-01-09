import React, { useState } from 'react';
import { AppState, Materia } from '../../types';

interface UserQuestoesProps {
    state: AppState;
    onStart: (materiaId: string, filters: { banca?: string, ano?: string, nivel?: string }) => void;
}

const UserQuestoes: React.FC<UserQuestoesProps> = ({ state, onStart }) => {
    const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

    // Filtros
    const [selectedBanca, setSelectedBanca] = useState<string>('');
    const [selectedAno, setSelectedAno] = useState<string>('');
    const [selectedNivel, setSelectedNivel] = useState<string>('');

    // Extrair opções unicas para os filtros baseados nas questões da matéria selecionada
    const getFilterOptions = (materiaId: string) => {
        const questoesDaMateria = state.questoes.filter(q => q.materiaId === materiaId);

        // Set para remover duplicatas e filter(Boolean) para remover null/undefined
        const bancas = Array.from(new Set(questoesDaMateria.map(q => q.banca).filter(Boolean))).sort();
        const anos = Array.from(new Set(questoesDaMateria.map(q => q.ano).filter(Boolean)))
            .sort((a, b) => String(b).localeCompare(String(a))); // Decrescente
        const niveis = Array.from(new Set(questoesDaMateria.map(q => q.nivel).filter(Boolean))).sort();

        return { bancas, anos, niveis, count: questoesDaMateria.length };
    };

    const handleMateriaClick = (materia: Materia) => {
        setSelectedMateria(materia);
        // Reset filters
        setSelectedBanca('');
        setSelectedAno('');
        setSelectedNivel('');
    };

    const handleStart = () => {
        if (!selectedMateria) return;

        // Converte vazio para undefined
        const filters = {
            banca: selectedBanca || undefined,
            ano: selectedAno || undefined,
            nivel: selectedNivel || undefined
        };

        onStart(selectedMateria.id, filters);
    };

    // Se uma matéria estiver selecionada, mostra o modal/tela de configuração
    if (selectedMateria) {
        const options = getFilterOptions(selectedMateria.id);

        return (
            <div className="h-full flex flex-col p-6 md:p-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                    onClick={() => setSelectedMateria(null)}
                    className="self-start flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold mb-6 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Voltar para Matérias</span>
                </button>

                <div className="max-w-2xl w-full mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 p-8">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">tune</span>
                            Configurar Simulado
                        </h2>
                        <p className="text-slate-500 font-medium mt-2">
                            Filtrar questões de <span className="text-slate-900 font-bold">{selectedMateria.nome}</span>
                        </p>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Banca */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Banca</label>
                                <select
                                    value={selectedBanca}
                                    onChange={e => setSelectedBanca(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                >
                                    <option value="">Todas as Bancas</option>
                                    {options.bancas.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            {/* Ano */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ano</label>
                                <select
                                    value={selectedAno}
                                    onChange={e => setSelectedAno(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                >
                                    <option value="">Todos os Anos</option>
                                    {options.anos.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            {/* Nível */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nível</label>
                                <select
                                    value={selectedNivel}
                                    onChange={e => setSelectedNivel(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                >
                                    <option value="">Todos os Níveis</option>
                                    {options.niveis.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>

                            {/* Info Card */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-center flex-col text-center">
                                <span className="text-2xl font-black text-blue-600">{options.count}</span>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Questões Totais</span>
                            </div>
                        </div>

                        <button
                            onClick={handleStart}
                            className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-4 font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">play_arrow</span>
                            Iniciar Simulado
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Lista de Matérias
    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Banco de Questões</h2>
                <p className="text-slate-500 font-medium">Selecione uma matéria para praticar questões aleatoriamente.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {state.materias.map(materia => {
                    const questaoCount = state.questoes.filter(q => q.materiaId === materia.id).length;
                    return (
                        <button
                            key={materia.id}
                            onClick={() => handleMateriaClick(materia)}
                            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all text-left flex flex-col gap-4"
                        >
                            <div className="h-12 w-12 rounded-xl bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-2xl transition-colors">
                                    menu_book
                                </span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-primary transition-colors">{materia.nome}</h3>
                                <span className="text-xs font-medium text-slate-400 mt-1 block">{questaoCount} questões disponíveis</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default UserQuestoes;
