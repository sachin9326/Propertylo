import React from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

const FilterSidebar = ({ filters, setFilters, isOpen, setIsOpen }) => {
  const [expandedSections, setExpandedSections] = React.useState({
    budget: true,
    bhk: true,
    propertyType: true,
    possession: true,
    listing: true,
    area: true,
    toggles: true,
    category: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Multi-select toggle helper (for BHK, propertyType, listingType)
  const toggleMultiSelect = (key, value) => {
    setFilters(prev => {
      const current = prev[key] ? prev[key].split(',').filter(Boolean) : [];
      const idx = current.indexOf(value);
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      return { ...prev, [key]: current.join(',') };
    });
  };

  const isSelected = (key, value) => {
    if (!filters[key]) return false;
    return filters[key].split(',').includes(value);
  };

  const clearAllFilters = () => {
    setFilters({
      search: filters.search || '',
      type: filters.type || 'ALL',
    });
  };

  const activeFilterCount = Object.keys(filters).filter(
    k => !['search', 'type'].includes(k) && filters[k] && filters[k] !== '' && filters[k] !== 'false'
  ).length;

  const SectionHeader = ({ title, section }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-3 text-sm font-bold text-slate-700 uppercase tracking-wider hover:text-primary transition-colors"
    >
      {title}
      {expandedSections[section] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );

  // Reusable Checkbox component with proper onClick
  const CheckboxItem = ({ label, filterKey, value }) => {
    const selected = isSelected(filterKey, value);
    return (
      <div
        onClick={() => toggleMultiSelect(filterKey, value)}
        className="flex items-center gap-3 cursor-pointer group py-1"
        role="checkbox"
        aria-checked={selected}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMultiSelect(filterKey, value); } }}
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          selected
            ? 'bg-primary border-primary'
            : 'border-slate-300 group-hover:border-primary'
        }`}>
          {selected && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span className={`text-sm font-medium transition-colors select-none ${
          selected ? 'text-primary' : 'text-slate-600 group-hover:text-slate-800'
        }`}>
          {label}
        </span>
      </div>
    );
  };

  // Reusable Radio component with proper onClick
  const RadioItem = ({ label, filterKey, value }) => {
    const selected = filters[filterKey] === value;
    return (
      <div
        onClick={() => updateFilter(filterKey, selected ? '' : value)}
        className="flex items-center gap-3 cursor-pointer group py-1"
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updateFilter(filterKey, selected ? '' : value); } }}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          selected
            ? 'border-primary'
            : 'border-slate-300 group-hover:border-primary'
        }`}>
          {selected && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          )}
        </div>
        <span className={`text-sm font-medium transition-colors select-none ${
          selected ? 'text-primary' : 'text-slate-600 group-hover:text-slate-800'
        }`}>
          {label}
        </span>
      </div>
    );
  };

  // Reusable Toggle component with proper onClick
  const ToggleItem = ({ label, filterKey }) => {
    const active = filters[filterKey] === 'true';
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <button
          type="button"
          onClick={() => updateFilter(filterKey, active ? '' : 'true')}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            active ? 'bg-primary' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={active}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
            active ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`} />
        </button>
      </div>
    );
  };

  const sidebarContent = (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-slate-800">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ============ BUDGET ============ */}
      <div className="border-b border-slate-100">
        <SectionHeader title="Budget" section="budget" />
        {expandedSections.budget && (
          <div className="pb-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Min (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice || ''}
                  onChange={e => updateFilter('minPrice', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Max (₹)</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice || ''}
                  onChange={e => updateFilter('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            {/* Quick budget presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '< 25L', min: '', max: '2500000' },
                { label: '25-50L', min: '2500000', max: '5000000' },
                { label: '50L-1Cr', min: '5000000', max: '10000000' },
                { label: '1Cr+', min: '10000000', max: '' },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    updateFilter('minPrice', preset.min);
                    updateFilter('maxPrice', preset.max);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                    filters.minPrice === preset.min && filters.maxPrice === preset.max
                      ? 'bg-primary text-white border-primary'
                      : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ BHK ============ */}
      <div className="border-b border-slate-100">
        <SectionHeader title="Configuration (BHK)" section="bhk" />
        {expandedSections.bhk && (
          <div className="pb-4 flex flex-wrap gap-2">
            {['1BHK', '2BHK', '3BHK', '4+ BHK'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggleMultiSelect('bhk', option)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                  isSelected('bhk', option)
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary bg-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============ CATEGORY ============ */}
      <div className="border-b border-slate-100">
        <SectionHeader title="Category" section="category" />
        {expandedSections.category && (
          <div className="pb-4 space-y-1">
            <CheckboxItem label="Buy" filterKey="category" value="BUY" />
            <CheckboxItem label="Rent" filterKey="category" value="RENT" />
            <CheckboxItem label="Commercial" filterKey="category" value="COMMERCIAL" />
            <CheckboxItem label="PG" filterKey="category" value="PG" />
            <CheckboxItem label="Plot / Land" filterKey="category" value="PLOT_LAND" />
          </div>
        )}
      </div>

      {/* ============ PROPERTY TYPE ============ */}
      <div className="border-b border-slate-100">
        <SectionHeader title="Property Type" section="propertyType" />
        {expandedSections.propertyType && (
          <div className="pb-4 space-y-1">
            <CheckboxItem label="Flat" filterKey="propertyType" value="Flat" />
            <CheckboxItem label="Independent House" filterKey="propertyType" value="Independent House" />
            <CheckboxItem label="Villa" filterKey="propertyType" value="Villa" />
            <CheckboxItem label="Plot" filterKey="propertyType" value="Plot" />
          </div>
        )}
      </div>

      {/* ============ POSSESSION STATUS ============ */}
      <div className="border-b border-slate-100">
        <SectionHeader title="Possession Status" section="possession" />
        {expandedSections.possession && (
          <div className="pb-4 space-y-1">
            <RadioItem label="Ready to Move" filterKey="possessionStatus" value="Ready to Move" />
            <RadioItem label="Under Construction" filterKey="possessionStatus" value="Under Construction" />
          </div>
        )}
      </div>

      {/* ============ LISTING TYPE ============ */}
      <div className="border-b border-slate-100">
        <SectionHeader title="Listing Type" section="listing" />
        {expandedSections.listing && (
          <div className="pb-4 space-y-1">
            <CheckboxItem label="New Launch" filterKey="listingType" value="New Launch" />
            <CheckboxItem label="New Project" filterKey="listingType" value="New Project" />
            <CheckboxItem label="New Booking" filterKey="listingType" value="New Booking" />
            <CheckboxItem label="Resale" filterKey="listingType" value="Resale" />
          </div>
        )}
      </div>

      {/* ============ AREA (SQ FT) ============ */}
      <div className="border-b border-slate-100">
        <SectionHeader title="Property Size (Sq. Ft)" section="area" />
        {expandedSections.area && (
          <div className="pb-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Min</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minArea || ''}
                  onChange={e => updateFilter('minArea', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Max</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxArea || ''}
                  onChange={e => updateFilter('maxArea', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '< 500', min: '', max: '500' },
                { label: '500-1000', min: '500', max: '1000' },
                { label: '1000-2000', min: '1000', max: '2000' },
                { label: '2000+', min: '2000', max: '' },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    updateFilter('minArea', preset.min);
                    updateFilter('maxArea', preset.max);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                    filters.minArea === preset.min && filters.maxArea === preset.max
                      ? 'bg-primary text-white border-primary'
                      : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {preset.label} sqft
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ TOGGLES ============ */}
      <div>
        <SectionHeader title="More Options" section="toggles" />
        {expandedSections.toggles && (
          <div className="pb-4 space-y-3">
            <ToggleItem label="Verified Only" filterKey="isVerified" />
            <ToggleItem label="Gated Society" filterKey="isGated" />
            <ToggleItem label="With Photos" filterKey="withPhotos" />
            <ToggleItem label="With Videos" filterKey="withVideos" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[340px] max-w-[90vw] bg-white shadow-2xl p-5 overflow-y-auto animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSidebar;
