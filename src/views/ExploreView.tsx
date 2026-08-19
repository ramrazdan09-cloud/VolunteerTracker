import { Search, MapPin, Filter, Clock, Calendar, Plus, Navigation, ChevronDown, Check, X, ArrowRight, Loader2, Globe, Share2, Compass, ExternalLink, Sparkles } from 'lucide-react';
import { useState, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { Screen } from '../App';
import type { UserProfile } from '../lib/firebase';
import { fetchNearbyOpportunities, fetchMapsGroundedOpportunities, VolunteerOpportunity } from '../services/opportunityService';
import { getCurrentLocation } from '../lib/location';

interface ExploreViewProps {
  onNavigate: (screen: Screen, opportunity?: VolunteerOpportunity) => void;
  profile: UserProfile | null;
}

export function ExploreView({ onNavigate, profile }: ExploreViewProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscoveringMaps, setIsDiscoveringMaps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'All',
    maxDistance: 100,
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
    category: ['All', 'Food Security', 'Tutoring', 'Environment', 'Health', 'Animals', 'Housing', 'Seniors', 'STEM', 'Sports', 'Community'],
    sources: ['All', 'LinkedIn', 'VolunteerMatch', 'Idealist', 'Google Maps', 'Direct Org']
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
    const searchLocation = profile?.schoolName || (profile?.state ? `in ${profile.state}` : 'California');
    const data = await fetchNearbyOpportunities(searchLocation, coords, profile?.state, radius);
    setOpportunities(data);
    setIsLoading(false);
  }

  async function handleDiscoverWithMaps() {
    setIsDiscoveringMaps(true);
    let coords = userCoords;
    if (!coords && profile?.locationAllowed) {
      const browserCoords = await getCurrentLocation();
      if (browserCoords) {
        coords = browserCoords;
        setUserCoords(browserCoords);
      }
    }

    const searchLocation = profile?.schoolName || profile?.state || 'California';
    const mapsData = await fetchMapsGroundedOpportunities(searchLocation, coords || undefined);
    
    if (mapsData.length > 0) {
      setOpportunities(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newMaps = mapsData.filter(m => !existingIds.has(m.id));
        return [...newMaps, ...prev];
      });
      setSelectedSource('Google Maps');
    }
    setIsDiscoveringMaps(false);
  }

  useEffect(() => {
    loadData();
  }, [profile?.schoolName, profile?.locationAllowed]);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opp.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedFilters.category === 'All' || 
                           opp.tags.some(t => t.toLowerCase() === selectedFilters.category.toLowerCase());
    
    const matchesSource = selectedSource === 'All' || 
                          (opp.source && opp.source.toLowerCase() === selectedSource.toLowerCase());

    let matchesDistance = true;
    if (userCoords && opp.coords && selectedFilters.maxDistance < 100) {
      const dist = calculateDistance(userCoords.lat, userCoords.lng, opp.coords.lat, opp.coords.lng);
      matchesDistance = dist <= selectedFilters.maxDistance;
    }

    let matchesDate = true;
    if (opp.date && opp.date !== 'Ongoing') {
      const oppDate = new Date(opp.date);
      if (!isNaN(oppDate.getTime())) {
        if (selectedFilters.startDate) {
          matchesDate = matchesDate && oppDate >= new Date(selectedFilters.startDate);
        }
        if (selectedFilters.endDate) {
          matchesDate = matchesDate && oppDate <= new Date(selectedFilters.endDate);
        }
      }
    }
    
    return matchesSearch && matchesCategory && matchesSource && matchesDistance && matchesDate;
  });

  const getSourceBadge = (source?: VolunteerOpportunity['source']) => {
    switch (source) {
      case 'LinkedIn':
        return { label: 'LinkedIn', bg: 'bg-[#0A66C2] text-white border-[#0A66C2]' };
      case 'VolunteerMatch':
        return { label: 'VolunteerMatch', bg: 'bg-teal-600 text-white border-teal-600' };
      case 'Idealist':
        return { label: 'Idealist', bg: 'bg-emerald-600 text-white border-emerald-600' };
      case 'Google Maps':
        return { label: 'Google Maps Grounded', bg: 'bg-rose-600 text-white border-rose-600' };
      default:
        return { label: 'Verified Org', bg: 'bg-black text-white border-black' };
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        
        {/* HERO */}
        <section className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-orange-200">
              <Sparkles size={14} /> Live Web & Maps Grounded Directory
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-black tracking-tighter mb-6 uppercase leading-[0.9]">
              Find your next <span className="text-orange-600 italic">Big Move</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto mb-6">
              Aggregating verified high school volunteer opportunities from <strong className="text-black">LinkedIn</strong>, <strong className="text-black">VolunteerMatch</strong>, <strong className="text-black">Idealist</strong>, and live <strong className="text-black">Google Maps</strong> nearby {profile?.schoolName || 'your area'}.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDiscoverWithMaps}
                disabled={isDiscoveringMaps}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {isDiscoveringMaps ? <Loader2 size={16} className="animate-spin" /> : <Compass size={16} />}
                Explore with Google Maps Grounding
              </button>
              <button
                onClick={() => loadData()}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Plus size={16} className={cn(isLoading && "animate-spin")} />
                Refresh Live Search
              </button>
            </div>
          </motion.div>
        </section>

        {/* SOURCE TABS & SEARCH & FILTERS */}
        <section className="mb-12 sticky top-24 z-40 bg-white/95 backdrop-blur-md py-4 border-b border-gray-100 space-y-4">
          {/* Source Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0 mr-2">
              Source:
            </span>
            {filterOptions.sources.map(src => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 border",
                  selectedSource === src
                    ? (src === 'LinkedIn' ? 'bg-[#0A66C2] text-white border-[#0A66C2]' :
                       src === 'VolunteerMatch' ? 'bg-teal-600 text-white border-teal-600' :
                       src === 'Idealist' ? 'bg-emerald-600 text-white border-emerald-600' :
                       src === 'Google Maps' ? 'bg-rose-600 text-white border-rose-600' :
                       'bg-black text-white border-black')
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-black hover:border-black'
                )}
              >
                {src === 'All' ? 'All Web Sources' : src}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-black focus:ring-0 font-bold transition-all"
                placeholder="Search by cause, organization, or city (e.g. food bank, tutoring, animal shelter)..."
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
                Filters {selectedFilters.category !== 'All' && `• ${selectedFilters.category}`}
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
                                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
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
                          <Navigation size={10} /> {selectedFilters.maxDistance === 100 ? 'Regional (All results)' : `Max Distance (${selectedFilters.maxDistance} miles)`}
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
                          <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-gray-300">
                            {selectedFilters.maxDistance === 100 ? 'Showing statewide results' : 'Filtering by local radius'}
                          </p>
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
              <p className="text-2xl font-black uppercase tracking-tighter text-black mb-2">
                Searching LinkedIn, VolunteerMatch, & Web Sources...
              </p>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                Finding active youth opportunities near {profile?.schoolName || 'your community'}
              </p>
            </div>
          </div>
        )}

        {/* EVENT LIST */}
        {!isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-400 px-2">
              <span>Showing {filteredOpportunities.length} opportunities</span>
              {selectedSource !== 'All' && <span>Filtered by {selectedSource}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredOpportunities.length > 0 ? (
                filteredOpportunities.map((event, idx) => {
                  const sourceBadge = getSourceBadge(event.source);
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => onNavigate('details', event)}
                      className="group bg-white border-2 border-gray-100 hover:border-black rounded-[2.5rem] overflow-hidden transition-all shadow-sm hover:shadow-xl flex flex-col h-full cursor-pointer"
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img 
                          src={`https://picsum.photos/seed/${event.id}/800/600`} 
                          alt={event.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                        />
                        
                        {/* Badges Overlay */}
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1.5">
                            <span className={cn(
                              "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest shadow-md",
                              sourceBadge.bg
                            )}>
                              {sourceBadge.label}
                            </span>
                            {event.remoteOrInPerson && (
                              <span className="bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full font-black text-[8px] uppercase tracking-wider text-black w-fit">
                                {event.remoteOrInPerson}
                              </span>
                            )}
                          </div>

                          <div className="bg-black/90 backdrop-blur text-white px-3 py-1.5 rounded-xl font-black text-[11px] shrink-0 shadow-md">
                            {event.hours}
                          </div>
                        </div>

                        {userCoords && event.coords && (
                          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur text-white px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5">
                            <Navigation size={10} />
                            {calculateDistance(userCoords.lat, userCoords.lng, event.coords.lat, event.coords.lng).toFixed(1)} mi away
                          </div>
                        )}
                      </div>

                      <div className="p-7 flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <a 
                            href={event.mapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location + " " + event.organization)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-600 transition-colors truncate"
                          >
                            <MapPin size={12} className="shrink-0 text-rose-500" /> {event.location}
                          </a>
                          {event.tags[0] && (
                            <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md shrink-0">
                              {event.tags[0]}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-black text-black mb-2 group-hover:text-orange-600 transition-colors leading-tight line-clamp-2">
                          {event.title}
                        </h3>

                        <p className="text-gray-500 font-medium text-xs leading-relaxed mb-6 flex-1 line-clamp-3">
                          {event.description}
                        </p>

                        <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">
                              Organization
                            </span>
                            <span className="text-xs font-black text-black truncate max-w-[140px]">
                              {event.organization}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => handleShare(e, event)}
                              className="w-10 h-10 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-xl flex items-center justify-center group/share"
                              title="Share Opportunity"
                            >
                              <Share2 size={16} className="group-hover/share:scale-110 transition-transform" />
                            </button>
                            <a 
                              href={event.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-10 h-10 bg-gray-50 hover:bg-orange-600 hover:text-white transition-all rounded-xl flex items-center justify-center group/btn"
                              title={`Apply via ${event.source || 'Website'}`}
                            >
                              <ExternalLink size={16} className="group-hover/btn:scale-110 transition-transform" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-32 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-100 px-6">
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8">
                    <Search size={40} className="text-gray-200" />
                  </div>
                  <h2 className="text-3xl font-black text-black uppercase tracking-tighter mb-4">No matching opportunities found</h2>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                    Try broadening your source selection or clearing the keyword search to view all {opportunities.length} available opportunities.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={() => {
                        setSelectedSource('All');
                        setSearchQuery('');
                        setSelectedFilters(prev => ({ ...prev, category: 'All' }));
                      }}
                      className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all"
                    >
                      Reset All Filters
                    </button>
                    <button 
                      onClick={handleDiscoverWithMaps}
                      className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Compass size={16} /> Discover via Google Maps
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
