
import React from 'react';
import { AppState } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface MyCargosProps {
  state: AppState;
  onSelectCargo?: (id: string) => void;
}

const UserCargos: React.FC<MyCargosProps> = ({ state, onSelectCargo }) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myCargos.map(cargo => {
            const concurso = state.concursos?.find(c => c.id === cargo.concursoId);
            return (
              <div key={cargo.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                <div className="h-32 bg-slate-100 relative overflow-hidden shrink-0">
                  {concurso?.imageUrl ? (
                    <img src={concurso.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt="Capa" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-blue-50"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent"></div>
                  <div className="absolute bottom-4 left-6">
                    <span className="bg-primary text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">Nível {cargo.nivel}</span>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h3 className="font-black text-slate-900 text-xl leading-tight uppercase mb-2 group-hover:text-primary transition-colors">{cargo.nome}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{concurso?.nome || 'Concurso Selecionado'}</p>

                  <div className="mt-6 space-y-3 flex-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400 uppercase">Salário</span>
                      <span className="text-emerald-600 font-black">{formatCurrency(cargo.salario)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400 uppercase">Matérias</span>
                      <span className="text-slate-700 font-black">{cargo.materiasConfig?.length || 0} no Edital</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCargo?.(cargo.id)}
                    className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-primary hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                    Simulado
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
