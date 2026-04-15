import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Maximize, FileImage, BadgeCheck, Shield, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AIMatchBadge from './AIMatchBadge';

const PropertyCard = ({ property, matchScores = {} }) => {
  const { user } = useAuth();
  const imageUrl = property.imageUrls && property.imageUrls.length > 0
    ? property.imageUrls[0]
    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80';

  const matchData = matchScores[property.id] || null;

  const formatPrice = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val?.toLocaleString('en-IN')}`;
  };

  return (
    <Link to={`/property/${property.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
            {property.type}
          </span>
          {property.bhk && (
            <span className="px-2.5 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-sm">
              {property.bhk}
            </span>
          )}
        </div>
        {/* Top-right badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center text-xs">
            <FileImage size={12} className="mr-1" />
            {property.imageUrls?.length || 0}
          </div>
          {property.isVerified && (
            <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center text-xs font-semibold">
              <BadgeCheck size={12} className="mr-1" />Verified
            </div>
          )}
        </div>
        {/* AI Match Badge overlay (bottom-left) */}
        {user && matchData && (
          <div className="absolute bottom-3 left-3">
            <AIMatchBadge
              score={matchData.score}
              matches={matchData.matches}
              mismatches={matchData.mismatches}
              compact={true}
            />
          </div>
        )}
        {/* Possession badge (bottom-right) */}
        {property.possessionStatus && (
          <div className="absolute bottom-3 right-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm shadow-sm ${
              property.possessionStatus === 'Ready to Move'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            }`}>
              {property.possessionStatus}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{property.title}</h3>
        </div>
        <p className="text-slate-500 text-sm flex items-center mb-1">
          <MapPin size={14} className="mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{property.address}</span>
        </p>
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3 mt-1">
          {property.propertyType && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md flex items-center gap-1">
              <Building2 size={10} />{property.propertyType}
            </span>
          )}
          {property.isGated && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-medium rounded-md flex items-center gap-1">
              <Shield size={10} />Gated
            </span>
          )}
          {property.listingType && (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-md">
              {property.listingType}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-baseline text-primary">
            <span className="text-lg font-bold">{formatPrice(property.price)}</span>
            {property.type === 'RENT' && <span className="text-xs border-l border-slate-200 ml-2 pl-2 text-slate-500">/mo</span>}
          </div>
          <div className="flex items-center text-slate-500 text-xs font-medium">
            <Maximize size={14} className="mr-1" />
            {property.areaSqFt} sqft
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
