import { SkeletonPageHeader, SkeletonBlock, SkeletonCircle } from "../components/Skeleton";

export default function MyTeamLoading() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={160} />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <SkeletonBlock height={32} width={100} style={{ borderRadius: 999 }} />
        <SkeletonBlock height={32} width={100} style={{ borderRadius: 999 }} />
        <SkeletonBlock height={32} width={100} style={{ borderRadius: 999 }} />
      </div>
      <div style={{ display: "flex", gap: "0.75rem", overflow: "hidden" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCircle key={i} size={90} style={{ borderRadius: 12 }} />
        ))}
      </div>
    </main>
  );
}
