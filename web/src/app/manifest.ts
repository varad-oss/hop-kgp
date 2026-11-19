import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hop",
    short_name: "Hop",
    description: "Split the ride home with KGP.",
    start_url: "/home",
    display: "standalone",
    background_color: "#eef2f7",
    theme_color: "#14213d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
