export default function WeeklyReport({ summary }) {
  if (!summary) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <h3 className="text-lg font-semibold">Latest Weekly Report</h3>
      <p className="mt-3 whitespace-pre-line text-sm text-white/80">{summary.summary_text}</p>
      <div className="mt-3 space-y-1 text-sm text-white/70">
        {summary.recommendations?.map((rec, i) => (
          <p key={`${rec}-${i}`}>{i + 1}. {rec}</p>
        ))}
      </div>
    </div>
  );
}
