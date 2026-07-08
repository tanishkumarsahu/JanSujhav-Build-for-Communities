import { ExternalLink, Tag } from 'lucide-react';

const CATEGORY_COLORS = {
  Politics: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-200/60' },
  Infrastructure: { bg: 'bg-amber-50/70', text: 'text-amber-700', border: 'border-amber-200/60' },
  Health: { bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-200/60' },
  Education: { bg: 'bg-sky-50/70', text: 'text-sky-700', border: 'border-sky-200/60' },
  Economy: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200/60' },
  Environment: { bg: 'bg-teal-50/70', text: 'text-teal-700', border: 'border-teal-200/60' },
  General: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

const SENTIMENT_STYLES = {
  Positive: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-250', label: 'Positive' },
  Negative: { bg: 'bg-rose-50/70', text: 'text-rose-750', border: 'border-rose-250', label: 'Negative' },
  Neutral: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'Neutral' },
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
    <div className="bg-white border border-slate-200/75 rounded-2xl overflow-hidden flex flex-col transition-all hover:border-slate-350 hover:-translate-y-0.5 hover:shadow-xs cursor-default">
      {/* Image or category placeholder */}
      {image_url ? (
        <img
          src={image_url}
          alt={headline}
          className="w-full h-40 object-cover border-b border-slate-200/60 bg-slate-50"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Fallback placeholder */}
      <div
        className="items-center justify-center h-28 bg-slate-50 border-b border-slate-200/60 text-3xl"
        style={{ display: image_url ? 'none' : 'flex' }}
      >
        {CATEGORY_ICONS[category] || '📰'}
      </div>

      {/* Content */}
      <div className="p-4.5 flex-1 flex flex-col gap-3">
        {/* Badges */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border tracking-wider uppercase shadow-3xs ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {category}
          </span>
          {sentStyle && (
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md border shadow-3xs ${sentStyle.bg} ${sentStyle.text} ${sentStyle.border}`}>
              {sentStyle.label}
            </span>
          )}
        </div>

        {/* Headline */}
        <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
          {headline || 'No headline'}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1 font-medium">
            {summary}
          </p>
        )}

        {/* AI Tags */}
        {ai_tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <Tag size={12} className="text-slate-400" />
            {ai_tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 shadow-3xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
          <div>
            {source_name && (
              <span className="text-xs text-slate-450 font-bold">{source_name}</span>
            )}
            {published_at && (
              <span className="text-[10px] text-slate-400 font-semibold ml-2">
                {timeAgo(published_at)}
              </span>
            )}
          </div>
          {source_url && (
            <a
              href={source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand-blue font-bold hover:underline whitespace-nowrap"
            >
              Read article <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
