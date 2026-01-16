
import React from 'react';

interface ConnectionErrorViewProps {
    onRetry: () => void;
    message?: string;
}

const ConnectionErrorView: React.FC<ConnectionErrorViewProps> = ({ onRetry, message }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8fafc] p-6 animate-in fade-in duration-500">
            <div className="max-w-md w-full bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-slate-100 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-red-500">wifi_off</span>
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Falha na Conexão</h2>

                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    {message || 'Não conseguimos carregar seus dados. Verifique sua conexão com a internet ou tente novamente em alguns instantes.'}
                </p>

                <button
                    onClick={onRetry}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    Tentar Novamente
                </button>
            </div>
        </div>
    );
};

export default ConnectionErrorView;
