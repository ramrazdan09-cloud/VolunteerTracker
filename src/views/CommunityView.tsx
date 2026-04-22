import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Plus, Users, School, MapPin, Send, Loader2, Sparkles, 
  Filter, Bookmark, Heart, Share2, Search, Megaphone, Trophy, 
  Lightbulb, Calendar, ExternalLink, Image as ImageIcon, Link as LinkIcon, ArrowRight, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CommunityPost, createCommunityPost, getRegionalPosts, auth, UserProfile, saveUserProfile, toggleLikePost } from '../lib/firebase';
import { searchSchools } from '../services/opportunityService';
import type { Screen } from '../App';

interface CommunityViewProps {
  profile: UserProfile;
  onProfileUpdate: (newProfile: UserProfile) => void;
  onNavigate: (screen: Screen, opportunity?: any, userId?: string) => void;
}

export function CommunityView({ profile, onProfileUpdate, onNavigate }: CommunityViewProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  
  // Create Post State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newExternalUrl, setNewExternalUrl] = useState('');
  const [newType, setNewType] = useState<'announcement' | 'achievement' | 'idea' | 'event' | 'general'>('general');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Missing School Selection State
  const [isSettingSchool, setIsSettingSchool] = useState(false);
  const [tempSchool, setTempSchool] = useState('');
  const [tempState, setTempState] = useState(profile.state || '');
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [isSearchingSchools, setIsSearchingSchools] = useState(false);

  const region = profile.state || 'Global';

  useEffect(() => {
    if (profile.schoolName && profile.state) {
      loadPosts();
    }
  }, [profile.state, profile.schoolName]);

  async function loadPosts() {
    setIsLoading(true);
    try {
      let data = await getRegionalPosts(region);
      
      // Fallback to Global if region is empty
      if (data.length === 0 && region !== 'Global') {
        const globalData = await getRegionalPosts('Global');
        data = globalData;
        console.info(`No posts in ${region}, falling back to Global.`);
      }
      
      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newTitle || !newContent) return;

    setIsPosting(true);
    try {
      await createCommunityPost({
        authorId: auth.currentUser.uid,
        authorName: profile.displayName || 'Anonymous',
        authorSchool: profile.schoolName,
        title: newTitle,
        content: newContent,
        imageUrl: newImageUrl || "",
        externalUrl: newExternalUrl || "",
        type: newType,
        region: region,
        tags: tags
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewImageUrl('');
      setNewExternalUrl('');
      setNewType('general');
      setTags([]);
      loadPosts();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    
    // Optimistic Update
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        const isLiked = likes.includes(userId);
        return {
          ...post,
          likes: isLiked ? likes.filter(id => id !== userId) : [...likes, userId]
        };
      }
      return post;
    }));

    try {
      await toggleLikePost(postId, userId);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert if error? (Too complex for now, but good practice)
    }
  };

  const filteredAndSortedPosts = posts
    .filter(post => activeFilter === 'all' || post.type === activeFilter)
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt.toMillis() - a.createdAt.toMillis();
      if (sortBy === 'oldest') return a.createdAt.toMillis() - b.createdAt.toMillis();
      if (sortBy === 'popular') {
        const aLikes = a.likes?.length || 0;
        const bLikes = b.likes?.length || 0;
        return bLikes - aLikes;
      }
      return 0;
    });

  // School Selection Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tempSchool && tempSchool.length >= 3 && tempState) {
        setIsSearchingSchools(true);
        const results = await searchSchools(tempSchool, tempState);
        setSchoolSuggestions(results);
        setIsSearchingSchools(false);
      } else {
        setSchoolSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [tempSchool, tempState]);

  const handleUpdateSchool = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !tempSchool) return;

    const newProfile = { ...profile, schoolName: tempSchool, state: tempState };
    await saveUserProfile(currentUserId, newProfile);
    onProfileUpdate(newProfile);
    setIsSettingSchool(false);
  };

  if (!profile.schoolName) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-orange-50 border-2 border-orange-100 p-12 rounded-[3rem] text-center space-y-8 shadow-sm"
        >
          <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users className="text-orange-600" size={40} />
          </div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tight">Access Community</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            To connect with others in your region, we need to know which high school you attend. This keeps our community safe and relevant.
          </p>
          <button 
            onClick={() => setIsSettingSchool(true)}
            className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl"
          >
            SET MY HIGH SCHOOL
          </button>

          <AnimatePresence>
            {isSettingSchool && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden shadow-2xl"
                >
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black uppercase">Where do you go?</h3>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block text-left">Which State?</label>
                       <select 
                         value={tempState}
                         onChange={(e) => setTempState(e.target.value)}
                         className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-black focus:ring-0"
                       >
                         <option value="">Select State</option>
                         {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
                           <option key={s} value={s}>{s}</option>
                         ))}
                       </select>
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block text-left">High School Name</label>
                      <input 
                        type="text"
                        placeholder="Start typing school..."
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:border-black focus:ring-0 uppercase"
                        value={tempSchool}
                        onChange={(e) => setTempSchool(e.target.value)}
                      />
                      {isSearchingSchools && (
                        <Loader2 className="absolute right-4 top-[45px] animate-spin text-orange-600" size={18} />
                      )}
                      
                      {schoolSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border-2 border-black rounded-2xl shadow-xl mt-2 overflow-hidden z-[110] max-h-48 overflow-y-auto">
                          {schoolSuggestions.map(s => (
                            <button 
                              key={s}
                              onClick={() => setTempSchool(s)}
                              className="w-full px-6 py-3 text-left font-black text-xs uppercase hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-none"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsSettingSchool(false)}
                      className="flex-1 py-4 border-2 border-black rounded-xl font-black uppercase text-xs hover:bg-gray-50 mb-2"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpdateSchool}
                      disabled={!tempSchool}
                      className="flex-1 py-4 bg-black text-white rounded-xl font-black uppercase text-xs hover:bg-orange-600 mb-2 disabled:bg-gray-200"
                    >
                      Save School
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
          
          {/* Feed Header & Posts */}
          <div className="flex-grow space-y-12">
            <div className="flex justify-between items-end bg-white border-b-2 border-gray-100 pb-8 sticky top-20 z-30">
               <div>
                  <div className="flex items-center gap-3 text-orange-600 mb-2">
                    <Users size={20} />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">{region} Community</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter">Event sharing</h1>
               </div>
               <button 
                 onClick={() => setShowCreateModal(true)}
                 className="bg-black text-white p-4 md:px-8 md:py-4 rounded-2xl md:rounded-3xl font-black flex items-center gap-3 hover:bg-orange-600 transition-all shadow-xl group"
               >
                 <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                 <span className="hidden md:inline">SHARE SOMETHING</span>
               </button>
            </div>

            {/* FILTER & SORT BAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
               <div className="flex flex-wrap gap-2">
                 {['all', 'announcement', 'achievement', 'idea', 'event', 'general'].map((type) => (
                   <button
                     key={type}
                     onClick={() => setActiveFilter(type)}
                     className={cn(
                       "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                       activeFilter === type 
                        ? "bg-black text-white shadow-lg" 
                        : "bg-white text-gray-400 hover:text-black border border-gray-100"
                     )}
                   >
                     {type}
                   </button>
                 ))}
               </div>
               <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Sort By</span>
                  <div className="relative group/sort">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none bg-white border border-gray-100 pl-4 pr-10 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-black focus:ring-0 cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="popular">Popularity</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
               </div>
            </div>

            {isLoading ? (
              <div className="py-24 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                <p className="font-black text-gray-300 uppercase tracking-widest text-xs">Loading regional feed...</p>
              </div>
            ) : filteredAndSortedPosts.length > 0 ? (
              <div className="space-y-8">
                {filteredAndSortedPosts.map(post => (
                  <motion.div 
                    key={post.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:border-black transition-all group overflow-hidden relative",
                      post.type === 'announcement' && "border-orange-100 bg-orange-50/10",
                      post.type === 'achievement' && "border-yellow-100 bg-yellow-50/10"
                    )}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gray-50 rounded-full opacity-50 group-hover:bg-orange-50 transition-colors" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-8 mb-8 relative z-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => onNavigate('publicProfile', undefined, post.authorId)}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm hover:scale-105 transition-transform"
                            style={{ 
                              backgroundColor: post.type === 'announcement' ? '#ffedd5' :
                                              post.type === 'achievement' ? '#fef9c3' :
                                              post.type === 'idea' ? '#dbeafe' :
                                              post.type === 'event' ? '#dcfce7' : '#f3f4f6',
                              color: post.type === 'announcement' ? '#ea580c' :
                                    post.type === 'achievement' ? '#ca8a04' :
                                    post.type === 'idea' ? '#2563eb' :
                                    post.type === 'event' ? '#16a34a' : '#4b5563'
                            }}
                          >
                            {post.type === 'announcement' && <Megaphone size={20} />}
                            {post.type === 'achievement' && <Trophy size={20} />}
                            {post.type === 'idea' && <Lightbulb size={20} />}
                            {post.type === 'event' && <Calendar size={20} />}
                            {post.type === 'general' && <MessageSquare size={20} />}
                          </button>
                          <div>
                            <button 
                              onClick={() => onNavigate('publicProfile', undefined, post.authorId)}
                              className="font-black text-black flex items-center gap-2 hover:text-orange-600 transition-colors"
                            >
                              {post.authorName}
                              {post.type === 'achievement' && <Sparkles size={14} className="text-yellow-600" />}
                            </button>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                              <School size={12} /> {post.authorSchool}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md w-fit",
                            post.type === 'announcement' ? "bg-orange-100 text-orange-600" :
                            post.type === 'achievement' ? "bg-yellow-100 text-yellow-600" :
                            post.type === 'idea' ? "bg-blue-100 text-blue-600" :
                            post.type === 'event' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                          )}>
                            {post.type}
                          </span>
                          <h3 className="text-2xl md:text-3xl font-black text-black leading-tight uppercase group-hover:text-orange-600 transition-colors">
                            {post.title}
                          </h3>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-gray-300 uppercase shrink-0">
                        {post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                      </span>
                    </div>

                    <div className="space-y-6 mb-8 relative z-10">
                      <p className="text-xl text-gray-500 font-medium leading-relaxed">
                        {post.content}
                      </p>

                      {post.imageUrl && (
                        <div className="rounded-3xl overflow-hidden border-2 border-gray-100 grayscale-[50%] hover:grayscale-0 transition-all duration-700">
                          <img 
                            src={post.imageUrl} 
                            alt={post.title} 
                            className="w-full object-cover max-h-[400px]"
                            referrerPolicy="no-referrer"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      )}

                      {post.externalUrl && (
                        <a 
                          href={post.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 hover:border-black transition-all group/link"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400 group-hover/link:text-orange-600 transition-colors">
                             <ExternalLink size={18} />
                          </div>
                          <div className="flex-grow">
                             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Shared Link</p>
                             <p className="text-sm font-bold text-black truncate max-w-[250px] md:max-w-md">{post.externalUrl}</p>
                          </div>
                          <ArrowRight size={18} className="text-gray-300 group-hover/link:translate-x-1 transition-transform" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {post.tags.map(tag => (
                        <span key={tag} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          #{tag.toLowerCase()}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                      <div className="flex gap-6">
                        <button 
                          onClick={() => handleToggleLike(post.id!)}
                          className={cn(
                            "flex items-center gap-2 font-black text-xs transition-all",
                            post.likes?.includes(auth.currentUser?.uid || '') 
                              ? "text-orange-600" 
                              : "text-gray-400 hover:text-orange-600"
                          )}
                        >
                           <Heart size={18} fill={post.likes?.includes(auth.currentUser?.uid || '') ? "currentColor" : "none"} /> 
                           {post.likes?.length || 0}
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-black font-black text-xs transition-colors">
                           <MessageSquare size={18} /> {post.commentCount || 0}
                        </button>
                      </div>
                      <button className="text-gray-400 hover:text-black transition-colors">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center space-y-6">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                   <MessageSquare className="text-gray-300" size={32} />
                </div>
                <h3 className="text-xl font-black uppercase text-gray-300">Quiet in {region}...</h3>
                <p className="text-gray-400 font-medium">Be the first to share an event or a flyer!</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-orange-100 text-orange-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                >
                  <Plus size={16} /> POST NOW
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-8 sticky top-20">
            <div className="bg-gray-50 border-2 border-gray-100 p-8 rounded-[2rem] space-y-6">
               <h4 className="font-black text-black uppercase tracking-widest text-xs flex items-center gap-2">
                 <Filter size={14} className="text-orange-600" /> Community Rules
               </h4>
               <ul className="space-y-4">
                 {[
                   'Keep it student-focused',
                   'No inappropriate content',
                   'Verify events before sharing',
                   'Be kind to your neighbors'
                 ].map((rule, i) => (
                   <li key={i} className="flex gap-3 text-sm text-gray-500 font-medium">
                     <span className="text-orange-600 font-black">0{i+1}.</span>
                     {rule}
                   </li>
                 ))}
               </ul>
            </div>

            <div className="p-8 bg-black text-white rounded-[2rem] space-y-6 shadow-xl">
               <Sparkles className="text-orange-400" size={32} />
               <h3 className="text-xl font-black uppercase">Club Leaders</h3>
               <p className="text-gray-400 text-sm font-medium">Post your flyers here to reach students in {region} looking for hours.</p>
               <button 
                 onClick={() => setShowCreateModal(true)}
                 className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all"
               >
                 Post Flyer
               </button>
            </div>
          </aside>
        </div>
      </main>

      {/* CREATE POST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
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
              className="bg-white w-full max-w-2xl rounded-[3rem] p-10 md:p-16 space-y-12 relative overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center bg-white border-b border-gray-100 pb-8 sticky top-0 md:static">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Share <span className="text-orange-600">Event</span></h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-300 hover:text-black font-black uppercase tracking-widest text-[10px]"
                >
                  Close [ESC]
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-10">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">What kind of post?</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { type: 'general', icon: MessageSquare, label: 'Post' },
                      { type: 'announcement', icon: Megaphone, label: 'News' },
                      { type: 'achievement', icon: Trophy, label: 'Win' },
                      { type: 'idea', icon: Lightbulb, label: 'Idea' },
                      { type: 'event', icon: Calendar, label: 'Event' }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setNewType(item.type as any)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all group/btn",
                            newType === item.type 
                              ? "bg-black text-white border-black" 
                              : "bg-gray-50 text-gray-400 border-gray-100 hover:border-black hover:text-black"
                          )}
                        >
                          <Icon size={24} className={cn(
                            "transition-transform",
                            newType === item.type ? "scale-110" : "group-hover/btn:scale-110"
                          )} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">Title / Headline</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Science Club Membership Drive"
                    className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg focus:border-black focus:ring-0 transition-all uppercase"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">Details</label>
                  <textarea 
                    required
                    placeholder="Tell us what's happening, where, and why it matters..."
                    className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-lg focus:border-black focus:ring-0 transition-all min-h-[200px] resize-none"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">Photo URL (Optional)</label>
                    <div className="relative">
                      <ImageIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input 
                        type="url"
                        placeholder="Paste image link..."
                        className="w-full pl-14 pr-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-black focus:ring-0 transition-all"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">External Link (Optional)</label>
                    <div className="relative">
                      <LinkIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input 
                        type="url"
                        placeholder="Link to social media or site..."
                        className="w-full pl-14 pr-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-black focus:ring-0 transition-all"
                        value={newExternalUrl}
                        onChange={(e) => setNewExternalUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="flex-grow space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-4">Add Tags (Optional)</label>
                        <div className="relative">
                           <Bookmark size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                           <input 
                            type="text"
                            placeholder="Type a tag and press enter"
                            className="w-full pl-14 pr-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-black focus:ring-0 transition-all uppercase"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          />
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleAddTag}
                        className="mt-6 p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl hover:border-black transition-all"
                      >
                         <Plus size={24} />
                      </button>
                   </div>
                   
                   <div className="flex flex-wrap gap-2">
                      {tags.map(t => (
                        <span key={t} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                          {t}
                          <button 
                            type="button" 
                            onClick={() => setTags(tags.filter(tag => tag !== t))}
                            className="hover:text-black"
                          >
                             ×
                          </button>
                        </span>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-12 border-t border-gray-100">
                   <div className="flex-grow flex items-center gap-3 text-[10px] font-black uppercase text-gray-300 tracking-widest italic ml-4 mb-4 md:mb-0">
                      Posting as {profile.displayName} from {profile.schoolName}
                   </div>
                   <button 
                    type="submit"
                    disabled={isPosting}
                    className="w-full md:w-auto px-12 py-6 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    {isPosting ? <Loader2 className="animate-spin" /> : <Send size={18} />} 
                    {isPosting ? 'POSTING...' : 'PUBLISH POST'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
