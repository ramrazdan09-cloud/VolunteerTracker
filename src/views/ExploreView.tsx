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
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'All',
    maxDistance: 50, // default 50 miles
    startDate: '',
    endDate: ''
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
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const filterOptions = {
    category: ['All', 'Clubs', 'Outdoors', 'Tutoring', 'Fundraising', 'Animals', 'Environment', 'Health'],
  };

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function loadData(overrideRadius?: number) {
    setIsLoading(true);
    let coords: { lat: number; lng: number } | undefined = undefined;
    
    if (profile?.locationAllowed) {
      const browserCoords = await getCurrentLocation();
      if (browserCoords) {
        coords = browserCoords;
        setUserCoords(browserCoords);
      }
    }

    const radius = overrideRadius ?? selectedFilters.maxDistance;
    const searchLocation = profile?.schoolName || (profile?.state ? `in ${profile.state}` : 'nearby');
    const data = await fetchNearbyOpportunities(searchLocation, coords, profile?.state, radius);
    setOpportunities(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [profile?.schoolName, profile?.locationAllowed]);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         opp.organization.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedFilters.category === 'All' || 
                           opp.tags.some(t => t.toLowerCase() === selectedFilters.category.toLowerCase());
    
    let matchesDistance = true;
    if (userCoords && opp.coords) {
      const dist = calculateDistance(userCoords.lat, userCoords.lng, opp.coords.lat, opp.coords.lng);
      matchesDistance = dist <= selectedFilters.maxDistance;
    }

    let matchesDate = true;
    if (opp.date) {
      const oppDate = new Date(opp.date);
      if (selectedFilters.startDate) {
        matchesDate = matchesDate && oppDate >= new Date(selectedFilters.startDate);
      }
      if (selectedFilters.endDate) {
        matchesDate = matchesDate && oppDate <= new Date(selectedFilters.endDate);
      }
    }
    
    return matchesSearch && matchesCategory && matchesDistance && matchesDate;
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
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-4">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 flex items-center gap-2">
                                 <Plus size={10} /> Category
                               </h4>
                               <div className="flex flex-wrap gap-2">
                                 {filterOptions.category.map(opt => (
                                   <button
                                      key={opt}
                                      onClick={() => setSelectedFilters(prev => ({ ...prev, category: opt }))}
                                      className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        selectedFilters.category === opt 
                                          ? "bg-black text-white" 
                                          : "bg-gray-50 text-gray-400 hover:text-black"
                                      )}
                                   >
                                      {opt}
                                   </button>
                                 ))}
                               </div>
                            </div>

                            <div className="space-y-4">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 flex items-center gap-2">
                                 <Navigation size={10} /> Max Distance ({selectedFilters.maxDistance} miles)
                               </h4>
                               <div className="pt-2">
                                 <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    step="5"
                                    value={selectedFilters.maxDistance}
                                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                                    className="w-full accent-black h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                 />
                               </div>
                            </div>

                            <div className="space-y-4">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 flex items-center gap-2">
                                 <Calendar size={10} /> Date Range
                               </h4>
                               <div className="grid grid-cols-2 gap-2">
                                  <input 
                                    type="date"
                                    value={selectedFilters.startDate}
                                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold uppercase focus:border-black focus:ring-0"
                                  />
                                  <input 
                                    type="date"
                                    value={selectedFilters.endDate}
                                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold uppercase focus:border-black focus:ring-0"
                                  />
                               </div>
                            </div>
                         </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-4">
                           <button 
                             onClick={() => {
                               setIsFilterOpen(false);
                               loadData();
                             }} 
                             className="px-8 py-3 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors"
                           >
                              Apply & Search
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
          <div className="py-32 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-600/20 blur-3xl animate-pulse rounded-full" />
              <Loader2 className="w-16 h-16 text-orange-600 animate-spin relative z-10" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-black uppercase tracking-tighter text-black mb-2">Scanning Planet Earth...</p>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                Finding the best moves near {profile?.schoolName || 'your area'}
              </p>
            </div>
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
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest text-orange-600 border border-orange-100 shadow-sm">
                         {event.tags[0] || 'Community'}
                      </div>
                      {userCoords && event.coords && (
                        <div className="bg-black/90 backdrop-blur px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest text-white border border-white/10 shadow-sm flex items-center gap-2">
                           <Navigation size={10} />
                           {calculateDistance(userCoords.lat, userCoords.lng, event.coords.lat, event.coords.lng).toFixed(1)} miles
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-6 right-6 bg-black text-white px-4 py-2 rounded-xl font-black text-xs">
                       {event.hours}
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location + " " + event.organization)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 hover:text-black transition-colors"
                    >
                      <MapPin size={12} /> {event.location}
                    </a>
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
              <div className="col-span-full py-32 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-100 px-6">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8">
                  <Search size={40} className="text-gray-200" />
                </div>
                <h2 className="text-4xl font-black text-black uppercase tracking-tighter mb-4">No results in this view</h2>
                <p className="text-gray-400 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                  Try adjusting your filters or broadening your search range. We're searching live, so try again in a few seconds!
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    onClick={() => loadData()}
                    className="px-10 py-5 bg-black text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
                  >
                    <Plus className={cn("transition-transform", isLoading && "animate-spin")} size={18} /> 
                    Try Refresh
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedFilters(prev => ({ ...prev, maxDistance: 100, category: 'All' }));
                      loadData(100);
                    }}
                    className="px-10 py-5 bg-white border-2 border-black text-black rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all"
                  >
                    Broaden Search
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
