import React, { useState } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

const AIMatchBadge = ({ score, matches, mismatches, compact = false }) => {
  const [showModal, setShowModal] = useState(false);

  if (score === null || score === undefined) return null;

  const getColor = (s) => {
    if (s >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', label: 'Great Match', ring: 'ring-emerald-400/30' };
    if (s >= 60) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200', label: 'Good Match', ring: 'ring-amber-400/30' };
    return { bg: 'bg-slate-400', text: 'text-slate-500', light: 'bg-slate-50', border: 'border-slate-200', label: 'Partial Match', ring: 'ring-slate-400/30' };
  };

  const color = getColor(score);

  // Compact badge for property cards
  if (compact) {
    return (
      <>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowModal(true); }}
          className={`flex items-center gap-1.5 px-2.5 py-1 ${color.light} ${color.border} border rounded-full cursor-pointer hover:shadow-md transition-all group`}
          title="AI Match Score — click for details"
        >
          <div className={`w-5 h-5 ${color.bg} rounded-full flex items-center justify-center`}>
            <span className="text-[10px] font-bold text-white">{score}</span>
          </div>
          <span className={`text-[10px] font-bold ${color.text} group-hover:underline`}>{color.label}</span>
        </button>

        {showModal && (
          <MatchDetailModal
            score={score}
            color={color}
            matches={matches}
            mismatches={mismatches}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // Full badge for detail page
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-3 px-4 py-3 ${color.light} ${color.border} border rounded-xl cursor-pointer hover:shadow-lg transition-all ring-4 ${color.ring} w-full`}
      >
        {/* Circular score */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#94a3b8'}
              strokeWidth="4"
              strokeDasharray={`${(score / 100) * 150.8} 150.8`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-extrabold ${color.text}`}>{score}</span>
          </div>
        </div>
        <div className="text-left flex-1">
          <p className={`text-sm font-bold ${color.text}`}>🤖 AI {color.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {matches?.length || 0} matching criteria · Click to see why
          </p>
        </div>
      </button>

      {showModal && (
        <MatchDetailModal
          score={score}
          color={color}
          matches={matches}
          mismatches={mismatches}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

// Modal: "Why this property suits you"
const MatchDetailModal = ({ score, color, matches = [], mismatches = [], onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${color.bg} p-6 rounded-t-2xl text-white relative`}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke="white" strokeWidth="4"
                  strokeDasharray={`${(score / 100) * 175.9} 175.9`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-extrabold">{score}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-extrabold">🤖 {color.label}</h3>
              <p className="text-white/80 text-sm mt-0.5">AI Compatibility Score</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Matches */}
          {matches.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-1.5">
                <Check size={14} /> What matches your lifestyle ({matches.length})
              </h4>
              <div className="space-y-2">
                {matches.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-sm text-slate-700">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mismatches */}
          {mismatches.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Points to consider ({mismatches.length})
              </h4>
              <div className="space-y-2">
                {mismatches.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">!</span>
                    <span className="text-sm text-slate-700">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMatchBadge;
