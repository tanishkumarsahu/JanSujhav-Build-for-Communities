import { ExternalLink, Tag } from 'lucide-react';

const CATEGORY_COLORS = {
  Politics: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  Infrastructure: { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA' },
  Health: { bg: '#FFF0F3', color: '#DC2626', border: '#FECACA' },
  Education: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  Economy: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Environment: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  General: { bg: '#F8F9FA', color: '#64748B', border: '#E2E8F0' },
};

const SENTIMENT_STYLES = {
  Positive: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Positive' },
  Negative: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Negative' },
  Neutral: { bg: '#F8F9FA', color: '#64748B', border: '#E2E8F0', label: 'Neutral' },
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
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
    >
      {/* Image or category placeholder */}
      {image_url ? (
        <img
          src={image_url}
          alt={headline}
          style={{
            width: '100%',
            height: '160px',
            objectFit: 'cover',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F1F5F9',
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Fallback placeholder */}
      <div
        style={{
          display: image_url ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '120px',
          backgroundColor: '#F1F5F9',
          borderBottom: '1px solid #E2E8F0',
          fontSize: '36px',
        }}
      >
        {CATEGORY_ICONS[category] || '📰'}
      </div>

      {/* Content */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: catStyle.bg,
              color: catStyle.color,
              border: `1px solid ${catStyle.border}`,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {category}
          </span>
          {sentStyle && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: sentStyle.bg,
                color: sentStyle.color,
                border: `1px solid ${sentStyle.border}`,
              }}
            >
              {sentStyle.label}
            </span>
          )}
        </div>

        {/* Headline */}
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: '#0F172A',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {headline || 'No headline'}
        </h3>

        {/* Summary */}
        {summary && (
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#475569',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {summary}
          </p>
        )}

        {/* AI Tags */}
        {ai_tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Tag size={12} color="#64748B" />
            {ai_tags.slice(0, 5).map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid #F1F5F9',
            marginTop: 'auto',
          }}
        >
          <div>
            {source_name && (
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{source_name}</span>
            )}
            {published_at && (
              <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '8px' }}>
                {timeAgo(published_at)}
              </span>
            )}
          </div>
          {source_url && (
            <a
              href={source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#2563EB',
                textDecoration: 'none',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Read article <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
