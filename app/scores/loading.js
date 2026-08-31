import { SkeletonPageHeader, SkeletonCard } from "../components/Skeleton";

export default function ScoresLoading() {
  return (
    <main style={{ maxWidth: 700, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={120} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height={64} />
        ))}
      </div>
    </main>
  );
}
