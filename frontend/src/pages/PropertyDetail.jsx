import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PriceHistoryChart from '../components/PriceHistoryChart';
import AIMatchBadge from '../components/AIMatchBadge';
import NegotiationAssistant from '../components/NegotiationAssistant';
import NeighborhoodIntelligence from '../components/NeighborhoodIntelligence';
import VisitScheduler from '../components/VisitScheduler';
import CommunityReviews from '../components/CommunityReviews';
import {
  MapPin, Maximize, Calendar, Home, Building2, Shield, BadgeCheck,
  Heart, Share2, Phone, Mail, ChevronLeft, ChevronRight, X,
  IndianRupee, Car, Sofa, Clock, Eye, ArrowLeft, Calculator, TrendingUp,
  Layers, Star, CalendarCheck
} from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [matchData, setMatchData] = useState(null);

  useEffect(() => { fetchProperty(); }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`${import.meta.env.VITE_API_URL}/properties/${id}`);
      setProperty(data);
      if (user) {
        try {
          const fav = await api.get(`${import.meta.env.VITE_API_URL}/favorites/check/${id}`);
          setIsSaved(fav.data.saved);
        } catch (e) {}
        // Fetch AI match score
        try {
          const { data: scoreRes } = await api.post(`${import.meta.env.VITE_API_URL}/ai/match-score`, { propertyId: id });
          if (scoreRes.score !== null) setMatchData(scoreRes);
        } catch (e) {}
      }
      try {
        const similar = await api.get(`${import.meta.env.VITE_API_URL}/properties`, { params: { city: data.city, type: data.type } });
        setSimilarProperties(similar.data.filter(p => String(p.id) !== String(id)).slice(0, 4));
      } catch (e) {}
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!user) { alert('Please login first'); return; }
    try {
      if (isSaved) { await api.delete(`${import.meta.env.VITE_API_URL}/favorites/${id}`); setIsSaved(false); }
      else { await api.post(`${import.meta.env.VITE_API_URL}/favorites`, { propertyId: id }); setIsSaved(true); }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!property) {
    return <div className="text-center py-20 text-slate-500 text-xl">Property not found</div>;
  }

  const images = property.imageUrls && property.imageUrls.length > 0
    ? property.imageUrls
    : [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=80',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80',
      ];

  const formatPrice = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val?.toLocaleString('en-IN')}`;
  };

  const specs = [
    { icon: Home, label: 'Type', value: property.propertyType || property.type },
    { icon: Building2, label: 'BHK', value: property.bhk || 'N/A' },
    { icon: Maximize, label: 'Area', value: `${property.areaSqFt} sqft` },
    { icon: IndianRupee, label: 'Price/sqft', value: `₹${Math.round(property.price / property.areaSqFt).toLocaleString('en-IN')}` },
    { icon: Clock, label: 'Possession', value: property.possessionStatus || 'N/A' },
    { icon: Sofa, label: 'Furnished', value: property.furnishedStatus || 'N/A' },
    { icon: Car, label: 'Parking', value: property.parking || 'N/A' },
    { icon: Shield, label: 'Society', value: property.isGated ? 'Gated' : 'Open' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Home },
    { key: 'neighbourhood', label: 'Area Intel', icon: Layers },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'schedule', label: 'Visit', icon: CalendarCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to listings
      </Link>

      {/* ======= IMAGE GALLERY ======= */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-[16/7] shadow-2xl group">
        <img
          src={images[currentImage]}
          alt={property.title}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Price overlay */}
        <div className="absolute bottom-5 left-5">
          <p className="text-4xl font-extrabold text-white drop-shadow">
            {formatPrice(property.price)}
            {property.type === 'RENT' && <span className="text-lg font-normal text-slate-300 ml-1">/month</span>}
          </p>
          <p className="text-slate-300 text-sm flex items-center gap-1 mt-1">
            <MapPin size={13} />{property.address}
          </p>
        </div>
        {/* Verified badge */}
        {property.isVerified && (
          <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-sm font-bold shadow">
            <BadgeCheck size={15} /> Verified
          </div>
        )}
        {/* Image nav */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage(i => Math.max(0, i - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentImage(i => Math.min(images.length - 1, i + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === currentImage ? 'border-primary shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={22} />
          </button>
          <img src={images[currentImage]} alt="" className="max-w-4xl max-h-[85vh] object-contain rounded-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ======= MAIN GRID ======= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- LEFT: Main Content ---- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title + AI Match */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800">{property.title}</h1>
                <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {property.locality && `${property.locality}, `}{property.city}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">{property.type}</span>
                {property.bhk && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold">{property.bhk}</span>}
                {property.listingType && <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-medium">{property.listingType}</span>}
              </div>
            </div>
            {/* AI Match Badge */}
            {matchData && (
              <div className="mb-4">
                <AIMatchBadge score={matchData.score} matches={matchData.matches} mismatches={matchData.mismatches} />
              </div>
            )}
          </div>

          {/* ---- TABS ---- */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon size={15} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Specs grid */}
                  <div>
                    <h3 className="text-base font-bold text-slate-700 mb-3">Property Details</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {specs.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-3 text-center hover:bg-blue-50 transition-colors">
                          <Icon size={18} className="text-primary mx-auto mb-1.5" />
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                          <p className="text-sm font-bold text-slate-700 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-700 mb-2">Description</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{property.description}</p>
                  </div>

                  {/* Feature badges */}
                  <div className="flex flex-wrap gap-2">
                    {property.isGated && <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1.5"><Shield size={12} />Gated Society</span>}
                    {property.isVerified && <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1.5"><BadgeCheck size={12} />Verified</span>}
                    {property.isNewLaunch && <span className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full">🚀 New Launch</span>}
                    {property.nearMetro && <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">🚇 Near Metro</span>}
                    {property.nearSchool && <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">🏫 Near School</span>}
                    {property.nearPark && <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">🌳 Near Park</span>}
                    {property.petFriendly && <span className="px-3 py-1.5 bg-pink-50 text-pink-600 text-xs font-semibold rounded-full">🐾 Pet Friendly</span>}
                  </div>

                  {/* Price History Chart */}
                  <div>
                    <h3 className="text-base font-bold text-slate-700 mb-3">Price Trends & Forecast</h3>
                    <PriceHistoryChart locality={property.locality || property.city} />
                  </div>

                  {/* Negotiation Assistant */}
                  <NegotiationAssistant propertyId={property.id} />
                </div>
              )}

              {/* NEIGHBOURHOOD TAB */}
              {activeTab === 'neighbourhood' && (
                <NeighborhoodIntelligence
                  locality={property.locality}
                  city={property.city}
                  latitude={property.latitude}
                  longitude={property.longitude}
                />
              )}

              {/* REVIEWS TAB */}
              {activeTab === 'reviews' && (
                <CommunityReviews propertyId={property.id} locality={property.locality} />
              )}

              {/* SCHEDULE TAB */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Pick a convenient time to visit this property. Your booking will be confirmed immediately.</p>
                  <VisitScheduler propertyId={property.id} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- RIGHT: Sidebar ---- */}
        <div className="space-y-4">
          {/* Contact Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-24">
            <h3 className="text-base font-bold text-slate-800 mb-4">Listed by</h3>
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {property.uploader?.name?.[0] || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{property.uploader?.name}</p>
                <p className="text-xs text-slate-500">{property.uploader?.email}</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-2 mb-4 text-center">
              <div className="flex-1 bg-slate-50 rounded-xl p-2">
                <p className="text-lg font-extrabold text-slate-800">{property.views || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase">Views</p>
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl p-2">
                <p className="text-lg font-extrabold text-slate-800">
                  {Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d
                </p>
                <p className="text-[10px] text-slate-400 uppercase">Listed</p>
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl p-2">
                <p className="text-lg font-extrabold text-slate-800">₹{Math.round(property.price / property.areaSqFt).toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400 uppercase">/sqft</p>
              </div>
            </div>

            {property.uploader?.phone && (
              <a href={`tel:${property.uploader.phone}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-md mb-2 text-sm">
                <Phone size={15} /> Call Agent
              </a>
            )}
            <a href={`mailto:${property.uploader?.email}?subject=Enquiry for ${property.title}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-primary text-primary rounded-xl font-bold hover:bg-blue-50 transition-colors mb-4 text-sm">
              <Mail size={15} /> Send Email
            </a>

            {/* Visit Scheduler in sidebar */}
            <VisitScheduler propertyId={property.id} />

            {/* Save & Share */}
            <div className="flex gap-2 mt-3">
              <button onClick={toggleSave}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-colors text-sm ${isSaved ? 'bg-red-50 text-red-500 border-2 border-red-200' : 'bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-primary hover:text-primary'}`}>
                <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button onClick={() => navigator.share?.({ title: property.title, url: window.location.href }) || navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'))}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-primary hover:text-primary rounded-xl font-semibold transition-colors text-sm">
                <Share2 size={15} /> Share
              </button>
            </div>

            {/* Tools */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/emi-calculator"
                className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:border-primary hover:text-primary transition-colors">
                <Calculator size={14} /> EMI Calc
              </Link>
              <Link to="/roi-calculator"
                className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:border-primary hover:text-primary transition-colors">
                <TrendingUp size={14} /> ROI Calc
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======= SIMILAR PROPERTIES ======= */}
      {similarProperties.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Similar Properties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarProperties.map(p => (
              <Link key={p.id} to={`/property/${p.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all group">
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-primary">{p.title}</p>
                  <p className="text-primary text-sm font-bold mt-1">
                    {p.price >= 10000000 ? `₹${(p.price / 10000000).toFixed(2)} Cr` : `₹${(p.price / 100000).toFixed(1)} L`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.areaSqFt} sqft · {p.bhk || p.propertyType}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
