import React, { useState } from 'react';
import { AppState, Concurso, Cargo, Materia, StatusConcurso, Nivel } from '../../types';
import { extractTextFromPdf } from '../../services/pdf-service';
import { parseEditalWithAI } from '../../services/ai-service';
import { supabase } from '../../lib/supabase';

interface AdminImportPdfProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
}

const AdminImportPdf: React.FC<AdminImportPdfProps> = ({ state, updateState }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
    const [previewData, setPreviewData] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const processFile = async () => {
        if (!file) return;
        setIsLoading(true);
        setLogs([]);
        addLog('Iniciando extração de texto do PDF...');

        try {
            const text = await extractTextFromPdf(file);
            addLog(`Texto extraído: ${text.length} caracteres.`);
            addLog('Enviando para análise da IA (Isso pode levar alguns segundos)...');

            const result = await parseEditalWithAI(text);
            addLog('Análise concluída com sucesso!');
            setPreviewData(result);
            setStep('preview');
        } catch (error: any) {
            addLog(`Erro: ${error.message}`);
            console.error(error);
            alert('Erro ao processar arquivo. Verifique se a chave API está correta e se o PDF não está corrompido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!previewData) return;
        setIsLoading(true);
        addLog('Salvando dados no banco...');

        try {
            // 1. Salvar Concurso
            const concursoId = Math.random().toString(36).substr(2, 9);
            const concurso: Concurso = {
                id: concursoId,
                nome: previewData.concurso.nome,
                banca: previewData.concurso.banca,
                orgao: previewData.concurso.orgao,
                status: StatusConcurso.EditalPublicado,
                cidades: previewData.concurso.cidades || [],
                datas: {
                    inscricaoInicio: '',
                    inscricaoFim: '',
                    prova: ''
                },
                links: {
                    editalPdf: '', // Todo: Upload do PDF para storage e link aqui
                },
                observacoes: previewData.concurso.observacoes,
                salarioMaximo: previewData.concurso.salario_maximo,
                totalVagas: previewData.concurso.total_vagas,
                imageUrl: '',
                subCoverUrl: ''
            };

            const { error: errConc } = await supabase.from('concursos').insert({
                id: concursoId,
                nome: concurso.nome,
                banca: concurso.banca,
                orgao: concurso.orgao,
                status: concurso.status,
                cidades: concurso.cidades,
                salario_maximo: concurso.salarioMaximo,
                total_vagas: concurso.totalVagas,
                observacoes: concurso.observacoes
            });

            if (errConc) throw errConc;
            addLog('Concurso salvo.');

            // 2. Salvar Matérias e Cargos
            // Precisamos primeiro criar as matérias para ter os IDs, ou verificar se já existem
            const materiasMap = new Map<string, string>(); // Nome -> ID

            for (const mat of previewData.materias) {
                const matId = Math.random().toString(36).substr(2, 9);
                // Simplificação: criando sempre novas matérias para esse concurso ou idealmente buscar existentes pelo nome
                // Para evitar duplicidade global, check se existe seria bom, mas para MVP vamos criar.
                const { error: errMat } = await supabase.from('materias').insert({
                    id: matId,
                    nome: mat.nome,
                    categoria: mat.categoria,
                    nivel_compativel: mat.nivel_compativel
                });
                if (errMat) console.warn('Erro ao salvar materia', mat.nome, errMat);
                materiasMap.set(mat.nome, matId);
            }
            addLog(`${previewData.materias.length} matérias processadas.`);

            // 3. Salvar Cargos e Vínculos
            for (const car of previewData.cargos) {
                const cargoId = Math.random().toString(36).substr(2, 9);
                const { error: errCar } = await supabase.from('cargos').insert({
                    id: cargoId,
                    concurso_id: concursoId,
                    nome: car.nome,
                    nivel: car.nivel,
                    vagas_amplas: car.vagas_amplas,
                    vagas_pcd: car.vagas_pcd,
                    vagas_cr: car.vagas_cr,
                    total_vagas: car.total_vagas,
                    salario: car.salario,
                    carga_horaria: car.carga_horaria,
                    requisitos: car.requisitos
                });

                if (errCar) throw errCar;

                // Vincular materias ao cargo
                const materiasDoCargo = previewData.cargos_materias.filter((cm: any) => cm.cargo_nome === car.nome);
                for (const mc of materiasDoCargo) {
                    const mId = materiasMap.get(mc.materia_nome);
                    // Match fuzzy poderia ser necessário aqui, mas assumindo que a IA gera nomes consistentes
                    if (mId) {
                        await supabase.from('cargos_materias').insert({
                            cargo_id: cargoId,
                            materia_id: mId
                        });
                    }
                }
            }
            addLog(`${previewData.cargos.length} cargos salvos.`);

            setStep('success');
            updateState({
                concursos: [...state.concursos, concurso]
                // Não atualizamos cargos/materias no state global aqui pois necessitaria reload ou complex logic,
                // mas idealmente faríamos. O onRefresh do pai resolverá se chamado.
            });

        } catch (error: any) {
            addLog(`Erro Crítico ao Salvar: ${error.message}`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-6 animate-in zoom-in">
                <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Importação Concluída!</h2>
                <p className="text-slate-500">O concurso e seus dados foram cadastrados com sucesso.</p>
                <button onClick={() => { setStep('upload'); setFile(null); setPreviewData(null); setLogs([]); }} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Importar Outro</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-[40px] shadow-lg relative overflow-hidden text-white">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Importador Inteligente (IA)</h1>
                    <p className="text-indigo-100 font-medium max-w-2xl">Envie o edital em PDF e nossa Inteligência Artificial irá extrair automaticamente as informações do concurso, cargos e matérias.</p>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-8 text-[180px] opacity-10 rotate-12">psychology</span>
            </div>

            {step === 'upload' && (
                <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-slate-200 hover:border-indigo-500 transition-all group">
                    <div className="flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="h-20 w-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Selecione o Edital (PDF)</h3>
                            <p className="text-sm text-slate-400 mt-1">O arquivo será processado localmente e analisado pela IA.</p>
                        </div>

                        <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
                        <label htmlFor="pdf-upload" className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold cursor-pointer hover:bg-slate-800 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined">upload</span>
                            {file ? file.name : 'Escolher Arquivo'}
                        </label>

                        {file && (
                            <button
                                onClick={processFile}
                                disabled={isLoading}
                                className="w-full max-w-sm bg-indigo-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin material-symbols-outlined">progress_activity</span>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        Iniciar Análise com IA
                                    </>
                                )}
                            </button>
                        )}

                        {logs.length > 0 && (
                            <div className="w-full max-w-lg bg-slate-900 rounded-xl p-4 mt-6 text-left font-mono text-xs text-green-400 max-h-40 overflow-y-auto">
                                {logs.map((log, i) => <div key={i}>&gt; {log}</div>)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 'preview' && previewData && (
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">verified</span>
                            Resultado da Análise
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-slate-50 p-5 rounded-2xl">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Concurso</label>
                                <p className="font-bold text-slate-900 text-lg">{previewData.concurso.nome}</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Banca</label>
                                <p className="font-bold text-slate-900 text-lg">{previewData.concurso.banca}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-black">
                                    {previewData.cargos.length}
                                </span>
                                Cargos Identificados
                            </h4>
                            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                                {previewData.cargos.map((cargo: any, idx: number) => (
                                    <div key={idx} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-bold text-slate-900">{cargo.nome}</p>
                                            <p className="text-xs text-slate-500">{cargo.nivel} • {cargo.salario}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-slate-900">{cargo.total_vagas} vagas</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 mt-6">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-black">
                                    {previewData.materias.length}
                                </span>
                                Matérias Identificadas
                            </h4>
                            <div className="max-h-60 overflow-y-auto pr-2 grid grid-cols-2 gap-2">
                                {previewData.materias.map((mat: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 p-3 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        {mat.nome}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 mt-8 border-t border-slate-100 flex justify-end gap-4">
                            <button onClick={() => setStep('upload')} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">Cancelar</button>
                            <button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
                                {isLoading ? 'Salvando...' : 'Confirmar e Importar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminImportPdf;
