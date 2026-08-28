export default function manifest() {
  return {
    name: "RedZone Redemption",
    short_name: "Fantasy Partner",
    description: "Power rankings, standings, trades, and league news",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1210",
    theme_color: "#0b1210",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
