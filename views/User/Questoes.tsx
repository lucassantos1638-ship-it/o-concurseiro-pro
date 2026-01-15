import React, { useState } from 'react';
import { AppState, Materia } from '../../types';

interface UserQuestoesProps {
    state: AppState;
    onStart: (materiaId: string, filters: { banca?: string, ano?: string, nivel?: string }) => void;
}

const UserQuestoes: React.FC<UserQuestoesProps> = ({ state, onStart }) => {
    // Stage 1: Level Selection (Global)
    const [globalSelectedNivel, setGlobalSelectedNivel] = useState<string | null>(null);

    // Stage 2: Subject Selection
    const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

    // Filters (Inside Subject)
    const [selectedBanca, setSelectedBanca] = useState<string>('');
    const [selectedAno, setSelectedAno] = useState<string>('');
    const [selectedNivel, setSelectedNivel] = useState<string>(''); // Still useful if subject supports multiple, but mainly pre-filled now

    // Extract unique options
    const getFilterOptions = (materiaId: string) => {
        const questoesDaMateria = state.questoes.filter(q => q.materiaId === materiaId);

        const bancas = Array.from(new Set(questoesDaMateria.map(q => q.banca).filter(Boolean))).sort();
        const anos = Array.from(new Set(questoesDaMateria.map(q => q.ano).filter(Boolean)))
            .sort((a, b) => String(b).localeCompare(String(a)));
        const niveis = Array.from(new Set(questoesDaMateria.map(q => q.nivel).filter(Boolean))).sort();

        return { bancas, anos, niveis, count: questoesDaMateria.length };
    };

    const handleMateriaClick = (materia: Materia) => {
        setSelectedMateria(materia);
        // Reset filters
        setSelectedBanca('');
        setSelectedAno('');
        // Pre-fill level if global level is selected
        setSelectedNivel(globalSelectedNivel || '');
    };

    const handleStart = () => {
        if (!selectedMateria) return;

        const filters = {
            banca: selectedBanca || undefined,
            ano: selectedAno || undefined,
            nivel: selectedNivel || undefined
        };

        onStart(selectedMateria.id, filters);
    };

    // Search filter
    const [searchTerm, setSearchTerm] = useState('');

    // Filter subjects by Search Term AND Global Level
    const filteredMaterias = state.materias.filter(materia => {
        const matchesSearch = materia.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = globalSelectedNivel ? materia.nivelCompativel === globalSelectedNivel : true;

        // Also check if there are questions for this level in this subject (optional validation)
        // const hasQuestions = state.questoes.some(q => q.materiaId === materia.id && (!globalSelectedNivel || q.nivel === globalSelectedNivel));

        return matchesSearch && matchesLevel;
    });

    // --- RENDER: LEVEL SELECTION (Step 1) ---
    if (!globalSelectedNivel) {
        const niveisAvailable = ['Fundamental', 'Médio', 'Superior']; // Hardcoded or derived from types

        return (
            <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Banco de Questões</h2>
                    <p className="text-slate-500 font-medium">Selecione o seu nível de escolaridade para começar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                    {niveisAvailable.map(nivel => (
                        <button
                            key={nivel}
                            onClick={() => setGlobalSelectedNivel(nivel)}
                            className="bg-white p-8 rounded-[32px] border border-slate-200 hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all group text-left relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 ${nivel === 'Superior' ? 'bg-purple-100 text-purple-600' :
                                    nivel === 'Médio' ? 'bg-blue-100 text-blue-600' :
                                        'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    Escolaridade
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-primary transition-colors">{nivel}</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">
                                    {state.materias.filter(m => m.nivelCompativel === nivel).length} Matérias disponíveis
                                </p>
                            </div>
                            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-slate-50 group-hover:text-primary/5 transition-colors rotate-12">
                                {nivel === 'Superior' ? 'school' : nivel === 'Médio' ? 'menu_book' : 'edit_note'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // --- RENDER: CONFIGURATION (Step 3 - Selected Subject) ---
    if (selectedMateria) {
        const options = getFilterOptions(selectedMateria.id);

        return (
            <div className="h-auto min-h-full flex flex-col p-4 md:p-10 animate-in fade-in slide-in-from-right-4 duration-300 pb-32 overflow-y-auto">
                <button
                    onClick={() => setSelectedMateria(null)}
                    className="self-start flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold mb-6 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Voltar para Matérias ({globalSelectedNivel})</span>
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

                            {/* Nível - Disabled or Pre-selected based on Global */}
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

    // --- RENDER: SUBJECT SELECTION (Step 2) ---
    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            <button
                onClick={() => setGlobalSelectedNivel(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold mb-2 transition-colors"
            >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Escolher outro Nível</span>
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Matérias: {globalSelectedNivel}</h2>
                    <p className="text-slate-500 font-medium">Selecione uma matéria para praticar.</p>
                </div>

                <div className="w-full md:w-72 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar matéria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:font-medium placeholder:text-slate-400"
                    />
                </div>
            </div>

            {filteredMaterias.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMaterias.map(materia => {
                        const questaoCount = state.questoes.filter(q => q.materiaId === materia.id).length;
                        return (
                            <button
                                key={materia.id}
                                onClick={() => handleMateriaClick(materia)}
                                className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all text-left flex items-center gap-4"
                            >
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-xl transition-colors">
                                        menu_book
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-3 md:line-clamp-none">{materia.nome}</h3>
                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 block uppercase tracking-wide">{questaoCount} questões</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-slate-400 text-3xl">search_off</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhuma matéria encontrada</h3>
                    <p className="text-slate-500 text-sm">Não encontramos matérias para o nível {globalSelectedNivel} com este termo.</p>
                </div>
            )}
        </div>
    );
};

export default UserQuestoes;
