import { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn, Loader2, Heart, Sparkles, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

export function LoginView() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Login failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative selection:bg-orange-100">
      {/* Navigation */}
      <nav className="relative z-10 w-full px-6 md:px-12 py-8 flex justify-between items-center bg-white border-b border-gray-100">
        <span className="font-black text-2xl tracking-tighter text-black uppercase">
          Volunteer<span className="text-orange-600">Tracker</span>
        </span>
        <button
          onClick={handleLogin}
          className="text-sm font-bold text-black border-b-2 border-orange-600 pb-1 hover:text-orange-600 transition-colors"
        >
          LOG IN
        </button>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl w-full"
        >
          <div className="flex justify-center gap-4 mb-8">
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
              <Heart size={24} />
            </div>
            <div className="p-3 bg-black rounded-2xl text-white">
              <Sparkles size={24} />
            </div>
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
              <MapPin size={24} />
            </div>
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-black tracking-tight leading-[1.1] mb-8">
            The easiest way to track your <span className="text-orange-600">volunteer hours</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto mb-16 leading-relaxed">
            Stop losing track of your community service. Log your hours, find nearby events, and reach your goals—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className={cn(
                "px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-wider transition-all duration-300 shadow-2xl flex items-center gap-4",
                isAuthenticating 
                  ? "bg-gray-400 cursor-not-allowed text-white" 
                  : "bg-black text-white hover:bg-orange-600 hover:scale-105 active:scale-95"
              )}
            >
              {isAuthenticating ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <LogIn size={24} />
              )}
              {isAuthenticating ? 'GETTING READY...' : 'CREATE ACCOUNT TO START'}
            </button>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
              <h3 className="font-black text-xl mb-3">Find Events</h3>
              <p className="text-gray-500 font-medium">See what's happening near your school and join in.</p>
            </div>
            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
              <h3 className="font-black text-xl mb-3">Log Hours</h3>
              <p className="text-gray-500 font-medium">Keep a clean record of everything you do for your community.</p>
            </div>
            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
              <h3 className="font-black text-xl mb-3">Hit Goals</h3>
              <p className="text-gray-500 font-medium">Set a target and watch your progress grow every week.</p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 py-10 px-6 border-t border-gray-100 text-center">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Build for Students — 2026
        </p>
      </footer>
    </div>
  );
}
