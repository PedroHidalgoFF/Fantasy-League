import { SkeletonPageHeader, SkeletonCard } from "./components/Skeleton";

export default function HomeLoading() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={180} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <SkeletonCard height={70} />
        <SkeletonCard height={120} />
        <SkeletonCard height={90} />
      </div>
    </main>
  );
}
