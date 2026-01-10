
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const AuthView: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        }
                    }
                });
                if (signUpError) throw signUpError;

                if (data.session) {
                    // Sessão criada imediatamente (auto-confirm off)
                    // App.tsx vai redirecionar automaticamente
                } else {
                    // Confirmação de email necessária ou login manual
                    setSuccess('Conta criada! Faça login com suas credenciais.');
                    setIsLogin(true);
                    setPassword('');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f8fafc] items-center justify-center p-6 relative overflow-hidden">
            {/* Elementos Decorativos de Fundo */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-[380px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-white shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] border border-slate-100 mb-4 group transition-transform hover:scale-110">
                        <span className="material-symbols-outlined text-3xl text-primary font-bold fill-1 group-hover:rotate-12 transition-transform">school</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Concurseiro <span className="text-primary">PRO</span></h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Plataforma de Estudos Avançada</p>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-[32px] shadow-[0_45px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-100/50 backdrop-blur-sm relative overflow-hidden group">


                    <div className="flex gap-2 mb-6 bg-slate-50 p-1 rounded-[20px] border border-slate-100 relative z-20">
                        <button
                            onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
                            className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
                            className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Cadastrar
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-3">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                <div className="relative group/input">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors">person</span>
                                    <input
                                        type="text"
                                        placeholder="Seu nome"
                                        required={!isLogin}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-[18px] text-xs focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Institucional</label>
                            <div className="relative group/input">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors">mail</span>
                                <input
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-[18px] text-xs focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                                {isLogin && <button type="button" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Esqueceu?</button>}
                            </div>
                            <div className="relative group/input">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors">lock</span>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-[22px] text-sm focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                                />
                            </div>
                        </div>


                        {error && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <span className="material-symbols-outlined text-red-500 text-sm">report</span>
                                <p className="text-[11px] font-black text-red-600 leading-tight uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                <p className="text-[11px] font-black text-green-600 leading-tight uppercase tracking-tight">{success}</p>
                            </div>
                        )}

                        <button
                            disabled={isLoading}
                            type="submit"
                            className="w-full bg-slate-900 text-white p-3.5 rounded-[20px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-[0.98] hover:bg-primary hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isLogin ? 'Entrar' : 'Começar'}
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-6">
                    © 2026 Concurseiro PRO — Segurança por <strong>Supabase Auth</strong>
                </p>
            </div>
        </div>
    );
};

export default AuthView;
