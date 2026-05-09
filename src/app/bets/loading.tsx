export default function BetsLoading() {
  return (
    <div className="pitch-bg min-h-screen p-4 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-pitch/60" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl bg-pitch/60 border border-pitch-light/20 h-28" />
      ))}
    </div>
  );
}
