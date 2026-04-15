import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Scale, TrendingDown, TrendingUp, Clock, BarChart3, MessageSquare,
  ChevronDown, ChevronUp, Loader2, AlertTriangle, CheckCircle2, Flame
} from 'lucide-react';

const NegotiationAssistant = ({ propertyId }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    if (!user) { alert('Please login first'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: result } = await api.post(`/ai/negotiation`, { propertyId });
      setData(result);
      setExpanded(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val?.toLocaleString('en-IN')}`;
  };

  const getMotivationBadge = (m) => {
    if (m === 'Motivated') return { icon: Flame, bg: 'bg-red-100', text: 'text-red-700', label: '🔥 Motivated Seller' };
    if (m === 'Hot') return { icon: TrendingDown, bg: 'bg-amber-100', text: 'text-amber-700', label: '⚡ Open to Negotiation' };
    return { icon: Scale, bg: 'bg-slate-100', text: 'text-slate-600', label: '⚖️ Neutral Position' };
  };

  if (!data && !loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Scale size={20} className="text-indigo-600" />
              AI Negotiation Assistant
            </h3>
            <p className="text-sm text-slate-500 mt-1">Get market analysis, fair price estimate & negotiation scripts</p>
          </div>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Scale size={16} />}
            Get Negotiation Help
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Analyzing market data...</p>
        <p className="text-xs text-slate-400 mt-1">Comparing with similar listings in this area</p>
      </div>
    );
  }

  const motivation = getMotivationBadge(data.sellerMotivation);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-xl">
            <Scale size={20} className="text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-800">AI Negotiation Analysis</h3>
            <p className="text-xs text-slate-500">Based on {data.comparableCount} comparable listings</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-xs text-slate-500">Listed Price</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(data.currentPrice)}</p>
              <p className="text-[10px] text-slate-400">₹{data.pricePerSqft}/sqft</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
              <p className="text-xs text-emerald-600 font-medium">Fair Value</p>
              <p className="text-sm font-bold text-emerald-700 mt-1">
                {formatCurrency(data.fairValueRange.low)} – {formatCurrency(data.fairValueRange.high)}
              </p>
              <p className="text-[10px] text-emerald-500">Market average</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-center border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">Offer Price</p>
              <p className="text-sm font-bold text-blue-700 mt-1">{formatCurrency(data.recommendedOffer)}</p>
              <p className="text-[10px] text-blue-500">Recommended start</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-xs text-slate-500">Avg ₹/sqft</p>
              <p className="text-sm font-bold text-slate-800 mt-1">₹{data.avgPricePerSqft.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-400">Locality median</p>
            </div>
          </div>

          {/* Insights Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Days on Market */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Clock size={18} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Days on Market</p>
                <p className="text-sm font-bold text-slate-800">{data.daysOnMarket} days</p>
              </div>
            </div>
            {/* Seller Motivation */}
            <div className={`flex items-center gap-3 p-3 ${motivation.bg} rounded-xl`}>
              <motivation.icon size={18} className={motivation.text} />
              <div>
                <p className="text-xs text-slate-500">Seller Status</p>
                <p className={`text-sm font-bold ${motivation.text}`}>{motivation.label}</p>
              </div>
            </div>
            {/* Discount Potential */}
            <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
              <TrendingDown size={18} className="text-violet-600" />
              <div>
                <p className="text-xs text-slate-500">Discount Possible</p>
                <p className="text-sm font-bold text-violet-700">{data.discountRange} off</p>
              </div>
            </div>
          </div>

          {/* Price Comparison */}
          {data.priceDiffPercent !== 0 && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              data.isOverpriced ? 'bg-red-50 border border-red-200' : data.isUnderpriced ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              {data.isOverpriced ? (
                <>
                  <AlertTriangle size={20} className="text-red-500" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Overpriced by {data.priceDiffPercent}%</p>
                    <p className="text-xs text-red-500">This property is above the locality average — strong room to negotiate</p>
                  </div>
                </>
              ) : data.isUnderpriced ? (
                <>
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Below market by {Math.abs(data.priceDiffPercent)}%</p>
                    <p className="text-xs text-emerald-500">Good value — this is priced competitively</p>
                  </div>
                </>
              ) : (
                <>
                  <Scale size={20} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-bold text-blue-700">Fairly priced ({data.priceDiffPercent > 0 ? '+' : ''}{data.priceDiffPercent}%)</p>
                    <p className="text-xs text-blue-500">Close to market average</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Negotiation Scripts */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-500" />
              Negotiation Scripts — Copy & Use
            </h4>
            <div className="space-y-2">
              {data.negotiationScripts.map((script, i) => (
                <div key={i} className="relative p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl group">
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    {script}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(script.replace(/^"|"$/g, ''));
                      alert('Script copied!');
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-white text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-slate-400 text-center mt-4">
            AI analysis based on {data.comparableCount} similar listings in this locality. For reference only — always consult a property advisor.
          </p>
        </div>
      )}
    </div>
  );
};

export default NegotiationAssistant;
