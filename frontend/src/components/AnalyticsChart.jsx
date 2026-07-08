import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PALETTE = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#64748B', '#7C3AED', '#0891B2', '#DB2777'];

const EmptyState = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-200 rounded-xl text-slate-450 text-xs font-semibold">
    <span className="text-xl mb-2">📊</span>
    No data available{title ? ` for ${title}` : ''}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 px-3.5 text-xs text-slate-800 shadow-sm">
      {label && <p className="m-0 mb-1.5 font-bold">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="m-0 mt-0.5" style={{ color: entry.color || '#0F172A' }}>
          {entry.name}: <strong className="font-extrabold">{entry.value}</strong>
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
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 px-5">
      {title && (
        <h3 className="m-0 mb-4 text-xs font-bold text-slate-700 tracking-wide uppercase">
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
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
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
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 650, color: '#475569' }} />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={color || '#2563EB'}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: color || '#2563EB', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
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
                wrapperStyle={{ fontSize: '11px', fontWeight: 650 }}
                formatter={(value) => <span className="text-slate-600">{value}</span>}
              />
            </PieChart>
          ) : (
            <div className="text-xs text-rose-500 font-bold">Unknown chart type: {type}</div>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
