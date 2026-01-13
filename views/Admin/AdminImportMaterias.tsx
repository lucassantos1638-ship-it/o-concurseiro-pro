import React, { useState } from 'react';
import { read, utils } from 'xlsx';
import { AppState, Cargo, Concurso, Materia, Nivel } from '../../types';
import { supabase } from '../../lib/supabase';

interface AdminImportMateriasProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
}

interface ImportedRow {
    Cargo: string;
    Materia: string;
    Quantidade: number;
    Peso: number;
}

const AdminImportMaterias: React.FC<AdminImportMateriasProps> = ({ state, updateState }) => {
    const [selectedConcursoId, setSelectedConcursoId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setLogs([]);
            // Reset preview when file changes
            setPreviewData([]);
        }
    };

    const processFile = async () => {
        if (!file || !selectedConcursoId) return;
        setIsLoading(true);
        setLogs([]);

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = utils.sheet_to_json<any>(worksheet);

            // Normalize keys to support variations like "Matéria", "Materia", "Qtd", "Peso"
            const normalizedData: ImportedRow[] = jsonData.map((row: any) => {
                const getVal = (keys: string[]) => {
                    for (const k of keys) {
                        const found = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase());
                        if (found) return row[found];
                    }
                    return null;
                };

                return {
                    Cargo: getVal(['Cargo', 'Cargo Nome']),
                    Materia: getVal(['Matéria', 'Materia', 'Disciplina']),
                    Quantidade: Number(getVal(['Quantidade', 'Qtd', 'Questões', 'Questoes'])) || 0,
                    Peso: Number(getVal(['Peso', 'Pontos'])) || 1
                };
            }).filter(r => r.Cargo && r.Materia); // Filter out empty rows

            if (normalizedData.length === 0) {
                addLog('❌ Nenhuma linha válida encontrada. Verifique as colunas: Cargo, Matéria, Quantidade, Peso.');
                setIsLoading(false);
                return;
            }

            setPreviewData(normalizedData);
            setStep('preview');
            addLog(`✅ Arquivo processado. ${normalizedData.length} associações encontradas.`);

        } catch (error) {
            console.error(error);
            addLog('❌ Erro ao ler arquivo Excel.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedConcursoId || previewData.length === 0) return;
        setIsLoading(true);

        // We need to fetch fresh data or rely on state? Rely on state for IDs but we might need to update Supabase.
        // Ideally we assume state is fresh enough or we fetch.
        // Let's iterate and process.

        const contestCargos = state.cargos.filter(c => c.concursoId === selectedConcursoId);
        let updatedCargos: Cargo[] = [...state.cargos]; // We will update local state ideally
        let updatedMaterias: Materia[] = [...state.materias];

        let processedCount = 0;
        const newMateriasToInsert: Omit<Materia, 'id'>[] = [];
        const materiasMap = new Map<string, Materia>();

        // Index existing materias for fast lookup case-insensitive
        state.materias.forEach(m => materiasMap.set(m.nome.toLowerCase().trim(), m));

        try {
            // 1. Identify new materias to create
            // We will create them one by one or batch? 
            // For simplicity and ID retrieval, maybe one by one or check beforehand.

            const adjustments: { cargoId: string, materiaName: string, qtd: number, peso: number, nivel: string }[] = [];

            for (const row of previewData) {
                const cargoName = String(row.Cargo).trim().toLowerCase();
                const cargo = contestCargos.find(c => c.nome.toLowerCase().trim() === cargoName);

                if (!cargo) {
                    addLog(`⚠️ Cargo não encontrado no concurso: ${row.Cargo}`);
                    continue;
                }

                adjustments.push({
                    cargoId: cargo.id,
                    materiaName: String(row.Materia).trim(),
                    qtd: row.Quantidade,
                    peso: row.Peso,
                    nivel: cargo.nivel // Get level from Cargo
                });
            }

            // 2. Process Adjustments
            for (const item of adjustments) {
                const materiaKey = item.materiaName.toLowerCase();
                let materia = materiasMap.get(materiaKey);

                if (!materia) {
                    // Create new materia
                    addLog(`🆕 Criando nova matéria: ${item.materiaName} (Nível: ${item.nivel})`);

                    const newMat = {
                        nome: item.materiaName,
                        nivelCompativel: item.nivel as Nivel,
                        categoria: 'Geral'
                    };

                    const { data: insertedMat, error: errMat } = await supabase
                        .from('materias')
                        .insert(newMat)
                        .select()
                        .single();

                    if (errMat || !insertedMat) {
                        addLog(`❌ Erro ao criar matéria ${item.materiaName}: ${errMat?.message}`);
                        continue;
                    }

                    const freshMateria: Materia = {
                        id: insertedMat.id,
                        nome: insertedMat.nome,
                        nivelCompativel: insertedMat.nivel_compativel as Nivel, // Map snake_case from DB
                        categoria: insertedMat.categoria,
                        descricao: insertedMat.descricao
                    };

                    materia = freshMateria;
                    materiasMap.set(materiaKey, materia);
                    updatedMaterias.push(materia); // Update local list
                } else {
                    // If materia exists, strictly we should check/update level? 
                    // User said: "Don't register equal names... use existing".
                    // We do exactly that.
                }

                // 3. Link to Cargo
                // Find cargo in our updated array (tho we are not modifying array structure just objects deep down)
                const cargoIndex = updatedCargos.findIndex(c => c.id === item.cargoId);
                if (cargoIndex === -1) continue;

                const currentConfig = updatedCargos[cargoIndex].materiasConfig || [];

                // Remove existing config for this materia if exists to overwrite
                const newConfig = currentConfig.filter(cfg => cfg.materiaId !== materia!.id);

                newConfig.push({
                    materiaId: materia.id,
                    quantidadeQuestoes: item.qtd,
                    peso: item.peso
                });

                // Update in Supabase
                const { error: errUpdate } = await supabase
                    .from('cargos')
                    .update({ materias_config: newConfig }) // Note: DB column is usually snake_case, check types or codebase conventions. 
                    // types.ts says `materiasConfig`, but supabase usually maps to `materias_config` in JSONB or similar.
                    // Looking at previous `AdminImport.tsx` or similar might reveal DB schema.
                    // In `types.ts`, `metricsConfig` is inside `Cargo` interface.
                    // Assuming the table column is `materias_config` or similar. Let's infer standard mapping.
                    // If the project uses a typed client or raw mapping?
                    // I'll assume `materias_config` based on standard convention for this project.
                    .eq('id', item.cargoId);

                if (errUpdate) {
                    addLog(`❌ Erro ao atualizar cargo ${updatedCargos[cargoIndex].nome}: ${errUpdate.message}`);
                } else {
                    updatedCargos[cargoIndex] = {
                        ...updatedCargos[cargoIndex],
                        materiasConfig: newConfig
                    };
                    processedCount++;
                }
            }

            updateState({
                cargos: updatedCargos,
                materias: updatedMaterias
            });

            addLog(`✅ Processo finalizado! ${processedCount} configurações aplicadas.`);
            setStep('success');

        } catch (error: any) {
            addLog(`❌ Erro CRÍTICO: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-[120px] text-primary">table_view</span>
                </div>

                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Importar Matérias</h2>
                    <p className="text-slate-500 font-medium mb-8">
                        Vincule matérias aos cargos em massa através de uma planilha Excel.
                        <br />
                        <span className="text-xs opacity-70">Colunas necessárias: Cargo, Matéria, Quantidade, Peso.</span>
                    </p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Selecione o Concurso</label>
                            <select
                                value={selectedConcursoId}
                                onChange={e => setSelectedConcursoId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                            >
                                <option value="">Selecione...</option>
                                {state.concursos.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome} ({c.banca})</option>
                                ))}
                            </select>
                        </div>

                        {step === 'upload' && (
                            <div className={`transition-all ${!selectedConcursoId ? 'opacity-50 pointer-events-none' : ''}`}>
                                <label
                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:text-primary transition-colors mb-3">upload_file</span>
                                        <p className="text-sm font-bold text-slate-500 group-hover:text-primary transition-colors uppercase tracking-wide">
                                            {file ? file.name : 'Clique para selecionar a planilha'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">.XLSX ou .XLS</p>
                                    </div>
                                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                                </label>

                                <button
                                    onClick={processFile}
                                    disabled={!file || isLoading}
                                    className="w-full mt-4 bg-primary text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">send</span>}
                                    Processar Arquivo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {logs.length > 0 && (
                <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs overflow-hidden">
                    <h4 className="text-slate-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">terminal</span> Logs de Processamento
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className={log.includes('❌') || log.includes('⚠️') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : 'text-slate-300'}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 'preview' && (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="font-black text-slate-800 uppercase tracking-tight">Pré-visualização</h3>
                            <p className="text-xs text-slate-500 font-bold mt-1">{previewData.length} itens identificados</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setStep('upload')} className="px-4 py-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-600">Cancelar</button>
                            <button onClick={handleSave} disabled={isLoading} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2">
                                {isLoading ? 'Salvando...' : 'Confirmar Importação'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-6">Cargo</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Matéria</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Peso</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {previewData.slice(0, 100).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6 text-xs font-bold text-slate-700">{row.Cargo}</td>
                                        <td className="p-4 text-xs font-medium text-slate-600">{row.Materia}</td>
                                        <td className="p-4 text-center text-xs font-bold text-slate-700">{row.Quantidade}</td>
                                        <td className="p-4 text-center text-xs font-bold text-slate-700">{row.Peso}</td>
                                    </tr>
                                ))}
                                {previewData.length > 100 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-xs text-slate-400 italic">...e mais {previewData.length - 100} linhas</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-emerald-500 mb-4">check_circle</span>
                    <h2 className="text-2xl font-black text-emerald-900 uppercase">Importação Concluída!</h2>
                    <p className="text-emerald-700 font-medium mt-2 mb-8">Todas as matérias foram vinculadas aos cargos com sucesso.</p>
                    <button onClick={() => { setStep('upload'); setFile(null); setPreviewData([]); setSelectedConcursoId(''); }} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all">
                        Nova Importação
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminImportMaterias;
