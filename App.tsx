
import React, { useState, useEffect } from 'react';
import { AppState, Cargo, Materia, UserProfile } from './types';
import { INITIAL_STATE } from './constants';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import AuthView from './views/Auth/AuthView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UserDashboard from './views/User/Dashboard';
import UserConcursos from './views/User/Concursos';
import UserCargos from './views/User/MyCargos';
import UserDesempenho from './views/User/Desempenho';
import UserRanking from './views/User/Ranking';
import UserProfileView from './views/User/Profile';
import SimuladoCargoView from './views/User/SimuladoCargoView';
import SimuladoQuestaoView from './views/User/SimuladoQuestaoView';
import UserQuestoes from './views/User/Questoes';
import ProGuard from './components/ProGuard';
import AdminLayout from './views/Admin/AdminLayout';
import ChatPanel from './components/ChatPanel';
import { useUserData } from './hooks/useUserData';
import { useRanking } from './hooks/useRanking';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [simuladoCargoId, setSimuladoCargoId] = useState<string | null>(null);
  const [simuladoMateriaId, setSimuladoMateriaId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  // Filtros para o modo "Questões"
  const [questoesFilters, setQuestoesFilters] = useState<{ banca?: string, ano?: string, nivel?: string } | undefined>(undefined);

  // Efeito dedicado para resetar o estado quando o usuário muda (Login)
  useEffect(() => {
    if (session?.user?.id) {
      setActiveTab('dashboard');
      setSimuladoCargoId(null);
      setSimuladoMateriaId(null);
      setIsAnswering(false);
      setIsChatOpen(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    // 1. Verificar sessão atual ao carregar
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsLoadingAuth(false);
    });

    // 2. Ouvir mudanças na autenticação (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);

      if (currentSession?.user) {
        if (currentSession.user.email !== 'lucassantos1638@gmail.com') {
          setIsAdmin(false);
        }
      } else {
        // Usuário deslogou: Limpar todo o estado visual
        setIsAdmin(false);
        setActiveTab('dashboard');
        setSimuladoCargoId(null);
        setSimuladoMateriaId(null);
        setIsAnswering(false);
        setIsChatOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* Hooks de Dados (Sincronizados com Supabase) */
  const { profile, progress, myCargosIds, loading: loadingData, updateProfile, updateMyCargos, updateProgress } = useUserData(session);
  const { ranking } = useRanking();

  // Sincronizar dados do Hook com o AppState Local
  useEffect(() => {
    setState(prev => ({
      ...prev,
      userProfile: profile,
      userProgress: progress,
      myCargosIds: myCargosIds,
      ranking: ranking
    }));
  }, [profile, progress, myCargosIds, ranking]);

  const handleUpdateState = (newState: Partial<AppState>) => {
    // Interceptar atualizações para persistir no banco
    if (newState.userProfile) updateProfile(newState.userProfile);
    if (newState.userProgress) updateProgress(newState.userProgress);
    if (newState.myCargosIds) updateMyCargos(newState.myCargosIds);

    // Atualiza localstate visualmente
    setState(prev => ({ ...prev, ...newState }));
  };

  const renderContent = () => {
    if (!state) return null;

    if (isAdmin && isUserAdmin) {
      return (
        <AdminLayout
          state={state}
          updateState={handleUpdateState}
          onExitAdmin={() => setIsAdmin(false)}
        />
      );
    }

    if (isAnswering && simuladoMateriaId && (simuladoCargoId || activeTab === 'questoes')) {
      return (
        <SimuladoQuestaoView
          state={state}
          cargoId={simuladoCargoId}
          materiaId={simuladoMateriaId}
          filters={questoesFilters}
          onFinish={(newResults) => {
            if (newResults.length > 0) {
              const currentHistory = state.userProgress.history || [];

              // Adiciona cargoId aos resultados se existir
              const resultsWithMetadata = newResults.map(r => ({
                ...r,
                cargoId: simuladoCargoId || undefined
              }));

              const updatedHistory = [...currentHistory, ...resultsWithMetadata];

              // Estima horas (ex: 3 min por questão) - Conta para tudo
              const addedHours = (newResults.length * 3) / 60;
              const newHours = Number((state.userProgress.hoursStudied + addedHours).toFixed(2));

              // Lógica de Ranking: Só atualiza stats agregados se for de um Cargo
              let newQuestionsResolved = state.userProgress.questionsResolved;
              let newAccuracyRate = state.userProgress.accuracyRate;

              if (simuladoCargoId) {
                // Cálculo para Ranking (baseado apenas em questões de cargo?)
                // A lógica atual do Ranking usa 'questionsResolved' e 'accuracyRate' do banco.
                // Se quisermos que o ranking só considere questões de cargo, devemos atualizar esses campos APENAS quando for cargo.

                // Opção: Recalcular baseando-se apenas no histórico que tem cargoId?
                // Ou simplesmente incrementar se estamos num cargo.
                // Vamos incrementar. Sendo assim, 'questionsResolved' no banco vira "Questões de Cargo Resolvidas".

                newQuestionsResolved = state.userProgress.questionsResolved + newResults.length;

                // Recalcula acurácia geral (considerando histórico todo ou apenas incremento? Idealmente todo o histórico relevante)
                // Para simplificar e manter consistência com o que já existe:
                // Vamos recalcular baseado em TUDO que conta para ranking (ou seja, tudo que tem cargoId + novos)
                // Se o histórico antigo não tiver cargoId (legado), assumimos que conta ou não? 
                // Assumindo que o estado anterior 'questionsResolved' já era "Ranking Stats".

                const totalCorrectPreviously = (state.userProgress.questionsResolved * state.userProgress.accuracyRate) / 100;
                const newCorrect = newResults.filter(r => r.acertou).length;
                const totalCorrect = totalCorrectPreviously + newCorrect;

                newAccuracyRate = newQuestionsResolved > 0
                  ? Number(((totalCorrect / newQuestionsResolved) * 100).toFixed(1))
                  : 0;
              }

              handleUpdateState({
                userProgress: {
                  ...state.userProgress,
                  questionsResolved: newQuestionsResolved,
                  hoursStudied: newHours,
                  accuracyRate: newAccuracyRate,
                  history: updatedHistory
                }
              });
            }
            setIsAnswering(false);
            setSimuladoMateriaId(null);
            // Se estiver no modo questões, limpa os filtros ao terminar
            if (activeTab === 'questoes') {
              setQuestoesFilters(undefined);
            }
          }}
        />
      );
    }

    if (simuladoCargoId && !isAnswering) {
      return (
        <SimuladoCargoView
          state={state}
          cargoId={simuladoCargoId}
          onBack={() => setSimuladoCargoId(null)}
          onStart={(materiaId) => {
            setSimuladoMateriaId(materiaId);
            setIsAnswering(true);
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <UserDashboard state={state} setActiveTab={setActiveTab} />;
      case 'ranking':
        return <UserRanking state={state} />;
      case 'concursos':
        return <UserConcursos
          state={state}
          setActiveTab={setActiveTab}
          onToggleMyCargo={(id) => {
            const exists = state.myCargosIds.includes(id);
            const newIds = exists
              ? state.myCargosIds.filter(i => i !== id)
              : [...state.myCargosIds, id];
            handleUpdateState({ myCargosIds: newIds });
          }}
        />;
      case 'meus-cargos':
        return (
          <ProGuard state={state} title="Meus Cargos">
            <UserCargos state={state} onSelectCargo={(id) => setSimuladoCargoId(id)} />
          </ProGuard>
        );
      case 'questoes':
        return (
          <ProGuard state={state} title="Banco de Questões">
            <UserQuestoes
              state={state}
              onStart={(materiaId, filters) => {
                setSimuladoMateriaId(materiaId);
                setQuestoesFilters(filters);
                setIsAnswering(true);
              }}
            />
          </ProGuard>
        );
      case 'desempenho':
        return <UserDesempenho state={state} />;
      case 'perfil':
        return (
          <UserProfileView
            state={state}
            updateProfile={(profile) => handleUpdateState({ userProfile: profile })}
          />
        );
      default:
        return (
          <div className="flex h-full items-center justify-center p-10 text-slate-400 font-bold uppercase tracking-widest text-center">
            Módulo em desenvolvimento
          </div>
        );
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  const isUserAdmin = session.user.email === 'lucassantos1638@gmail.com';

  return (
    <div className="flex h-screen bg-[#f6f6f8] overflow-hidden font-sans">
      {!isAdmin && (
        <>
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setSimuladoCargoId(null);
              setIsAnswering(false);
              setIsSidebarOpen(false);
            }}
            onAdminClick={() => {
              setIsAdmin(true);
              setIsSidebarOpen(false);
            }}
            onLogout={() => supabase.auth.signOut()}
            isOpen={isSidebarOpen}
            showAdmin={isUserAdmin}
            plan={state.userProfile.plan}
          />
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {!isAdmin && (
          <Header
            activeTab={activeTab}
            onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)}
            profile={state.userProfile}
            onProfileClick={() => setActiveTab('perfil')}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>

        {!isAdmin && (
          <>
            <button
              onClick={() => {
                const newOpenState = !isChatOpen;
                setIsChatOpen(newOpenState);
                if (newOpenState) {
                  setUnreadCount(0); // Zera contador ao abrir
                }
              }}
              className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all group"
            >
              <span className="material-symbols-outlined text-2xl">
                {isChatOpen ? 'close' : 'forum'}
              </span>

              {/* Notifier Badge */}
              {!isChatOpen && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}

              {/* PRO Badge */}
              {state.userProfile.plan === 'free' && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest shadow-sm border-2 border-white whitespace-nowrap">
                  PRO
                </span>
              )}
            </button>

            {/* ChatPanel renderizado sempre para manter conexão socket ativa, apenas oculto visualmente */}
            <div className={!isChatOpen ? 'hidden' : ''}>
              <ChatPanel
                key={session?.user?.id || 'no-user'}
                state={state}
                onClose={() => setIsChatOpen(false)}
                setActiveTab={setActiveTab}
                onUnreadMessage={() => {
                  // Só conta se o chat estiver fechado
                  if (!isChatOpen) {
                    setUnreadCount(prev => prev + 1);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
