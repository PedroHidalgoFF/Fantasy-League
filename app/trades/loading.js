import { SkeletonPageHeader, SkeletonCard } from "../components/Skeleton";

export default function TradesLoading() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={140} />
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} height={80} />
        ))}
      </div>
    </main>
  );
}
