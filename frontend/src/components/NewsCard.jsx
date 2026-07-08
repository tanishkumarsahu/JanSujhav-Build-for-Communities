import { ExternalLink, Tag, ArrowRight } from 'lucide-react';

const CATEGORY_COLORS = {
  Politics: { bg: 'bg-[#BFDDF0]/20', text: 'text-[#3B8BC7]', border: 'border-[#BFDDF0]' },
  Infrastructure: { bg: 'bg-[#FFEBCC]/40', text: 'text-amber-700', border: 'border-[#FFEBCC]' },
  Health: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  Education: { bg: 'bg-[#BFDDF0]/20', text: 'text-[#3B8BC7]', border: 'border-[#BFDDF0]' },
  Economy: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  Environment: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  General: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
};

const SENTIMENT_STYLES = {
  Positive: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Positive' },
  Negative: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Negative' },
  Neutral: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', label: 'Neutral' },
};

const CATEGORY_ICONS = {
  Politics: '🏛️',
  Infrastructure: '🏗️',
  Health: '🏥',
  Education: '📚',
  Economy: '📈',
  Environment: '🌿',
  General: '📰',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * NewsCard — individual news article card
 * Props: { article }
 */
export default function NewsCard({ article }) {
  const {
    headline,
    summary,
    source_name,
    source_url,
    image_url,
    published_at,
    category = 'General',
    sentiment,
    ai_tags = [],
  } = article || {};

  const catStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
  const sentStyle = sentiment ? SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.Neutral : null;

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden flex flex-col transition-all duration-300 cursor-default hover:border-[#BFDDF0] hover:shadow-md hover:-translate-y-0.5 group">
      {/* Image or category placeholder */}
      {image_url ? (
        <img
          src={image_url}
          alt={headline}
          className="w-full h-44 object-cover bg-slate-50"
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Fallback placeholder */}
      <div
        className={`${image_url ? 'hidden' : 'flex'} items-center justify-center h-32 bg-slate-50 text-4xl`}
      >
        {CATEGORY_ICONS[category] || '📰'}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        {/* Badges */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border} uppercase tracking-wide`}>
            {category}
          </span>
          {published_at && (
            <span className="text-[11px] text-slate-400 ml-auto">{timeAgo(published_at)}</span>
          )}
        </div>

        {/* Headline */}
        <h3 className="m-0 text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2">
          {headline || 'No headline'}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="m-0 text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
            {summary}
          </p>
        )}

        {/* Footer: Read link */}
        {source_url && (
          <a
            href={source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#5BA3D9] no-underline font-medium mt-auto pt-2 hover:text-[#3B8BC7] transition-colors group/link"
          >
            Read Full Article
            <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
          </a>
        )}
      </div>
    </div>
  );
}
