import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, School, GraduationCap, MapPin, Award, ArrowLeft, Loader2, Clock, Users, UserPlus, UserCheck } from 'lucide-react';
import { UserProfile, auth, getUserActivities, VolunteerActivity, getUserProfile, toggleFollowUser } from '../lib/firebase';
import { cn } from '../lib/utils';
import type { Screen } from '../App';

interface PublicProfileViewProps {
  userId: string;
  onNavigate: (screen: Screen) => void;
  currentUserProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
}

export function PublicProfileView({ userId, onNavigate, currentUserProfile, onProfileUpdate }: PublicProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    async function loadPublicProfile() {
      setIsLoading(true);
      try {
        const [userProf, userActs] = await Promise.all([
          getUserProfile(userId),
          getUserActivities(userId)
        ]);
        setProfile(userProf);
        setActivities(userActs);
        
        if (currentUserProfile?.following?.includes(userId)) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error("Error loading public profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPublicProfile();
  }, [userId, currentUserProfile]);

  const handleFollow = async () => {
    if (!auth.currentUser || !currentUserProfile) return;
    
    setIsFollowLoading(true);
    try {
      const newFollowState = await toggleFollowUser(auth.currentUser.uid, userId);
      setIsFollowing(newFollowState);
      
      // Update local current user profile to reflect the change
      const updatedFollowing = newFollowState 
        ? [...(currentUserProfile.following || []), userId]
        : (currentUserProfile.following || []).filter(id => id !== userId);
      
      onProfileUpdate({
        ...currentUserProfile,
        following: updatedFollowing
      });

      // Update target profile followers count locally
      if (profile) {
        setProfile({
          ...profile,
          followers: newFollowState 
            ? [...(profile.followers || []), auth.currentUser.uid]
            : (profile.followers || []).filter(id => id !== auth.currentUser.uid)
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-orange-600" size={40} />
        <p className="font-black text-gray-300 uppercase tracking-widest text-xs">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-4xl font-black uppercase mb-4">Profile Not Found</h2>
        <button 
          onClick={() => onNavigate('community')}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest"
        >
          Back to Community
        </button>
      </div>
    );
  }

  const isMe = auth.currentUser?.uid === userId;

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        <button 
          onClick={() => onNavigate('community')}
          className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black mb-12 transition-all"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Community
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-10 text-center relative overflow-hidden group shadow-sm">
               <div className="w-24 h-24 bg-orange-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg relative z-10">
                  <span className="text-4xl font-black text-orange-800 uppercase">{profile.displayName?.charAt(0)}</span>
               </div>
               
               <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-2 leading-none">{profile.displayName}</h2>
               <p className="text-gray-400 font-bold mb-8 uppercase text-xs tracking-widest leading-none">
                  Volunteer Extraordinaire
               </p>

               <div className="flex justify-center gap-6 py-6 border-y-2 border-gray-50 mb-8">
                  <div className="text-center">
                    <p className="text-xl font-black text-black">{profile.followers?.length || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Followers</p>
                  </div>
                  <div className="w-px h-10 bg-gray-50"></div>
                  <div className="text-center">
                    <p className="text-xl font-black text-black">{profile.following?.length || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Following</p>
                  </div>
               </div>

               {profile.bio && (
                 <div className="mb-8 text-center bg-gray-50/50 p-6 rounded-2xl">
                   <p className="text-sm font-bold text-gray-600 leading-relaxed italic">
                     "{profile.bio}"
                   </p>
                 </div>
               )}

               <div className="space-y-4 text-left mb-10">
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
                    <School size={16} className="text-black" />
                    <span>{profile.schoolName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
                    <GraduationCap size={16} className="text-black" />
                    <span>{profile.grade || 'High School Student'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
                    <MapPin size={16} className="text-black" />
                    <span>{profile.state || 'Global'}</span>
                  </div>
               </div>

               {!isMe && (
                 <button 
                   onClick={handleFollow}
                   disabled={isFollowLoading}
                   className={cn(
                     "w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl",
                     isFollowing 
                      ? "bg-gray-100 text-black hover:bg-red-50 hover:text-red-600 hover:border-red-100 border-2 border-transparent" 
                      : "bg-black text-white hover:bg-orange-600"
                   )}
                 >
                   {isFollowLoading ? (
                     <Loader2 className="animate-spin" size={18} />
                   ) : isFollowing ? (
                     <><UserCheck size={18} /> FOLLOWING</>
                   ) : (
                     <><UserPlus size={18} /> FOLLOW</>
                   )}
                 </button>
               )}
            </div>

            <div className="p-10 border-2 border-gray-100 rounded-[3rem] space-y-6 bg-white shadow-sm">
               <h3 className="font-black text-black uppercase tracking-widest text-xs flex items-center gap-3">
                  <Award className="text-orange-600" size={16} /> Verified Badges
               </h3>
               <div className="flex flex-wrap gap-3">
                  <div title="Community Impact" className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center font-black">I</div>
                  <div title="Service Star" className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-black">S</div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-16">
            <section className="space-y-8">
               <div className="flex justify-between items-end border-b-2 border-gray-100 pb-6">
                  <h3 className="text-3xl font-black text-black uppercase tracking-tighter">Impact <span className="text-orange-600">History</span></h3>
               </div>

               {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map(activity => (
                      <div key={activity.id} className="flex items-center gap-6 p-8 bg-gray-50 border border-gray-100 rounded-3xl group transition-all hover:bg-white hover:shadow-xl hover:border-black">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-orange-600 text-lg shadow-sm group-hover:bg-black group-hover:text-white transition-colors">
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
                  <div className="p-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                    <p className="text-sm font-black text-gray-300 uppercase italic">No public activity history yet</p>
                  </div>
               )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
