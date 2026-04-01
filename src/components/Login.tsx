import React, { useState } from 'react';
import { Orbit, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background-dark p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] size-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] size-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-12 rounded-[40px] border border-primary/20 max-w-md w-full text-center relative z-10"
      >
        <div className="size-20 bg-primary rounded-3xl flex items-center justify-center text-background-dark mx-auto mb-8 shadow-2xl shadow-primary/20">
          <Orbit size={48} strokeWidth={3} />
        </div>
        <h1 className="text-4xl font-black text-slate-100 tracking-tight mb-4">LegalOrbit</h1>
        <p className="text-slate-400 mb-10 leading-relaxed">
          The next-generation solar system for legal document simplification and analysis.
        </p>

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-slate-100 text-background-dark py-4 rounded-2xl font-black text-lg hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {loading ? (
            <Orbit className="animate-spin" size={24} />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="size-6" />
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-primary/40">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Grade Security</span>
        </div>
      </motion.div>
    </div>
  );
};
