import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PALETTE = ['#8CC0EB', '#5BA3D9', '#D97706', '#DC2626', '#64748B', '#7C3AED', '#0891B2', '#DB2777'];

const EmptyState = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[200px] border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
    <span className="text-2xl mb-2">📊</span>
    No data available{title ? ` for ${title}` : ''}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800 shadow-md">
      {label && <p className="m-0 mb-1.5 font-semibold">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="m-0 my-0.5" style={{ color: entry.color || '#1E293B' }}>
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
    <div className="bg-white border border-slate-100 rounded-xl p-5">
      {title && (
        <h3 className="m-0 mb-4 text-sm font-semibold text-slate-800">{title}</h3>
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
                fill={color || '#8CC0EB'}
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
                stroke={color || '#8CC0EB'}
                strokeWidth={2}
                dot={{ r: 3, fill: color || '#8CC0EB', strokeWidth: 0 }}
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
                formatter={(value) => <span className="text-slate-500">{value}</span>}
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
