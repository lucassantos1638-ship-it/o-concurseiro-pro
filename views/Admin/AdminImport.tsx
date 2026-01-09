
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AppState, Cargo, Nivel } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AdminImportProps {
    state: AppState;
    updateState: (newState: Partial<AppState>) => void;
}

const AdminImport: React.FC<AdminImportProps> = ({ state, updateState }) => {
    const [selectedConcursoId, setSelectedConcursoId] = useState<string>('');
    const [parsedCargos, setParsedCargos] = useState<Partial<Cargo>[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConcursoId) return;

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

                const firstRow = rows[0];
                const hasHeader = firstRow.some(cell =>
                    typeof cell === 'string' &&
                    (cell.toLowerCase().includes("nivel") || cell.toLowerCase().includes("nível") || cell.toLowerCase().includes("cargo"))
                );

                const dataRows = hasHeader ? rows.slice(1) : rows;

                const cargos: Partial<Cargo>[] = dataRows.map(cols => {
                    const vAmplas = parseInt(cols[2]) || 0;
                    const vCR = parseInt(cols[3]) || 0;
                    const vPcd = parseInt(cols[4]) || 0;

                    const totalInformado = parseInt(cols[5]);
                    const total = isNaN(totalInformado) ? (vAmplas + vCR + vPcd) : totalInformado;

                    let nivelVal = Nivel.Superior;
                    const rawNivel = cols[0]?.toString().toLowerCase() || '';
                    if (rawNivel.includes('fundamental')) nivelVal = Nivel.Fundamental;
                    else if (rawNivel.includes('medio') || rawNivel.includes('médio')) nivelVal = Nivel.Medio;

                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        nivel: nivelVal,
                        nome: cols[1]?.toString() || 'Cargo não identificado',
                        vagasAmplas: vAmplas,
                        vagasCR: vCR,
                        vagasPcd: vPcd,
                        totalVagas: total,
                        salario: formatCurrency(cols[6]),
                        cargaHoraria: cols[7]?.toString() || 'Conforme Edital',
                        requisitos: cols[8]?.toString() || '',
                        materiasConfig: []
                    };
                });

                const validCargos = cargos.filter(c => c.nome && c.nome !== 'Cargo não identificado');
                setParsedCargos(validCargos);
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

    const handleSaveAll = () => {
        if (!selectedConcursoId || parsedCargos.length === 0) return;

        const newCargos: Cargo[] = parsedCargos.map(p => ({
            ...p,
            concursoId: selectedConcursoId,
        } as Cargo));

        updateState({ cargos: [...state.cargos, ...newCargos] });
        setImportStatus('success');
        setParsedCargos([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setImportStatus('idle'), 3000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* 1. SELEÇÃO DO CONCURSO */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-9xl">account_balance</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">1. Selecione o Edital</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">O Concurso deve ser selecionado antes do envio do arquivo.</p>
                    </div>
                    <div className="w-full md:w-96">
                        <select
                            value={selectedConcursoId}
                            onChange={e => {
                                setSelectedConcursoId(e.target.value);
                                setParsedCargos([]);
                            }}
                            className="w-full border-2 border-slate-100 p-5 rounded-[24px] bg-slate-50 text-slate-900 font-black text-sm outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                        >
                            <option value="">Escolher Concurso Alvo...</option>
                            {state.concursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. UPLOAD DE ARQUIVO */}
            <div className={`bg-white p-12 rounded-[40px] border-2 border-dashed transition-all duration-500 ${!selectedConcursoId ? 'opacity-20 grayscale cursor-not-allowed' : 'border-slate-200 hover:border-primary bg-slate-50/30'}`}>
                <div className="flex flex-col items-center justify-center text-center space-y-8">
                    <div className="h-24 w-24 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <span className="material-symbols-outlined text-5xl">upload_file</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">2. Envie o Arquivo da Planilha</h4>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Formatos Suportados: .XLSX, .XLS, .CSV, .TXT</p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-upload"
                        disabled={!selectedConcursoId}
                    />
                    <label
                        htmlFor="excel-upload"
                        className={`flex items-center gap-3 px-16 py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-2xl active:scale-95 ${selectedConcursoId
                                ? 'bg-slate-900 text-white cursor-pointer hover:bg-primary shadow-slate-900/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <span className="material-symbols-outlined">attach_file</span>
                        Selecionar Planilha do Excel
                    </label>

                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm w-full max-w-4xl">
                        <p className="text-[9px] font-black text-slate-300 uppercase mb-4 tracking-widest text-center">Estrutura Esperada (Colunas A até I)</p>
                        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                            {[
                                'Nível', 'Cargo', 'Ampla', 'CR', 'PCD',
                                'Total', 'Salário', 'Carga H.', 'Requisitos'
                            ].map(col => (
                                <div key={col} className="bg-slate-50 border border-slate-100 py-2 rounded-xl text-[8px] font-black text-slate-500 uppercase flex items-center justify-center">{col}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. PREVIEW E SALVAMENTO */}
            {parsedCargos.length > 0 && (
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-lg">
                                {parsedCargos.length}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Preview da Importação</h4>
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-tighter">Os valores de salário foram formatados automaticamente.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveAll}
                            className="w-full md:w-auto bg-emerald-600 text-white px-12 py-5 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined">save</span>
                            Gravar no Banco de Dados
                        </button>
                    </div>

                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-20">
                                <tr>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Nível</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Cargo</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b text-center">Vagas Totais</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Salário</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Carga H.</th>
                                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">Requisitos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedCargos.map((cargo, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-6 text-[10px] font-black text-primary border-b uppercase">{cargo.nivel}</td>
                                        <td className="p-6 text-sm font-bold text-slate-800 border-b uppercase">{cargo.nome}</td>
                                        <td className="p-6 text-sm font-black text-slate-900 border-b text-center">{cargo.totalVagas}</td>
                                        <td className="p-6 text-sm font-black text-emerald-600 border-b whitespace-nowrap">{cargo.salario}</td>
                                        <td className="p-6 text-[11px] font-black text-slate-500 border-b uppercase">{cargo.cargaHoraria}</td>
                                        <td className="p-6 text-[10px] font-medium text-slate-400 border-b max-w-[180px] truncate" title={cargo.requisitos}>{cargo.requisitos || '-'}</td>
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
                        <p className="text-[10px] font-bold opacity-80 uppercase mt-1 tracking-widest">Os dados foram importados e formatados corretamente.</p>
                    </div>
                </div>
            )}

            {importStatus === 'error' && (
                <div className="bg-red-500 text-white p-8 rounded-[40px] flex items-center gap-6 animate-in slide-in-from-top-6 shadow-2xl">
                    <span className="material-symbols-outlined text-4xl">report_problem</span>
                    <div>
                        <p className="font-black uppercase text-sm tracking-widest">Erro na Importação</p>
                        <p className="text-[10px] font-bold opacity-80 uppercase mt-1 tracking-widest">Não conseguimos processar o arquivo. Tente salvar como CSV ou .XLSX simples.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminImport;
