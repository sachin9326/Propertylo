import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Flag, Loader2, PenLine, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const categories = [
  { key: 'waterSupply', label: 'Water Supply', emoji: '💧' },
  { key: 'powerBackup', label: 'Power Backup', emoji: '⚡' },
  { key: 'security', label: 'Security', emoji: '🛡️' },
  { key: 'maintenance', label: 'Maintenance', emoji: '🔧' },
  { key: 'noiseLevel', label: 'Noise Level', emoji: '🔇', inverted: true },
  { key: 'parking', label: 'Parking', emoji: '🚗' },
  { key: 'neighborly', label: 'Neighbors', emoji: '🤝' },
  { key: 'management', label: 'Management', emoji: '🏢' },
];

const StarRating = ({ value, onChange, readOnly = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        disabled={readOnly}
        onClick={() => !readOnly && onChange?.(star)}
        className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
      >
        <Star
          size={readOnly ? 12 : 18}
          className={star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
        />
      </button>
    ))}
  </div>
);

const ScoreBar = ({ score, inverted = false }) => {
  const display = inverted ? (6 - parseFloat(score)).toFixed(1) : score;
  const pct = (parseFloat(display) / 5) * 100;
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-600 w-6">{display}</span>
    </div>
  );
};

const CommunityReviews = ({ propertyId, locality }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [form, setForm] = useState({
    waterSupply: 3, powerBackup: 3, security: 3, maintenance: 3,
    noiseLevel: 3, parking: 3, neighborly: 3, management: 3, comment: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [propertyId, locality]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = propertyId ? { propertyId } : { locality };
      const { data } = await api.get(`/reviews`, { params });
      setReviews(data.reviews || []);
      setAggregate(data.aggregate);
      setCount(data.count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/reviews`, { ...form, propertyId, locality });
      setSubmitted(true);
      setShowForm(false);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlag = async (id) => {
    try {
      await api.put(`/reviews/flag/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      alert('Review flagged for moderation. Thank you!');
    } catch (e) {}
  };

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Star size={18} className="text-amber-400 fill-amber-400" />
            Resident Reviews
            {count > 0 && <span className="text-sm font-normal text-slate-400">({count})</span>}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Real experiences from residents & past tenants</p>
        </div>
        {user && !submitted && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors"
          >
            <PenLine size={14} /> Write a Review
          </button>
        )}
      </div>

      {/* Aggregate Score */}
      {aggregate && (
        <div className="p-5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-5xl font-extrabold text-slate-800">{aggregate.overall}</p>
              <StarRating value={Math.round(parseFloat(aggregate.overall))} readOnly />
              <p className="text-xs text-slate-400 mt-1">{count} reviews</p>
            </div>
            <div className="flex-1 space-y-2">
              {categories.map(cat => (
                <div key={cat.key} className="flex items-center gap-2">
                  <span className="text-base w-5">{cat.emoji}</span>
                  <span className="text-xs text-slate-600 w-24 truncate">{cat.label}</span>
                  <ScoreBar score={aggregate[cat.key]} inverted={cat.inverted} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="p-5 border-b border-slate-100 bg-violet-50">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Rate your experience</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {categories.map(cat => (
              <div key={cat.key} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 flex items-center gap-1.5">
                  {cat.emoji} {cat.label}
                  {cat.inverted && <span className="text-[10px] text-slate-400">(lower=better)</span>}
                </span>
                <StarRating
                  value={form[cat.key]}
                  onChange={val => setForm(prev => ({ ...prev, [cat.key]: val }))}
                />
              </div>
            ))}
          </div>
          <textarea
            placeholder="Share your experience (optional)..."
            rows={3}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            value={form.comment}
            onChange={e => setForm(prev => ({ ...prev, comment: e.target.value }))}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
              Submit Review
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 text-center text-sm text-emerald-700 font-semibold">
          ✅ Review submitted! It may take a moment to appear.
        </div>
      )}

      {/* Reviews List */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={24} className="animate-spin text-primary mx-auto" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center">
            <Star size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No reviews yet. Be the first to review!</p>
            {!user && (
              <Link to="/auth" className="mt-3 inline-block text-xs text-primary font-semibold hover:underline">
                Login to write a review
              </Link>
            )}
          </div>
        ) : (
          visibleReviews.map(review => (
            <div key={review.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {review.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{review.user?.name || 'Anonymous'}</p>
                    <p className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700">
                    {((review.waterSupply + review.powerBackup + review.security + review.maintenance + review.parking + review.neighborly + review.management) / 7).toFixed(1)} ⭐
                  </div>
                  <button
                    onClick={() => handleFlag(review.id)}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                    title="Flag review"
                  >
                    <Flag size={12} />
                  </button>
                </div>
              </div>
              {/* Mini category scores */}
              <div className="grid grid-cols-4 gap-1 mb-2">
                {categories.map(cat => (
                  <div key={cat.key} className="text-center">
                    <p className="text-[9px] text-slate-400">{cat.emoji}</p>
                    <StarRating value={review[cat.key]} readOnly />
                  </div>
                ))}
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600 italic mt-2 pl-2 border-l-2 border-slate-200">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>

      {reviews.length > 3 && (
        <div className="p-3 border-t border-slate-100 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline mx-auto"
          >
            {showAll ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> View all {reviews.length} reviews</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityReviews;
