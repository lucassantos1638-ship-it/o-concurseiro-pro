
import React, { useState } from 'react';
import { AppState } from '../../types';
import AdminConcursos from './AdminConcursos';
import AdminCargos from './AdminCargos';
import AdminMaterias from './AdminMaterias';
import AdminQuestoes from './AdminQuestoes';
import AdminImport from './AdminImport';
import AdminWebhooks from './AdminWebhooks';
import AdminBackup from './AdminBackup';

interface AdminLayoutProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onExitAdmin: () => void;
  onRefresh: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ state, updateState, onExitAdmin, onRefresh }) => {
  const [currentTab, setCurrentTab] = useState('concursos');

  const renderAdminContent = () => {
    switch (currentTab) {
      case 'concursos': return <AdminConcursos state={state} updateState={updateState} onRefresh={onRefresh} />;
      case 'cargos': return <AdminCargos state={state} updateState={updateState} onRefresh={onRefresh} />;
      case 'materias': return <AdminMaterias state={state} updateState={updateState} onRefresh={onRefresh} />;
      case 'questoes': return <AdminQuestoes state={state} updateState={updateState} onRefresh={onRefresh} />;
      case 'importar': return <AdminImport state={state} updateState={updateState} />;
      case 'webhooks': return <AdminWebhooks />;
      case 'backup': return <AdminBackup />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#f0f2f5]">
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 shadow-lg">
        <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
          <h2 className="text-lg font-bold flex items-center gap-2 shrink-0 text-white">
            <span className="material-symbols-outlined text-primary fill-1">shield_person</span>
            Painel Gestor
          </h2>
          <nav className="flex gap-2">
            {['concursos', 'cargos', 'materias', 'questoes', 'importar', 'webhooks', 'backup'].map((tab) => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-4 py-1.5 text-[10px] font-black tracking-widest rounded-xl transition-all whitespace-nowrap uppercase ${currentTab === tab ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                {tab === 'importar' ? 'Excel Import' : tab}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={onExitAdmin} className="text-xs font-bold flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-base">logout</span> Sair
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {renderAdminContent()}
      </main>
    </div>
  );
};

export default AdminLayout;
