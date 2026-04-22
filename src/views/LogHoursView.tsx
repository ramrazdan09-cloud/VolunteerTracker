import { useState, FormEvent } from 'react';
import { Clock, Calendar, MapPin, CheckCircle2, ChevronRight, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { Screen } from '../App';

import { logVolunteerActivity } from '../lib/firebase';

interface LogHoursViewProps {
  onNavigate: (screen: Screen) => void;
  userId: string;
}

export function LogHoursView({ onNavigate, userId }: LogHoursViewProps) {
  const [hours, setHours] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hours || !title) return;
    
    setSubmitting(true);
    try {
      await logVolunteerActivity(userId, {
        title,
        hours: parseFloat(hours),
        date,
        description
      });
      onNavigate('success');
    } catch (error) {
      console.error("Error logging hours:", error);
      alert("Failed to log hours. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen selection:bg-orange-100">
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight mb-4 uppercase">
            Log your <span className="text-orange-600">Impact</span>
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Did something cool? Log it here to track your progress and inspire others.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* TITLE */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">What did you do?</label>
            <input
              required
              className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black focus:ring-0 transition-all font-bold text-lg placeholder:text-gray-300"
              placeholder="e.g. Park Cleanup with Science Club"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* HOURS */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">How many hours?</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="number"
                  step="0.5"
                  className="w-full pl-12 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black focus:ring-0 transition-all font-bold text-lg placeholder:text-gray-300"
                  placeholder="2.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
            </div>

            {/* DATE */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">When was it?</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="date"
                  className="w-full pl-12 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black focus:ring-0 transition-all font-bold text-lg placeholder:text-gray-300"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Tell us more (optional)</label>
            <textarea
              className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black focus:ring-0 transition-all font-bold text-lg placeholder:text-gray-300 min-h-[150px] resize-none"
              placeholder="What was your favorite part?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "w-full py-6 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3",
              submitting ? "bg-gray-100 text-gray-400" : "bg-black text-white hover:bg-orange-600"
            )}
          >
            {submitting ? 'LOGGING...' : 'SUBMIT LOG'} <ChevronRight size={18} />
          </button>
        </form>
      </main>
    </div>
  );
}
