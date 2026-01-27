
import React, { useState, useMemo } from 'react';
import { AppState, RankingEntry } from '../../types';

interface RankingProps {
  state: AppState;
}

const UserRanking: React.FC<RankingProps> = ({ state }) => {
  const [selectedCargoId, setSelectedCargoId] = useState<string>('all');

  // Cargos Filtrados (Apenas os que o usuário participa)
  const filteredCargos = useMemo(() => {
    return state.cargos.filter(c => state.myCargosIds.includes(c.id));
  }, [state.cargos, state.myCargosIds]);

  // Efeito para selecionar automaticamente o primeiro cargo se o atual não estiver na lista (ou for 'all')
  // Isso força a view a sempre mostrar um ranking relevante ou vazio se não tiver cargo
  React.useEffect(() => {
    if (filteredCargos.length > 0 && (selectedCargoId === 'all' || !filteredCargos.find(c => c.id === selectedCargoId))) {
      setSelectedCargoId(filteredCargos[0].id);
    }
  }, [filteredCargos, selectedCargoId]);

  const fullRanking = useMemo(() => {
    // Criamos uma entrada para o usuário atual baseada no progresso dele
    const myEntry: RankingEntry = {
      id: 'me',
      userName: state.userProfile.name,
      city: state.userProfile.city,
      state: state.userProfile.state,
      accuracyRate: state.userProgress.accuracyRate,
      questionsResolved: state.userProgress.questionsResolved,
      cargoId: selectedCargoId !== 'all' ? selectedCargoId : (state.myCargosIds[0] || 'none'),
      avatar: state.userProfile.profilePicture,
      age: state.userProfile.age,
      isPcd: state.userProfile.isPcd
    };

    // Combinamos o ranking existente com o usuário
    // IMPORTANTE: Primeiro removemos o usuário da lista vinda do servidor para evitar duplicidade ou dados desatualizados (ex: cargoId vazio)
    // Depois inserimos o usuário com os dados locais e o cargoId correto para este contexto.
    const listWithoutMe = state.ranking.filter(r => r.userName !== state.userProfile.name);

    // Adiciona eu mesmo na lista
    const list = [...listWithoutMe, myEntry];

    // Filtrar pelo cargo selecionado
    // Como removemos o 'all' de concurso, apenas validamos o cargo selecionado
    if (selectedCargoId !== 'all') {
      return list
        .filter(r => r.cargoId === selectedCargoId)
        .sort((a, b) => b.accuracyRate - a.accuracyRate);
    }

    // Fallback se nada selecionado (retorna vazio ou apenas meus cargos)
    // Se não tiver cargo selecionado (ex: 'all'), retornamos vazio.
    // O ranking só deve ser exibido PARA um cargo específico.
    return [];

  }, [state.ranking, state.userProfile, state.userProgress, selectedCargoId, state.myCargosIds]);

  const currentCargo = useMemo(() => {
    return state.cargos.find(c => c.id === selectedCargoId);
  }, [state.cargos, selectedCargoId]);

  const rankingFeedback = useMemo(() => {
    if (!currentCargo || fullRanking.length === 0) return null;

    // Filtro PCD se o usuário for PCD
    const isUserPcd = state.userProfile.isPcd;

    // Se usuário for PCD, o ranking de comparação deve ser apenas entre PCDs?
    // O usuário disse: "ranking dele vai aparecer do mesmo jeito" (aparece na lista geral),
    // MAS "vagas dele vai ser de acordo do numero de vagas para pcd".
    // Então para o FEEDBACK, calculamos a posição dele relativo apenas aos outros PCDs do ranking?
    // OU calculamos a posição dele no geral e comparamos com vagas PCD?
    // Geralmente concursos têm listas separadas. Se ele compete na lista PCD, a posição dele é X na lista PCD.
    // Vamos filtrar a lista para achar a "Posição PCD" dele.

    let effectiveRank: number;
    let vagasDisponiveis: number;
    let labelVagas: string;

    if (isUserPcd) {
      const pcdRanking = fullRanking.filter(r => r.isPcd);
      const myPcdIndex = pcdRanking.findIndex(r => r.userName === state.userProfile.name);

      if (myPcdIndex === -1) return null; // Deveria estar na lista

      effectiveRank = myPcdIndex + 1;
      vagasDisponiveis = currentCargo.vagasPcd;
      labelVagas = 'vagas PCD';
    } else {
      const myIndex = fullRanking.findIndex(r => r.userName === state.userProfile.name);
      if (myIndex === -1) return null;

      effectiveRank = myIndex + 1;
      vagasDisponiveis = currentCargo.vagasAmplas;
      labelVagas = 'vagas imediatas';
    }

    // CR é compartilhado ou específico? Vamos assumir que CR é geral ou proporcional. 
    // Para simplificar, usamos o CR total do cargo para o aviso de "zona de espera", 
    // mas comparando com rank efetivo + CR pode ser impreciso se CR for separado.
    // Vamos usar a lógica simples: Rank <= Vagas = Aprovado.

    const cadastroReserva = currentCargo.vagasCR; // CR Geral

    if (effectiveRank <= vagasDisponiveis) {
      return {
        type: 'success',
        style: 'bg-emerald-50 border-emerald-100 text-emerald-800',
        icon: 'trophy',
        title: `Parabéns! Você está em ${effectiveRank}º lugar ${isUserPcd ? '(Lista PCD)' : ''}!`,
        message: `Você está dentro das ${vagasDisponiveis} ${labelVagas}. Continue fazendo os simulados e mantenha sua posição de aprovação!`
      };
    } else if (effectiveRank <= vagasDisponiveis + cadastroReserva) {
      // Logic for CR Zone
      const isCrOnly = vagasDisponiveis === 0;

      return {
        type: 'warning',
        style: 'bg-amber-50 border-amber-100 text-amber-800',
        icon: 'trending_up',
        title: `Você está no Cadastro de Reserva (Posição ${effectiveRank}º ${isUserPcd ? 'PCD' : ''})`,
        message: isCrOnly
          ? `Este cargo é exclusivamente para Cadastro de Reserva. Você está bem posicionado na zona de espera. Continue estudando para garantir sua convocação!`
          : `Faltam poucas posições para entrar nas vagas diretas. Você está na zona do CR. Estude mais e melhore sua posição!`
      };
    } else {
      return {
        type: 'info',
        style: 'bg-slate-50 border-slate-200 text-slate-600',
        icon: 'school',
        title: `Sua posição atual é ${effectiveRank}º ${isUserPcd ? '(Lista PCD)' : ''}`,
        message: vagasDisponiveis === 0
          ? `Você está fora da zona de Cadastro de Reserva. Avance ${effectiveRank - cadastroReserva} posições para entrar na lista de espera.`
          : `Você está fora das vagas e do CR no momento. Lembre-se: este é um simulado com candidatos reais. Intensifique os estudos para subir no ranking!`
      };
    }
  }, [currentCargo, fullRanking, state.userProfile.name, state.userProfile.isPcd]);

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 antialiased pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Ranking de Elite</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Veja sua colocação entre os concorrentes do seu cargo cadastrados no O Concurseiro Pro.</p>
        </div>

        {/* Mostra posição apenas se tiver dados */}
        {fullRanking.length > 0 && fullRanking.find(r => r.userName === state.userProfile.name) && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">person_pin</span>
            <span className="text-xs font-bold uppercase tracking-widest">Sua Posição: #{fullRanking.findIndex(r => r.userName === state.userProfile.name) + 1}</span>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cargo (Meus Simulados)</label>
            <select
              value={selectedCargoId}
              onChange={(e) => setSelectedCargoId(e.target.value)}
              disabled={filteredCargos.length === 0}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
            >
              {filteredCargos.length === 0 ? (
                <option value="all">Nenhum cargo salvo nos favoritos</option>
              ) : (
                filteredCargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)
              )}
            </select>
          </div>
        </div>

        {currentCargo && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vagas Ampla</span>
                <span className="text-2xl font-black text-slate-800">{currentCargo.vagasAmplas}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vagas PCD</span>
                <span className="text-2xl font-black text-blue-600">{currentCargo.vagasPcd}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cadastro Reserva</span>
                <span className="text-2xl font-black text-slate-600">{currentCargo.vagasCR}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-visible group/info">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Total de Candidatos</span>
                  <span className="material-symbols-outlined text-[14px] text-slate-300 cursor-help hover:text-primary transition-colors">info</span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-800 text-white text-[10px] font-medium p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 pointer-events-none">
                    Total de candidatos cadastrados para este cargo no O Concurseiro Pro, e não no concurso oficial.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                  </div>
                </div>

                {state.userProfile.plan === 'pro' ? (
                  <span className="text-2xl font-black text-slate-400">{fullRanking.length}</span>
                ) : (
                  <div className="relative flex flex-col items-center justify-center w-full">
                    <span className="text-2xl font-black text-slate-400 blur-sm select-none opacity-50">{fullRanking.length}</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest shadow-sm transform scale-90">PRO</span>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {rankingFeedback && (
              <div className={`rounded-xl border p-4 flex gap-4 ${rankingFeedback.style}`}>
                <div className="shrink-0">
                  <span className="material-symbols-outlined text-3xl">{rankingFeedback.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1">{rankingFeedback.title}</h3>
                  <p className="text-sm font-medium opacity-90 leading-relaxed">{rankingFeedback.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Visualização Mobile (Cards conforme screenshot) */}
      <div className="flex flex-col gap-4 md:hidden">
        {fullRanking.map((entry, index) => {
          const isMe = entry.userName === state.userProfile.name;
          return (
            <div
              key={entry.id}
              className={`p-4 rounded-[20px] bg-white border border-slate-100 shadow-sm flex items-center gap-4 transition-all ${isMe ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' :
                index === 1 ? 'bg-slate-100 text-slate-600' :
                  index === 2 ? 'bg-orange-50 text-orange-600' :
                    'bg-slate-50 text-slate-400'
                }`}>
                {index + 1}
              </div>

              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-slate-100 shadow-sm">
                <img src={entry.avatar} className="w-full h-full object-cover" alt="" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-[13px] truncate">{entry.userName}</span>
                  {isMe && <span className="bg-primary text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase">VOCÊ</span>}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">
                    {entry.city.toUpperCase()} - {entry.state.toUpperCase()}
                  </p>
                  {entry.age && (
                    <>
                      <span className="text-[8px] text-slate-300">•</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{entry.age} ANOS</span>
                    </>
                  )}
                  {entry.isPcd && (
                    <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1.5 rounded ml-1">PCD</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-black text-primary leading-none">{entry.accuracyRate}%</p>
                <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{entry.questionsResolved} QS</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualização Desktop (Tabela) */}
      <div className="hidden md:block bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 text-center">Posição</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estudante</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Localização</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Idade</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Questões</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aproveitamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fullRanking.map((entry, index) => {
                const isMe = entry.userName === state.userProfile.name;
                const isTop3 = index < 3;

                return (
                  <tr key={entry.id} className={`hover:bg-slate-50/50 transition-colors group ${isMe ? 'bg-primary/[0.03]' : ''}`}>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${index === 0 ? 'bg-amber-100 text-amber-600 border-amber-200' :
                          index === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            index === 2 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              'bg-white text-slate-400 border-slate-100'
                          }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                          <img src={entry.avatar} className="h-full w-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isMe ? 'text-primary' : 'text-slate-800'}`}>
                            {entry.userName} {isMe && <span className="ml-2 text-[8px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">VOCÊ</span>}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                            {state.cargos.find(c => c.id === entry.cargoId)?.nome || 'Concurseiro'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-600">{entry.city}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.state}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-xs font-semibold text-slate-600">{entry.age ? `${entry.age} Anos` : '-'}</span>
                      {entry.isPcd && <div className="mt-1"><span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded">PCD</span></div>}
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-xs font-bold text-slate-500">{entry.questionsResolved.toLocaleString()}</span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-black ${isTop3 ? 'text-primary' : 'text-slate-700'}`}>{entry.accuracyRate}%</span>
                        <div className="w-24 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div className={`h-full ${isMe ? 'bg-primary animate-pulse' : 'bg-primary/60'}`} style={{ width: `${entry.accuracyRate}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {
        fullRanking.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl text-slate-100 mb-4">leaderboard</span>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Selecione um cargo acima para ver o ranking</p>
          </div>
        )
      }
    </div >
  );
};

export default UserRanking;
