import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import FilterSidebar from '../components/FilterSidebar';
import { Search, SlidersHorizontal, MapPin, Brain, Sparkles, Key, Home as HomeIcon, Building2, Bed, Map, BarChart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const [filters, setFilters] = useState({
    search: '',
    type: 'ALL',
  });

  const debounceRef = useRef(null);

  // Check if user has completed quiz
  useEffect(() => {
    if (user) {
      api.get('/api/ai/preferences').then(({ data }) => {
        setQuizCompleted(data.quizCompleted);
      }).catch(() => {});
    }
  }, [user]);

  const buildParams = useCallback(() => {
    const params = { page, limit: 12 };
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'ALL') params[key] = value;
    });
    return params;
  }, [filters, page]);

  const fetchProperties = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const params = buildParams();
      const { data } = await api.get('/api/properties', { params });
      
      // Handle the new paginated API response
      const newProperties = data.properties || [];
      
      if (isLoadMore) {
        setProperties(prev => [...prev, ...newProperties]);
      } else {
        setProperties(newProperties);
      }
      
      setResultCount(data.total || newProperties.length);
      setHasMore(data.page < data.totalPages);

      // Fetch AI match scores if user is logged in
      if (user && newProperties.length > 0) {
        try {
          const ids = newProperties.map(p => p.id);
          const { data: scoreData } = await api.post('/api/ai/match-scores-bulk', { propertyIds: ids });
          setMatchScores(prev => ({ ...prev, ...(scoreData.scores || {}) }));
        } catch (e) {
          // Scores are optional — don't block UI
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams, user]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // If page is 1, it's a new search, if page > 1, it's load more
    debounceRef.current = setTimeout(() => fetchProperties(page > 1), 400);
    return () => clearTimeout(debounceRef.current);
  }, [filters, page, fetchProperties]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div>
      {/* ====== HERO SEARCH SECTION ====== */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 mb-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80')] bg-cover bg-center" />
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
          // The Add Button inserted between Commercial and PG
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


      {/* ====== AI QUIZ PROMPT (if logged in + no quiz) ====== */}
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
            {loading ? 'Searching...' : `${resultCount} Properties Found`}
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

      {/* ====== MAIN CONTENT: SIDEBAR + GRID ====== */}
      <div className="flex gap-6 items-start">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-slate-500 text-sm font-medium">Loading properties...</p>
              </div>
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
              <p className="text-slate-400 text-sm mt-2">Try adjusting your search filters.</p>
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
