export default function DashboardLoading() {
  return (
    <div className="pitch-bg min-h-screen p-4 space-y-4 animate-pulse">
      {/* Hero card skeleton */}
      <div className="rounded-2xl bg-pitch/60 border border-pitch-light/20 p-6 h-32" />

      {/* Bet category cards */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-pitch/60 border border-pitch-light/20 h-24" />
        ))}
      </div>

      {/* Leaderboard skeleton */}
      <div className="rounded-2xl bg-pitch/60 border border-pitch-light/20 p-4 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-pitch-dark/60" />
        ))}
      </div>

      {/* Trash talk skeleton */}
      <div className="rounded-2xl bg-pitch/60 border border-pitch-light/20 h-48" />
    </div>
  );
}
