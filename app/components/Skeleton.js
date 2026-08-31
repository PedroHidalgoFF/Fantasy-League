// Piezas reutilizables para los loading.js de cada ruta. La idea es que
// cada loading.js arme, con estas piezas, una silueta parecida a la forma
// real de esa página (título + tarjetas, título + tabla, título + filas de
// avatar) en vez de un spinner genérico — así el salto entre el skeleton y
// el contenido real se siente continuo.

export function SkeletonBlock({ width = "100%", height = 16, style }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

export function SkeletonCircle({ size = 40, style }) {
  return <div className="skeleton" style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, ...style }} />;
}

export function SkeletonRow({ avatarSize = 40 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0" }}>
      <SkeletonCircle size={avatarSize} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <SkeletonBlock height={14} width="60%" />
        <SkeletonBlock height={11} width="35%" />
      </div>
    </div>
  );
}

export function SkeletonCard({ height = 90 }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", background: "var(--surface)" }}>
      <SkeletonBlock height={14} width="45%" style={{ marginBottom: "0.6rem" }} />
      <SkeletonBlock height={height} />
    </div>
  );
}

export function SkeletonPageHeader({ titleWidth = 220 }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <SkeletonBlock height={26} width={titleWidth} style={{ marginBottom: "0.5rem" }} />
      <SkeletonBlock height={13} width="70%" />
    </div>
  );
}
