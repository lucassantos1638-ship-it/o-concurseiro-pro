import React from 'react';
import { AppState } from '../types';

interface ProGuardProps {
    state: AppState;
    children: React.ReactNode;
    title?: string;
}

const ProGuard: React.FC<ProGuardProps> = ({ state, children, title = 'Funcionalidade PRO' }) => {
    const isPro = state.userProfile.plan === 'pro';

    if (isPro) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full overflow-hidden rounded-3xl">
            {/* Conteúdo embaçado no fundo para dar gostinho */}
            <div className="absolute inset-0 blur-md opacity-50 pointer-events-none select-none grayscale">
                {children}
            </div>

            {/* Overlay de Bloqueio */}
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 p-6 text-center backdrop-blur-sm">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md border border-slate-100 flex flex-col items-center">
                    <div className="h-16 w-16 mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <span className="material-symbols-outlined text-3xl text-white">workspace_premium</span>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
                        Desbloqueie o {title}
                    </h3>

                    <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                        Esta funcionalidade é exclusiva para membros <span className="text-amber-500 font-bold">PRO</span>.
                        Atualize seu plano para ter acesso ilimitado a chats, questões e salvamento de cargos por apenas <span className="text-slate-800 font-black">R$ 19,90 mensais</span>.
                    </p>

                    <a
                        href="https://pay.kiwify.com.br/eqZiCEB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl py-4 font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">upgrade</span>
                        Atualizar Plano Agora
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ProGuard;
