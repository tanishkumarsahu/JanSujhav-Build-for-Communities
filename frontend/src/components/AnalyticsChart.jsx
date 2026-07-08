import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PALETTE = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#64748B', '#7C3AED', '#0891B2', '#DB2777'];

const EmptyState = ({ title }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      border: '1px dashed #E2E8F0',
      borderRadius: '8px',
      color: '#64748B',
      fontSize: '14px',
    }}
  >
    <span style={{ fontSize: '24px', marginBottom: '8px' }}>📊</span>
    No data available{title ? ` for ${title}` : ''}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#0F172A',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {label && <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: '2px 0', color: entry.color || '#0F172A' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

/**
 * AnalyticsChart — reusable Recharts wrapper
 * Props: { type: 'bar'|'line'|'pie', data, xKey, yKey, title, color? }
 */
export default function AnalyticsChart({ type, data, xKey, yKey, title, color }) {
  const isEmpty = !data || data.length === 0;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '16px 20px',
      }}
    >
      {title && (
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
          {title}
        </h3>
      )}

      {isEmpty ? (
        <EmptyState title={title} />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={yKey}
                radius={[4, 4, 0, 0]}
                fill={color || '#2563EB'}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : type === 'line' ? (
            <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={color || '#2563EB'}
                strokeWidth={2}
                dot={{ r: 3, fill: color || '#2563EB', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey={yKey}
                nameKey={xKey}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={PALETTE[index % PALETTE.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span style={{ color: '#475569' }}>{value}</span>}
              />
            </PieChart>
          ) : (
            <div>Unknown chart type: {type}</div>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
