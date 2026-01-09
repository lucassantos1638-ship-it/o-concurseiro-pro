
import React, { useState } from 'react';
import { AppState, Cargo, Nivel, CargoMateriaConfig } from '../../types';

interface AdminCargosProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
}

const AdminCargos: React.FC<AdminCargosProps> = ({ state, updateState }) => {
    const [selectedConcursoId, setSelectedConcursoId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nome: '',
        nivel: Nivel.Superior,
        salario: '',
        vagasAmplas: '',
        vagasPcd: '',
        vagasCR: '',
        cargaHoraria: '',
        requisitos: '',
        materiasConfig: [] as CargoMateriaConfig[],
        apostilaCapa: '',
        apostilaValor: '',
        apostilaLink: ''
    });

    const [materiaTemp, setMateriaTemp] = useState({
        materiaId: '',
        peso: '1',
        quantidadeQuestoes: '10'
    });

    const cargosDoConcurso = state.cargos.filter(c => c.concursoId === selectedConcursoId);

    const handleEditCargo = (c: any) => {
        setEditingId(c.id);
        setFormData({
            nome: c.nome,
            nivel: c.nivel,
            salario: c.salario,
            vagasAmplas: c.vagasAmplas.toString(),
            vagasPcd: c.vagasPcd.toString(),
            vagasCR: c.vagasCR.toString(),
            cargaHoraria: c.cargaHoraria || '',
            requisitos: c.requisitos || '',
            materiasConfig: c.materiasConfig || [],
            apostilaCapa: c.apostilaCapa || '',
            apostilaValor: c.apostilaValor || '',
            apostilaLink: c.apostilaLink || ''
        });
        setShowForm(true);
    };

    const handleApostilaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, apostilaCapa: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const addMateriaConfig = () => {
        if (!materiaTemp.materiaId) return;
        setFormData(prev => ({
            ...prev,
            materiasConfig: [
                ...prev.materiasConfig,
                {
                    materiaId: materiaTemp.materiaId,
                    peso: parseFloat(materiaTemp.peso) || 1,
                    quantidadeQuestoes: parseInt(materiaTemp.quantidadeQuestoes) || 0
                }
            ]
        }));
        setMateriaTemp({ materiaId: '', peso: '1', quantidadeQuestoes: '10' });
    };

    const removeMateriaConfig = (index: number) => {
        setFormData(prev => ({
            ...prev,
            materiasConfig: prev.materiasConfig.filter((_, i) => i !== index)
        }));
    };

    const handleSubmitCargo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConcursoId) return;

        const vAmplas = parseInt(formData.vagasAmplas) || 0;
        const vPcd = parseInt(formData.vagasPcd) || 0;
        const vCR = parseInt(formData.vagasCR) || 0;

        const cargoData: any = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            concursoId: selectedConcursoId,
            nome: formData.nome,
            nivel: formData.nivel,
            salario: formData.salario,
            vagasAmplas: vAmplas,
            vagasPcd: vPcd,
            vagasCR: vCR,
            totalVagas: vAmplas + vPcd + vCR,
            cargaHoraria: formData.cargaHoraria,
            requisitos: formData.requisitos,
            materiasConfig: formData.materiasConfig,
            apostilaCapa: formData.apostilaCapa,
            apostilaValor: formData.apostilaValor,
            apostilaLink: formData.apostilaLink
        };

        if (editingId) {
            updateState({ cargos: state.cargos.map(c => c.id === editingId ? cargoData : c) });
        } else {
            updateState({ cargos: [...state.cargos, cargoData] });
        }

        setShowForm(false);
        setEditingId(null);
        setFormData({ nome: '', nivel: Nivel.Superior, salario: '', vagasAmplas: '', vagasPcd: '', vagasCR: '', cargaHoraria: '', requisitos: '', materiasConfig: [], apostilaCapa: '', apostilaValor: '', apostilaLink: '' });
    };

    if (!selectedConcursoId) return (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.concursos.map(c => (
                <button key={c.id} onClick={() => setSelectedConcursoId(c.id)} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-primary text-left shadow-sm group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                            {c.subCoverUrl ? <img src={c.subCoverUrl} className="w-full h-full object-cover rounded-lg" /> : <span className="material-symbols-outlined text-slate-300">account_balance</span>}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-primary">{c.nome}</h4>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Gerenciar Cargos</p>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <button onClick={() => setSelectedConcursoId(null)} className="text-xs font-bold text-slate-500 flex items-center gap-2"><span className="material-symbols-outlined text-sm">arrow_back</span> Voltar</button>
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Cargos - {state.concursos.find(c => c.id === selectedConcursoId)?.nome}</h3>
                <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">{showForm ? 'Fechar' : 'Novo Cargo'}</button>
            </div>
            {showForm && (
                <form onSubmit={handleSubmitCargo} className="bg-white p-8 rounded-[40px] border grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
                    <div className="md:col-span-3 border-b pb-4 mb-2"><h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Configuração do Cargo</h4></div>

                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Nome do Cargo</label>
                        <input className="w-full border p-3 rounded-xl text-slate-900 bg-white" placeholder="Ex: Analista Judiciário" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Escolaridade</label>
                        <select className="w-full border p-3 rounded-xl text-slate-900 bg-white" value={formData.nivel} onChange={e => setFormData({ ...formData, nivel: e.target.value as Nivel })}>
                            {Object.values(Nivel).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Salário Base</label>
                        <input className="w-full border p-3 rounded-xl text-slate-900 bg-white" placeholder="R$ 0,00" value={formData.salario} onChange={e => setFormData({ ...formData, salario: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Carga Horária</label>
                        <input className="w-full border p-3 rounded-xl text-slate-900 bg-white" placeholder="Ex: 40h semanais" value={formData.cargaHoraria} onChange={e => setFormData({ ...formData, cargaHoraria: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:col-span-1">
                        <div className="col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Vagas</label></div>
                        <div><input type="number" className="w-full border p-2 rounded-lg text-slate-900 bg-white text-xs" placeholder="AC" value={formData.vagasAmplas} onChange={e => setFormData({ ...formData, vagasAmplas: e.target.value })} /></div>
                        <div><input type="number" className="w-full border p-2 rounded-lg text-slate-900 bg-white text-xs" placeholder="PCD" value={formData.vagasPcd} onChange={e => setFormData({ ...formData, vagasPcd: e.target.value })} /></div>
                        <div><input type="number" className="w-full border p-2 rounded-lg text-slate-900 bg-white text-xs" placeholder="CR" value={formData.vagasCR} onChange={e => setFormData({ ...formData, vagasCR: e.target.value })} /></div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Requisitos do Cargo</label>
                        <textarea className="w-full border p-3 rounded-xl text-slate-900 bg-white h-24" placeholder="Descreva os requisitos..." value={formData.requisitos} onChange={e => setFormData({ ...formData, requisitos: e.target.value })} />
                    </div>

                    <div className="md:col-span-3 border-t pt-6 mt-2">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Venda de Apostila (Opcional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Capa da Apostila</label>
                                <div className="flex items-center gap-4">
                                    <input type="file" accept="image/*" onChange={handleApostilaFileUpload} className="hidden" id="apostila-upload" />
                                    <label htmlFor="apostila-upload" className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors bg-white">
                                        {formData.apostilaCapa ? <img src={formData.apostilaCapa} className="h-20 object-contain" /> : <span className="text-[10px] font-bold text-slate-400">Upload Capa</span>}
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Valor (R$)</label>
                                <input className="w-full border p-3 rounded-xl text-slate-900 bg-white" placeholder="Ex: 49,90" value={formData.apostilaValor} onChange={e => setFormData({ ...formData, apostilaValor: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Link de Compra</label>
                                <input className="w-full border p-3 rounded-xl text-slate-900 bg-white" placeholder="https://..." value={formData.apostilaLink} onChange={e => setFormData({ ...formData, apostilaLink: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 border-t pt-6 mt-2">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Grade de Matérias (Edital)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Selecionar Matéria</label>
                                <select className="w-full border p-3 rounded-xl text-slate-900 bg-white" value={materiaTemp.materiaId} onChange={e => setMateriaTemp({ ...materiaTemp, materiaId: e.target.value })}>
                                    <option value="">Escolher...</option>
                                    {state.materias.filter(m => m.nivelCompativel === formData.nivel).map(m => (
                                        <option key={m.id} value={m.id}>{m.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Peso</label>
                                <input type="number" step="0.1" className="w-full border p-3 rounded-xl text-slate-900 bg-white" value={materiaTemp.peso} onChange={e => setMateriaTemp({ ...materiaTemp, peso: e.target.value })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Qtd Questões</label>
                                    <input type="number" className="w-full border p-3 rounded-xl text-slate-900 bg-white" value={materiaTemp.quantidadeQuestoes} onChange={e => setMateriaTemp({ ...materiaTemp, quantidadeQuestoes: e.target.value })} />
                                </div>
                                <button type="button" onClick={addMateriaConfig} className="bg-primary text-white p-3 rounded-xl flex items-center justify-center shrink-0 h-[48px] w-[48px] shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 space-y-2">
                        {formData.materiasConfig.map((item, idx) => {
                            const mat = state.materias.find(m => m.id === item.materiaId);
                            return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-4">
                                        <span className="w-6 h-6 bg-slate-100 text-[10px] flex items-center justify-center rounded-full font-black text-slate-400">{idx + 1}</span>
                                        <span className="font-bold text-slate-800 text-sm">{mat?.nome}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] font-black text-primary uppercase">Peso {item.peso}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{item.quantidadeQuestoes} Questões</span>
                                        <button type="button" onClick={() => removeMateriaConfig(idx)} className="text-red-300 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button className="md:col-span-3 bg-primary text-white p-4 rounded-2xl font-black uppercase text-xs shadow-lg mt-4 active:scale-95 transition-all">
                        {editingId ? 'Atualizar Cargo' : 'Salvar Novo Cargo'}
                    </button>
                </form>
            )}
            <div className="bg-white rounded-[32px] border overflow-hidden shadow-sm">
                {cargosDoConcurso.map(c => (
                    <div key={c.id} className="p-5 border-b flex justify-between items-center hover:bg-slate-50 group">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{c.nome} ({c.nivel})</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.totalVagas} Vagas Totais • {c.materiasConfig.length} Matérias</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditCargo(c)} className="text-slate-300 hover:text-primary transition-colors p-2"><span className="material-symbols-outlined">edit</span></button>
                            <button onClick={() => updateState({ cargos: state.cargos.filter(it => it.id !== c.id) })} className="text-slate-300 hover:text-red-500 transition-colors p-2"><span className="material-symbols-outlined">delete</span></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminCargos;
