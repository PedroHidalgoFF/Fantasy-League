import { Star } from "lucide-react";

export default function YourTeamBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        background: "var(--accent)",
        color: "var(--accent-contrast)",
        padding: "0.1rem 0.5rem",
        borderRadius: "999px",
        fontSize: "0.65rem",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      <Star size={11} fill="var(--accent-contrast)" /> You
    </span>
  );
}
