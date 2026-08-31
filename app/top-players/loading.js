import { SkeletonPageHeader, SkeletonBlock, SkeletonRow } from "../components/Skeleton";

export default function TopPlayersLoading() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={160} />
      <SkeletonBlock height={38} width="100%" style={{ marginBottom: "1rem", borderRadius: 8 }} />
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonRow key={i} avatarSize={36} />
      ))}
    </main>
  );
}
