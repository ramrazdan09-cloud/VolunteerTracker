import { MapPin, ArrowLeft, Share2, Calendar, Clock, Globe, Info, GraduationCap, ChevronRight, ArrowRight, Bookmark, ExternalLink, Compass, ShieldCheck } from 'lucide-react';
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

  const getSourceBadge = (source?: VolunteerOpportunity['source']) => {
    switch (source) {
      case 'LinkedIn':
        return { label: 'LinkedIn Volunteer Listing', bg: 'bg-[#0A66C2] text-white', cta: 'Apply on LinkedIn' };
      case 'VolunteerMatch':
        return { label: 'VolunteerMatch Network', bg: 'bg-teal-600 text-white', cta: 'Apply on VolunteerMatch' };
      case 'Idealist':
        return { label: 'Idealist Non-Profit Network', bg: 'bg-emerald-600 text-white', cta: 'Apply on Idealist' };
      case 'Google Maps':
        return { label: 'Google Maps Grounded Listing', bg: 'bg-rose-600 text-white', cta: 'View on Google Maps' };
      default:
        return { label: 'Verified Community Partner', bg: 'bg-black text-white', cta: 'Apply on Official Website' };
    }
  };

  const sourceBadge = getSourceBadge(opportunity.source);

  return (
    <div className="bg-white min-h-screen selection:bg-orange-100">
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        {/* BACK BUTTON */}
        <button 
          onClick={() => onNavigate('explore')}
          className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black mb-12 transition-all"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Opportunities
        </button>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-8 space-y-12">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-xs shadow-sm",
                    sourceBadge.bg
                  )}>
                    {sourceBadge.label}
                  </span>
                  {opportunity.remoteOrInPerson && (
                    <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-xs">
                      {opportunity.remoteOrInPerson}
                    </span>
                  )}
                  {opportunity.ageRequirement && (
                    <span className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-xs">
                      Ages: {opportunity.ageRequirement}
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-500 border-2 border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-black hover:text-black transition-all"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                  <button 
                    onClick={handleToggleBookmark}
                    disabled={loading}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2",
                      saved 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-500 border-gray-100 hover:border-black hover:text-black"
                    )}
                  >
                    <Bookmark size={16} fill={saved ? "white" : "none"} />
                    {saved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>

              <h1 className="text-4xl md:text-7xl font-black text-black tracking-tighter mb-8 uppercase leading-tight">
                {opportunity.title}
              </h1>
              
              <div className="rounded-[3rem] overflow-hidden border-2 border-black shadow-2xl relative group bg-gray-100">
                <img 
                  src={`https://picsum.photos/seed/${opportunity.id}/1200/800`} 
                  alt={opportunity.title} 
                  referrerPolicy="no-referrer"
                  className="w-full aspect-video object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                />
                <div className="absolute top-8 right-8 bg-black/90 backdrop-blur text-white px-6 py-3 rounded-2xl font-black text-lg shadow-lg">
                  {opportunity.hours}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-wrap gap-2 pt-2">
                {opportunity.tags.map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>

              <h3 className="text-2xl font-black uppercase flex items-center gap-3">
                <Info className="text-orange-600" /> About this Impact Opportunity
              </h3>
              <p className="text-xl text-gray-600 font-medium leading-relaxed">
                {opportunity.description}
              </p>
              
              <div className="space-y-8 pt-10 border-t border-gray-100">
                <div className="flex items-end justify-between gap-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    Host Organization & Mission
                  </h4>
                  <ShieldCheck className="text-orange-600" size={24} />
                </div>
                
                <div className="relative">
                  <div className="absolute -left-4 -top-4 w-24 h-24 bg-orange-100 rounded-full blur-3xl opacity-50" />
                  <div className="relative bg-white border-4 border-black p-8 md:p-10 rounded-[2.5rem] shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-6">
                       <div>
                         <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-1">Organization</p>
                         <h3 className="text-3xl md:text-4xl font-black text-black leading-none uppercase tracking-tighter">
                            {opportunity.organization}
                         </h3>
                       </div>
                       
                       <div className="relative">
                          <p className="relative z-10 text-lg text-gray-600 font-medium leading-relaxed italic">
                            "{opportunity.organizationMission || `This organization is dedicated to creating positive change and empowering individuals to make a difference in their community through service and education.`}"
                          </p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8 sticky top-32">
            <div className="bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
              <div className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <Calendar className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Schedule / Date</p>
                    <p className="text-sm font-black uppercase">{opportunity.date || 'Flexible / Check portal'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <MapPin className="text-rose-600" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location</p>
                    <p className="text-sm font-black uppercase">{opportunity.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <Clock className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Commitment</p>
                    <p className="text-sm font-black uppercase">{opportunity.hours}</p>
                  </div>
                </div>
              </div>

              {/* MAPS PREVIEW & LINK */}
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <Compass size={14} className="text-rose-500" /> Google Maps Directory
                  </span>
                  <a
                    href={opportunity.mapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(opportunity.location + " " + opportunity.organization)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline inline-flex items-center gap-1"
                  >
                    Open Maps <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-xs font-bold text-gray-600">
                  {opportunity.location}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <a 
                    href={opportunity.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(
                      "w-full py-4 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group",
                      opportunity.source === 'LinkedIn' ? 'bg-[#0A66C2] hover:bg-[#084e96]' :
                      opportunity.source === 'VolunteerMatch' ? 'bg-teal-600 hover:bg-teal-700' :
                      opportunity.source === 'Idealist' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      opportunity.source === 'Google Maps' ? 'bg-rose-600 hover:bg-rose-700' :
                      'bg-black hover:bg-orange-600'
                    )}
                  >
                    {sourceBadge.cta} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">
                    Direct application via official web listing.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-7 bg-orange-600 text-white rounded-[2.5rem] flex items-center gap-5 shadow-xl shadow-orange-100">
               <Globe size={36} className="shrink-0" />
               <div>
                  <h4 className="font-black uppercase tracking-widest text-xs">Verified Source</h4>
                  <p className="text-xs font-medium opacity-90">Aggregated from verified non-profit networks and community hubs.</p>
               </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
