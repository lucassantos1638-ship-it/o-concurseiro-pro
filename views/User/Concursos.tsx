
import React, { useState, useMemo } from 'react';
import { AppState, Concurso, Cargo, Nivel } from '../../types';
import { getConcursoStatus } from '../../utils/concursoStatus';

interface ConcursosProps {
  state: AppState;
  onToggleMyCargo: (id: string) => void;
  setActiveTab?: (tab: string) => void;
}

const UFS = [
  'Nacional', 'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

const UserConcursos: React.FC<ConcursosProps> = ({ state, onToggleMyCargo, setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('Todos os Estados');
  const [selectedConcursoId, setSelectedConcursoId] = useState<string | null>(null);
  const [viewingCargoId, setViewingCargoId] = useState<string | null>(null);

  const filteredConcursos = useMemo(() => {
    return state.concursos.filter(c => {
      const matchesSearch = c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.orgao.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = selectedState === 'Todos os Estados' ||
        c.cidades.some(city => city.toLowerCase() === selectedState.toLowerCase());
      return matchesSearch && matchesState;
    });
  }, [state.concursos, searchQuery, selectedState]);

  const selectedConcurso = useMemo(() =>
    state.concursos.find(c => c.id === selectedConcursoId),
    [state.concursos, selectedConcursoId]
  );
  const getDynamicStatus = (concurso: Concurso) => {
    // Add logic for 'Últimos Dias' check on top of the base status if needed
    // Or just return the base status.
    // The user wants strict logic. Let's see if we should keep "Last Days".
    // User said: "Inscrições Abertas" -> "Em Andamento". Did not specify "Last Days".
    // But "Last Days" is a nice UI feature.
    // Let's rely on getConcursoStatus but override locally for "Últimos Dias" if strictly within typical "Open" period.

    const status = getConcursoStatus(concurso);
    if (status === 'Inscrições Abertas' && concurso.datas.inscricaoFim) {
      const today = new Date();
      const end = new Date(concurso.datas.inscricaoFim + 'T12:00:00');
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 5 && diffDays >= 0) return "Últimos Dias";
    }
    return status;
  };

  const getStatusTag = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border transition-all";
    if (status === "Inscrições Abertas" || status === "Edital Publicado") return <span className={`${baseClasses} bg-emerald-50 text-emerald-600 border-emerald-100/50 animate-pulse`}><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {status}</span>;
    if (status === "Em Andamento") return <span className={`${baseClasses} bg-blue-50 text-blue-600 border-blue-100/50 animate-pulse`}><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {status}</span>;
    if (status === "Provas Realizadas") return <span className={`${baseClasses} bg-slate-100 text-slate-600 border-slate-200`}><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {status}</span>;
    if (status === "Últimos Dias") return <span className={`${baseClasses} bg-red-50 text-red-600 border-red-100/50 animate-pulse`}><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Últimos Dias</span>;

    // Fallback/Legacy
    if (status === "Previsto") return <span className={`${baseClasses} bg-amber-50 text-amber-600 border-amber-100/50 animate-pulse`}><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Previsto</span>;

    return <span className={`${baseClasses} bg-slate-100 text-slate-600 border-slate-200`}>{status}</span>;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'A definir';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  if (viewingCargoId && selectedConcurso) {
    const cargo = state.cargos.find(c => c.id === viewingCargoId);
    if (cargo) {
      const isMyCargo = state.myCargosIds.includes(cargo.id);
      return (
        <div className="min-h-full bg-[#f8fafc] p-4 md:p-12 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto pb-24">
          <div className="mx-auto max-w-3xl">
            <button onClick={() => setViewingCargoId(null)} className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
              <span className="material-symbols-outlined text-lg">arrow_back</span> Voltar ao Edital
            </button>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="relative h-[220px] md:h-[280px] w-full overflow-hidden">
                <img src={selectedConcurso.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <span className="bg-primary/20 backdrop-blur-md text-white border border-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                    Nível {cargo.nivel}
                  </span>
                  <h1 className="text-xl md:text-3xl font-black text-white leading-tight max-w-full px-2 break-words uppercase">{cargo.nome}</h1>
                  <p className="text-slate-300 font-bold text-xs opacity-90 mt-2 uppercase">{selectedConcurso.nome}</p>

                  <div className="mt-6 w-full max-w-[280px]">
                    <button
                      onClick={() => onToggleMyCargo(cargo.id)}
                      className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${isMyCargo
                        ? 'bg-red-500 text-white shadow-red-500/20'
                        : 'bg-primary text-white shadow-primary/40 hover:scale-[1.02] active:scale-95'
                        }`}
                    >
                      <span className="material-symbols-outlined text-base">{isMyCargo ? 'cancel' : 'check_circle'}</span>
                      {isMyCargo ? 'Remover do Plano' : 'Adicionar ao Plano'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-8 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-600">payments</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salário</span>
                    </div>
                    <p className="text-sm font-black text-emerald-600 ml-4">{cargo.salario || 'Ver edital'}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">schedule</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 ml-4">{cargo.cargaHoraria || 'Não informada'}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">group</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vagas</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 ml-4">{cargo.totalVagas}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Ampla</span>
                      <p className="text-sm font-black text-slate-700">{cargo.vagasAmplas}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">PCD</span>
                      <p className="text-sm font-black text-slate-700">{cargo.vagasPcd}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">CR</span>
                      <p className="text-sm font-black text-slate-700">{cargo.vagasCR}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 overflow-hidden">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">info</span>
                    Requisitos
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium break-words">
                    {cargo.requisitos || 'Consulte o edital completo para os requisitos detalhados.'}
                  </p>
                </div>

                <div className="pt-6">
                  <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-3">
                    <span className="w-1 h-5 bg-primary rounded-full"></span>
                    Grade de Matérias
                  </h4>
                  <div className="flex flex-col gap-2.5 mb-6">
                    {cargo.materiasConfig.map(config => {
                      const m = state.materias.find(mat => mat.id === config.materiaId);
                      return (
                        <div key={config.materiaId} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-primary/40 transition-all shadow-sm">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-black shrink-0 text-sm border border-slate-100">
                              {m?.nome.charAt(0)}
                            </div>
                            <h5 className="font-bold text-slate-800 text-sm md:text-base truncate">{m?.nome}</h5>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 ml-4">
                            <div className="text-right">
                              <span className="text-[10px] font-black text-primary uppercase block tracking-tighter">PESO {config.peso}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{config.quantidadeQuestoes} Qs</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {cargo.materiasConfig.length === 0 && (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Matérias ainda não informadas pelo gestor.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  if (selectedConcurso) {
    const cargosDoConcurso = state.cargos.filter(cargo => cargo.concursoId === selectedConcursoId);
    const status = getDynamicStatus(selectedConcurso);

    return (
      <div className="min-h-full bg-[#f8fafc] p-4 md:p-12 overflow-y-auto pb-24">
        <div className="mx-auto max-w-5xl">
          <button onClick={() => setSelectedConcursoId(null)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Lista de Editais
          </button>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-8">
            <div className="relative h-[240px] md:h-[280px] w-full rounded-[32px] overflow-hidden m-2 md:m-3">
              <img src={selectedConcurso.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Capa" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
              <div className="absolute bottom-6 left-8 flex items-end justify-between right-8">
                <div className="flex flex-col gap-2 md:gap-3">
                  <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${status === 'Edital Publicado' || status === 'Inscrições Abertas' ? 'bg-primary' : 'bg-amber-500'
                    }`}>
                    {status}
                  </span>
                  <h3 className="text-xl md:text-3xl font-bold text-white leading-tight uppercase">{selectedConcurso.nome}</h3>
                  <p className="text-[10px] md:text-sm font-medium text-slate-300 opacity-90 uppercase tracking-tighter">{selectedConcurso.orgao} • {selectedConcurso.banca}</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-white rounded-2xl border border-white/20 shadow-xl flex items-center justify-center p-3">
                    {selectedConcurso.subCoverUrl
                      ? <img src={selectedConcurso.subCoverUrl} className="max-w-full max-h-full object-contain" alt="Logo" />
                      : <span className="material-symbols-outlined text-slate-200 text-5xl">account_balance</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 md:px-8 pb-8 pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8">
                <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Início das Inscrições</span>
                  <p className="text-sm md:text-xl font-black text-slate-900">{formatDate(selectedConcurso.datas.inscricaoInicio)}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fim das Inscrições</span>
                  <p className="text-sm md:text-xl font-black text-slate-900">{formatDate(selectedConcurso.datas.inscricaoFim)}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data da Prova</span>
                  <p className="text-sm md:text-xl font-black text-slate-900">{formatDate(selectedConcurso.datas.prova)}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Salários até</span>
                  <p className="text-sm md:text-xl font-black text-emerald-600 truncate">{selectedConcurso.salarioMaximo || 'A definir'}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vagas (AC + PCD)</span>
                  <p className="text-sm md:text-xl font-black text-slate-900">{selectedConcurso.totalVagas ? `${selectedConcurso.totalVagas}` : 'A definir'}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Local</span>
                  <p className="text-sm md:text-xl font-black text-slate-900 truncate" title={selectedConcurso.cidades.join(', ')}>
                    {selectedConcurso.cidades.join(', ') || 'Nacional'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <a href={selectedConcurso.links.inscricoes} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all ${selectedConcurso.links.inscricoes ? 'bg-blue-50 text-primary hover:bg-primary hover:text-white' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                  <span className="material-symbols-outlined text-base">how_to_reg</span> Inscrição
                </a>
                <a href={selectedConcurso.links.editalPdf} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all ${selectedConcurso.links.editalPdf ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                  <span className="material-symbols-outlined text-base">description</span> Edital
                </a>
                <a href={selectedConcurso.links.apostilas} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all ${selectedConcurso.links.apostilas ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                  <span className="material-symbols-outlined text-base">menu_book</span> Apostilas
                </a>
                <a href={selectedConcurso.links.cursos} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all ${selectedConcurso.links.cursos ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}>
                  <span className="material-symbols-outlined text-base">smart_display</span> Cursos
                </a>
              </div>
            </div>
          </div>

          <h4 className="text-lg md:text-xl font-black text-slate-900 mb-6 px-2 flex items-center gap-3">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Cargos Disponíveis ({cargosDoConcurso.length})
          </h4>

          <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden mb-12 shadow-sm">
            {cargosDoConcurso.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-8">Cargo</th>
                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nível</th>
                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Salário</th>
                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Vagas</th>
                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">CR</th>
                        <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest pr-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cargosDoConcurso.map(cargo => (
                        <tr key={cargo.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors last:border-0 group">
                          <td className="p-5 pl-8">
                            <p className="font-bold text-slate-800 text-sm uppercase group-hover:text-primary transition-colors">{cargo.nome}</p>
                          </td>
                          <td className="p-5">
                            <span className={`inline-block px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide border ${cargo.nivel === 'Superior' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                              cargo.nivel === 'Médio' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                                'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                              {cargo.nivel}
                            </span>
                          </td>
                          <td className="p-5">
                            <span className="font-black text-emerald-600 text-xs">{cargo.salario || 'A definir'}</span>
                          </td>
                          <td className="p-5 text-center">
                            <span className="font-bold text-slate-700 text-xs">{cargo.vagasAmplas + cargo.vagasPcd}</span>
                          </td>
                          <td className="p-5 text-center">
                            <span className="font-bold text-slate-400 text-xs">{cargo.vagasCR > 0 ? cargo.vagasCR : '-'}</span>
                          </td>
                          <td className="p-5 pr-8 text-right">
                            <button
                              onClick={() => setViewingCargoId(cargo.id)}
                              className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all hover:shadow-lg hover:shadow-primary/20"
                            >
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden">
                  {cargosDoConcurso.map(cargo => (
                    <div key={cargo.id} className="p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <h4 className="font-bold text-slate-800 text-sm uppercase leading-tight">{cargo.nome}</h4>
                        <span className={`shrink-0 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide border ${cargo.nivel === 'Superior' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          cargo.nivel === 'Médio' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                          {cargo.nivel}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Salário</span>
                          <span className="font-black text-emerald-600 text-xs">{cargo.salario || 'A definir'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Vagas</span>
                          <span className="font-bold text-slate-700 text-xs">{cargo.vagasAmplas + cargo.vagasPcd}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">CR</span>
                          <span className="font-bold text-slate-500 text-xs">{cargo.vagasCR > 0 ? cargo.vagasCR : '-'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setViewingCargoId(cargo.id)}
                        className="w-full bg-slate-100 text-slate-500 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-12 text-center border-dashed">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Aguardando cadastro de cargos pelo gestor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 md:p-14 overflow-y-auto">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-[#111827] tracking-tight">Concursos</h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Editais sincronizados em tempo real com o painel administrativo.</p>
          </div>
          <span className="hidden md:inline-block text-[11px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">Portal Oficial</span>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-2 md:gap-3 bg-white p-3 md:p-4 rounded-[28px] shadow-sm border border-slate-100">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Buscar por nome, banca ou órgão..."
              className="w-full bg-slate-50/50 pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/10 text-xs md:text-sm font-medium transition-all"
            />
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">map</span>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="w-full md:w-56 bg-slate-50/50 pl-12 pr-10 py-3 rounded-2xl focus:outline-none appearance-none font-bold text-slate-600 text-xs md:text-sm cursor-pointer"
            >
              <option>Todos os Estados</option>
              {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
          <button className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Filtrar</button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exibindo {filteredConcursos.length} editais</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-5">
          {filteredConcursos.map(concurso => {
            const status = getDynamicStatus(concurso);
            const cargosRelacionados = state.cargos.filter(cg => cg.concursoId === concurso.id);
            const nivelExibicao = cargosRelacionados[0]?.nivel || 'Ver Detalhes';
            const dataLabel = status === 'Previsto' ? 'Prev' : (status === 'Últimos Dias' ? 'Fim' : 'Insc. até');
            const dataValue = status === 'Últimos Dias' ? '2 dias' : formatDate(concurso.datas.inscricaoFim);

            return (
              <div
                key={concurso.id}
                onClick={() => setSelectedConcursoId(concurso.id)}
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-all cursor-pointer group p-4 md:p-6 relative"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl border border-slate-100 flex items-center justify-center shrink-0 shadow-sm mb-4 md:mb-0">
                  {concurso.subCoverUrl
                    ? <img src={concurso.subCoverUrl} className="max-w-[85%] max-h-[85%] object-contain" alt="Logo" />
                    : <span className="material-symbols-outlined text-slate-200 text-3xl md:text-4xl">account_balance</span>
                  }
                </div>

                <div className="flex-1 flex flex-col md:flex-row justify-between pl-0 md:pl-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getStatusTag(status)}
                      <span className="bg-slate-50 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-100 uppercase">
                        {concurso.cidades[0] || 'Nacional'}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-[#111827] group-hover:text-primary transition-colors leading-tight uppercase">
                      {concurso.nome}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-tighter">{concurso.orgao} • {concurso.banca}</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-4 pt-4 mt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Salário Máx</span>
                        <span className="text-xs font-bold text-[#111827] mt-0.5 truncate">{concurso.salarioMaximo || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Vagas</span>
                        <span className="text-xs font-bold text-[#111827] mt-0.5">{concurso.totalVagas || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Nível</span>
                        <span className="text-xs font-bold text-[#111827] mt-0.5">{nivelExibicao}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Local</span>
                        <span className="text-xs font-bold text-[#111827] mt-0.5 truncate" title={concurso.cidades.join(', ')}>
                          {concurso.cidades.join(', ') || 'Nacional'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{dataLabel}</span>
                        <span className={`text-xs font-bold mt-0.5 ${status === 'Últimos Dias' ? 'text-red-500' : 'text-[#111827]'}`}>
                          {dataValue}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end md:pl-10 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0">
                    <button className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.05] transition-transform">
                      Abrir Edital
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConcursos.length === 0 && (
            <div className="bg-white p-20 rounded-[32px] border border-dashed text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">search_off</span>
              <h3 className="text-lg font-bold text-slate-900 uppercase">Nenhum concurso encontrado</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserConcursos;
