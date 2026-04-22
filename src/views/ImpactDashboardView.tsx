import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { Screen } from '../App';
import { UserProfile, getUserActivities, VolunteerActivity, auth, getUserBookmarks, VolunteerBookmark } from '../lib/firebase';
import { PlusCircle, Loader2, Globe, ArrowRight, Bookmark, Share2 } from 'lucide-react';
import { useEffect, useState, MouseEvent } from 'react';
import { fetchNearbyOpportunities, VolunteerOpportunity } from '../services/opportunityService';
import { getCurrentLocation } from '../lib/location';

interface ImpactDashboardViewProps {
  onNavigate: (screen: Screen, opportunity?: VolunteerOpportunity) => void;
  profile: UserProfile;
}

export function ImpactDashboardView({ onNavigate, profile }: ImpactDashboardViewProps) {
  const [nearbyEvents, setNearbyEvents] = useState<VolunteerOpportunity[]>([]);
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [bookmarks, setBookmarks] = useState<VolunteerBookmark[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoadingEvents(true);
      setIsLoadingActivities(true);
      setIsLoadingBookmarks(true);
      
      const currentUserId = auth.currentUser?.uid;
      
      if (currentUserId) {
        const [userActivities, userBookmarks] = await Promise.all([
          getUserActivities(currentUserId),
          getUserBookmarks(currentUserId)
        ]);
        setActivities(userActivities);
        setBookmarks(userBookmarks.slice(0, 3)); // Just show recent 3
        setIsLoadingActivities(false);
        setIsLoadingBookmarks(false);
      }

      let coords: { lat: number; lng: number } | undefined = undefined;
      
      if (profile?.locationAllowed) {
        const browserCoords = await getCurrentLocation();
        if (browserCoords) coords = browserCoords;
      }

      const data = await fetchNearbyOpportunities(profile.schoolName || 'nearby', coords, profile.state);
      setNearbyEvents(data.slice(0, 2)); // Just top 2 for dashboard
      setIsLoadingEvents(false);
    }
    loadData();
  }, [profile.schoolName, profile.locationAllowed, profile.state]);

  const totalCalculatedHours = activities.reduce((sum, act) => sum + act.hours, 0);
  const progressPercentage = Math.min((totalCalculatedHours / profile.hourGoal) * 100, 100);

  const handleShare = async (e: MouseEvent, title: string, url: string, organization?: string) => {
    e.stopPropagation();
    const shareData = {
      title: title,
      text: `Check out this volunteer opportunity: ${title}${organization ? ` at ${organization}` : ''}`,
      url: url || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="bg-white min-h-screen selection:bg-orange-100">
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        {/* WELCOME SECTION */}
        <section className="mb-16">
          <div className="bg-orange-50 border-2 border-orange-100 p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
            <div className="text-left">
              <span className="text-orange-600 font-black uppercase tracking-widest text-xs mb-2 block">Student Profile • {profile.email}</span>
              <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight mb-4">
                Hey {profile.displayName}! 👋
              </h1>
              <p className="text-gray-500 font-medium text-lg">
                You've completed <span className="text-black font-black">{totalCalculatedHours} hours</span> so far. Keep it up!
              </p>
            </div>
            
            <div className="w-full md:w-auto flex flex-col items-center">
               <div className="relative w-48 h-48">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-gray-200 stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50"/>
                    <circle className="text-orange-600 stroke-current transition-all duration-1000" strokeWidth="10" strokeDasharray={`${progressPercentage * 2.51} 251.2`} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" transform="rotate(-90 50 50)"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black">{Math.round(progressPercentage)}%</span>
                  </div>
               </div>
               <span className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400">Target: {profile.hourGoal} hrs</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* RECENT ACTIVITY */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center bg-white border-b-2 border-gray-100 pb-4">
              <h2 className="text-xl font-black text-black uppercase">What you've done recently</h2>
              <button 
                onClick={() => onNavigate('log')}
                className="text-xs font-black text-orange-600 uppercase hover:underline flex items-center gap-2"
              >
                <PlusCircle size={14} /> Log New Hours
              </button>
            </div>
            <div className="grid gap-6">
              {isLoadingActivities ? (
                <div className="py-20 flex flex-col items-center">
                  <Loader2 className="animate-spin text-orange-600" />
                </div>
              ) : activities.length > 0 ? (
                activities.map(activity => (
                  <div key={activity.id} className="flex items-center gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-orange-200 transition-colors group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xl">
                      {activity.title.charAt(0)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-lg text-black">{activity.title}</h3>
                          <p className="text-sm text-gray-400 font-bold">{activity.description.slice(0, 50)}{activity.description.length > 50 ? '...' : ''}</p>
                          <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest mt-1">{activity.date}</p>
                        </div>
                        <span className="bg-white px-4 py-2 rounded-xl border border-gray-200 text-orange-600 font-black text-sm">
                          +{activity.hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <PlusCircle className="text-orange-600" size={32} />
                  </div>
                  <h3 className="text-2xl font-black mb-2 uppercase italic">The Board is Blank</h3>
                  <p className="text-gray-500 font-medium max-w-sm mx-auto mb-10 text-sm">
                    Your impact journey starts today. Log your first few hours or check out what's happening near your school.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={() => onNavigate('log')}
                      className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all flex items-center justify-center gap-4"
                    >
                      <PlusCircle size={18} /> LOG HOURS
                    </button>
                    <button 
                      onClick={() => onNavigate('explore')}
                      className="px-8 py-4 bg-white border-2 border-black text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all flex items-center justify-center gap-4"
                    >
                      <Globe size={18} /> FIND EVENTS
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* NEARBY EVENTS */}
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white border-b-2 border-gray-100 pb-4">
              <h2 className="text-xl font-black text-black uppercase">Nearby real events</h2>
              <button 
                onClick={() => onNavigate('explore')}
                className="text-xs font-black text-orange-600 uppercase hover:underline"
              >
                See All
              </button>
            </div>
            <div className="grid gap-4">
              {isLoadingEvents ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-300">Finding local sites...</p>
                </div>
              ) : nearbyEvents.length > 0 ? (
                nearbyEvents.map(event => (
                  <div 
                    key={event.id} 
                    onClick={() => onNavigate('details', event)}
                    className="p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-black transition-all group shadow-sm flex flex-col cursor-pointer"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 mb-2 block">{event.tags[0] || 'Community'}</span>
                    <h3 className="font-black text-lg mb-1 line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-gray-500 font-bold mb-4 line-clamp-2">{event.organization} • {event.location}</p>
                    <div className="mt-4 flex gap-2">
                       <button 
                         onClick={(e) => handleShare(e, event.title, event.url, event.organization)}
                         className="flex-1 py-3 bg-gray-50 text-black border border-gray-100 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 group/share"
                         title="Share"
                       >
                         Share <Share2 size={14} className="group-hover/share:scale-110 transition-transform" />
                       </button>
                       <a 
                         href={event.url}
                         target="_blank"
                         rel="noopener noreferrer"
                         onClick={(e) => e.stopPropagation()}
                         className="flex-1 py-3 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                       >
                         Visit Website <Globe size={14} />
                       </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-sm font-black text-gray-300 uppercase">No live events found</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-black text-white rounded-[2rem] text-center space-y-4 shadow-xl">
               <h3 className="text-xl font-black italic">Need more hours?</h3>
               <p className="text-gray-400 text-sm font-medium">Head to the Explore tab to find high-impact volunteer sites near home.</p>
               <button 
                  onClick={() => onNavigate('explore')}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
               >
                  Go to Find Events <ArrowRight size={18} />
               </button>
            </div>
          </div>

          {/* BOOKMARKED IMPACT */}
          <div className="lg:col-span-2 space-y-8 mt-12">
            <div className="flex justify-between items-center bg-white border-b-2 border-gray-100 pb-4">
              <h2 className="text-xl font-black text-black uppercase">Bookmarked Impact</h2>
              <button 
                onClick={() => onNavigate('explore')}
                className="text-xs font-black text-orange-600 uppercase hover:underline"
              >
                Find More
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingBookmarks ? (
                <div className="col-span-full py-12 flex justify-center">
                  <Loader2 className="animate-spin text-orange-600" />
                </div>
              ) : bookmarks.length > 0 ? (
                bookmarks.map(bookmark => (
                  <div 
                    key={bookmark.id} 
                    onClick={() => onNavigate('details', bookmark as any)}
                    className="p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-black transition-all group flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 italic">Saved Movement</span>
                        <button 
                          onClick={(e) => handleShare(e, bookmark.title, bookmark.url, bookmark.organization)}
                          className="p-2 -m-2 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg transition-all group/share"
                          title="Share Bookmark"
                        >
                          <Share2 size={14} className="group-hover/share:scale-110 transition-transform" />
                        </button>
                      </div>
                      <h3 className="font-black text-lg mb-1 leading-tight group-hover:text-orange-600 transition-colors uppercase">{bookmark.title}</h3>
                      <p className="text-sm text-gray-500 font-bold uppercase">{bookmark.organization}</p>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                       <span className="text-xs font-black text-black/30 uppercase tracking-widest">{bookmark.hours} goal</span>
                       <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                          <ArrowRight size={14} />
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-12 text-center bg-orange-50/50 rounded-3xl border-2 border-dashed border-orange-100">
                  <p className="text-sm font-black text-orange-900/40 uppercase tracking-widest">No objects bookmarked yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
