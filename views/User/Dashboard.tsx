
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AppState } from '../../types';
import { getConcursoStatus } from '../../utils/concursoStatus';

interface DashboardProps {
  state: AppState;
  setActiveTab: (tab: string) => void;
  isLoading?: boolean;
}

const UserDashboard: React.FC<DashboardProps> = ({ state, setActiveTab, isLoading }) => {
  const { concursos, userProgress, ranking, myCargosIds, cargos } = state;
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPaused = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Estado para o filtro de tempo
  const [timeFilter, setTimeFilter] = useState<'hoje' | '7dias' | '30dias' | 'total'>('total');

  // Lógica de Filtro de Histórico (Copiada do Desempenho para consistência)
  const history = userProgress.history || [];

  const filteredHistory = useMemo(() => {
    const now = new Date();
    // Zera horas para comparação de datas passadas
    now.setHours(0, 0, 0, 0);

    return history.filter(item => {
      const itemDate = new Date(item.data);
      // Normaliza para início do dia para comparação correta
      const itemDateZero = new Date(itemDate);
      itemDateZero.setHours(0, 0, 0, 0);

      if (timeFilter === 'hoje') {
        return itemDateZero.getTime() === now.getTime();
      }

      if (timeFilter === '7dias') {
        const pastDate = new Date(now);
        pastDate.setDate(now.getDate() - 7);
        return itemDateZero >= pastDate;
      }

      if (timeFilter === '30dias') {
        const pastDate = new Date(now);
        pastDate.setDate(now.getDate() - 30);
        return itemDateZero >= pastDate;
      }

      return true; // total
    });
  }, [history, timeFilter]);

  // Recalcular métricas para o Dashboard
  const displayedQuestions = filteredHistory.length;
  const displayedHours = (displayedQuestions * 3) / 60; // Estimativa: 3 min por questão

  const displayedAccuracy = useMemo(() => {
    if (displayedQuestions === 0) return 0;
    const correct = filteredHistory.filter(h => h.acertou).length;
    return Math.round((correct / displayedQuestions) * 100);
  }, [filteredHistory, displayedQuestions]);





  // Se ainda assim não tiver ID (e o histórico não ajudou), podemos tentar 'chutar' o primeiro cargo disponível se quisermos forçar, 
  // mas o correto é o usuário ter um cargo. 
  // O usuário disse: "o usuario respondeu sete perguntas do cargo auditor fiscal, já tinha que aparecer no ranking"
  // Isso implica que ele FEZ questões. Se ele fez, deveria estar nos 'meus cargos'?
  // Vamos forçar o dashboard a mostrar o ranking de 'Auditor Fiscal' se ele tiver respondido algo? 
  // Como não temos cargoId no history (verifiquei App.tsx anteriormente e não vi cargoId no history payload), 
  // a melhor aposta é que o usuário espera que o cargo seja adicionado aos favoritos automaticamente.

  // Vamos manter a lógica de myCargosIds. Se não aparecer, é porque não está em myCargosIds.



  // Efeito de Scroll Automático do Carrossel
  useEffect(() => {
    // Remove isPaused dependencies effectively
    if (!scrollRef.current || concursos.length <= 1) return;

    const interval = setInterval(() => {
      // Check ref inside interval
      if (isPaused.current || isDragging || !scrollRef.current) return;

      const container = scrollRef.current;
      const cardWidth = container.firstElementChild?.clientWidth || 0;
      const gap = 20;
      const scrollAmount = cardWidth + gap;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [concursos.length, isDragging]); // removed isPaused

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.scrollSnapType = 'none';
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    if (!scrollRef.current) return;
    setIsDragging(false);
    scrollRef.current.style.scrollSnapType = 'x mandatory';
    scrollRef.current.style.cursor = 'pointer';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
    if (Math.abs(walk) > 5) setHasMoved(true);
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 select-none antialiased">
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Olá, Estudante <span className="animate-bounce-slow text-3xl">👋</span>
          </h2>
          <p className="text-slate-500 font-medium mt-1">Confira os concursos disponíveis para você hoje.</p>
        </div>

        <div
          ref={scrollRef}
          onMouseEnter={() => { isPaused.current = true; }}
          onMouseLeave={() => { isPaused.current = false; handleMouseUp(); }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex w-full overflow-x-auto gap-5 pb-6 snap-x no-scrollbar -mx-2 px-2 cursor-pointer active:cursor-grabbing touch-pan-x"
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {isLoading ? (
            // Skeleton Loading for Concursos
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="relative min-w-[340px] md:min-w-[500px] h-[280px] rounded-[32px] bg-white border border-slate-100 flex flex-col justify-end p-8 gap-4 shadow-sm snap-start shrink-0 animate-pulse"
              >
                <div className="w-24 h-6 bg-slate-100 rounded-full mb-auto"></div>
                <div className="w-32 h-4 bg-slate-100 rounded-full"></div>
                <div className="w-3/4 h-8 bg-slate-100 rounded-lg"></div>
                <div className="w-full h-4 bg-slate-100 rounded-lg"></div>
              </div>
            ))
          ) : (
            concursos.map((concurso) => {
              const status = getConcursoStatus(concurso);
              const isHighlighted = status === 'Inscrições Abertas' || status === 'Edital Publicado';
              return (
                <div
                  key={concurso.id}
                  onClick={() => !hasMoved && setActiveTab('concursos')}
                  className="relative min-w-[340px] md:min-w-[500px] h-[280px] rounded-[32px] overflow-hidden snap-start group shadow-xl transition-all hover:shadow-primary/20 shrink-0"
                >
                  <img src={concurso.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 p-8 flex flex-col gap-3 pointer-events-none">
                    <span className={`inline-flex w-fit items-center rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg ${isHighlighted ? 'bg-primary' : 'bg-amber-500'}`}>{status}</span>
                    <span className="text-[10px] text-white/50">{concurso.datas.inscricaoInicio}</span>
                    <h3 className="text-2xl font-bold text-white leading-tight uppercase group-hover:translate-x-1 transition-transform tracking-tight">{concurso.nome}</h3>
                    <p className="text-sm font-medium text-slate-300 line-clamp-2 max-w-[90%] opacity-90">{concurso.observacoes}</p>
                  </div>
                </div>
              )
            }))}
        </div>
      </section>

      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Seu Desempenho</h3>

          {/* Filtro de Tempo Unificado */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm self-start md:self-auto">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: '7dias', label: '7 Dias' },
              { id: '30dias', label: '30 Dias' },
              { id: 'total', label: 'Total' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeFilter(opt.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeFilter === opt.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-[24px]">schedule</span></div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Horas Estudadas</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900 leading-none">
                {displayedHours < 1 && displayedHours > 0 ? displayedHours.toFixed(1) : Math.floor(displayedHours)}h
              </span>
              {/* Variação (Mockada por enquanto ou poderia ser comparado com periodo anterior) */}
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{timeFilter === 'total' ? 'Total' : 'No Período'}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-primary" style={{ width: '45%' }}></div></div>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><span className="material-symbols-outlined text-[24px]">task_alt</span></div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Questões Resolvidas</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900 leading-none">{displayedQuestions}</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{timeFilter === 'total' ? 'Total' : 'No Período'}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-purple-500" style={{ width: '65%' }}></div></div>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><span className="material-symbols-outlined text-[24px]">analytics</span></div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Taxa de Acerto</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900 leading-none">{displayedAccuracy}%</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Média</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: '85%' }}></div></div>
          </div>
        </div>
      </section>

      {/* Seção de Ranking - Dashboard */}


      <section className="mb-20">
        <h3 className="mb-6 text-xl font-bold text-slate-900 tracking-tight">Acesso Rápido</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <button onClick={() => setActiveTab('concursos')} className="group relative text-left flex overflow-hidden rounded-[28px] border border-slate-100 bg-white p-8 transition-all hover:shadow-2xl active:scale-[0.98]">
            <div className="z-10 flex flex-col gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-50 text-primary group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-3xl">search</span></div>
              <div className="flex flex-col gap-2">
                <h4 className="text-2xl font-bold text-slate-900">Explorar Concursos</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[90%]">Encontre os melhores editais e organize seu plano de estudos por cargo ou região.</p>
              </div>
              <span className="mt-2 flex items-center text-sm font-bold text-primary">Ver concursos <span className="material-symbols-outlined ml-2 text-base transition-transform group-hover:translate-x-2">arrow_forward</span></span>
            </div>
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-50/40 group-hover:scale-125 transition-transform duration-1000"></div>
          </button>
          <button onClick={() => setActiveTab('meus-cargos')} className="group relative text-left flex overflow-hidden rounded-[28px] border border-slate-100 bg-white p-8 transition-all hover:shadow-2xl active:scale-[0.98]">
            <div className="z-10 flex flex-col gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-3xl">edit_note</span></div>
              <div className="flex flex-col gap-2">
                <h4 className="text-2xl font-bold text-slate-900">Meus Simulados</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[90%]">Pratique em tempo real e identifique seus pontos fortes e fracos em cada matéria.</p>
              </div>
              <span className="mt-2 flex items-center text-sm font-bold text-purple-600">Fazer simulado <span className="material-symbols-outlined ml-2 text-base transition-transform group-hover:translate-x-2">arrow_forward</span></span>
            </div>
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-50/40 group-hover:scale-125 transition-transform duration-1000"></div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default UserDashboard;
