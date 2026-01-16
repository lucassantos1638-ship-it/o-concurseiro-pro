
import React from 'react';

const PageLoading: React.FC = () => {
    return (
        <div className="flex h-full w-full items-center justify-center p-20">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Carregando...</p>
            </div>
        </div>
    );
};

export default PageLoading;
