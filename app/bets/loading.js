import { SkeletonPageHeader, SkeletonCard } from "../components/Skeleton";

export default function BetsLoading() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={140} />
      <SkeletonCard height={220} />
      <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <SkeletonCard height={90} />
        <SkeletonCard height={90} />
      </div>
    </main>
  );
}
