import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, getUserProfile, saveUserProfile, UserProfile } from './lib/firebase';
import { cn } from './lib/utils';
import { LayoutDashboard, Compass, Users, UserCircle } from 'lucide-react';
import { fetchNearbyOpportunities, VolunteerOpportunity } from './services/opportunityService';
import { 
  ExploreView,
  OnboardingView,
  LogHoursView,
  SubmissionSuccessView,
  EventDetailsView,
  ImpactDashboardView,
  LoginView,
  CommunityView,
  ProfileView,
  PublicProfileView
} from './views';

export type Screen = 'onboarding' | 'explore' | 'log' | 'success' | 'details' | 'dashboard' | 'community' | 'profile' | 'publicProfile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('explore');
  const [selectedOpp, setSelectedOpp] = useState<VolunteerOpportunity | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      setUser(newUser);
      if (newUser) {
        const userProfile = await getUserProfile(newUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const navigateTo = (screen: Screen, opportunity?: VolunteerOpportunity, userId?: string) => {
    if (opportunity) setSelectedOpp(opportunity);
    if (userId) setSelectedUserId(userId);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOnboardingComplete = async (schoolName: string, hourGoal: number, grade?: string, locationAllowed?: boolean, state?: string, username?: string) => {
    if (!user) return;
    const newProfile: UserProfile = {
      schoolName: schoolName || '',
      hourGoal: hourGoal || 40,
      grade: grade || null,
      state: state || null,
      locationAllowed: locationAllowed ?? false,
      onboarded: true,
      displayName: username || user.displayName || 'Volunteer',
      email: user.email || '',
      bio: '',
      following: [],
      followers: []
    };
    await saveUserProfile(user.uid, newProfile);
    setProfile(newProfile);
    navigateTo('dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentScreen('dashboard'); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-4xl font-black animate-pulse uppercase tracking-tighter">Loading Tracker...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!profile || !profile.onboarded) {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-white selection:bg-orange-100">
      
      {/* SIMPLE HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-6 py-6 flex justify-between items-center h-20">
          <div className="flex items-center gap-12">
            <button 
              onClick={() => navigateTo('dashboard')} 
              className="font-black text-2xl tracking-tighter text-black uppercase"
            >
              Volunteer<span className="text-orange-600">Tracker</span>
            </button>

            <nav className="hidden md:flex gap-8">
              {[
                { label: 'Dashboard', screen: 'dashboard' },
                { label: 'Find Events', screen: 'explore' },
                { label: 'Community', screen: 'community' },
                { label: 'Log Hours', screen: 'log' }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigateTo(item.screen as Screen)}
                  className={cn(
                    "text-sm font-bold transition-all duration-300 relative py-2",
                    currentScreen === item.screen 
                      ? "text-orange-600"
                      : "text-gray-400 hover:text-black"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-black text-black">{profile.displayName}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{profile.schoolName || 'No School Set'}</span>
            </div>
            <button 
              onClick={() => navigateTo('profile')}
              className="text-xs font-black uppercase tracking-widest text-orange-600 hover:text-black transition-all"
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-20 min-h-screen pb-24 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {currentScreen === 'dashboard' && <ImpactDashboardView onNavigate={navigateTo} profile={profile} />}
            {currentScreen === 'explore' && <ExploreView onNavigate={navigateTo} profile={profile} />}
            {currentScreen === 'community' && <CommunityView profile={profile} onProfileUpdate={setProfile} onNavigate={navigateTo} />}
            {currentScreen === 'log' && user && <LogHoursView onNavigate={navigateTo} userId={user.uid} />}
            {currentScreen === 'success' && <SubmissionSuccessView onNavigate={navigateTo} />}
            {currentScreen === 'details' && <EventDetailsView onNavigate={navigateTo} opportunity={selectedOpp} />}
            {currentScreen === 'profile' && (
              <ProfileView 
                profile={profile} 
                onNavigate={navigateTo} 
                onSignOut={handleLogout} 
                onProfileUpdate={setProfile} 
              />
            )}
            {currentScreen === 'publicProfile' && selectedUserId && (
              <PublicProfileView 
                userId={selectedUserId} 
                onNavigate={navigateTo} 
                currentUserProfile={profile}
                onProfileUpdate={setProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Mobile Navigation Bar */}
        <div className="fixed bottom-6 left-6 right-6 z-[100] md:hidden">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl flex justify-around items-center">
            <button 
              onClick={() => navigateTo('dashboard')}
              className={cn(
                "p-4 rounded-2xl transition-all",
                currentScreen === 'dashboard' ? "bg-orange-600 text-white" : "text-gray-400"
              )}
            >
              <LayoutDashboard size={20} />
            </button>
            <button 
              onClick={() => navigateTo('explore')}
              className={cn(
                "p-4 rounded-2xl transition-all",
                currentScreen === 'explore' ? "bg-orange-600 text-white" : "text-gray-400"
              )}
            >
              <Compass size={20} />
            </button>
            <button 
              onClick={() => navigateTo('community')}
              className={cn(
                "p-4 rounded-2xl transition-all",
                currentScreen === 'community' ? "bg-orange-600 text-white" : "text-gray-400"
              )}
            >
              <Users size={20} />
            </button>
            <button 
              onClick={() => navigateTo('profile')}
              className={cn(
                "p-4 rounded-2xl transition-all",
                currentScreen === 'profile' || currentScreen === 'publicProfile' ? "bg-orange-600 text-white" : "text-gray-400"
              )}
            >
              <UserCircle size={20} />
            </button>
          </div>
        </div>

        <footer className="max-w-screen-xl mx-auto px-12 py-12 border-t border-gray-100 mt-24">
           <div className="flex justify-between items-center text-xs font-bold text-gray-300 uppercase tracking-widest">
              <span>Volunteer Tracker — Student Edition</span>
              <span>© 2026</span>
           </div>
        </footer>
      </div>
    </div>
  );
}
