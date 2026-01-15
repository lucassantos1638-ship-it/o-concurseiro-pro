
import React, { useState } from 'react';
import { AppState, Concurso, StatusConcurso } from '../../types';
import { ESTADOS_BRASIL } from '../../constants';
import { supabase } from '../../lib/supabase';

interface AdminConcursosProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
    onRefresh: () => void;
}

const AdminConcursos: React.FC<AdminConcursosProps> = ({ state, updateState, onRefresh }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '', banca: '', orgao: '', salarioMaximo: '', totalVagas: '',
        estado: '', cidade: '', dataInscInicio: '', dataInscFim: '', dataProva: '',
        linkInscricao: '', linkEdital: '', linkApostila: '', linkCurso: '',
        capaUrl: '', subCapaUrl: '',
        status: StatusConcurso.EditalPublicado,
        descricao: ''
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'capaUrl' | 'subCapaUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = (c: Concurso) => {
        setEditingId(c.id);
        setFormData({
            nome: c.nome,
            banca: c.banca,
            orgao: c.orgao,
            salarioMaximo: c.salarioMaximo || '',
            totalVagas: c.totalVagas?.toString() || '',
            estado: c.cidades[0] || '',
            cidade: c.cidades[1] || '',
            dataInscInicio: c.datas.inscricaoInicio || '',
            dataInscFim: c.datas.inscricaoFim || '',
            dataProva: c.datas.prova || '',
            linkInscricao: c.links.inscricoes || '',
            linkEdital: c.links.editalPdf || '',
            linkApostila: c.links.apostilas || '',
            linkCurso: c.links.oficial || '', // Fixed mapping: linkCurso uses oficial link
            capaUrl: c.imageUrl || '',
            subCapaUrl: c.subCoverUrl || '',
            status: c.status,
            descricao: c.observacoes
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {

        setLoading(true);
        try {
            await supabase.from('concursos').delete().eq('id', id);
            onRefresh();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = {
            nome: formData.nome,
            banca: formData.banca || '',
            orgao: formData.orgao || '',
            status: formData.status,
            cidades: [formData.estado, formData.cidade].filter(Boolean), // Reverted to original logic for cities based on current formData
            data_edital: null, // This field is not present in current formData, setting to null
            data_prova: formData.dataProva || null,
            data_inscricao_inicio: formData.dataInscInicio || null,
            data_inscricao_fim: formData.dataInscFim || null,
            link_oficial: formData.linkCurso || '', // Using linkCurso as official link
            link_inscricoes: formData.linkInscricao || '',
            link_edital: formData.linkEdital || '',
            link_apostilas: formData.linkApostila || '',
            observacoes: formData.descricao || '',
            image_url: formData.capaUrl || '',
            sub_cover_url: formData.subCapaUrl || '',
            total_vagas: parseInt(formData.totalVagas) || 0,
            salario_maximo: formData.salarioMaximo || ''
        };

        try {
            if (editingId) {
                const { error } = await supabase.from('concursos').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('concursos').insert({
                    id: crypto.randomUUID(),
                    ...payload
                });
                if (error) throw error;
            }
            onRefresh();
            setShowForm(false);
            setEditingId(null);
            setFormData({
                nome: '', banca: '', orgao: '', salarioMaximo: '', totalVagas: '',
                estado: '', cidade: '', dataInscInicio: '', dataInscFim: '', dataProva: '',
                linkInscricao: '', linkEdital: '', linkApostila: '', linkCurso: '',
                capaUrl: '', subCapaUrl: '',
                status: StatusConcurso.EditalPublicado,
                descricao: ''
            });
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar concurso');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">Gerenciar Concursos</h3><button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">{showForm ? 'Fechar' : 'Novo Concurso'}</button></div>
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-sm relative">
                    {loading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div></div>}
                    <div className="col-span-2 md:col-span-4 border-b pb-4 mb-2 flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase text-slate-400">{editingId ? 'Editando Concurso' : 'Informações Básicas'}</h4>
                    </div>
                    <input className="col-span-2 border p-3 rounded-xl text-slate-900 bg-white" placeholder="Nome do Concurso" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="Banca" value={formData.banca} onChange={e => setFormData({ ...formData, banca: e.target.value })} required />
                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="Órgão" value={formData.orgao} onChange={e => setFormData({ ...formData, orgao: e.target.value })} required />

                    <select
                        className="border p-3 rounded-xl text-slate-900 bg-white appearance-none cursor-pointer"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as StatusConcurso })}
                        required
                    >
                        {Object.values(StatusConcurso).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>

                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="Salário (Ex: R$ 5.000)" value={formData.salarioMaximo} onChange={e => setFormData({ ...formData, salarioMaximo: e.target.value })} />
                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="Vagas Totais" type="number" value={formData.totalVagas} onChange={e => setFormData({ ...formData, totalVagas: e.target.value })} />

                    <select
                        className="border p-3 rounded-xl text-slate-900 bg-white appearance-none cursor-pointer"
                        value={formData.estado}
                        onChange={e => setFormData({ ...formData, estado: e.target.value })}
                        required
                    >
                        <option value="" disabled>Selecionar Estado</option>
                        <option value="Nacional">Nacional</option>
                        {ESTADOS_BRASIL.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>

                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="Cidade" value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />

                    <div className="col-span-2 md:col-span-4 mt-2">
                        <textarea className="w-full border p-3 rounded-xl text-slate-900 bg-white h-24" placeholder="Descrição/Observações do Concurso" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
                    </div>

                    <div className="col-span-2 md:col-span-4 border-b pb-4 mb-2 mt-4"><h4 className="text-xs font-black uppercase text-slate-400">Datas Críticas</h4></div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Início Inscrições</label>
                        <input className="border p-3 rounded-xl text-slate-900 bg-white" type="date" value={formData.dataInscInicio} onChange={e => setFormData({ ...formData, dataInscInicio: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Fim Inscrições</label>
                        <input className="border p-3 rounded-xl text-slate-900 bg-white" type="date" value={formData.dataInscFim} onChange={e => setFormData({ ...formData, dataInscFim: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Data da Prova</label>
                        <input className="border p-3 rounded-xl text-slate-900 bg-white" type="date" value={formData.dataProva} onChange={e => setFormData({ ...formData, dataProva: e.target.value })} />
                    </div>
                    <div className="invisible md:visible"></div>

                    <div className="col-span-2 md:col-span-4 border-b pb-4 mb-2 mt-4"><h4 className="text-xs font-black uppercase text-slate-400">Links de Acesso</h4></div>
                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="URL Inscrição" value={formData.linkInscricao} onChange={e => setFormData({ ...formData, linkInscricao: e.target.value })} />
                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="URL Edital (PDF)" value={formData.linkEdital} onChange={e => setFormData({ ...formData, linkEdital: e.target.value })} />
                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="URL Apostila" value={formData.linkApostila} onChange={e => setFormData({ ...formData, linkApostila: e.target.value })} />
                    <input className="border p-3 rounded-xl text-slate-900 bg-white" placeholder="URL Curso" value={formData.linkCurso} onChange={e => setFormData({ ...formData, linkCurso: e.target.value })} />

                    <div className="col-span-2 md:col-span-4 border-b pb-4 mb-2 mt-4"><h4 className="text-xs font-black uppercase text-slate-400">Identidade Visual (Upload)</h4></div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Capa do Concurso (Banner)</label>
                        <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'capaUrl')} className="hidden" id="capa-upload" />
                            <label htmlFor="capa-upload" className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                                {formData.capaUrl ? <img src={formData.capaUrl} className="h-10 object-contain" /> : <span className="text-xs font-bold text-slate-400">Selecionar Capa</span>}
                            </label>
                        </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sub Capa (Logo)</label>
                        <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'subCapaUrl')} className="hidden" id="subcapa-upload" />
                            <label htmlFor="subcapa-upload" className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                                {formData.subCapaUrl ? <img src={formData.subCapaUrl} className="h-10 object-contain" /> : <span className="text-xs font-bold text-slate-400">Selecionar Logo</span>}
                            </label>
                        </div>
                    </div>

                    <button className="col-span-2 md:col-span-4 bg-primary text-white p-4 rounded-2xl font-black uppercase text-xs shadow-lg mt-4 active:scale-95 transition-all" disabled={loading}>
                        {loading ? 'Salvando...' : (editingId ? 'Atualizar Concurso' : 'Salvar Concurso Completo')}
                    </button>
                </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.concursos.map(c => (
                    <div key={c.id} className="bg-white p-5 rounded-3xl border border-slate-200 flex justify-between items-center hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden border">
                                {c.subCoverUrl ? <img src={c.subCoverUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-300 w-full h-full flex items-center justify-center">account_balance</span>}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{c.nome}</h4>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{c.banca} • {c.cidades[0] || 'Nacional'} • <span className="text-primary">{c.status}</span></p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(c)} className="text-slate-200 hover:text-primary transition-colors p-2"><span className="material-symbols-outlined">edit</span></button>
                            <button onClick={() => handleDelete(c.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2"><span className="material-symbols-outlined">delete</span></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminConcursos;
