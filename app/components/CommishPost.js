import ReactMarkdown from "react-markdown";

export default function CommishPost({ post }) {
  if (!post || !post.content) return null;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          textTransform: "uppercase",
          fontSize: "0.78rem",
          letterSpacing: "0.05em",
          color: "var(--accent)",
          marginBottom: "0.5rem",
        }}
      >
        A word from the Commish:
      </div>
      <div className="commish-post-content">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </div>
  );
}
