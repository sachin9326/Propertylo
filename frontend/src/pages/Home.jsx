import React, { useState, useEffect, useCallback, useRef } from 'react';
import api, { ensureBackendReady } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import FilterSidebar from '../components/FilterSidebar';
import { Search, SlidersHorizontal, MapPin, Brain, Sparkles, Key, Home as HomeIcon, Building2, Bed, Map, BarChart, Plus, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const PropertySkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
    <div className="aspect-[4/3] bg-slate-200" />
    <div className="p-4 flex flex-col gap-3">
      <div className="h-5 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-6 bg-slate-100 rounded w-16" />
        <div className="h-6 bg-slate-100 rounded w-16" />
      </div>
      <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
        <div className="h-6 bg-slate-200 rounded w-24" />
        <div className="h-6 bg-slate-200 rounded w-16" />
      </div>
    </div>
  </div>
);

// Local storage cache for instant loading on return visits
const CACHE_KEY = 'propertylo_home_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getLocalCache = (params) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const key = JSON.stringify(params);
    if (cache[key] && (Date.now() - cache[key].timestamp < CACHE_TTL)) {
      return cache[key].data;
    }
  } catch (e) {}
  return null;
};

const setLocalCache = (params, data) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    const key = JSON.stringify(params);
    cache[key] = { data, timestamp: Date.now() };
    // Keep only last 5 cache entries to avoid localStorage bloat
    const keys = Object.keys(cache);
    if (keys.length > 5) {
      const oldest = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)[0];
      delete cache[oldest];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
};

const Home = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [matchScores, setMatchScores] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [backendStatus, setBackendStatus] = useState('connecting'); // 'connecting' | 'ready' | 'slow'
  const [usingCache, setUsingCache] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    type: 'ALL',
  });

  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Check if user has completed quiz
  useEffect(() => {
    if (user) {
      api.get('/api/ai/preferences').then(({ data }) => {
        setQuizCompleted(data.quizCompleted);
      }).catch(() => {});
    }
  }, [user]);

  const buildParams = useCallback(() => {
    const params = { page, limit: 8 }; // Reduced from 12 to 8 for faster first paint
    if (user?.id) params.userId = user.id;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'ALL') params[key] = value;
    });
    return params;
  }, [filters, page, user]);

  const fetchProperties = useCallback(async (isLoadMore = false) => {
    const params = buildParams();

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // STEP 1: Show cached data INSTANTLY (stale-while-revalidate)
    if (!isLoadMore) {
      const cached = getLocalCache(params);
      if (cached) {
        setProperties(cached.properties || []);
        setResultCount(cached.total || 0);
        setHasMore((cached.page || 1) < (cached.totalPages || 1));
        setLoading(false);
        setUsingCache(true);
        // Don't return — continue to fetch fresh data in background
      }
    }

    // STEP 2: Ensure backend is awake before making the real API call
    if (backendStatus === 'connecting') {
      const ready = await ensureBackendReady();
      setBackendStatus(ready ? 'ready' : 'slow');
    }

    // STEP 3: Fetch fresh data
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else if (!usingCache) {
        setLoading(true);
      }
      
      const { data } = await api.get('/api/properties', { 
        params,
        signal: abortControllerRef.current.signal
      });
      
      const newProperties = data.properties || [];
      
      if (isLoadMore) {
        setProperties(prev => [...prev, ...newProperties]);
      } else {
        setProperties(newProperties);
        // Cache the fresh response for next visit
        setLocalCache(params, data);
      }
      
      setResultCount(data.total || newProperties.length);
      setHasMore(data.page < data.totalPages);
      if (data.matchScores) setMatchScores(prev => ({ ...prev, ...data.matchScores }));
      
      setLoading(false);
      setLoadingMore(false);
      setUsingCache(false);
      setBackendStatus('ready');

      // Background: fetch AI match scores if needed
      if (user && newProperties.length > 0 && !data.matchScores) {
        try {
          const ids = newProperties.map(p => p.id);
          const { data: scoreData } = await api.post('/api/ai/match-scores-bulk', { propertyIds: ids });
          setMatchScores(prev => ({ ...prev, ...(scoreData.scores || {}) }));
        } catch (e) {}
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return; // Ignore cancelled requests
      console.error('Error fetching properties:', error);
      
      // If network request failed but we have cached data, keep showing it
      if (properties.length > 0) {
        setUsingCache(true);
      }
      
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams, user, backendStatus]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      fetchProperties(page > 1);
      isFirstLoad.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProperties(page > 1), 400);
    return () => clearTimeout(debounceRef.current);
  }, [filters, page, fetchProperties]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div>
      {/* Backend warming indicator */}
      {backendStatus === 'connecting' && loading && !usingCache && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
          <Wifi size={16} className="text-amber-600 animate-pulse" />
          <p className="text-sm text-amber-700 font-medium">Connecting to server... This may take a few seconds on first visit.</p>
        </div>
      )}

      {/* Stale data indicator */}
      {usingCache && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
          <p className="text-xs text-blue-600 font-medium">Showing cached results • Refreshing...</p>
        </div>
      )}

      {/* ====== HERO SEARCH SECTION ====== */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 mb-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=60')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto mt-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">Find Your Dream Home</h1>
          <p className="text-slate-300 mb-6 text-lg">Search by city, locality, or project name</p>
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl md:rounded-full shadow-2xl border border-white/20">
            <div className="flex-grow flex items-center bg-white rounded-xl md:rounded-l-full overflow-hidden px-4 py-3 focus-within:ring-2 focus-within:ring-primary transition-all">
              <MapPin className="text-primary mr-2 flex-shrink-0" size={20} />
              <input
                type="text"
                placeholder="Enter city, locality or project name..."
                className="w-full outline-none text-slate-800 bg-transparent placeholder-slate-400 font-medium"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <select
              className="bg-white px-6 py-3 md:rounded-none rounded-xl text-slate-700 outline-none border-l border-slate-200 cursor-pointer font-semibold"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="ALL">All Types</option>
              <option value="RENT">For Rent</option>
              <option value="SALE">For Sale</option>
              <option value="BUY">To Buy</option>
            </select>
            <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl md:rounded-r-full md:rounded-l-none font-bold hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center gap-2">
              <Search size={18} /> Search
            </button>
          </form>
        </div>
      </div>
 
      {/* ====== CATEGORY SECTION ====== */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-8">
        {[
          { label: 'Buy', icon: HomeIcon, color: 'text-blue-600', bg: 'bg-blue-50', cat: 'BUY' },
          { label: 'Rent', icon: Key, color: 'text-emerald-600', bg: 'bg-emerald-50', cat: 'RENT' },
          { label: 'Commercial', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50', cat: 'COMMERCIAL' },
          { 
            label: 'Sell/Rent', 
            icon: Plus, 
            color: 'text-white', 
            bg: 'bg-primary', 
            link: '/post-property',
            isSpecial: true 
          },
          { label: 'PG', icon: Bed, color: 'text-purple-600', bg: 'bg-purple-50', cat: 'PG' },
          { label: 'Plot / Land', icon: Map, color: 'text-rose-600', bg: 'bg-rose-50', cat: 'PLOT_LAND' },
          { label: 'Insights', icon: BarChart, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '#' },
        ].map((item, i) => {
          if (item.isSpecial) {
            return (
              <Link
                key={i}
                to={item.link}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className={`p-2.5 ${item.bg} ${item.color} rounded-xl group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} className="stroke-[3px]" />
                </div>
                <span className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-tight">{item.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={i}
              onClick={() => item.cat && setFilters(prev => ({ ...prev, category: item.cat }))}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className={`p-2.5 ${item.bg} ${item.color} rounded-xl group-hover:scale-110 transition-transform`}>
                <item.icon size={20} />
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-700">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====== AI QUIZ PROMPT ====== */}
      {user && !quizCompleted && (
        <div className="mb-6 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Brain size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-800">Unlock AI Match Scores</p>
              <p className="text-xs text-violet-600">Take the 2-min lifestyle quiz — we'll score every listing for you</p>
            </div>
          </div>
          <Link
            to="/ai-quiz"
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-md whitespace-nowrap"
          >
            <Sparkles size={14} /> Start Quiz
          </Link>
        </div>
      )}

      {/* ====== RESULT BAR ====== */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {loading && !usingCache ? 'Searching...' : `${resultCount} Properties Found`}
          </h2>
          {user && quizCompleted && !loading && (
            <p className="text-xs text-violet-600 mt-0.5 flex items-center gap-1">
              <Brain size={12} /> AI match scores active
            </p>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex gap-6 items-start">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <div className="flex-1 min-w-0">
          {loading && !usingCache ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <PropertySkeleton key={i} />)}
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map(property => (
                  <PropertyCard key={property.id} property={property} matchScores={matchScores} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Properties'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
              <Search size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg font-medium">No properties found matching your criteria.</p>
              <button
                onClick={() => setFilters({ search: '', type: 'ALL' })}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
