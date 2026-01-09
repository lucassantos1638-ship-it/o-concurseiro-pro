
import React, { useRef, useState } from 'react';
import { AppState, UserProfile } from '../../types';
import { ESTADOS_BRASIL } from '../../constants';

interface ProfileProps {
  state: AppState;
  updateProfile: (profile: UserProfile) => void;
}

const UserProfileView: React.FC<ProfileProps> = ({ state, updateProfile }) => {
  const { userProfile } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLocalProfile(prev => ({ ...prev, profilePicture: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(localProfile);
    setSuccessMessage('Perfil atualizado com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>
        <div className="px-8 pb-10">
          <div className="relative -top-16 flex flex-col items-center">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center relative">
                {localProfile.profilePicture ? (
                  <img
                    src={localProfile.profilePicture}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-slate-300 text-[64px]">person</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-10 w-10 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-primary hover:bg-slate-50 transition-all"
              >
                <span className="material-symbols-outlined text-xl">photo_camera</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold text-slate-900">{localProfile.name}</h2>
              <p className="text-slate-500 font-medium">{localProfile.city}, {localProfile.state}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6 -mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 tracking-tight">Nome Completo</label>
                <input
                  type="text"
                  value={localProfile.name}
                  onChange={(e) => setLocalProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary transition-all font-medium text-slate-900"
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 tracking-tight">Estado</label>
                <select
                  value={localProfile.state}
                  onChange={(e) => setLocalProfile(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary transition-all font-medium text-slate-900 appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Selecione um estado</option>
                  {ESTADOS_BRASIL.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 tracking-tight">Cidade</label>
                <input
                  type="text"
                  value={localProfile.city}
                  onChange={(e) => setLocalProfile(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary transition-all font-medium text-slate-900"
                  placeholder="Ex: Campinas"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              {successMessage ? (
                <span className="text-emerald-600 font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {successMessage}
                </span>
              ) : <div></div>}

              <button
                type="submit"
                className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">save</span>
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
