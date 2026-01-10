
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAdminClick: () => void;
  onLogout: () => void;
  isOpen: boolean;
  showAdmin?: boolean;
  plan?: 'free' | 'pro';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onAdminClick, onLogout, isOpen, showAdmin = false, plan = 'free' }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'desempenho', label: 'Desempenho', icon: 'bar_chart' },
    { id: 'ranking', label: 'Ranking', icon: 'leaderboard' },
    { id: 'concursos', label: 'Concursos', icon: 'description' },
    { id: 'meus-cargos', label: 'Meus Cargos', icon: 'work' },
    { id: 'questoes', label: 'Questões', icon: 'quiz' },
    { id: 'apostilas', label: 'Apostilas', icon: 'menu_book' },
    { id: 'cursos', label: 'Cursos', icon: 'cast_for_education' },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="flex h-full flex-col py-8 antialiased overflow-y-auto">
        <div className="flex flex-col gap-8 px-4">
          <div className="flex items-center gap-3 px-2 mb-2 group cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-white shadow-xl shadow-primary/30 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl fill-1">school</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[15px] font-extrabold leading-tight text-slate-900 tracking-tighter uppercase">
                O CONCURSEIRO <span className="text-primary">PRO</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">Plataforma de Estudos</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all w-full text-left relative overflow-hidden group/item ${activeTab === item.id
                  ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/5'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
              >
                <span className={`material-symbols-outlined text-[22px] ${activeTab === item.id ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-bold tracking-tight flex-1">{item.label}</span>

                {/* PRO Badge */}
                {(item.id === 'meus-cargos' || item.id === 'questoes') && plan === 'free' && (
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest shadow-sm">
                    PRO
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-1 px-4 border-t border-slate-100 pt-6 pb-24">
          {showAdmin && (
            <button onClick={onAdminClick} className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-500 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
              <span className="text-sm font-bold tracking-tight">Administração</span>
            </button>
          )}
          <button onClick={() => setActiveTab('perfil')} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${activeTab === 'perfil' ? 'bg-primary/10 text-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span className={`material-symbols-outlined text-[22px] ${activeTab === 'perfil' ? 'fill-1' : ''}`}>person</span>
            <span className="text-sm font-bold tracking-tight">Perfil</span>
          </button>
          <button onClick={onLogout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-red-500 hover:bg-red-50 transition-all mt-2">
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="text-sm font-bold tracking-tight">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
