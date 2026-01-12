
import React, { useState } from 'react';
import { AppState } from '../../types';

interface SimuladoCargoViewProps {
  state: AppState;
  cargoId: string;
  onBack: () => void;
  onStart: (materiaId: string) => void;
}

const SimuladoCargoView: React.FC<SimuladoCargoViewProps> = ({ state, cargoId, onBack, onStart }) => {
  const cargo = state.cargos.find(c => c.id === cargoId);
  const concurso = state.concursos.find(c => c.id === cargo?.concursoId);
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  if (!cargo) return null;

  const handleStart = () => {
    if (!selectedMateriaId) return;

    // Verificação de Plano PRO
    if (state.userProfile.plan !== 'pro') {
      setShowProModal(true);
      return;
    }

    onStart(selectedMateriaId);
  };

  return (
    <div className="p-6 md:p-10 pb-80 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors group"
        >
          <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Voltar aos meus planos
        </button>

        {/* Hero Section do Cargo */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="h-48 relative">
            <img src={concurso?.imageUrl} className="w-full h-full object-cover" alt="Banner" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 flex items-end justify-between w-full">
              <div className="flex-1 min-w-0 mr-4">
                <span className="bg-primary/10 text-primary text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-2 inline-block">Edital em Foco</span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight break-words">{cargo.nome}</h1>
                <p className="text-slate-500 font-bold text-[10px] mt-1 uppercase tracking-widest">{concurso?.nome}</p>
              </div>
              <div className="hidden md:flex flex-col items-end shrink-0">
                <span className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Status de Estudo</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-1 w-6 rounded-full ${i <= 2 ? 'bg-primary' : 'bg-slate-100'}`}></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-[24px] border border-slate-50 text-center shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Salário</span>
            <p className="font-black text-emerald-600 text-base md:text-lg">{cargo.salario}</p>
          </div>
          <div className="bg-white p-5 rounded-[24px] border border-slate-50 text-center shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Vagas AC</span>
            <p className="font-black text-slate-800 text-base md:text-lg">{cargo.vagasAmplas}</p>
          </div>
          <div className="bg-white p-5 rounded-[24px] border border-slate-50 text-center shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Vagas CR</span>
            <p className="font-black text-slate-800 text-base md:text-lg">{cargo.vagasCR}</p>
          </div>
          <div className="bg-white p-5 rounded-[24px] border border-slate-50 text-center shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nível</span>
            <p className="font-black text-slate-800 text-base md:text-lg">{cargo.nivel}</p>
          </div>
        </div>

        {/* Seleção de Matérias em Lista */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Matérias do Edital</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full shadow-sm tracking-widest">Clique para selecionar</span>
          </div>

          <div className="flex flex-col gap-3">
            {cargo.materiasConfig.map(config => {
              const materia = state.materias.find(m => m.id === config.materiaId);
              const isSelected = selectedMateriaId === config.materiaId;

              return (
                <button
                  key={config.materiaId}
                  onClick={() => setSelectedMateriaId(config.materiaId)}
                  className={`group relative flex items-center justify-between p-5 rounded-[20px] border transition-all text-left min-h-[80px] ${isSelected
                      ? 'bg-primary/5 border-primary shadow-md'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-xs border transition-colors shrink-0 ${isSelected ? 'bg-primary text-white border-primary' : 'bg-slate-50 border-slate-100 text-primary'
                      }`}>
                      {materia?.nome.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-black text-sm uppercase tracking-tight leading-snug break-words ${isSelected ? 'text-primary' : 'text-slate-800'}`}>
                        {materia?.nome}
                      </h4>
                      <div className={`flex items-center gap-3 mt-1 ${isSelected ? 'text-primary/60' : 'text-slate-400'}`}>
                        <span className="text-[9px] font-black uppercase tracking-widest">Peso {config.peso}</span>
                        <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{config.quantidadeQuestoes} questões</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-slate-200'
                      }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                  </div>
                </button>
              );
            })}

            {cargo.materiasConfig.length === 0 && (
              <div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-white">
                <span className="material-symbols-outlined text-slate-200 text-5xl mb-3">inventory_2</span>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma matéria configurada neste edital</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Footer - Agora Transparente e com Padding Extra */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-8 bg-transparent pointer-events-none z-40 flex justify-center">
          <button
            disabled={!selectedMateriaId}
            onClick={handleStart}
            className={`pointer-events-auto w-full max-w-[300px] py-4 rounded-full font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_20px_50px_rgba(19,91,236,0.3)] transition-all flex items-center justify-center gap-3 ${selectedMateriaId
                ? 'bg-primary text-white hover:scale-[1.05] active:scale-95'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              }`}
          >
            Começar Simulado
            <span className="material-symbols-outlined text-base">rocket_launch</span>
          </button>
        </div>
      </div>

      {/* Modal PRO */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowProModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 mb-6 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="material-symbols-outlined text-4xl text-white">workspace_premium</span>
              </div>

              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
                Simulados PRO
              </h3>

              <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed max-w-xs">
                Para acessar os simulados e subir no ranking com questões reais, você precisa ser membro <span className="text-amber-500 font-bold">PRO</span>.
              </p>

              <div className="w-full space-y-3">
                <a
                  href="https://pay.kiwify.com.br/eqZiCEB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl py-4 font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">upgrade</span>
                  Liberar Simulados
                </a>
                <button
                  onClick={() => setShowProModal(false)}
                  className="w-full py-3 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimuladoCargoView;
