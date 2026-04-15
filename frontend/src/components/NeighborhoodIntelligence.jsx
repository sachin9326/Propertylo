import React, { useState, useMemo } from 'react';
import {
  Shield, Wind, GraduationCap, Cross, Train, Droplets,
  TreePine, Building, ToggleLeft, ToggleRight, MapPin, Info
} from 'lucide-react';

// Generate deterministic mock scores from locality seed
const seededRandom = (str, offset = 0) => {
  let hash = offset;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 100);
};

const NeighborhoodIntelligence = ({ locality, city, latitude, longitude }) => {
  const [activeLayers, setActiveLayers] = useState({
    safety: true,
    flood: true,
    aqi: true,
    schools: true,
    hospitals: true,
    metro: true,
  });

  const seed = `${locality || city || 'default'}`;

  // Generate realistic mock data seeded on locality name
  const data = useMemo(() => {
    const safetyScore = 40 + (seededRandom(seed, 1) % 55); // 40-95
    const floodRisk = seededRandom(seed, 2) % 3; // 0=safe, 1=low,2=high
    const aqiRaw = 30 + (seededRandom(seed, 3) % 200); // 30-230
    const schoolCount = 1 + (seededRandom(seed, 4) % 6);
    const hospitalCount = 1 + (seededRandom(seed, 5) % 4);
    const metroDistance = 0.3 + ((seededRandom(seed, 6) % 30) / 10); // 0.3-3.3km

    // AQI category
    let aqiLabel, aqiColor, aqiScore;
    if (aqiRaw <= 50) { aqiLabel = 'Good'; aqiColor = 'emerald'; aqiScore = 100; }
    else if (aqiRaw <= 100) { aqiLabel = 'Moderate'; aqiColor = 'amber'; aqiScore = 70; }
    else if (aqiRaw <= 150) { aqiLabel = 'Unhealthy (Sensitive)'; aqiColor = 'orange'; aqiScore = 45; }
    else { aqiLabel = 'Unhealthy'; aqiColor = 'red'; aqiScore = 20; }

    // Flood risk
    const floodLabels = ['Safe Zone', 'Low Risk', 'High Risk'];
    const floodColors = ['emerald', 'amber', 'red'];
    const floodScores = [100, 60, 20];

    // Safety category
    let safetyLabel, safetyColor;
    if (safetyScore >= 75) { safetyLabel = 'High Safety'; safetyColor = 'emerald'; }
    else if (safetyScore >= 50) { safetyLabel = 'Moderate Safety'; safetyColor = 'amber'; }
    else { safetyLabel = 'Low Safety'; safetyColor = 'red'; }

    // School rating (1-5)
    const schoolRating = (3 + (seededRandom(seed, 7) % 20) / 10).toFixed(1);

    // Overall neighborhood score (0-10)
    const overall = (
      (safetyScore / 100) * 3 +
      (floodScores[floodRisk] / 100) * 2 +
      (aqiScore / 100) * 2 +
      (Math.min(schoolCount, 5) / 5) * 1.5 +
      (Math.min(hospitalCount, 3) / 3) * 1 +
      (metroDistance <= 1 ? 1 : metroDistance <= 2 ? 0.6 : 0.3) * 0.5
    ).toFixed(1);

    return {
      safety: { score: safetyScore, label: safetyLabel, color: safetyColor },
      flood: { risk: floodRisk, label: floodLabels[floodRisk], color: floodColors[floodRisk], score: floodScores[floodRisk] },
      aqi: { value: aqiRaw, label: aqiLabel, color: aqiColor, score: aqiScore },
      schools: { count: schoolCount, rating: schoolRating },
      hospitals: { count: hospitalCount, nearestKm: (0.5 + (seededRandom(seed, 8) % 25) / 10).toFixed(1) },
      metro: { distanceKm: metroDistance.toFixed(1) },
      overall: parseFloat(overall),
    };
  }, [seed]);

  const toggleLayer = (key) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getScoreColor = (score) => {
    if (score >= 7.5) return 'text-emerald-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-red-500';
  };

  const layers = [
    {
      key: 'safety',
      icon: Shield,
      label: 'Safety Index',
      value: `${data.safety.label}`,
      score: data.safety.score,
      detail: `Crime index score: ${data.safety.score}/100`,
      color: data.safety.color,
    },
    {
      key: 'flood',
      icon: Droplets,
      label: 'Flood Risk',
      value: data.flood.label,
      score: data.flood.score,
      detail: `NDMA India flood zone classification`,
      color: data.flood.color,
    },
    {
      key: 'aqi',
      icon: Wind,
      label: 'Air Quality (AQI)',
      value: `${data.aqi.value} — ${data.aqi.label}`,
      score: data.aqi.score,
      detail: `OpenWeatherMap AQI index`,
      color: data.aqi.color,
    },
    {
      key: 'schools',
      icon: GraduationCap,
      label: 'Schools Nearby',
      value: `${data.schools.count} within 2km`,
      score: Math.round(data.schools.count * 16),
      detail: `Avg rating: ${data.schools.rating}/5 ⭐`,
      color: 'blue',
    },
    {
      key: 'hospitals',
      icon: Cross,
      label: 'Hospitals',
      value: `${data.hospitals.count} within 3km`,
      score: Math.round(data.hospitals.count * 25),
      detail: `Nearest: ${data.hospitals.nearestKm} km away`,
      color: 'blue',
    },
    {
      key: 'metro',
      icon: Train,
      label: 'Metro / Transit',
      value: `${data.metro.distanceKm} km away`,
      score: parseFloat(data.metro.distanceKm) <= 1 ? 100 : parseFloat(data.metro.distanceKm) <= 2 ? 60 : 30,
      detail: `Nearest metro/railway station`,
      color: parseFloat(data.metro.distanceKm) <= 1 ? 'emerald' : parseFloat(data.metro.distanceKm) <= 2 ? 'amber' : 'red',
    },
  ];

  const colorMap = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    red: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Neighborhood Intelligence</h3>
              <p className="text-slate-400 text-xs">{locality || city} — Real-time area analysis</p>
            </div>
          </div>
          {/* Overall Score */}
          <div className="text-right">
            <p className="text-xs text-slate-400">Overall Score</p>
            <p className={`text-3xl font-extrabold ${data.overall >= 7.5 ? 'text-emerald-400' : data.overall >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
              {data.overall}<span className="text-lg text-slate-500">/10</span>
            </p>
          </div>
        </div>
      </div>

      {/* Map Placeholder with overlay */}
      <div className="relative bg-slate-100 h-52 overflow-hidden">
        {/* Simulated map tiles look */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${longitude || 77.209},${latitude || 28.614},13,0/700x210?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Fallback gradient map */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-green-100 flex items-center justify-center">
          <div className="text-center">
            <MapPin size={32} className="text-primary mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">{locality || city}</p>
          </div>
        </div>
        {/* Color coded zone overlays */}
        {activeLayers.safety && (
          <div className={`absolute inset-0 opacity-20 ${data.safety.color === 'emerald' ? 'bg-emerald-400' : data.safety.color === 'amber' ? 'bg-amber-400' : 'bg-red-400'}`} />
        )}
        {/* AQI overlay */}
        {activeLayers.aqi && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold shadow">
            AQI: {data.aqi.value} <span className={`text-${data.aqi.color}-600`}>{data.aqi.label}</span>
          </div>
        )}
        {/* Metro marker */}
        {activeLayers.metro && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Train size={12} /> Metro {data.metro.distanceKm}km
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-white/80 text-[10px] text-slate-500 px-1.5 py-0.5 rounded">
          Mock data — Labels indicate real categories
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Toggle Layers</p>
        <div className="flex flex-wrap gap-2">
          {layers.map(layer => (
            <button
              key={layer.key}
              onClick={() => toggleLayer(layer.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                activeLayers[layer.key]
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-primary'
              }`}
            >
              <layer.icon size={12} />
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Details */}
      <div className="p-4 space-y-3">
        {layers.filter(l => activeLayers[l.key]).map(layer => {
          const c = colorMap[layer.color] || colorMap.blue;
          return (
            <div key={layer.key} className="flex items-center gap-3">
              <div className={`p-2 ${c.bg} rounded-lg flex-shrink-0`}>
                <layer.icon size={16} className={c.text} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-700">{layer.label}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.badge}`}>{layer.value}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(layer.score, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{layer.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Summary Grid */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-t border-slate-100">
        <div className="text-center">
          <p className="text-xs text-slate-500">Safety</p>
          <p className={`text-lg font-extrabold ${colorMap[data.safety.color].text}`}>{data.safety.score}<span className="text-[10px]">/100</span></p>
        </div>
        <div className="text-center border-x border-slate-200">
          <p className="text-xs text-slate-500">Air Quality</p>
          <p className={`text-lg font-extrabold ${colorMap[data.aqi.color].text}`}>{data.aqi.value}<span className="text-[10px]"> AQI</span></p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Schools</p>
          <p className="text-lg font-extrabold text-blue-600">{data.schools.count}<span className="text-[10px]"> nearby</span></p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
          <Info size={10} /> Data sourced from mock datasets representing NDMA, OpenWeatherMap, Google Places APIs
        </p>
      </div>
    </div>
  );
};

export default NeighborhoodIntelligence;
