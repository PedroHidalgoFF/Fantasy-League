import { SkeletonPageHeader, SkeletonBlock, SkeletonCard } from "../components/Skeleton";

export default function WeeklyReportLoading() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={220} />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} height={32} width={110} style={{ borderRadius: 999 }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ flex: "1 1 200px" }}>
            <SkeletonCard height={60} />
          </div>
        ))}
      </div>
    </main>
  );
}
