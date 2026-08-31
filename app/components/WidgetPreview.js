// Vista previa ilustrada del widget de iOS para el modal de instalación
// (WidgetBanner.js). Usa la misma paleta exacta que
// public/scriptable/sleeper-widget.js (COLOR_* en ese archivo) para que se
// vea igual al widget real. Los 4 anillos usan colores distintos a propósito
// (rojo/naranja/verde/azul) para mostrar toda la escala de una sola vez —
// no representan un momento real, es solo para explicar el sistema de color.

const RING_COLORS = ["#ef4444", "#f97316", "#22c55e", "#3b82f6"];
const POSITIONS = ["QB", "RB", "WR", "TE"];
const POINTS = ["6.2/20.1", "9.8/15.5", "21.0/20.5", "14.2/14.2"];

const BAR_X = 14;
const BAR_WIDTH = 292;
const MARKER_PCT = 0.75;

export default function WidgetPreview() {
  const markerX = BAR_X + BAR_WIDTH * MARKER_PCT;
  const fillWidth = BAR_WIDTH * 0.61;

  return (
    <svg
      viewBox="0 0 320 172"
      role="img"
      aria-label="Ejemplo del widget: récord de color dinámico, barra de progreso de puntos y anillos de color por jugador"
      style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }}
    >
      <rect x="0" y="0" width="320" height="172" rx="22" fill="#0d0d0d" />

      {/* Fila 1: avatar + nombre + récord */}
      <circle cx="27" cy="27" r="13" fill="#4a4f47" />
      <text x="47" y="32" fontSize="14" fontWeight="700" fill="#f1f1f1">
        Diddy&rsquo;s Oilers
      </text>
      <text x="160" y="32" fontSize="13" fontWeight="700" fill="#22c55e">
        5-2
      </text>

      {/* Fila 2: barra de progreso de puntos del equipo */}
      <text x={BAR_X} y="58" fontSize="9" fill="#4a4f47">0.0</text>
      <text x={markerX} y="58" fontSize="9" fill="#9ca3af" textAnchor="middle">142.30</text>
      <text x={BAR_X + fillWidth} y="70" fontSize="9" fontWeight="700" fill="#facc15" textAnchor="middle">
        88.9
      </text>
      <rect x={BAR_X} y="74" width={BAR_WIDTH} height="7" rx="4" fill="#2a2c2a" />
      <rect x={BAR_X} y="74" width={fillWidth} height="7" rx="4" fill="#facc15" />
      <rect x={markerX - 0.75} y="71" width="1.5" height="13" fill="#f1f1f1" />

      {/* Fila 3: jugadores con anillo de color */}
      {POSITIONS.map((pos, i) => {
        const cx = BAR_X + (BAR_WIDTH / 4) * i + BAR_WIDTH / 8;
        return (
          <g key={pos}>
            <circle cx={cx} cy="112" r="21" fill={RING_COLORS[i]} />
            <circle cx={cx} cy="112" r="18" fill="#0d0d0d" />
            <circle cx={cx} cy="112" r="16" fill="#8a7a6a" />
            <text x={cx} y="145" fontSize="9" fontWeight="700" fill="#9ca3af" textAnchor="middle">
              {pos}
            </text>
            <text x={cx} y="156" fontSize="8" fill="#4a4f47" textAnchor="middle">
              {POINTS[i]}
            </text>
          </g>
        );
      })}

      <text x={BAR_X + BAR_WIDTH} y="166" fontSize="8" fill="#4a4f47" textAnchor="end">
        Hoy 4:41 pm
      </text>
    </svg>
  );
}
