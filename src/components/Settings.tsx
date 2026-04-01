import React from 'react';
import { 
  User, 
  Shield, 
  Moon, 
  Sun, 
  BrainCircuit, 
  Clock,
  Mail,
  UserCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export const Settings = ({ 
  user, 
  userProfile, 
  isDark, 
  toggleTheme, 
  highThinking, 
  setHighThinking 
}: { 
  user: any, 
  userProfile: any, 
  isDark: boolean, 
  toggleTheme: () => void, 
  highThinking: boolean, 
  setHighThinking: (v: boolean) => void 
}) => {
  return (
    <div className="p-10 max-w-4xl mx-auto space-y-12">
      <header>
        <h1 className="text-3xl font-black text-slate-100 mb-2">System Settings</h1>
        <p className="text-slate-400">Configure your orbital analysis parameters and profile.</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
          <UserCircle size={14} /> User Profile
        </h2>
        <div className="glass p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-center md:items-start">
          <img 
            src={user?.photoURL || ''} 
            alt={user?.displayName || ''} 
            className="size-24 rounded-full border-4 border-primary/20 shadow-2xl shadow-primary/10"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-bold text-slate-100">{user?.displayName}</h3>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <Mail size={14} className="text-slate-500" />
                <span className="text-slate-400 text-sm">{user?.email}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                <Shield size={12} className="text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Role: {userProfile?.role || 'Client'}
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 flex items-center gap-2">
                <Clock size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Last Login: {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
          <BrainCircuit size={14} /> Analysis Preferences
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <BrainCircuit size={20} />
              </div>
              <button 
                onClick={() => setHighThinking(!highThinking)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${highThinking ? 'bg-primary' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform duration-300 ${highThinking ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div>
              <h3 className="text-slate-100 font-bold mb-1">High Thinking Mode</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enable advanced reasoning for complex legal documents. Uses more powerful AI models for deeper analysis.
              </p>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <button 
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isDark ? 'bg-primary' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform duration-300 ${isDark ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div>
              <h3 className="text-slate-100 font-bold mb-1">Visual Theme</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Switch between Dark Nebula and Light Solar themes. Theme is persisted across all your devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-8 border-t border-primary/10">
        <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
          <h3 className="text-red-400 font-bold mb-2">Danger Zone</h3>
          <p className="text-xs text-slate-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <button className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all">
            Request Account Deletion
          </button>
        </div>
      </section>
    </div>
  );
};
