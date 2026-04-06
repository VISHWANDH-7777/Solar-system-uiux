import React, { useEffect, useState } from 'react';
import { Orbit, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, type AuthError } from 'firebase/auth';
import { auth } from '../firebase';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const readRedirectResult = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        console.error('Redirect result error:', error);
        setAuthError(getFriendlyAuthError(error));
      }
    };

    readRedirectResult();
  }, []);

  const getFriendlyAuthError = (error: unknown): string => {
    const code = (error as AuthError | undefined)?.code;
    const currentDomain = window.location.hostname;

    switch (code) {
      case 'auth/popup-blocked':
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Google popup was blocked or closed. Retrying with redirect sign-in...';
      case 'auth/unauthorized-domain':
        return `This domain (${currentDomain}) is not authorized in Firebase Auth. Add ${currentDomain}, localhost, and 127.0.0.1 in Firebase Console > Authentication > Settings > Authorized domains, then retry.`;
      case 'auth/operation-not-allowed':
        return 'Google sign-in is not enabled in your Firebase project. Enable Google under Authentication > Sign-in method.';
      case 'auth/invalid-api-key':
        return 'Firebase API key is invalid. Check firebase-applet-config.json and use the correct project config.';
      case 'auth/network-request-failed':
        return 'Network error while contacting Firebase. Check your internet connection and retry.';
      default:
        return `Failed to sign in with Google on ${currentDomain}. Check browser console for the exact Firebase error.`;
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);

      const code = (error as AuthError | undefined)?.code;
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error('Redirect login failed:', redirectError);
          setAuthError(getFriendlyAuthError(redirectError));
          return;
        }
      }

      setAuthError(getFriendlyAuthError(error));
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

        {authError && (
          <p className="mt-4 text-left text-xs text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg p-3">
            {authError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-primary/40">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Grade Security</span>
        </div>
      </motion.div>
    </div>
  );
};
