import { SkeletonPageHeader, SkeletonRow } from "../components/Skeleton";

export default function TeamsLoading() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <SkeletonPageHeader titleWidth={120} />
      {Array.from({ length: 10 }).map((_, i) => (
        <SkeletonRow key={i} avatarSize={32} />
      ))}
    </main>
  );
}
