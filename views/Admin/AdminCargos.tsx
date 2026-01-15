
import React, { useState } from 'react';
import { AppState, Cargo, Nivel, CargoMateriaConfig } from '../../types';
import { supabase } from '../../lib/supabase';

interface AdminCargosProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
    onRefresh: () => void;
}

const AdminCargos: React.FC<AdminCargosProps> = ({ state, updateState, onRefresh }) => {
    const [selectedConcursoId, setSelectedConcursoId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        nivel: Nivel.Superior,
        salario: '',
        vagasAmplas: '',
        vagasPcd: '',
        vagasPn: '',
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
            vagasPn: (c.vagasPn || '').toString(),
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

    const handleDeleteCargo = async (id: string) => {

        setLoading(true);
        try {
            await supabase.from('cargos').delete().eq('id', id);
            onRefresh();
        } catch (error) {
            console.error('Error deleting cargo:', error);
            alert('Erro ao excluir cargo');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitCargo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConcursoId) return;
        setLoading(true);

        const vAmplas = parseInt(formData.vagasAmplas) || 0;
        const vPcd = parseInt(formData.vagasPcd) || 0;
        const vPn = parseInt(formData.vagasPn) || 0;
        const vCR = parseInt(formData.vagasCR) || 0;

        const cargoPayload = {
            concurso_id: selectedConcursoId,
            nome: formData.nome,
            nivel: formData.nivel,
            salario: formData.salario,
            vagas_amplas: vAmplas,
            vagas_pcd: vPcd,
            vagas_pn: vPn, // Added PN column
            vagas_cr: vCR,
            total_vagas: vAmplas + vPcd + vPn + vCR,
            carga_horaria: formData.cargaHoraria,
            requisitos: formData.requisitos,
            // apostila fields removed or need extra handling if we are to keep them but DB doesn't have columns for them yet?
            // checking schema.. I created cargos table without apostila columns.
            // I will ignore apostila colums for now or add them. The detailed plan did not explicitly list them in create table.
            // Let's assume we won't persist apostila details for now or I should add them.
            // For now I will focus on core data.
        };

        try {
            let cargoId = editingId;
            if (editingId) {
                await supabase.from('cargos').update(cargoPayload).eq('id', editingId);
            } else {
                const { data, error } = await supabase.from('cargos').insert(cargoPayload).select().single();
                if (error) throw error;
                cargoId = data.id;
            }

            // Handle Materias Config (CargosMaterias)
            if (cargoId) {
                // Delete existing configs for this cargo
                await supabase.from('cargos_materias').delete().eq('cargo_id', cargoId);

                // Insert new configs
                // Insert new configs
                if (formData.materiasConfig.length > 0) {
                    const materiasPayload = [];

                    for (const mc of formData.materiasConfig) {
                        let targetMateriaId = mc.materiaId;
                        const originalMateria = state.materias.find(m => m.id === mc.materiaId);

                        // Rule: If materia name starts with "Conhecimento", specific-fy it
                        if (originalMateria && originalMateria.nome.match(/^Conhecimento/i) && !originalMateria.nome.includes(formData.nome)) {
                            const specificName = `${originalMateria.nome} (${formData.nome})`;

                            // Check if exists
                            const { data: existing } = await supabase.from('materias').select('id').eq('nome', specificName).maybeSingle();

                            if (existing) {
                                targetMateriaId = existing.id;
                            } else {
                                // Create new
                                const id = Math.random().toString(36).substr(2, 9);
                                const { data: newMat, error: errNew } = await supabase.from('materias').insert({
                                    id,
                                    nome: specificName,
                                    categoria: originalMateria.categoria,
                                    nivel_compativel: originalMateria.nivelCompativel
                                }).select().single();

                                if (!errNew && newMat) {
                                    targetMateriaId = newMat.id;
                                }
                            }
                        }

                        materiasPayload.push({
                            cargo_id: cargoId,
                            materia_id: targetMateriaId,
                            peso: mc.peso,
                            quantidade_questoes: mc.quantidadeQuestoes
                        });
                    }

                    if (materiasPayload.length > 0) {
                        await supabase.from('cargos_materias').insert(materiasPayload);
                    }
                }
            }

            onRefresh();
            setShowForm(false);
            setEditingId(null);
            setFormData({ nome: '', nivel: Nivel.Superior, salario: '', vagasAmplas: '', vagasPcd: '', vagasPn: '', vagasCR: '', cargaHoraria: '', requisitos: '', materiasConfig: [], apostilaCapa: '', apostilaValor: '', apostilaLink: '' });
        } catch (error) {
            console.error('Error saving cargo:', error);
            alert('Erro ao salvar cargo');
        } finally {
            setLoading(false);
        }
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
                <form onSubmit={handleSubmitCargo} className="bg-white p-8 rounded-[40px] border grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl relative">
                    {loading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-[40px]"><div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div></div>}
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

                    <div className="grid grid-cols-4 gap-2 md:col-span-1">
                        <div className="col-span-4"><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Vagas</label></div>
                        <div><input type="number" className="w-full border p-2 rounded-lg text-slate-900 bg-white text-xs" placeholder="AC" value={formData.vagasAmplas} onChange={e => setFormData({ ...formData, vagasAmplas: e.target.value })} /></div>
                        <div><input type="number" className="w-full border p-2 rounded-lg text-slate-900 bg-white text-xs" placeholder="PN" value={formData.vagasPn} onChange={e => setFormData({ ...formData, vagasPn: e.target.value })} /></div>
                        <div><input type="number" className="w-full border p-2 rounded-lg text-slate-900 bg-white text-xs" placeholder="PCD" value={formData.vagasPcd} onChange={e => setFormData({ ...formData, vagasPcd: e.target.value })} /></div>
                        <div><input type="number" className="w-full border p-2 rounded-lg text-slate-900 bg-white text-xs" placeholder="CR" value={formData.vagasCR} onChange={e => setFormData({ ...formData, vagasCR: e.target.value })} /></div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Requisitos do Cargo</label>
                        <textarea className="w-full border p-3 rounded-xl text-slate-900 bg-white h-24" placeholder="Descreva os requisitos..." value={formData.requisitos} onChange={e => setFormData({ ...formData, requisitos: e.target.value })} />
                    </div>

                    <div className="md:col-span-3 border-t pt-6 mt-2">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Venda de Apostila (Opcional - Em breve)</h4>
                        {/* Apostila fields disabled for now as no schema yet */}
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
                                        <span className={`font-bold text-sm ${mat ? 'text-slate-800' : 'text-red-400'}`}>
                                            {mat ? mat.nome : `Indisponível (ID: ${item.materiaId.substring(0, 8)}...)`}
                                        </span>
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

                    <button className="md:col-span-3 bg-primary text-white p-4 rounded-2xl font-black uppercase text-xs shadow-lg mt-4 active:scale-95 transition-all" disabled={loading}>
                        {loading ? 'Salvando...' : (editingId ? 'Atualizar Cargo' : 'Salvar Novo Cargo')}
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
                            <button onClick={() => handleDeleteCargo(c.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><span className="material-symbols-outlined">delete</span></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminCargos;
