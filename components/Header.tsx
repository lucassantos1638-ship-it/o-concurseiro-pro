
import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  activeTab: string;
  onToggleMenu: () => void;
  profile: UserProfile;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onToggleMenu, profile, onProfileClick }) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'ranking': return 'Ranking de Elite';
      case 'concursos': return 'Concursos';
      case 'desempenho': return 'Desempenho';
      case 'meus-cargos': return 'Meus Cargos';
      case 'perfil': return 'Meu Perfil';
      default: return 'Plataforma';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-30 antialiased">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMenu}
          className="lg:hidden flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-6">


        <div className="flex items-center gap-4">
          <div className="relative group">
            <div
              onClick={onProfileClick}
              className={`h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 shadow-md hover:scale-105 transition-transform flex items-center justify-center bg-slate-100 ${profile.plan === 'pro' ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-white'}`}
            >
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-slate-400 text-2xl">person</span>
              )}
            </div>
            {profile.plan === 'pro' && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm border-2 border-white" title="Membro PRO">
                <span className="material-symbols-outlined text-[10px] text-white font-bold">star</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
