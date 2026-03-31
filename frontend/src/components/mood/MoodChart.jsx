import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function MoodChart({ data = [] }) {
  return (
    <div className="glass-card overflow-hidden rounded-3xl p-6 ring-1 ring-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Metrics Over Time</h3>
          <p className="text-sm text-white/40">30-day view of your mental and productivity trends.</p>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="logged_date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              domain={[0, 10]} 
            />
            <Tooltip 
              contentStyle={{ 
                background: "rgba(26, 29, 46, 0.95)", 
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                backdropFilter: "blur(10px)",
                fontSize: "12px"
              }} 
              itemStyle={{ padding: "2px 0" }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: "20px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}
            />
            <Area 
              type="monotone" 
              dataKey="mood_score" 
              name="Mood"
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorMood)" 
            />
            <Area 
              type="monotone" 
              dataKey="productivity_score" 
              name="Productivity"
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorProd)" 
            />
            <Area 
              type="monotone" 
              dataKey="energy_score" 
              name="Energy"
              stroke="#22d3ee" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="none" 
            />
            <Area 
              type="monotone" 
              dataKey="stress_score" 
              name="Stress"
              stroke="#f43f5e" 
              strokeWidth={2}
              strokeDasharray="3 3"
              fill="none" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

