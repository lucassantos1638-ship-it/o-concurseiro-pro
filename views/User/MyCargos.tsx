
import React from 'react';
import { AppState } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface MyCargosProps {
  state: AppState;
  onSelectCargo?: (id: string) => void;
  onRemoveCargo?: (id: string) => void;
}

const UserCargos: React.FC<MyCargosProps> = ({ state, onSelectCargo, onRemoveCargo }) => {
  // Defensive check for state
  if (!state || !state.cargos || !state.myCargosIds) {
    return (
      <div className="p-20 text-center flex flex-col items-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 animate-spin">sync</span>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando dados...</p>
      </div>
    );
  }

  const myCargos = state.cargos.filter(c => state.myCargosIds.includes(c.id));

  return (
    <div className="p-6 md:p-14 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Meus Planos</h2>
        <p className="text-slate-500 font-medium mt-1">Selecione um cargo para iniciar o treinamento direcionado.</p>
      </div>

      {myCargos.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">work_off</span>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhum plano selecionado</p>
          <p className="text-slate-300 text-xs mt-2 font-medium">Vá até a aba Concursos e escolha o cargo desejado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {myCargos.map(cargo => {
            const concurso = state.concursos?.find(c => c.id === cargo.concursoId);
            return (
              <div key={cargo.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-2 flex items-center gap-4 group hover:shadow-lg transition-all">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-[20px] bg-slate-100 relative overflow-hidden shrink-0">
                  {concurso?.imageUrl ? (
                    <img src={concurso.imageUrl} className="w-full h-full object-cover" alt="Capa" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-blue-50"></div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">Nível {cargo.nivel}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 py-2">
                  <h3 className="font-black text-slate-900 text-base md:text-lg leading-tight uppercase group-hover:text-primary transition-colors truncate">{cargo.nome}</h3>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest truncate">{concurso?.nome || 'Concurso Selecionado'}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-emerald-500">payments</span>
                      <span className="text-[10px] font-black text-slate-700">{formatCurrency(cargo.salario)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                      <span className="material-symbols-outlined text-[14px] text-primary">library_books</span>
                      <span className="text-[10px] font-black text-slate-700">{cargo.materiasConfig?.length || 0} Matérias</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 pr-2">
                  <button
                    onClick={() => onSelectCargo?.(cargo.id)}
                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    <span className="hidden md:inline">Continuar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja sair deste cargo? Seu progresso será mantido, mas ele sairá desta lista.')) {
                        onRemoveCargo?.(cargo.id);
                      }
                    }}
                    className="h-8 px-4 text-rose-500 hover:bg-rose-50 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Sair
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserCargos;
