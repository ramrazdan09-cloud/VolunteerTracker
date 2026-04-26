import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, School, GraduationCap, MapPin, Award, LogOut, Settings, ChevronRight, Clock, Heart, ArrowLeft, Loader2, Edit3, X, Check, Save } from 'lucide-react';
import { UserProfile, auth, getUserActivities, VolunteerActivity, getUserBookmarks, VolunteerBookmark, saveUserProfile } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import type { Screen } from '../App';
import { searchSchools } from '../services/opportunityService';

interface ProfileViewProps {
  profile: UserProfile;
  onNavigate: (screen: Screen) => void;
  onSignOut: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export function ProfileView({ profile, onNavigate, onSignOut, onProfileUpdate }: ProfileViewProps) {
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [bookmarks, setBookmarks] = useState<VolunteerBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editGrade, setEditGrade] = useState(profile.grade || '');
  const [editGoal, setEditGoal] = useState(profile.hourGoal);
  const [editSchool, setEditSchool] = useState(profile.schoolName || '');
  const [editState, setEditState] = useState(profile.state || '');
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [isSearchingSchools, setIsSearchingSchools] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      if (auth.currentUser) {
        setIsLoading(true);
        const [userActs, userBooks] = await Promise.all([
          getUserActivities(auth.currentUser.uid),
          getUserBookmarks(auth.currentUser.uid)
        ]);
        setActivities(userActs);
        setBookmarks(userBooks);
        setIsLoading(false);
      }
    }
    loadProfileData();
  }, []);

  // School Search Logic
  useEffect(() => {
    if (editSchool.length < 2) {
      setSchoolSuggestions([]);
      setIsSearchingSchools(false);
      return;
    }

    if (schoolSuggestions.includes(editSchool)) {
      return;
    }

    setIsSearchingSchools(true);
    const timer = setTimeout(async () => {
      if (editState) {
        const results = await searchSchools(editSchool, editState);
        setSchoolSuggestions(results);
        setIsSearchingSchools(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [editSchool, editState]);

  const handleSaveProfile = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    setIsSaving(true);
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        grade: editGrade as any,
        hourGoal: editGoal,
        schoolName: editSchool,
        state: editState as any,
        bio: editBio,
      };

      await saveUserProfile(currentUserId, updatedProfile);
      if (onProfileUpdate) onProfileUpdate(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalHours = activities.reduce((sum, act) => sum + act.hours, 0);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-orange-100 text-orange-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all flex items-center gap-2 shadow-sm"
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Profile Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-orange-50 border-2 border-orange-100 rounded-[3rem] p-10 text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <User size={80} />
               </div>
               
               <div className="w-24 h-24 bg-orange-200 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-xl relative z-10">
                  <span className="text-4xl font-black text-orange-800">{profile.displayName?.charAt(0)}</span>
               </div>
               
               <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-2">{profile.displayName}</h2>
               <p className="text-gray-400 font-bold mb-8 uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                  <Mail size={14} /> {profile.email}
               </p>

               {profile.bio && (
                 <div className="mb-8 p-4 bg-orange-100/50 rounded-2xl text-left border border-orange-100">
                    <p className="text-xs font-bold text-orange-900 leading-relaxed italic">
                      "{profile.bio}"
                    </p>
                 </div>
               )}

               <div className="grid grid-cols-6 gap-y-6 py-8 border-y-2 border-orange-200/50 mb-8">
                  <div className="text-center col-span-2">
                    <p className="text-2xl font-black text-black">{totalHours}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">Hours</p>
                  </div>
                  <div className="text-center col-span-2">
                    <p className="text-2xl font-black text-black">{activities.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">Acts</p>
                  </div>
                  <div className="text-center col-span-2">
                    <p className="text-2xl font-black text-black">{bookmarks.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">Saved</p>
                  </div>
                  <div className="text-center pt-4 border-t border-orange-200/30 col-span-3">
                    <p className="text-xl font-black text-black">{profile.followers?.length || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">Followers</p>
                  </div>
                  <div className="text-center pt-4 border-t border-orange-200/30 col-span-3">
                    <p className="text-xl font-black text-black">{profile.following?.length || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">Following</p>
                  </div>
               </div>

               <div className="space-y-4 text-left">
                  <div className="flex items-center gap-4 text-sm font-bold text-orange-900/70">
                    <School size={16} className="text-orange-600" />
                    <span>{profile.schoolName || 'Not Set'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-orange-900/70">
                    <GraduationCap size={16} className="text-orange-600" />
                    <span>{profile.grade || 'High School Student'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-orange-900/70">
                    <MapPin size={16} className="text-orange-600" />
                    <span>{profile.state || 'Global Member'}</span>
                  </div>
               </div>

               <button 
                 onClick={onSignOut}
                 className="w-full mt-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-3 shadow-xl"
               >
                 <LogOut size={18} /> SIGN OUT
               </button>
            </div>

            <div className="p-10 border-2 border-gray-100 rounded-[3rem] space-y-6 bg-white shadow-sm">
               <h3 className="font-black text-black uppercase tracking-widest text-xs flex items-center gap-3">
                  <Award className="text-orange-600" size={16} /> Impact Badges
               </h3>
               <div className="flex flex-wrap gap-3">
                  {totalHours >= 10 && (
                    <div title="Pioneer: 10+ Hours" className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center font-black">P</div>
                  )}
                  {activities.length >= 5 && (
                    <div title="Consistent: 5+ Activities" className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-black">C</div>
                  )}
                  <div className="w-12 h-12 bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-200">
                    <Settings size={16} />
                  </div>
               </div>
            </div>
          </div>

          {/* Activity/Saved Feed */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* SAVED OPPORTUNITIES */}
            <section className="space-y-8">
               <div className="flex justify-between items-end border-b-2 border-gray-100 pb-6">
                  <h3 className="text-3xl font-black text-black uppercase tracking-tighter">Your Saved <span className="text-orange-600">Impact</span></h3>
                  <button 
                    onClick={() => onNavigate('dashboard')}
                    className="text-xs font-black uppercase text-gray-400 hover:text-black transition-colors"
                  >
                    Manage
                  </button>
               </div>
               
               {isLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4 text-gray-300">
                    <Loader2 className="animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Loading bookmarks...</p>
                  </div>
               ) : bookmarks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bookmarks.map(bookmark => (
                      <div 
                        key={bookmark.id}
                        className="p-8 bg-white border-2 border-gray-100 rounded-[2.5rem] hover:border-black transition-all group flex flex-col justify-between"
                      >
                         <div>
                            <div className="flex justify-between items-start mb-6">
                               <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                  <Heart size={18} fill="currentColor" />
                               </div>
                               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{bookmark.hours} goal</span>
                            </div>
                            <h4 className="text-xl font-black uppercase leading-tight mb-2 group-hover:text-orange-600 transition-colors">{bookmark.title}</h4>
                            <p className="text-sm font-bold text-gray-400 uppercase">{bookmark.organization}</p>
                         </div>
                         <button 
                           onClick={() => onNavigate('dashboard')} // Details logic handled elsewhere but dashboard shows bookmarks
                           className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform"
                         >
                            View Details <ChevronRight size={14} />
                         </button>
                      </div>
                    ))}
                  </div>
               ) : (
                  <div className="p-12 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <p className="text-sm font-black text-gray-300 uppercase italic">No saved events yet</p>
                  </div>
               )}
            </section>

            {/* FULL ACTIVITY LOG */}
            <section className="space-y-8">
               <div className="flex justify-between items-end border-b-2 border-gray-100 pb-6">
                  <h3 className="text-3xl font-black text-black uppercase tracking-tighter">Activity <span className="text-orange-600">Log</span></h3>
                  <button 
                    onClick={() => onNavigate('log')}
                    className="text-xs font-black uppercase text-orange-600 hover:underline"
                  >
                    Log More
                  </button>
               </div>

               {isLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4 text-gray-300">
                    <Loader2 className="animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Loading history...</p>
                  </div>
               ) : activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map(activity => (
                      <div key={activity.id} className="flex items-center gap-6 p-8 bg-gray-50 border border-gray-100 rounded-3xl group">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-orange-600 text-lg shadow-sm">
                            <Clock size={20} />
                         </div>
                         <div className="flex-grow">
                            <div className="flex justify-between items-center">
                               <div>
                                  <h4 className="font-black text-lg uppercase tracking-tight">{activity.title}</h4>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activity.date}</p>
                                </div>
                                <span className="bg-orange-600 text-white px-5 py-2 rounded-xl font-black text-sm shadow-lg shadow-orange-100">
                                   +{activity.hours}h
                                </span>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
               ) : (
                  <div className="p-12 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <p className="text-sm font-black text-gray-300 uppercase italic">No hours logged yet</p>
                  </div>
               )}
            </section>
          </div>
        </div>
      </main>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] p-10 md:p-16 space-y-10 relative overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Edit <span className="text-orange-600">Profile</span></h2>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-gray-300 hover:text-black transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Grade Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">Current Grade</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Freshman', 'Sophomore', 'Junior', 'Senior'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setEditGrade(g)}
                        className={cn(
                          "py-4 rounded-xl border-2 font-black uppercase text-xs transition-all",
                          editGrade === g 
                            ? "bg-black text-white border-black" 
                            : "bg-gray-50 text-gray-400 border-gray-100 hover:border-black"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio Section */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">About You (Bio)</label>
                  <textarea 
                    placeholder="Tell the community who you are and why you volunteer..."
                    className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-black focus:ring-0 transition-all min-h-[120px] resize-none"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                  <div className="flex justify-end pr-4 text-[10px] font-black uppercase text-gray-300">
                    {editBio.length} / 1000
                  </div>
                </div>

                {/* Hour Goal */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">Hour Goal: {editGoal} hrs</label>
                  <input 
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={editGoal}
                    onChange={(e) => setEditGoal(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <div className="flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    <span>10 hrs</span>
                    <span>200 hrs</span>
                  </div>
                </div>

                {/* School Selection */}
                <div className="space-y-6 pt-6 border-t border-gray-100">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">State (CA Focus)</label>
                      <select 
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-orange-100 rounded-xl font-bold focus:border-black focus:ring-0 appearance-none bg-orange-50/30"
                      >
                        <option value="CA">California (CA)</option>
                        {['AL','AK','AZ', 'AR','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                  <div className="space-y-4 relative school-search-container">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">High School Name</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Search schools..."
                        className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-black focus:ring-0 transition-all uppercase"
                        value={editSchool}
                        onChange={(e) => {
                          setEditSchool(e.target.value);
                          setIsSearchingSchools(true);
                        }}
                      />
                      {isSearchingSchools && (
                        <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-orange-600" size={18} />
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {editSchool.length >= 2 && (schoolSuggestions.length > 0 || isSearchingSchools) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 right-0 bg-white border-2 border-black rounded-2xl shadow-2xl mb-4 overflow-hidden z-[110] max-h-60 overflow-y-auto"
                        >
                          {isSearchingSchools ? (
                            <div className="p-10 text-center flex flex-col items-center gap-4">
                              <Loader2 className="text-orange-600 animate-spin" size={24} />
                              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Searching Registry...</p>
                            </div>
                          ) : (
                            <>
                              {schoolSuggestions.length > 0 ? (
                                <>
                                  {schoolSuggestions.map(s => (
                                    <button 
                                      key={s}
                                      onClick={() => {
                                        setEditSchool(s);
                                        setSchoolSuggestions([]);
                                      }}
                                      className="w-full px-6 py-4 text-left font-black text-xs uppercase hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-none flex items-center justify-between group"
                                    >
                                      <span>{s}</span>
                                      <Check size={14} className="text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  ))}
                                  <button 
                                    onClick={() => { setEditSchool(editSchool); setSchoolSuggestions([]); }}
                                    className="w-full py-3 bg-gray-50 text-[8px] font-black uppercase hover:bg-black hover:text-white transition-colors"
                                  >
                                    Use "{editSchool}"
                                  </button>
                                </>
                              ) : (
                                <div className="p-6 text-center space-y-4">
                                  <p className="text-[8px] font-black uppercase text-gray-300 tracking-widest">No schools found</p>
                                  <button 
                                    onClick={() => { setEditSchool(editSchool); setSchoolSuggestions([]); }}
                                    className="w-full py-3 bg-black text-white rounded-xl text-[8px] font-black uppercase hover:bg-orange-600 transition-colors"
                                  >
                                    Use "{editSchool}"
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-10 border-t border-gray-100">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-5 border-2 border-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || !editSchool || !editState}
                  className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-xl flex items-center justify-center gap-3 disabled:bg-gray-200"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
