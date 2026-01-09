
import React, { useState } from 'react';
import { AppState, Questao, Nivel } from '../../types';

interface AdminQuestoesProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
}

const AdminQuestoes: React.FC<AdminQuestoesProps> = ({ state, updateState }) => {
    const [selectedNivel, setSelectedNivel] = useState<Nivel | null>(null);
    const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [testAnswer, setTestAnswer] = useState<string | null>(null);
    const [previewQuestion, setPreviewQuestion] = useState<Questao | null>(null);

    const generateCode = () => `Q${Math.floor(1000000 + Math.random() * 9000000)}`;

    const [formData, setFormData] = useState<Omit<Questao, 'id' | 'materiaId' | 'nivel'>>({
        codigo: generateCode(),
        enunciado: '',
        textoAssociado: '',
        imagem: '',
        alternativas: ['', '', '', ''],
        gabarito: 'A',
        banca: '',
        ano: new Date().getFullYear().toString(),
        prova: ''
    });

    const filteredMaterias = state.materias.filter(m => m.nivelCompativel === selectedNivel);
    const questionsOfMateria = state.questoes.filter(q => q.materiaId === selectedMateriaId && q.nivel === selectedNivel);

    const handleToggleAlt = (action: 'add' | 'remove') => {
        setFormData(prev => {
            const newAlts = [...prev.alternativas];
            if (action === 'add' && newAlts.length < 5) newAlts.push('');
            if (action === 'remove' && newAlts.length > 2) newAlts.pop();
            return { ...prev, alternativas: newAlts };
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMateriaId || !selectedNivel) return;
        const newQ: Questao = { id: Math.random().toString(36).substr(2, 9), ...formData, materiaId: selectedMateriaId, nivel: selectedNivel };
        updateState({ questoes: [...state.questoes, newQ] });
        setShowForm(false);
        setFormData({ codigo: generateCode(), enunciado: '', textoAssociado: '', imagem: '', alternativas: Array(formData.alternativas.length).fill(''), gabarito: 'A', banca: '', ano: new Date().getFullYear().toString(), prova: '' });
    };

    const openPreview = (q?: Questao) => {
        const qData = q || { id: 'temp', ...formData, materiaId: selectedMateriaId!, nivel: selectedNivel! };
        setPreviewQuestion(qData);
        setTestAnswer(null);
        setShowTestModal(true);
    };

    if (!selectedNivel) return (
        <div className="max-w-5xl mx-auto text-center space-y-8">
            <h3 className="text-2xl font-black text-slate-900 uppercase">Gestão de Questões</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.values(Nivel).map(n => (
                    <button key={n} onClick={() => setSelectedNivel(n)} className="bg-white p-12 rounded-[40px] border border-slate-200 hover:border-primary flex flex-col items-center group shadow-sm transition-all">
                        <span className="material-symbols-outlined text-5xl mb-4 text-primary">fact_check</span>
                        <h4 className="font-black text-slate-900 uppercase tracking-widest">{n}</h4>
                    </button>
                ))}
            </div>
        </div>
    );

    if (!selectedMateriaId) return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <button onClick={() => setSelectedNivel(null)} className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest"><span className="material-symbols-outlined text-sm">arrow_back</span> Voltar</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {filteredMaterias.map(m => (
                    <button key={m.id} onClick={() => setSelectedMateriaId(m.id)} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-primary text-left shadow-sm group">
                        <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{m.nome}</h4>
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{state.questoes.filter(q => q.materiaId === m.id).length} itens</span>
                            <span className="material-symbols-outlined text-primary">chevron_right</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            {showTestModal && previewQuestion && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white w-full max-w-6xl rounded-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 max-h-[95vh]">
                        {/* Modelo Profissional de Questão - Cabeçalho responsivo */}
                        <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-8 h-8 shrink-0 bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 rounded">1</div>
                                    <span className="text-slate-400 font-bold text-xs sm:text-sm tracking-tight truncate">{previewQuestion.codigo}</span>
                                    <span className="text-slate-600 font-bold text-xs sm:text-sm tracking-tight truncate">{state.materias.find(m => m.id === previewQuestion.materiaId)?.nome}</span>
                                </div>
                                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center gap-1 border border-blue-100/50 w-fit">
                                    <span className="material-symbols-outlined text-sm">check</span> Resolvida
                                </div>
                            </div>

                            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex flex-wrap gap-x-4 gap-y-2 border-t pt-4">
                                <span className="whitespace-nowrap"><strong>Ano:</strong> <span className="text-slate-600">{previewQuestion.ano}</span></span>
                                <span className="whitespace-nowrap"><strong>Banca:</strong> <span className="text-slate-600">{previewQuestion.banca}</span></span>
                                <span className="whitespace-nowrap"><strong>Prova:</strong> <span className="text-slate-600">{previewQuestion.prova}</span></span>
                            </div>
                        </div>

                        <div className="p-5 sm:p-10 flex-1 overflow-y-auto space-y-6 sm:space-y-8 bg-white hide-scrollbar">
                            <button className="text-slate-400 text-[10px] sm:text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors uppercase tracking-widest">
                                Texto associado <span className="material-symbols-outlined text-sm">add_circle</span>
                            </button>

                            {previewQuestion.textoAssociado && (
                                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium mb-6 italic whitespace-pre-wrap">
                                    {previewQuestion.textoAssociado}
                                </div>
                            )}

                            {previewQuestion.imagem && (
                                <div className="flex justify-center mb-6">
                                    <img
                                        src={previewQuestion.imagem}
                                        alt="Questão"
                                        className="max-w-full h-auto rounded-lg shadow-sm"
                                    />
                                </div>
                            )}

                            <p className="font-medium text-slate-900 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{previewQuestion.enunciado}</p>

                            <div className="space-y-3 sm:space-y-4">
                                {previewQuestion.alternativas.map((alt, i) => {
                                    const letter = String.fromCharCode(65 + i);
                                    const isSelected = testAnswer === letter;
                                    const isCorrect = previewQuestion.gabarito === letter;

                                    let styleClasses = "border-slate-100 hover:bg-slate-50";
                                    let circleClasses = "bg-white border-slate-200 text-slate-400";
                                    let showIcon = null;

                                    if (testAnswer) {
                                        if (isCorrect) {
                                            styleClasses = "bg-emerald-50/50 border-emerald-200";
                                            circleClasses = "bg-emerald-100 text-emerald-600 border-emerald-300";
                                            showIcon = <span className="material-symbols-outlined text-emerald-500 text-sm">check</span>;
                                        } else if (isSelected) {
                                            styleClasses = "bg-red-50/50 border-red-200";
                                            circleClasses = "bg-red-100 text-red-600 border-red-300";
                                            showIcon = <span className="material-symbols-outlined text-red-500 text-sm">close</span>;
                                        }
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => !testAnswer && setTestAnswer(letter)}
                                            className={`w-full p-2.5 sm:p-3 rounded-md border text-left flex items-start sm:items-center gap-3 sm:gap-4 transition-all group ${styleClasses}`}
                                        >
                                            <div className="flex items-center gap-2 shrink-0">
                                                {showIcon}
                                                <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs border ${circleClasses}`}>
                                                    {letter}
                                                </span>
                                            </div>
                                            <span className={`text-[11px] sm:text-sm font-medium ${testAnswer && isCorrect ? 'text-emerald-700' : (testAnswer && isSelected ? 'text-red-700' : 'text-slate-700')}`}>
                                                {alt}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rodapé Estilizado do Modelo - Responsivo */}
                        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-white gap-4 shrink-0">
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                <button className="w-full sm:w-auto bg-primary text-white px-8 py-2.5 rounded text-[11px] sm:text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
                                    Responder
                                </button>

                                {testAnswer && (
                                    <div className="flex items-center gap-4 animate-in slide-in-from-left-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-[10px] sm:text-xs ${testAnswer === previewQuestion.gabarito ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {testAnswer === previewQuestion.gabarito ? 'Correta!' : 'Errada!'}
                                            </span>
                                            <span className="text-slate-400 text-[10px] sm:text-xs">Gabarito:</span>
                                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px] border border-emerald-200">
                                                {previewQuestion.gabarito}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-1">
                                    <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                                        <span className="material-symbols-outlined text-base">arrow_back</span>
                                    </button>
                                    <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-primary bg-white text-primary hover:bg-primary hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </button>
                                </div>
                                <button onClick={() => setShowTestModal(false)} className="ml-2 text-slate-400 hover:text-slate-900 transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <button onClick={() => setSelectedMateriaId(null)} className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest"><span className="material-symbols-outlined text-sm">arrow_back</span> Matérias</button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <span className="bg-white border text-primary font-black px-4 py-2 rounded-xl text-[10px] uppercase shadow-sm text-center">{state.materias.find(m => m.id === selectedMateriaId)?.nome}</span>
                    <button onClick={() => { setShowForm(!showForm); if (!showForm) setFormData(f => ({ ...f, codigo: generateCode() })) }} className="bg-primary text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Nova Questão</button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="bg-white p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 space-y-6 sm:space-y-8 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center border-b pb-6">
                        <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest">Editor de Questão</h4>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => openPreview()} className="text-[9px] sm:text-[10px] font-black bg-amber-50 text-amber-600 px-3 sm:px-4 py-2 rounded-xl border border-amber-200 uppercase flex items-center gap-1.5 transition-all hover:bg-amber-100"><span className="material-symbols-outlined text-base">visibility</span> Testar</button>
                            <button type="button" onClick={() => setShowForm(false)} className="text-[9px] sm:text-[10px] font-black bg-slate-50 text-slate-400 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-widest">X</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Código</label><input readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-black text-primary" value={formData.codigo} /></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Ano</label><input required className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 focus:border-primary outline-none" value={formData.ano} onChange={e => setFormData({ ...formData, ano: e.target.value })} /></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Banca</label><input required className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 focus:border-primary outline-none" value={formData.banca} onChange={e => setFormData({ ...formData, banca: e.target.value })} /></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Prova</label><input required className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 focus:border-primary outline-none" value={formData.prova} onChange={e => setFormData({ ...formData, prova: e.target.value })} /></div>
                    </div>

                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Texto Associado</label><textarea rows={2} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-900 focus:border-primary outline-none" value={formData.textoAssociado} onChange={e => setFormData({ ...formData, textoAssociado: e.target.value })} /></div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Imagem (Opcional)</label>
                        <div className="flex flex-col gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setFormData({ ...formData, imagem: reader.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            {formData.imagem && (
                                <div className="relative w-fit group">
                                    <img src={formData.imagem} alt="Preview" className="h-32 w-auto object-contain rounded-lg border border-slate-200" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, imagem: '' })}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 border border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Enunciado</label><textarea required rows={4} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-900 font-bold focus:border-primary outline-none whitespace-pre-wrap" value={formData.enunciado} onChange={e => setFormData({ ...formData, enunciado: e.target.value })} /></div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alternativas</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => handleToggleAlt('remove')} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors"><span className="material-symbols-outlined text-base">remove</span></button>
                                <button type="button" onClick={() => handleToggleAlt('add')} className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center hover:bg-emerald-100 transition-colors"><span className="material-symbols-outlined text-base">add</span></button>
                            </div>
                        </div>
                        {formData.alternativas.map((alt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            return (
                                <div key={i} className="flex gap-2 sm:gap-3 items-center">
                                    <button type="button" onClick={() => setFormData({ ...formData, gabarito: letter })} className={`h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full font-black border transition-all flex items-center justify-center text-xs sm:text-sm ${formData.gabarito === letter ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200'}`}>{letter}</button>
                                    <input required className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 focus:border-primary outline-none" placeholder={`Texto da alternativa ${letter}...`} value={alt} onChange={e => { const n = [...formData.alternativas]; n[i] = e.target.value; setFormData({ ...formData, alternativas: n }); }} />
                                </div>
                            );
                        })}
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 sm:py-5 rounded-2xl shadow-xl shadow-emerald-500/20 uppercase text-[10px] tracking-widest active:scale-95 transition-all">Salvar Questão</button>
                </form>
            )}

            <div className="grid grid-cols-1 gap-4">
                {questionsOfMateria.map(q => (
                    <div key={q.id} className="bg-white p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:border-primary transition-all group gap-4">
                        <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="font-black text-primary text-[10px] sm:text-xs tracking-widest">{q.codigo}</span>
                                <span className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">{q.ano} • {q.banca}</span>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed line-clamp-2">{q.enunciado}</p>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-50">
                            <div className="flex gap-2">
                                <button onClick={() => openPreview(q)} className="p-2 text-slate-400 md:text-slate-300 hover:text-amber-500 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Testar Questão"><span className="material-symbols-outlined">visibility</span></button>
                                <button onClick={() => updateState({ questoes: state.questoes.filter(item => item.id !== q.id) })} className="p-2 text-slate-400 md:text-slate-300 hover:text-red-500 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Excluir"><span className="material-symbols-outlined">delete</span></button>
                            </div>
                            <span className="bg-emerald-50 text-emerald-600 px-3 sm:px-4 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black border border-emerald-100 tracking-widest">GABARITO: {q.gabarito}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminQuestoes;
