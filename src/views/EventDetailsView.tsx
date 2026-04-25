import { MapPin, ArrowLeft, Share2, Calendar, Clock, Globe, Info, GraduationCap, ChevronRight, ArrowRight, Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Screen } from '../App';
import { motion } from 'motion/react';
import { VolunteerOpportunity } from '../services/opportunityService';
import { useState, useEffect } from 'react';
import { auth, isBookmarked, toggleBookmark } from '../lib/firebase';

interface EventDetailsViewProps {
  onNavigate: (screen: Screen) => void;
  opportunity: VolunteerOpportunity | null;
}

export function EventDetailsView({ onNavigate, opportunity }: EventDetailsViewProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSaved() {
      if (opportunity && auth.currentUser) {
        const bookmarked = await isBookmarked(auth.currentUser.uid, opportunity.id);
        setSaved(bookmarked);
      }
      setLoading(false);
    }
    checkSaved();
  }, [opportunity]);

  const handleToggleBookmark = async () => {
    if (!opportunity || !auth.currentUser) return;
    const newState = await toggleBookmark(auth.currentUser.uid, opportunity);
    setSaved(newState);
  };

  const handleShare = async () => {
    if (!opportunity) return;
    const shareData = {
      title: opportunity.title,
      text: `Check out this volunteer opportunity: ${opportunity.title} at ${opportunity.organization}`,
      url: opportunity.url || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(opportunity.url);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  if (!opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => onNavigate('explore')} className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen selection:bg-orange-100">
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        {/* BACK BUTTON */}
        <button 
          onClick={() => onNavigate('explore')}
          className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black mb-12 transition-all"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Events
        </button>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-8 space-y-12">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <span className="text-orange-600 font-black uppercase tracking-widest text-xs">
                  {opportunity.tags.join(' • ')}
                </span>
                <div className="flex gap-4">
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-400 border-2 border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-black hover:text-black transition-all"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                  <button 
                    onClick={handleToggleBookmark}
                    disabled={loading}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2",
                      saved 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black"
                    )}
                  >
                    <Bookmark size={16} fill={saved ? "white" : "none"} />
                    {saved ? 'Saved' : 'Save to Bookmarks'}
                  </button>
                </div>
              </div>
              <h1 className="text-5xl md:text-8xl font-black text-black tracking-tighter mb-8 uppercase leading-none">
                {opportunity.title}
              </h1>
              
              <div className="rounded-[3rem] overflow-hidden border-2 border-black shadow-2xl relative group">
                <img 
                  src={`https://picsum.photos/seed/${opportunity.id}/1200/800`} 
                  alt={opportunity.title} 
                  referrerPolicy="no-referrer"
                  className="w-full aspect-video object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                />
                <div className="absolute top-8 right-8 bg-black text-white px-6 py-3 rounded-2xl font-black text-lg">
                  {opportunity.hours}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-2xl font-black uppercase flex items-center gap-3">
                <Info className="text-orange-600" /> About this Impact
              </h3>
              <p className="text-xl text-gray-500 font-medium leading-relaxed">
                {opportunity.description}
              </p>
              
              <div className="space-y-8 pt-12 border-t border-gray-100">
                <div className="flex items-end justify-between gap-4">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-300">The Powerhouse Behind it</h4>
                  <Globe className="text-gray-200" size={24} />
                </div>
                
                <div className="relative">
                  <div className="absolute -left-4 -top-4 w-24 h-24 bg-orange-100 rounded-full blur-3xl opacity-50" />
                  <div className="relative bg-white border-4 border-black p-10 rounded-[3rem] shadow-[16px_16px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-6">
                       <div>
                         <p className="text-sm font-black text-orange-600 uppercase tracking-widest mb-1">Organization</p>
                         <h3 className="text-4xl font-black text-black leading-none uppercase tracking-tighter">
                            {opportunity.organization}
                         </h3>
                       </div>
                       
                       <div className="relative">
                          <span className="absolute -left-6 -top-6 text-8xl text-orange-100 font-serif leading-none italic pointer-events-none">"</span>
                          <p className="relative z-10 text-xl text-gray-600 font-medium leading-relaxed italic pr-4">
                            {opportunity.organizationMission || `This organization is dedicated to creating positive change and empowering individuals to make a difference in their community through service and education.`}
                          </p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8 sticky top-32">
            <div className="bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] p-10 space-y-10 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Calendar className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date/Schedule</p>
                    <p className="text-sm font-black uppercase">{opportunity.date || 'Check organization site'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <MapPin className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location</p>
                    <p className="text-sm font-black uppercase">{opportunity.location}</p>
                  </div>
                </div>
              </div>

              {opportunity.coords && (
                <div className="rounded-3xl overflow-hidden border-2 border-gray-100 h-48 bg-gray-100 relative group">
                  <iframe
                    title="opportunity-location"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')}&q=${opportunity.coords.lat},${opportunity.coords.lng}`}
                    allowFullScreen
                    className="grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                  {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center p-6 text-center">
                      <div className="space-y-2">
                        <MapPin className="mx-auto text-gray-300" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">
                          Map View available with API Key<br/>
                          Location: {opportunity.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-8 border-t border-gray-200">
                <div className="space-y-4">
                  <a 
                    href={opportunity.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-5 bg-black text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all shadow-xl flex items-center justify-center gap-3 group"
                  >
                    Go to {opportunity.organization} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">
                    Visit the official website to sign up.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-orange-600 text-white rounded-[2.5rem] flex items-center gap-6 shadow-xl shadow-orange-100">
               <Globe size={40} className="shrink-0" />
               <div>
                  <h4 className="font-black uppercase tracking-widest text-xs">Official Site</h4>
                  <p className="text-sm font-medium opacity-90">This link takes you directly to the {opportunity.organization} portal.</p>
               </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
