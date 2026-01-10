
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Questao } from '../../types';

interface SimuladoQuestaoViewProps {
  state: AppState;
  cargoId?: string | null;
  materiaId: string;
  filters?: { banca?: string; ano?: string; nivel?: string };
  onFinish: (results: Array<{ questaoId: string; resposta: string; acertou: boolean; data: string }>) => void;
}

const SimuladoQuestaoView: React.FC<SimuladoQuestaoViewProps> = ({ state, cargoId, materiaId, filters, onFinish }) => {
  const cargo = cargoId ? state.cargos.find(c => c.id === cargoId) : null;
  const materia = state.materias.find(m => m.id === materiaId);

  // Lógica de embaralhamento e filtro por matéria + (nível do cargo OU filtros personalizados)
  const questoesAleatorias = useMemo(() => {
    const filtradas = state.questoes.filter(q => {
      // 1. Filtro base - Matéria
      if (q.materiaId !== materiaId) return false;

      // 2. Filtros Personalizados (Se existirem)
      if (filters) {
        if (filters.banca && q.banca !== filters.banca) return false;
        if (filters.ano && q.ano !== filters.ano) return false;
        if (filters.nivel && q.nivel !== filters.nivel) return false;
        return true;
      }

      // 3. Fallback: Filtro por Nível do Cargo (Modo Original)
      if (cargo) {
        return q.nivel === cargo.nivel;
      }

      return true; // Sem cargo e sem filtros = todas da matéria
    });
    return [...filtradas].sort(() => Math.random() - 0.5);
  }, [state.questoes, materiaId, cargo?.nivel, filters]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, { choice: string, confirmed: boolean }>>({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showText, setShowText] = useState(true);

  const currentQuestao = questoesAleatorias[currentIndex];

  useEffect(() => {
    const saved = answers[currentQuestao?.id] as { choice: string; confirmed: boolean } | undefined;
    if (saved) {
      setSelectedAnswer(saved.choice);
      setIsConfirmed(saved.confirmed);
    } else {
      setSelectedAnswer(null);
      setIsConfirmed(false);
    }
  }, [currentIndex, currentQuestao?.id]);

  const handleResponder = () => {
    if (!selectedAnswer) return;
    setIsConfirmed(true);
    setAnswers(prev => ({
      ...prev,
      [currentQuestao.id]: { choice: selectedAnswer, confirmed: true }
    }));
  };

  const handleNext = () => {
    if (currentIndex < questoesAleatorias.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Compilar resultados e finalizar
      const results = Object.entries(answers).map(([qId, ans]) => {
        const typedAns = ans as { choice: string; confirmed: boolean };
        const questao = state.questoes.find(q => q.id === qId);
        const isCorrect = questao ? questao.gabarito === typedAns.choice : false;
        return {
          questaoId: qId,
          resposta: typedAns.choice,
          acertou: isCorrect,
          data: new Date().toISOString()
        };
      });
      onFinish(results);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentQuestao) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 bg-white animate-in fade-in duration-500">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-slate-300">find_in_page</span>
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nenhuma questão encontrada</h3>
        <p className="text-slate-400 mt-2 text-center max-w-xs font-medium">Não há questões de nível {cargo?.nivel} para esta matéria.</p>
        <button onClick={() => onFinish([])} className="mt-8 px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Voltar</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f6f6f8] overflow-hidden animate-in fade-in duration-300">
      {/* Barra de Topo Minimalista */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onFinish} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-xl">close</span>
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cargo?.nome}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso</span>
          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentIndex + 1) / questoesAleatorias.length) * 100}%` }}></div>
          </div>
          <span className="text-[10px] font-black text-primary ml-1">{currentIndex + 1}/{questoesAleatorias.length}</span>
        </div>
      </div>

      {/* Container da Questão - Estilo Papel/Branco */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 hide-scrollbar">
        <div className="max-w-6xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Header da Questão */}
          <div className="p-4 bg-white border-b border-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 shrink-0 bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 rounded text-xs shadow-sm">{currentIndex + 1}</span>
                <span className="text-slate-400 font-bold text-sm tracking-tight">{currentQuestao.codigo}</span>
                <span className="text-slate-600 font-bold text-sm tracking-tight">{materia?.nome}</span>
              </div>
              {isConfirmed && (
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 border border-blue-100/50">
                  <span className="material-symbols-outlined text-sm font-bold">check</span> Resolvida
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-medium flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-slate-50">
              <span className="flex gap-1.5"><strong>Ano:</strong> <span className="text-slate-600 font-semibold">{currentQuestao.ano}</span></span>
              <span className="flex gap-1.5"><strong>Banca:</strong> <span className="text-slate-600 font-semibold">{currentQuestao.banca}</span></span>
              <span className="flex gap-1.5"><strong>Prova:</strong> <span className="text-slate-600 font-semibold">{currentQuestao.prova}</span></span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Texto Associado (Botão simples, sem estilo de link) */}
            <div>
              <button
                onClick={() => setShowText(!showText)}
                className="text-slate-400 text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors mb-4 uppercase tracking-widest"
              >
                Texto associado
                <span className="material-symbols-outlined text-sm">{showText ? 'remove_circle' : 'add_circle'}</span>
              </button>

              {showText && currentQuestao.textoAssociado && (
                <div className="text-sm text-slate-700 leading-relaxed font-medium mb-8 p-6 bg-slate-50 rounded-xl border border-slate-100 italic animate-in slide-in-from-top-2 whitespace-pre-wrap">
                  {currentQuestao.textoAssociado}
                </div>
              )}
            </div>

            {/* Image (Above Enunciado) */}
            {currentQuestao.imagem && (
              <div className="flex justify-center mb-6">
                <img
                  src={currentQuestao.imagem}
                  alt="Imagem da Questão"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* Enunciado */}
            <p className="text-slate-800 text-sm sm:text-[15px] font-medium leading-relaxed whitespace-pre-wrap">
              {currentQuestao.enunciado}
            </p>

            {/* Alternativas */}
            <div className="space-y-4 pt-4">
              {currentQuestao.alternativas.map((alt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = selectedAnswer === letter;
                const isCorrect = isConfirmed && currentQuestao.gabarito === letter;
                const isWrongSelection = isConfirmed && isSelected && currentQuestao.gabarito !== letter;

                let icon = null;
                if (isCorrect) icon = <span className="material-symbols-outlined text-emerald-500 text-xl font-bold">check</span>;
                if (isWrongSelection) icon = <span className="material-symbols-outlined text-red-500 text-xl font-bold">close</span>;

                return (
                  <button
                    key={i}
                    disabled={isConfirmed}
                    onClick={() => setSelectedAnswer(letter)}
                    className="w-full text-left flex items-start gap-4 group"
                  >
                    <div className="flex items-center gap-2 shrink-0 h-8">
                      {icon}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${isSelected
                        ? (isConfirmed ? (isCorrect ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-red-50 text-red-600 border-red-300') : 'bg-blue-50 text-blue-600 border-blue-400')
                        : 'bg-white text-slate-400 border-slate-200 group-hover:bg-slate-50'
                        }`}>
                        {letter}
                      </div>
                    </div>
                    <span className={`text-[13px] sm:text-[14px] pt-1.5 leading-relaxed font-medium ${isCorrect ? 'text-emerald-600' : (isWrongSelection ? 'text-red-600' : 'text-slate-700')
                      }`}>
                      {alt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rodapé da Questão */}
          <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-white gap-6">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <button
                onClick={handleResponder}
                disabled={!selectedAnswer || isConfirmed}
                className={`px-8 py-2 rounded text-[13px] font-bold shadow-sm transition-all ${selectedAnswer && !isConfirmed
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                Responder
              </button>

              {isConfirmed && (
                <div className="flex items-center gap-6 animate-in slide-in-from-left-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-xs uppercase ${selectedAnswer === currentQuestao.gabarito ? 'text-emerald-500' : 'text-red-500'}`}>
                      {selectedAnswer === currentQuestao.gabarito ? 'Correta!' : 'Errada!'}
                    </span>
                    <span className="text-slate-400 text-xs font-medium">Opção correta:</span>
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px] border border-emerald-200 shadow-sm">
                      {currentQuestao.gabarito}
                    </span>
                  </div>
                  {/* Removed statistics as per user request */}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-5 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <span className="text-slate-900 font-bold text-xs tracking-tight">Ir para a questão:</span>
                <select
                  value={currentIndex + 1}
                  onChange={(e) => setCurrentIndex(parseInt(e.target.value) - 1)}
                  className="bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {questoesAleatorias.map((_, idx) => (
                    <option key={idx} value={idx + 1}>{idx + 1}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-primary bg-white text-primary hover:bg-primary hover:text-white transition-all shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined font-bold">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimuladoQuestaoView;
