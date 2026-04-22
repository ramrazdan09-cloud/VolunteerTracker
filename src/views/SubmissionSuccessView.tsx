import { CheckCircle2, Trophy, ArrowRight, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';

interface SubmissionSuccessViewProps {
  onNavigate: (screen: Screen) => void;
}

export function SubmissionSuccessView({ onNavigate }: SubmissionSuccessViewProps) {
  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 12 }}
        className="max-w-2xl w-full"
      >
        {/* SUCCESS ICON */}
        <div className="mb-12 relative flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-32 h-32 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-100"
          >
            <CheckCircle2 size={64} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-4 -right-4 md:right-32 bg-black text-white p-4 rounded-2xl shadow-xl rotate-12"
          >
            <Trophy size={24} />
          </motion.div>
        </div>

        <span className="text-orange-600 font-black uppercase tracking-[0.4em] text-xs mb-6 block">Awesome Work!</span>
        <h1 className="text-5xl md:text-7xl font-black text-black tracking-tight mb-8 uppercase">
          Hours logged <span className="text-orange-600 italic">Successfully</span>
        </h1>
        
        <p className="text-gray-500 text-xl font-medium max-w-lg mx-auto mb-16 leading-relaxed">
          Nice job making a difference today. Your dashboard has been updated with these new hours.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-12 py-6 bg-black text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            Back to Dashboard <ArrowRight size={18} />
          </button>
          <button
            className="px-12 py-6 border-2 border-black text-black font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
          >
            Share Impact <Share2 size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
