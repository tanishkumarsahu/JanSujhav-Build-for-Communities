import { useState } from 'react';
import { Search, Zap, X, Calendar, Landmark, Leaf, Users, BookOpen, TrendingUp, Heart, FileText } from 'lucide-react';

const CATEGORIES = ['All', 'Politics', 'Infrastructure', 'Health', 'Education', 'Economy', 'Environment', 'General'];
const SENTIMENTS = ['All', 'Positive', 'Negative', 'Neutral'];
const DATE_PRESETS = ['All', 'Today', '7 Days', '30 Days', 'Custom'];

const CATEGORY_ICONS = {
  All: FileText,
  Politics: Landmark,
  Infrastructure: TrendingUp,
  Health: Heart,
  Education: BookOpen,
  Economy: TrendingUp,
  Environment: Leaf,
  General: FileText,
};

/**
 * NewsFilterPanel — built-in filters + AI smart filter
 */
export default function NewsFilterPanel({
  filters = {},
  onFilterChange,
  onAIFilter,
  onClearAIFilter,
  aiFilterLoading = false,
  aiFilterActive = false,
  constituency,
}) {
  const [aiQuery, setAiQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const setFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleDatePreset = (preset) => {
    if (preset === 'Custom') {
      setShowDatePicker(true);
      setFilter('date', 'Custom');
    } else {
      setShowDatePicker(false);
      setFilter('date', preset);
      onFilterChange({ ...filters, date: preset, dateFrom: undefined, dateTo: undefined });
    }
  };

  const handleAIFilter = () => {
    if (aiQuery.trim()) {
      onAIFilter(aiQuery.trim());
    }
  };

  const handleClear = () => {
    setAiQuery('');
    onClearAIFilter();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
      {/* Category Row */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Filter by Category
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = filters.category === cat || (!filters.category && cat === 'All');
            const IconComp = CATEGORY_ICONS[cat] || FileText;
            return (
              <button
                key={cat}
                onClick={() => setFilter('category', cat)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium cursor-pointer font-[inherit] whitespace-nowrap transition-all duration-200 border
                  ${isActive
                    ? 'bg-[#BFDDF0]/25 border-[#8CC0EB] text-slate-800 font-semibold'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
              >
                <IconComp size={13} />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sentiment + Date Row */}
      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Sentiment
          </div>
          <div className="flex gap-2">
            {SENTIMENTS.map((s) => {
              const isActive = filters.sentiment === s || (!filters.sentiment && s === 'All');
              return (
                <button
                  key={s}
                  onClick={() => setFilter('sentiment', s)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer font-[inherit] whitespace-nowrap transition-all duration-200 border
                    ${isActive
                      ? 'bg-[#BFDDF0]/25 border-[#8CC0EB] text-slate-800 font-semibold'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Date Range
          </div>
          <div className="flex gap-2 flex-wrap">
            {DATE_PRESETS.map((d) => {
              const isActive = filters.date === d || (!filters.date && d === 'All');
              return (
                <button
                  key={d}
                  onClick={() => handleDatePreset(d)}
                  className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer font-[inherit] whitespace-nowrap transition-all duration-200 border
                    ${isActive
                      ? 'bg-[#BFDDF0]/25 border-[#8CC0EB] text-slate-800 font-semibold'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                >
                  {d === 'Custom' && <Calendar size={12} />}
                  {d}
                </button>
              );
            })}
          </div>
          {showDatePicker && (
            <div className="flex gap-2 mt-2 items-center">
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 bg-white"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilter('dateTo', e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Keyword Row */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Keyword Search
        </div>
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search news..."
            value={filters.keyword || ''}
            onChange={(e) => setFilter('keyword', e.target.value)}
            className="w-full py-2.5 pl-9 pr-3 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 bg-white transition-all duration-200 hover:border-slate-300"
          />
        </div>
      </div>
    </div>
  );
}
