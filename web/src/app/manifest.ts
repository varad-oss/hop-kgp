import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hop",
    short_name: "Hop",
    description: "Split the ride home with KGP.",
    start_url: "/home",
    display: "standalone",
    background_color: "#eceee9",
    theme_color: "#12352a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
