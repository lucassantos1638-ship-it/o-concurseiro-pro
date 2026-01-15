import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AppState, Cargo, Nivel, Concurso, StatusConcurso } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';

interface AdminImportProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
}

const AdminImport: React.FC<AdminImportProps> = ({ state, updateState }) => {
    const [selectedConcursoId, setSelectedConcursoId] = useState<string>('');
    const [parsedCargos, setParsedCargos] = useState<Partial<Cargo>[]>([]);
    const [parsedConcurso, setParsedConcurso] = useState<Partial<Concurso> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [mode, setMode] = useState<'existing' | 'new'>('new'); // Default to new (Flat Excel)
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseDate = (value: any): string => {
        if (!value) return '';
        // Handle Excel serial date
        if (typeof value === 'number') {
            const date = new Date(Math.round((value - 25569) * 86400 * 1000));
            return date.toISOString().split('T')[0];
        }
        // Handle string DD/MM/YYYY
        if (typeof value === 'string') {
            const parts = value.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        return String(value);
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // If mode is existing, we need a selected ID
        if (mode === 'existing' && !selectedConcursoId) return;

        setIsProcessing(true);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (rows.length === 0) {
                    setIsProcessing(false);
                    return;
                }

                // Identify Header Row (Look for "Cargo" or "Nome do concurso")
                const headerRowIndex = rows.findIndex(row => row.some((cell: any) =>
                    typeof cell === 'string' && (cell.toLowerCase().includes('cargo') || cell.toLowerCase().includes('concurso'))
                ));

                if (headerRowIndex === -1) {
                    throw new Error("Cabeçalho não encontrado.");
                }

                const headerRow = rows[headerRowIndex].map((h: any) => h?.toString().toLowerCase().trim());
                const dataRows = rows.slice(headerRowIndex + 1);

                // Map columns
                const getColIdx = (term: string) => headerRow.findIndex((h: string) => h.includes(term));

                const idxNomeConcurso = getColIdx('nome do concurso');
                const idxBanca = getColIdx('banca');
                const idxOrgao = getColIdx('órgão') > -1 ? getColIdx('órgão') : getColIdx('orgao');
                const idxNivel = getColIdx('nivel') > -1 ? getColIdx('nivel') : getColIdx('nível');
                const idxCargo = getColIdx('cargo'); // careful not to match 'carga'
                const idxAmpla = getColIdx('ampla');
                const idxPCD = getColIdx('pcd');
                const idxPN = getColIdx('pn') > -1 ? getColIdx('pn') : (getColIdx('negro') > -1 ? getColIdx('negro') : getColIdx('cota'));
                const idxCR = getColIdx('reserva');
                const idxTotal = getColIdx('total de vagas');
                const idxSalario = getColIdx('salário') > -1 ? getColIdx('salário') : getColIdx('salario');
                const idxCargaHoraria = getColIdx('carga horária') > -1 ? getColIdx('carga horária') : getColIdx('carga horaria');
                const idxRequisitos = getColIdx('requisitos');
                const idxCidade = getColIdx('cidade');
                const idxInicio = getColIdx('inicio') > -1 ? getColIdx('inicio') : getColIdx('início');
                const idxFim = getColIdx('fim');
                const idxProva = getColIdx('data da prova');

                // Extract Concurso Metadata (from first valid row)
                if (mode === 'new' && dataRows.length > 0) {
                    const r = dataRows[0];
                    if (r[idxNomeConcurso]) {
                        setParsedConcurso({
                            id: Math.random().toString(36).substr(2, 9),
                            nome: r[idxNomeConcurso],
                            banca: r[idxBanca],
                            orgao: r[idxOrgao],
                            status: StatusConcurso.EditalPublicado,
                            cidades: r[idxCidade] ? [r[idxCidade]] : [],
                            datas: {
                                inscricaoInicio: parseDate(r[idxInicio]),
                                inscricaoFim: parseDate(r[idxFim]),
                                prova: parseDate(r[idxProva])
                            },
                        });
                    }
                }

                // Extract Cargos
                const cargos: Partial<Cargo>[] = dataRows.map(cols => {
                    if (!cols[idxCargo]) return null;

                    const vAmplas = parseInt(cols[idxAmpla]) || 0;
                    const vCR = parseInt(cols[idxCR]) || 0;
                    const vPcd = parseInt(cols[idxPCD]) || 0;
                    const vPn = parseInt(cols[idxPN]) || 0;
                    const totalInformado = parseInt(cols[idxTotal]);
                    const total = isNaN(totalInformado) ? (vAmplas + vCR + vPcd + vPn) : totalInformado;

                    let nivelVal = Nivel.Superior;
                    const rawNivel = cols[idxNivel]?.toString().toLowerCase() || '';
                    if (rawNivel.includes('fundamental')) nivelVal = Nivel.Fundamental;
                    else if (rawNivel.includes('medio') || rawNivel.includes('médio')) nivelVal = Nivel.Medio;

                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        nivel: nivelVal,
                        nome: cols[idxCargo]?.toString() || 'Cargo não identificado',
                        vagasAmplas: vAmplas,
                        vagasCR: vCR,
                        vagasPcd: vPcd,
                        vagasPn: vPn,
                        totalVagas: total,
                        salario: cols[idxSalario]?.toString() || '',
                        cargaHoraria: cols[idxCargaHoraria]?.toString() || '40h',
                        requisitos: cols[idxRequisitos]?.toString() || '',
                        materiasConfig: []
                    };
                }).filter(Boolean) as Partial<Cargo>[];

                setParsedCargos(cargos);
                setIsProcessing(false);
            } catch (err) {
                console.error("Erro ao processar arquivo:", err);
                setImportStatus('error');
                setIsProcessing(false);
            }
        };

        reader.onerror = () => {
            setImportStatus('error');
            setIsProcessing(false);
        };

        reader.readAsArrayBuffer(file);
    };

    const handleSaveAll = async () => {
        if (parsedCargos.length === 0) return;

        try {
            setIsProcessing(true);
            let targetConcursoId = selectedConcursoId;

            // 1. Create Concurso if New Mode
            if (mode === 'new' && parsedConcurso) {
                targetConcursoId = parsedConcurso.id!;
                const { error: errConc } = await supabase.from('concursos').insert({
                    id: targetConcursoId,
                    nome: parsedConcurso.nome,
                    banca: parsedConcurso.banca || '',
                    orgao: parsedConcurso.orgao || '',
                    status: parsedConcurso.status,
                    cidades: parsedConcurso.cidades,
                    data_inscricao_inicio: parsedConcurso.datas?.inscricaoInicio || null,
                    data_inscricao_fim: parsedConcurso.datas?.inscricaoFim || null,
                    data_prova: parsedConcurso.datas?.prova || null,
                    total_vagas: parsedCargos.reduce((acc, curr) => acc + (curr.totalVagas || 0), 0)
                });
                if (errConc) throw errConc;

                // Update local state to include new Concurso
                updateState({ concursos: [...state.concursos, parsedConcurso as Concurso] });
            }

            if (!targetConcursoId) throw new Error("ID do Concurso não definido");

            // 2. Create Cargos
            const newCargos: Cargo[] = parsedCargos.map(p => ({
                ...p,
                concursoId: targetConcursoId,
            } as Cargo));

            for (const cargo of newCargos) {
                const { error: errCar } = await supabase.from('cargos').insert({
                    id: cargo.id,
                    concurso_id: cargo.concursoId,
                    nome: cargo.nome,
                    nivel: cargo.nivel,
                    vagas_amplas: cargo.vagasAmplas,
                    vagas_pcd: cargo.vagasPcd,
                    vagas_pn: cargo.vagasPn,
                    vagas_cr: cargo.vagasCR,
                    total_vagas: cargo.totalVagas,
                    salario: cargo.salario,
                    carga_horaria: cargo.cargaHoraria,
                    requisitos: cargo.requisitos
                });
                if (errCar) throw errCar;
            }

            // Update local state
            updateState({ cargos: [...state.cargos, ...newCargos] });

            setImportStatus('success');
            setParsedCargos([]);
            setParsedConcurso(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setTimeout(() => setImportStatus('idle'), 3000);

        } catch (error) {
            console.error("Erro ao salvar:", error);
            setImportStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header Section */}
            <div className="flex justify-center mb-6">
                <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm">
                    <button
                        onClick={() => { setMode('new'); setParsedCargos([]); setParsedConcurso(null); }}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'new' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Criar Concurso Completo
                    </button>
                    <button
                        onClick={() => { setMode('existing'); setParsedCargos([]); setParsedConcurso(null); }}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'existing' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Adicionar a Concurso Existente
                    </button>
                </div>
            </div>

            {/* 1. SELEÇÃO DO CONCURSO (Only for Existing Mode) */}
            {mode === 'existing' && (
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">1. Selecione o Edital</h3>
                    <select
                        value={selectedConcursoId}
                        onChange={e => setSelectedConcursoId(e.target.value)}
                        className="w-full border-2 border-slate-100 p-5 rounded-[24px] bg-slate-50 text-slate-900 font-black text-sm outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                    >
                        <option value="">Escolher Concurso Alvo...</option>
                        {state.concursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
            )}

            {/* 2. UPLOAD DE ARQUIVO */}
            <div className={`bg-white p-12 rounded-[40px] border-2 border-dashed transition-all duration-500 ${mode === 'existing' && !selectedConcursoId ? 'opacity-20 grayscale cursor-not-allowed' : 'border-slate-200 hover:border-primary bg-slate-50/30'}`}>
                <div className="flex flex-col items-center justify-center text-center space-y-8">
                    <div className="h-24 w-24 rounded-[32px] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                        <span className="material-symbols-outlined text-5xl">table_view</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Envie a Planilha (Excel)</h4>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Suporte a linhas combinadas: Concurso + Cargos</p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-upload"
                        disabled={mode === 'existing' && !selectedConcursoId}
                    />
                    <label
                        htmlFor="excel-upload"
                        className={`flex items-center gap-3 px-16 py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-2xl active:scale-95 ${(mode === 'new' || selectedConcursoId)
                            ? 'bg-slate-900 text-white cursor-pointer hover:bg-emerald-600 shadow-slate-900/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <span className="material-symbols-outlined">attach_file</span>
                        Selecionar Planilha do Excel
                    </label>
                </div>
            </div>

            {/* 3. PREVIEW */}
            {(parsedConcurso || parsedCargos.length > 0) && (
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="p-8 bg-slate-50 border-b">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-black text-slate-800 text-xl uppercase tracking-widest mb-1">Preview de Importação</h4>
                                <p className="text-slate-400 text-xs font-bold uppercase">Verifique os dados antes de gravar</p>
                            </div>
                            <button
                                onClick={handleSaveAll}
                                disabled={isProcessing}
                                className="bg-emerald-600 text-white px-12 py-4 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined">save</span>
                                {isProcessing ? 'Gravando...' : 'Gravar Tudo'}
                            </button>
                        </div>
                    </div>

                    {parsedConcurso && (
                        <div className="p-8 border-b grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
                            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                                <label className="text-[10px] font-black text-indigo-300 uppercase">Concurso</label>
                                <p className="font-bold text-indigo-900 text-lg">{parsedConcurso.nome}</p>
                                <p className="text-xs text-indigo-500 font-bold">{parsedConcurso.banca} • {parsedConcurso.orgao}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <label className="text-[10px] font-black text-slate-300 uppercase">Local & Vagas</label>
                                <p className="font-bold text-slate-900 text-lg">{parsedConcurso.cidades?.[0] || 'Nacional'}</p>
                                <p className="text-xs text-slate-500 font-bold">{parsedCargos.length} Cargos identificados</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <label className="text-[10px] font-black text-slate-300 uppercase">Cronograma</label>
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex justify-between text-xs font-medium text-slate-600"><span>Início:</span> <span>{parsedConcurso.datas?.inscricaoInicio || '-'}</span></div>
                                    <div className="flex justify-between text-xs font-medium text-slate-600"><span>Fim:</span> <span>{parsedConcurso.datas?.inscricaoFim || '-'}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-900"><span>Prova:</span> <span>{parsedConcurso.datas?.prova || '-'}</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-20 shadow-sm">
                                <tr>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Nível</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Cargo</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b text-center">Vagas</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Salário</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Requisitos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedCargos.map((cargo, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors border-b last:border-0">
                                        <td className="p-6 text-[10px] font-black text-primary uppercase">{cargo.nivel}</td>
                                        <td className="p-6 text-sm font-bold text-slate-800 uppercase">{cargo.nome}</td>
                                        <td className="p-6 text-sm font-black text-slate-900 text-center">
                                            {cargo.totalVagas}
                                            <span className="block text-[9px] text-slate-400 font-medium">
                                                {cargo.vagasAmplas} AC / {cargo.vagasPn} PN / {cargo.vagasCR} CR
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm font-black text-emerald-600 whitespace-nowrap">{cargo.salario}</td>
                                        <td className="p-6 text-[10px] font-medium text-slate-400 max-w-[200px] truncate" title={cargo.requisitos}>{cargo.requisitos || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {importStatus === 'success' && (
                <div className="bg-emerald-600 text-white p-8 rounded-[40px] flex items-center gap-6 animate-in slide-in-from-top-6 shadow-2xl">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                    <div>
                        <p className="font-black uppercase text-sm tracking-widest">Sucesso!</p>
                        <p className="text-[10px] font-bold opacity-80 uppercase mt-1 tracking-widest">Todos os dados foram importados e salvos.</p>
                    </div>
                </div>
            )}

            {importStatus === 'error' && (
                <div className="bg-red-500 text-white p-8 rounded-[40px] flex items-center gap-6 animate-in slide-in-from-top-6 shadow-2xl">
                    <span className="material-symbols-outlined text-4xl">report_problem</span>
                    <div>
                        <p className="font-black uppercase text-sm tracking-widest">Erro na Importação</p>
                        <p className="text-[10px] font-bold opacity-80 uppercase mt-1 tracking-widest">Verifique se as colunas correspondem ao modelo esperado.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminImport;
