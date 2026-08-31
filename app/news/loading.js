import { SkeletonPageHeader, SkeletonCard } from "../components/Skeleton";

export default function NewsLoading() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={110} />
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} height={50} />
        ))}
      </div>
    </main>
  );
}
