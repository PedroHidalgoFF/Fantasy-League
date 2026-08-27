export const metadata = {
  title: "Mi Liga - Fantasy Football",
  description: "Power rankings, standings, trades y noticias de la liga",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "sans-serif", margin: 0, padding: "2rem", background: "#0f1115", color: "#f1f1f1" }}>
        {children}
      </body>
    </html>
  );
}
