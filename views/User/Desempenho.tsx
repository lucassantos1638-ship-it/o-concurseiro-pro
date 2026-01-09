
import React, { useState, useMemo } from 'react';
import { AppState } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DesempenhoProps {
  state: AppState;
}

const UserDesempenho: React.FC<DesempenhoProps> = ({ state }) => {
  // Estado para o filtro de tempo
  const [timeFilter, setTimeFilter] = useState<'hoje' | '7dias' | '30dias' | 'total'>('total');

  const history = state.userProgress.history || [];

  // Filtrar histórico com base na seleção
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

  // Calcular métricas baseadas no histórico filtrado
  const displayedQuestions = filteredHistory.length;
  // Estima horas (3 min por questão)
  const displayedHours = (displayedQuestions * 3) / 60;

  const displayedAccuracy = useMemo(() => {
    if (displayedQuestions === 0) return 0;
    const correct = filteredHistory.filter(h => h.acertou).length;
    return Math.round((correct / displayedQuestions) * 100);
  }, [filteredHistory, displayedQuestions]);


  // Estatísticas por Matéria (Geral - para manter consistência nos graficos de baixo)
  // Ou deveríamos filtrar também? O pedido foi "configurar no desempenho as horas estudas tem que ter um filtro".
  // Vou aplicar o filtro apenas nos Cards de cima por enquanto, para não esvaziar os gráficos de evolução/matérias desnecessariamente, mas
  // faz sentido que "Questões Hoje" seja substituído pelo filtro selecionado.
  // Vou manter os gráficos inferiores com dados TOTAIS ou 7 DIAS (padrão visual) e atualizar os Cards Superiores.

  // Estatísticas Totais para os gráficos de baixo
  const statsByMateria = history.reduce((acc, item) => {
    const questao = state.questoes.find(q => q.id === item.questaoId);
    if (!questao) return acc;

    const materiaId = questao.materiaId;
    if (!acc[materiaId]) {
      acc[materiaId] = { total: 0, acertou: 0, nome: state.materias.find(m => m.id === materiaId)?.nome || 'Outros' };
    }

    acc[materiaId].total += 1;
    if (item.acertou) acc[materiaId].acertou += 1;

    return acc;
  }, {} as Record<string, { total: number, acertou: number, nome: string }>);

  // Evolução Semanal (Sempre últimos 7 dias fixo para o gráfico)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dataEvolucao = last7Days.map(dateStr => {
    const dayQuestions = history.filter(h => h.data.startsWith(dateStr));
    const acertos = dayQuestions.filter(h => h.acertou).length;
    const erros = dayQuestions.length - acertos;

    const dateObj = new Date(dateStr);
    const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][dateObj.getDay()];

    return { name: dayName, acertos, erro: erros };
  });

  // Matérias com Maior Dificuldade (Abaixo de 50%)
  const materiasDificuldade = (Object.values(statsByMateria) as Array<{ total: number, acertou: number, nome: string }>)
    .map(stat => ({
      materia: stat.nome,
      acerto: Math.round((stat.acertou / stat.total) * 100),
      total: stat.total
    }))
    .filter(stat => stat.acerto < 50)
    .sort((a, b) => a.acerto - b.acerto)
    .slice(0, 10);

  // Melhores Matérias (Acima de 70%)
  const materiasMelhorDesempenho = (Object.values(statsByMateria) as Array<{ total: number, acertou: number, nome: string }>)
    .map(stat => ({
      materia: stat.nome,
      acerto: Math.round((stat.acertou / stat.total) * 100),
      total: stat.total
    }))
    .filter(stat => stat.acerto > 70)
    .sort((a, b) => b.acerto - a.acerto)
    .slice(0, 10);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análise de Desempenho</h2>
          <p className="text-slate-500 font-medium mt-1">Acompanhe sua evolução e identifique pontos de melhoria.</p>
        </div>

        {/* Filtro de Tempo */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">
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

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Questões Resolvidas',
            value: displayedQuestions.toString(),
            color: 'text-primary', bg: 'bg-blue-50', icon: 'edit_note',
            sub: timeFilter === 'total' ? 'Total Geral' : 'No Período'
          },
          {
            label: 'Taxa de Acerto',
            // Mostra a taxa do período selecionado
            value: `${displayedAccuracy}%`,
            color: 'text-emerald-500', bg: 'bg-emerald-50', icon: 'target',
            sub: 'Média do Período'
          },
          {
            label: 'Horas Estudadas',
            // Mostra horas do período
            value: `${displayedHours < 1 && displayedHours > 0 ? displayedHours.toFixed(1) : Math.floor(displayedHours)}h`,
            color: 'text-purple-500', bg: 'bg-purple-50', icon: 'timer',
            sub: 'Estimado'
          },
          {
            label: 'Questões Totais',
            // Mantém sempre o total geral para referência
            value: state.userProgress.questionsResolved.toString(),
            color: 'text-amber-500', bg: 'bg-amber-50', icon: 'local_fire_department',
            sub: 'Desde o início'
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
            </div>
            <span className={`text-4xl font-black ${stat.color} mb-1 tracking-tighter relative z-10`}>{stat.value}</span>
            <div className="flex flex-col relative z-10">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{stat.label}</span>
              <span className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de Evolução (Full Width, Menor Altura) */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-3">
            <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
            Evolução Semanal
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Acertos</span>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAcertos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                fontSize={10}
                fontWeight={700}
                tick={{ fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={700} tick={{ fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area
                type="monotone"
                dataKey="acertos"
                stroke="#6366f1"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorAcertos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid de Dificuldade vs Melhores Matérias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Matérias com Maior Dificuldade */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">warning</span>
            Matérias para Revisar
          </h3>
          <div className="space-y-4">
            {materiasDificuldade.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">Nenhum dado disponível</p>
                <p className="text-[10px] text-slate-300 font-medium mt-1">Nenhuma matéria com média abaixo de 50%</p>
              </div>
            ) : (
              materiasDificuldade.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                      <span className={`material-symbols-outlined ${item.acerto < 50 ? 'text-red-400' : 'text-amber-400'}`}>warning</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{item.materia}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter capitalize">
                        {item.total === 1 ? '1 questão' : `${item.total} questões`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${item.acerto < 50 ? 'text-red-500' : 'text-amber-500'}`}>{item.acerto}%</span>
                    <p className="text-[9px] font-bold text-slate-300 uppercase">Aproveitamento</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Melhores Matérias (NOVO) */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">verified</span>
            Seus Pontos Fortes
          </h3>
          <div className="space-y-4">
            {materiasMelhorDesempenho.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">Nenhum dado disponível</p>
                <p className="text-[10px] text-slate-300 font-medium mt-1">Nenhuma matéria com média acima de 70%</p>
              </div>
            ) : (
              materiasMelhorDesempenho.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-500">emoji_events</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">{item.materia}</h4>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter capitalize">
                        {item.total === 1 ? '1 questão' : `${item.total} questões`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-600">{item.acerto}%</span>
                    <p className="text-[9px] font-bold text-emerald-300 uppercase">Aproveitamento</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserDesempenho;
