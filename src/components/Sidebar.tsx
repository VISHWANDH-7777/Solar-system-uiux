import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3 as Analytics, 
  FileText, 
  Library, 
  Orbit, 
  LogOut 
} from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = ({ activeTab, setActiveTab, user, userProfile }: { 
  activeTab: string, 
  setActiveTab: (t: string) => void, 
  user: User | null,
  userProfile: any
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'analysis', label: 'Solar Analysis', icon: Analytics },
    { id: 'vault', label: 'Document Vault', icon: FileText },
    { id: 'galaxy', label: 'Clause Galaxy', icon: Library },
    { id: 'settings', label: 'System Settings', icon: Orbit },
  ];

  return (
    <aside className="w-64 glass border-r border-primary/10 hidden lg:flex flex-col p-6 gap-8 h-screen sticky top-0">
      <div className="flex items-center gap-3 text-primary mb-4">
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark">
          <Orbit size={20} strokeWidth={3} />
        </div>
        <h2 className="text-slate-100 text-xl font-bold tracking-tight">LegalOrbit</h2>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              activeTab === item.id 
                ? "bg-primary text-background-dark font-bold shadow-lg shadow-primary/20" 
                : "text-primary/60 hover:bg-primary/10 hover:text-primary"
            )}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {user && (
        <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || ''} alt={user.displayName || ''} className="size-10 rounded-full border border-primary/20" referrerPolicy="no-referrer" />
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-100 truncate">{user.displayName}</p>
                {userProfile?.role === 'admin' && (
                  <span className="text-[8px] bg-primary/20 text-primary px-1 rounded border border-primary/30 font-black uppercase">Admin</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};
