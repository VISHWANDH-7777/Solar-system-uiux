import React from 'react';
import { 
  Search, 
  BrainCircuit, 
  Sun, 
  Moon, 
  Bell as Notifications, 
  Settings 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Header = ({ onToggleTheme, isDark, highThinking, setHighThinking }: { onToggleTheme: () => void, isDark: boolean, highThinking: boolean, setHighThinking: (v: boolean) => void }) => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-primary/10 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center bg-surface/50 rounded-full px-4 py-1.5 border border-primary/10">
          <Search size={18} className="text-primary/60" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-100 placeholder:text-primary/40 w-64 ml-2" 
            placeholder="Search orbit..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setHighThinking(!highThinking)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold",
            highThinking 
              ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10" 
              : "border-primary/20 text-primary/40 hover:text-primary/60"
          )}
          title="Enable Gemini 3.1 Pro with High Thinking"
        >
          <BrainCircuit size={16} />
          {highThinking ? "High Thinking ON" : "Standard Mode"}
        </button>
        <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
          <Notifications size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};
