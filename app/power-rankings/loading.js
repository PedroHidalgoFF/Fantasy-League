import { SkeletonPageHeader, SkeletonRow, SkeletonBlock } from "../components/Skeleton";

export default function PowerRankingsLoading() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={220} />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <SkeletonBlock height={32} width={140} style={{ borderRadius: 999 }} />
        <SkeletonBlock height={32} width={140} style={{ borderRadius: 999 }} />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonRow key={i} avatarSize={22} />
      ))}
    </main>
  );
}
