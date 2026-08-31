import { SkeletonPageHeader, SkeletonCard } from "../components/Skeleton";

export default function PlayersLoading() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={160} />
      <div style={{ display: "flex", gap: "1rem" }}>
        <SkeletonCard height={200} />
        <SkeletonCard height={200} />
      </div>
    </main>
  );
}
