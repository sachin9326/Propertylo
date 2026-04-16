import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../utils/api';
import {
  Heart, Home, Eye, TrendingUp, Plus, Trash2, Edit3,
  Building2, MapPin, IndianRupee, Calendar, User, Settings,
  Calculator, BarChart3, Star, Shield, Brain, CalendarCheck,
  Clock, CheckCircle2, XCircle, Sparkles
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [savedProperties, setSavedProperties] = useState([]);
  const [sellerStats, setSellerStats] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch saved properties
      try {
        const fav = await api.get('/api/favorites');
        setSavedProperties(fav.data);
      } catch (e) {}

      // Fetch visits
      try {
        const vis = await api.get('/api/visits/my');
        setVisits(vis.data);
      } catch (e) {}

      // Fetch seller stats if UPLOADER
      if (user.role === 'UPLOADER') {
        try {
          const stats = await api.get('/api/favorites/dashboard/stats');
          setSellerStats(stats.data);
        } catch (e) {}
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId) => {
    try {
      await api.post(`/api/favorites/${propertyId}`);
      setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (e) { console.error(e); }
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val?.toLocaleString('en-IN')}`;
  };

  if (!user) return null;

  const cancelVisit = async (id) => {
    try {
      await api.put(`/api/visits/cancel/${id}`);
      setVisits(prev => prev.map(v => v.id === id ? { ...v, status: 'CANCELLED' } : v));
    } catch (e) { alert('Cancel failed'); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'saved', label: 'Saved', icon: Heart },
    { id: 'visits', label: 'My Visits', icon: CalendarCheck },
    ...(user.role === 'UPLOADER' ? [{ id: 'listings', label: 'My Listings', icon: Building2 }] : []),
    { id: 'tools', label: 'Tools', icon: Calculator },
  ];

  const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
            <span className="text-2xl font-extrabold">{user.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{user.name}</h1>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full ${
              user.role === 'UPLOADER' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {user.role === 'UPLOADER' ? '🏠 Property Seller' : '🔍 Property Seeker'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Heart} label="Saved Properties" value={savedProperties.length} color="bg-red-500" />
                {user.role === 'UPLOADER' && sellerStats && (
                  <>
                    <StatCard icon={Building2} label="My Listings" value={sellerStats.totalListings} color="bg-blue-500" />
                    <StatCard icon={Eye} label="Total Views" value={sellerStats.totalViews} color="bg-purple-500" />
                    <StatCard icon={Star} label="Times Saved" value={sellerStats.totalFavorites} color="bg-amber-500" sub="by other users" />
                  </>
                )}
                {user.role !== 'UPLOADER' && (
                  <>
                    <StatCard icon={Eye} label="Properties Viewed" value="—" color="bg-purple-500" />
                    <StatCard icon={TrendingUp} label="Avg Budget" value={savedProperties.length > 0 ? formatCurrency(savedProperties.reduce((s, p) => s + p.price, 0) / savedProperties.length) : '—'} color="bg-emerald-500" />
                    <StatCard icon={MapPin} label="Preferred City" value={savedProperties.length > 0 ? (savedProperties[0].city || 'N/A') : '—'} color="bg-indigo-500" />
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link to="/" className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <Home size={24} className="text-primary" />
                    <span className="text-sm font-semibold text-slate-700">Browse Properties</span>
                  </Link>
                  <Link to="/emi-calculator" className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                    <Calculator size={24} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-700">EMI Calculator</span>
                  </Link>
                  <Link to="/roi-calculator" className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                    <BarChart3 size={24} className="text-purple-600" />
                    <span className="text-sm font-semibold text-slate-700">ROI Calculator</span>
                  </Link>
                  {user.role === 'UPLOADER' && (
                    <Link to="/post-property" className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                      <Plus size={24} className="text-orange-600" />
                      <span className="text-sm font-semibold text-slate-700">Post Property</span>
                    </Link>
                  )}
                  <Link to="/ai-quiz" className="flex flex-col items-center gap-2 p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
                    <Brain size={24} className="text-violet-600" />
                    <span className="text-sm font-semibold text-slate-700">AI Match Quiz</span>
                  </Link>
                </div>
              </div>

              {/* Upcoming Visits Summary */}
              {visits.filter(v => v.status === 'CONFIRMED').length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CalendarCheck size={18} className="text-primary" /> Upcoming Visits
                  </h3>
                  <div className="space-y-2">
                    {visits.filter(v => v.status === 'CONFIRMED').slice(0, 3).map(visit => (
                      <div key={visit.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="p-2 bg-primary/10 rounded-lg"><Calendar size={16} className="text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{visit.property?.title}</p>
                          <p className="text-xs text-slate-500">{visit.date} · {visit.timeSlot}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SAVED PROPERTIES TAB */}
          {activeTab === 'saved' && (
            <div>
              {savedProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedProperties.map(property => (
                    <div key={property.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex">
                      <Link to={`/property/${property.id}`} className="w-40 flex-shrink-0">
                        <img src={getImageUrl(property.imageUrls?.[0])} alt={property.title}
                          className="w-full h-full object-cover" />
                      </Link>
                      <div className="p-4 flex-1 flex flex-col">
                        <Link to={`/property/${property.id}`}>
                          <h4 className="font-bold text-slate-800 hover:text-primary transition-colors line-clamp-1">{property.title}</h4>
                        </Link>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={10} />{property.address}</p>
                        <div className="flex gap-2 mt-2">
                          {property.bhk && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">{property.bhk}</span>}
                          {property.propertyType && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded">{property.propertyType}</span>}
                        </div>
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <p className="text-lg font-bold text-primary">{formatCurrency(property.price)}</p>
                          <button onClick={() => removeFavorite(property.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600">No saved properties yet</p>
                  <p className="text-sm text-slate-400 mt-1">Start browsing and save properties you like!</p>
                  <Link to="/" className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    Browse Properties
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* MY VISITS TAB */}
          {activeTab === 'visits' && (
            <div>
              {visits.length > 0 ? (
                <div className="space-y-3">
                  {visits.map(visit => {
                    const statusColor = {
                      CONFIRMED: 'bg-emerald-100 text-emerald-700',
                      PENDING: 'bg-amber-100 text-amber-700',
                      CANCELLED: 'bg-red-100 text-red-600',
                      COMPLETED: 'bg-blue-100 text-blue-700',
                      NO_SHOW: 'bg-slate-100 text-slate-600',
                    }[visit.status] || 'bg-slate-100 text-slate-600';

                    return (
                      <div key={visit.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                              <CalendarCheck size={20} className="text-primary" />
                            </div>
                            <div>
                              <Link to={`/property/${visit.propertyId}`} className="text-base font-bold text-slate-800 hover:text-primary transition-colors">
                                {visit.property?.title || 'Property'}
                              </Link>
                              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                                <MapPin size={12} /> {visit.property?.address || 'N/A'}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-sm text-slate-600">
                                  <Calendar size={14} className="text-slate-400" /> {visit.date}
                                </span>
                                <span className="flex items-center gap-1 text-sm text-slate-600">
                                  <Clock size={14} className="text-slate-400" /> {visit.timeSlot}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                              {visit.status}
                            </span>
                            {(visit.status === 'CONFIRMED' || visit.status === 'PENDING') && (
                              <button
                                onClick={() => cancelVisit(visit.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors"
                              >
                                <XCircle size={12} /> Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                  <CalendarCheck size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600">No visits scheduled</p>
                  <p className="text-sm text-slate-400 mt-1">Browse properties and schedule a visit!</p>
                  <Link to="/" className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    Browse Properties
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* MY LISTINGS TAB (Seller only) */}
          {activeTab === 'listings' && sellerStats && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">{sellerStats.totalListings} Properties Listed</h3>
                <Link to="/post-property" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-md">
                  <Plus size={16} /> Add New
                </Link>
              </div>
              {sellerStats.listings.length > 0 ? (
                <div className="space-y-3">
                  {sellerStats.listings.map(property => (
                    <div key={property.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                      <Link to={`/property/${property.id}`} className="w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                        <img src={getImageUrl(property.imageUrls?.[0])} alt="" className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/property/${property.id}`} className="font-bold text-slate-800 hover:text-primary transition-colors line-clamp-1">{property.title}</Link>
                        <p className="text-xs text-slate-500 mt-1">{property.city || property.address}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-bold text-primary">{formatCurrency(property.price)}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Eye size={12} />{property.views || 0} views</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12} />{new Date(property.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {property.isVerified && <Shield size={16} className="text-emerald-500" />}
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${property.type === 'RENT' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {property.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600">No listings yet</p>
                  <Link to="/post-property" className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold">Post Your First Property</Link>
                </div>
              )}
            </div>
          )}

          {/* FINANCIAL TOOLS TAB */}
          {activeTab === 'tools' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/emi-calculator" className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white hover:shadow-xl hover:scale-[1.02] transition-all">
                <Calculator size={32} className="mb-4" />
                <h3 className="text-xl font-extrabold mb-2">EMI Calculator</h3>
                <p className="text-blue-200 text-sm">Calculate your monthly EMI, view amortization schedule, and check loan affordability.</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
                  Open Tool <TrendingUp size={16} />
                </div>
              </Link>
              <Link to="/roi-calculator" className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white hover:shadow-xl hover:scale-[1.02] transition-all">
                <BarChart3 size={32} className="mb-4" />
                <h3 className="text-xl font-extrabold mb-2">ROI Calculator</h3>
                <p className="text-emerald-200 text-sm">Analyze rental yield, cap rate, cashflow projections, and investment ratings.</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
                  Open Tool <TrendingUp size={16} />
                </div>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
