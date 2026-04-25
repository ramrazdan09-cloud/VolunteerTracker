import { useState, useEffect } from 'react';
import { User, Search, MapPin, Navigation, GraduationCap, Target, ChevronRight, Heart, Sparkles, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { searchSchools } from '../services/opportunityService';

interface OnboardingViewProps {
  onComplete: (schoolName: string, hourGoal: number, grade?: string, locationAllowed?: boolean, state?: string, username?: string) => void;
}

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [hourGoal, setHourGoal] = useState(40);
  const [grade, setGrade] = useState('');
  const [state, setState] = useState('');
  const [locationAllowed, setLocationAllowed] = useState<boolean | undefined>(undefined);
  
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [isSearchingSchools, setIsSearchingSchools] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (schoolName.length >= 3 && state && !schoolSuggestions.includes(schoolName)) {
        setIsSearchingSchools(true);
        const results = await searchSchools(schoolName, state);
        setSchoolSuggestions(results);
        setIsSearchingSchools(false);
        setShowSuggestions(true);
      } else {
        setSchoolSuggestions([]);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [schoolName, state]);

  const selectSchool = (name: string) => {
    setSchoolName(name);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click was outside the search input container and suggestions list
      if (!target.closest('.school-search-container')) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      onComplete(schoolName, hourGoal, grade, locationAllowed, state, username);
    }
  };

  const handleSkip = () => {
    // Prevent skip on username step if desired, but request says "ask for username/name. That will be required"
    if (step === 1 && !username.trim()) return;
    handleNext();
  };

  const steps = [
    {
      id: 1,
      title: "What should we call you?",
      description: "Enter your full name or a username.",
      content: (
        <div className="space-y-6 w-full max-w-md">
          <div className="relative border-2 border-black rounded-2xl overflow-hidden bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              className="w-full pl-12 pr-4 py-5 bg-transparent border-none focus:ring-0 font-bold text-lg placeholder:text-gray-300"
              placeholder="Your Name / Username..."
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "First, which state are you in?",
      description: "This helps us identify the correct school registry.",
      content: (
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 w-full max-w-2xl px-4 overflow-y-auto max-h-[300px] p-4 bg-gray-50 rounded-3xl border-2 border-gray-100">
          {states.map((s) => (
            <button
              key={s}
              onClick={() => { setState(s); setStep(3); }}
              className={cn(
                "py-3 rounded-xl font-black text-xs transition-all border-2",
                state === s ? "bg-orange-600 text-white border-orange-600 shadow-lg" : "bg-white text-black border-gray-100 hover:border-black"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )
    },
    {
      id: 3,
      title: "Where do you go to school?",
      description: state 
        ? `Searching for high schools in ${state}. We use this to connect you with events at your school and local community.` 
        : "This helps us show you real volunteer opportunities and regional community posts.",
      content: (
        <div className="space-y-6 w-full max-w-md relative school-search-container">
          <div className="relative z-50 border-2 border-black rounded-2xl overflow-hidden bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              className="w-full pl-12 pr-12 py-5 bg-transparent border-none focus:ring-0 font-bold text-lg placeholder:text-gray-300 uppercase"
              placeholder="Search your high school..."
              type="text"
              value={schoolName}
              onChange={(e) => {
                setSchoolName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {isSearchingSchools && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-600 animate-spin" size={20} />
            )}
          </div>

          <AnimatePresence>
            {showSuggestions && (schoolName.length >= 3) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-[85px] left-0 right-0 z-[60] bg-white border-2 border-black rounded-2xl shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden max-h-[300px] overflow-y-auto"
              >
                {isSearchingSchools ? (
                  <div className="p-10 text-center flex flex-col items-center gap-4">
                    <Loader2 className="text-orange-600 animate-spin" size={32} />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
                      Searching Registry in {state}...
                    </p>
                  </div>
                ) : schoolSuggestions.length > 0 ? (
                   <>
                    <div className="px-6 py-2 bg-gray-50 border-b border-black/5 text-[8px] font-black uppercase tracking-widest text-gray-400">
                      Found {schoolSuggestions.length} schools matching "{schoolName}"
                    </div>
                    {schoolSuggestions.map((school) => (
                      <button
                        key={school}
                        onClick={() => selectSchool(school)}
                        className="w-full text-left px-6 py-5 hover:bg-orange-50 font-black text-sm uppercase transition-all flex items-center justify-between group border-b border-gray-100 last:border-none hover:pl-8"
                      >
                        <div className="flex items-center gap-3">
                          <GraduationCap size={16} className={cn("text-gray-300 group-hover:text-orange-600 transition-colors")} />
                          <span className="group-hover:text-orange-600 transition-colors">{school}</span>
                        </div>
                        <Check size={16} className="text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                   </>
                ) : (
                  <div className="p-10 text-center flex flex-col items-center gap-4">
                    <Search className="text-gray-200" size={32} />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
                      No schools found for "{schoolName}"
                    </p>
                    <button 
                      onClick={() => setShowSuggestions(false)}
                      className="text-[8px] font-black underline text-orange-600 uppercase"
                    >
                      Keep typing or skip
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => { setLocationAllowed(true); setStep(4); }}
            className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-colors"
          >
            <Navigation size={18} />
            USE MY LOCATION INSTEAD
          </button>
        </div>
      )
    },
    {
      id: 4,
      title: "What grade are you in?",
      description: "Some events are only for specific year groups.",
      content: (
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {['9th', '10th', '11th', '12th'].map((g) => (
            <button
              key={g}
              onClick={() => { setGrade(g); setStep(5); }}
              className={cn(
                "py-6 border-2 border-black rounded-2xl font-black text-xl transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]",
                grade === g ? "bg-orange-600 text-white border-orange-600" : "bg-white text-black"
              )}
            >
              {g} Grade
            </button>
          ))}
        </div>
      )
    },
    {
      id: 5,
      title: "How many hours is your goal?",
      description: "Most students aim for 40 hours per year.",
      content: (
        <div className="w-full max-w-md space-y-12">
          <div className="text-center">
            <span className="text-8xl font-black text-orange-600 tracking-tighter">{hourGoal}</span>
            <span className="text-2xl font-black ml-4">HOURS</span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={hourGoal}
            onChange={(e) => setHourGoal(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
          />
          <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-40">
            <span>5 hrs</span>
            <span>100 hrs</span>
            <span>200 hrs</span>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Ready to start tracking?",
      description: "Your personalized dashboard is waiting for you.",
      content: (
        <div className="w-full max-w-md bg-orange-50 border-2 border-orange-200 p-8 rounded-3xl text-left">
          <h4 className="font-black text-orange-600 uppercase tracking-widest text-xs mb-4">Summary</h4>
          <div className="space-y-4">
             <div className="flex justify-between items-center pb-4 border-b border-orange-200">
                <span className="font-bold text-orange-900/60 transition-colors">Personal Username</span>
                <span className="font-black text-orange-600">{username || 'Volunteer'}</span>
             </div>
             <div className="flex justify-between items-center pb-4 border-b border-orange-200">
                <span className="font-bold text-orange-900/60 transition-colors">Target Goal</span>
                <span className="font-black text-orange-600">{hourGoal} Hours</span>
             </div>
             {state && (
               <div className="flex justify-between items-center pb-4 border-b border-orange-200">
                  <span className="font-bold text-orange-900/60">State</span>
                  <span className="font-black text-orange-600">{state}</span>
               </div>
             )}
             {schoolName && (
               <div className="flex justify-between items-center pb-4 border-b border-orange-200">
                  <span className="font-bold text-orange-900/60">School</span>
                  <span className="font-black text-orange-600">{schoolName}</span>
               </div>
             )}
             {grade && (
               <div className="flex justify-between items-center">
                  <span className="font-bold text-orange-900/60">Grade</span>
                  <span className="font-black text-orange-600">{grade}</span>
               </div>
             )}
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps.find(s => s.id === step)!;

  const isNextDisabled = step === 1 && !username.trim();

  return (
    <div className="flex flex-col items-center bg-white min-h-screen w-full selection:bg-orange-100">
      <nav className="w-full px-6 py-8 flex justify-between items-center">
        <span className="font-black text-xl tracking-tighter text-black uppercase">
          Volunteer<span className="text-orange-600">Tracker</span>
        </span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-2 w-8 rounded-full transition-all duration-300",
                s === step ? "bg-orange-600" : (s < step ? "bg-black" : "bg-gray-100")
              )}
            />
          ))}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-6 py-12 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex flex-col items-center"
          >
            <h2 className="text-4xl md:text-6xl font-black text-black tracking-tight mb-4 uppercase">
              {currentStep.title}
            </h2>
            <p className="text-lg md:text-xl text-gray-500 font-medium mb-16">
              {currentStep.description}
            </p>

            <div className="w-full mb-16 flex justify-center">
              {currentStep.content}
            </div>

            <div className="flex items-center gap-8">
              {step !== 1 && (
                <button 
                  onClick={handleSkip}
                  className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  SKIP FOR NOW
                </button>
              )}
              <button 
                onClick={handleNext}
                disabled={isNextDisabled}
                className={cn(
                  "bg-black text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-3",
                  isNextDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600"
                )}
              >
                {step === 6 ? 'TAKE ME IN' : 'NEXT STEP'} <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
