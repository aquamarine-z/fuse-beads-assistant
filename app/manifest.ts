import type {MetadataRoute} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/zh",
    name: "Fuse Beads Assistant",
    short_name: "Beads",
    description: "Fuse bead pattern generator",
    start_url: "/zh",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8f3",
    theme_color: "#fff8f3",
    categories: ["productivity", "graphics", "utilities"],
    icons: [
      {
        src: "/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
