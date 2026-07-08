import { useState } from 'react';
import { Search, Calendar } from 'lucide-react';

const CATEGORIES = ['All', 'Politics', 'Infrastructure', 'Health', 'Education', 'Economy', 'Environment', 'General'];
const SENTIMENTS = ['All', 'Positive', 'Negative', 'Neutral'];
const DATE_PRESETS = ['All', 'Today', '7 Days', '30 Days', 'Custom'];

const CATEGORY_STYLES = {
  All: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  Politics: 'bg-indigo-50/80 text-indigo-750 border-indigo-200 hover:bg-indigo-100/50',
  Infrastructure: 'bg-amber-50/80 text-amber-750 border-amber-200 hover:bg-amber-100/50',
  Health: 'bg-rose-50/80 text-rose-750 border-rose-200 hover:bg-rose-100/50',
  Education: 'bg-sky-50/80 text-sky-750 border-sky-200 hover:bg-sky-100/50',
  Economy: 'bg-emerald-50/80 text-emerald-750 border-emerald-200 hover:bg-emerald-100/50',
  Environment: 'bg-teal-50/80 text-teal-750 border-teal-200 hover:bg-teal-100/50',
  General: 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100',
};

const SENTIMENT_STYLES = {
  All: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  Positive: 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100/50',
  Negative: 'bg-rose-50 text-rose-755 border-rose-250 hover:bg-rose-100/50',
  Neutral: 'bg-slate-50 text-slate-655 border-slate-200 hover:bg-slate-100',
};

/**
 * NewsFilterPanel — built-in filters
 *
 * Props: {
 *   filters, onFilterChange,
 *   constituency
 * }
 */
export default function NewsFilterPanel({
  filters = {},
  onFilterChange,
  constituency,
}) {
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

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 mb-5 shadow-xs">
      {/* Category Row */}
      <div className="mb-4">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">
          Category
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = filters.category === cat || (!filters.category && cat === 'All');
            const styleClass = CATEGORY_STYLES[cat] || CATEGORY_STYLES.General;
            return (
              <button
                key={cat}
                onClick={() => setFilter('category', cat)}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-blue/30 ${
                  active
                    ? styleClass + ' ring-1 ring-brand-blue/20 shadow-3xs scale-102 font-bold'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sentiment + Date Row */}
      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">
            Sentiment
          </div>
          <div className="flex flex-wrap gap-2">
            {SENTIMENTS.map((s) => {
              const active = filters.sentiment === s || (!filters.sentiment && s === 'All');
              const styleClass = SENTIMENT_STYLES[s] || SENTIMENT_STYLES.Neutral;
              return (
                <button
                  key={s}
                  onClick={() => setFilter('sentiment', s)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-blue/30 ${
                    active
                      ? styleClass + ' ring-1 ring-brand-blue/20 shadow-3xs scale-102 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">
            Date Range
          </div>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((d) => {
              const active = filters.date === d || (!filters.date && d === 'All');
              return (
                <button
                  key={d}
                  onClick={() => handleDatePreset(d)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-blue/30 flex items-center gap-1.5 ${
                    active
                      ? 'bg-soft-blue/20 text-slate-800 border-soft-blue/50 ring-1 ring-brand-blue/20 shadow-3xs scale-102 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {d === 'Custom' && <Calendar size={13} className="text-slate-500" />}
                  {d}
                </button>
              );
            })}
          </div>
          {showDatePicker && (
            <div className="flex gap-2 mt-2.5 items-center">
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
              />
              <span className="text-slate-400 text-xs font-semibold">to</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilter('dateTo', e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
              />
            </div>
          )}
        </div>
      </div>

      {/* Keyword Row */}
      <div className="mb-2">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2 uppercase">
          Keyword Search
        </div>
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search news..."
            value={filters.keyword || ''}
            onChange={(e) => setFilter('keyword', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50/30 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
