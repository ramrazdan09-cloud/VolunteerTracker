import { Search, MapPin, Filter, Clock, Calendar, Plus, Navigation, ChevronDown, Check, X, ArrowRight, Loader2, Globe, Share2 } from 'lucide-react';
import { useState, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { Screen } from '../App';
import type { UserProfile } from '../lib/firebase';
import { fetchNearbyOpportunities, VolunteerOpportunity } from '../services/opportunityService';
import { getCurrentLocation } from '../lib/location';

interface ExploreViewProps {
  onNavigate: (screen: Screen, opportunity?: VolunteerOpportunity) => void;
  profile: UserProfile | null;
}

export function ExploreView({ onNavigate, profile }: ExploreViewProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'All',
    time: 'Any time',
    proximity: 'Anywhere'
  });

  const handleShare = async (e: MouseEvent, opp: VolunteerOpportunity) => {
    e.stopPropagation();
    const shareData = {
      title: opp.title,
      text: `Check out this volunteer opportunity: ${opp.title} at ${opp.organization}`,
      url: opp.url || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(opp.url);
        // Simple visual feedback could be added here
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const filterOptions = {
    category: ['All', 'Clubs', 'Outdoors', 'Tutoring', 'Fundraising', 'Animals'],
    time: ['Any time', 'After School', 'Weekends', 'One-time'],
    proximity: ['Anywhere', 'At School', 'Walkable', 'Online']
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      let coords: { lat: number; lng: number } | undefined = undefined;
      
      if (profile?.locationAllowed) {
        const browserCoords = await getCurrentLocation();
        if (browserCoords) coords = browserCoords;
      }

      const searchLocation = profile?.schoolName || 'nearby';
      const data = await fetchNearbyOpportunities(searchLocation, coords, profile?.state);
      setOpportunities(data);
      setIsLoading(false);
    }
    loadData();
  }, [profile?.schoolName, profile?.locationAllowed]);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         opp.organization.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simple filter logic for demo - in real world would use Gemini or more complex mapping
    const matchesCategory = selectedFilters.category === 'All' || 
                           opp.tags.some(t => t.toLowerCase() === selectedFilters.category.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white min-h-screen">
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        
        {/* HERO */}
        <section className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto"
          >
            <span className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-orange-200">
              Real-World Impact
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-black tracking-tighter mb-6 uppercase leading-[0.9]">
              Find your next <span className="text-orange-600 italic">Big Move</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto">
              We found these opportunities near {profile?.schoolName || 'you'}. 
              Search live openings from across the community.
            </p>
          </motion.div>
        </section>

        {/* SEARCH & FILTERS */}
        <section className="mb-12 sticky top-24 z-40 bg-white/80 backdrop-blur-md py-4 border-b border-gray-100">
           <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black focus:ring-0 font-bold transition-all"
                    placeholder="Search real opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              
              <div className="relative">
                 <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={cn(
                       "h-full px-6 py-4 border-2 rounded-2xl font-black text-sm uppercase flex items-center gap-3 transition-all",
                       isFilterOpen ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-gray-50"
                    )}
                 >
                    {isFilterOpen ? <X size={18} /> : <Filter size={18} />}
                    Filters
                 </button>

                 <AnimatePresence>
                   {isFilterOpen && (
                     <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-screen max-w-[600px] bg-white border-2 border-black rounded-[2rem] shadow-2xl z-50 p-8"
                     >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           {Object.entries(filterOptions).map(([key, options]) => (
                             <div key={key} className="space-y-4">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                                 {key}
                               </h4>
                               <div className="space-y-1">
                                 {options.map(opt => (
                                   <button
                                      key={opt}
                                      onClick={() => setSelectedFilters(prev => ({ ...prev, [key]: opt }))}
                                      className={cn(
                                        "w-full text-left px-4 py-3 rounded-xl text-sm font-black transition-all flex justify-between items-center",
                                        selectedFilters[key as keyof typeof selectedFilters] === opt 
                                          ? "bg-orange-600 text-white shadow-lg shadow-orange-200" 
                                          : "text-gray-400 hover:bg-gray-50 hover:text-black"
                                      )}
                                   >
                                      {opt}
                                      {selectedFilters[key as keyof typeof selectedFilters] === opt && <Check size={14} />}
                                   </button>
                                 ))}
                               </div>
                             </div>
                           ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-4">
                           <button onClick={() => setIsFilterOpen(false)} className="px-8 py-3 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors">
                              Done
                           </button>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>
        </section>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="py-32 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
            <p className="text-xl font-black uppercase tracking-widest text-gray-300">Searching the web for you...</p>
          </div>
        )}

        {/* EVENT LIST */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onNavigate('details', event)}
                  className="group bg-white border-2 border-transparent hover:border-black rounded-[2.5rem] overflow-hidden transition-all shadow-sm hover:shadow-xl flex flex-col h-full cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${event.id}/800/600`} 
                      alt={event.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest text-orange-600 border border-orange-100 shadow-sm">
                       {event.tags[0] || 'Community'}
                    </div>
                    <div className="absolute bottom-6 right-6 bg-black text-white px-4 py-2 rounded-xl font-black text-xs">
                       {event.hours}
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                      <MapPin size={12} /> {event.location}
                    </div>
                    <h3 className="text-2xl font-black text-black mb-3 group-hover:text-orange-600 transition-colors leading-tight">
                      {event.title}
                    </h3>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">
                          Organization
                        </span>
                        <span className="text-sm font-black text-black truncate max-w-[150px]">
                          {event.organization}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => handleShare(e, event)}
                          className="w-12 h-12 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-2xl flex items-center justify-center group/share"
                          title="Share Opportunity"
                        >
                          <Share2 size={20} className="group-hover/share:scale-110 transition-transform" />
                        </button>
                        <a 
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 h-12 bg-gray-50 hover:bg-orange-600 hover:text-white transition-all rounded-2xl flex items-center justify-center group/btn"
                          title="Visit Website"
                        >
                          <Globe size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center">
                <p className="text-4xl font-black text-gray-100 uppercase tracking-tighter mb-4">No results found</p>
                <p className="text-gray-400 font-medium">Try a different search or school location.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
