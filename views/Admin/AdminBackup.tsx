
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminBackup() {
    const [loading, setLoading] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleBackup = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all data in parallel
            const [
                { data: concursos },
                { data: cargos },
                { data: materias },
                { data: questoes },
                { data: cargosMaterias }
            ] = await Promise.all([
                supabase.from('concursos').select('*'),
                supabase.from('cargos').select('*'),
                supabase.from('materias').select('*'),
                supabase.from('questoes').select('*'),
                supabase.from('cargos_materias').select('*')
            ]);

            const backupData = {
                timestamp: new Date().toISOString(),
                concursos: concursos || [],
                cargos: cargos || [],
                materias: materias || [],
                questoes: questoes || [],
                cargos_materias: cargosMaterias || []
            };

            // Create download blob
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-concurseiro-pro-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setLastBackup(new Date().toLocaleString('pt-BR'));
        } catch (err: any) {
            console.error('Backup error:', err);
            setError('Falha ao gerar backup. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Backup de Dados</h2>
                        <p className="text-slate-500 mt-1">Exporte todos os dados do sistema para segurança.</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="material-symbols-outlined text-blue-600 text-2xl">download</span>
                    </div>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 mb-8">
                    <p>
                        Esta ferramenta gera um arquivo JSON contendo:
                    </p>
                    <ul className="grid grid-cols-2 gap-2 list-none p-0 mt-4">
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Todos os Concursos
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Todos os Cargos
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Todas as Matérias
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Banco de Questões
                        </li>
                    </ul>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBackup}
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all transform active:scale-95 shadow-lg shadow-blue-500/30 ${loading
                            ? 'bg-blue-400 cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'
                            }`}
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                Gerando arquivo...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">download</span>
                                Baixar Backup Completo
                            </>
                        )}
                    </button>

                    {lastBackup && (
                        <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-left-4">
                            <span className="material-symbols-outlined">check_circle</span>
                            <span className="text-sm font-medium">Backup salvo: {lastBackup}</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                        <span className="material-symbols-outlined">error</span>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
