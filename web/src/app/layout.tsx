import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import "./globals.css";

const display = Bodoni_Moda({ variable: "--font-display", subsets: ["latin"], weight: "variable", axes: ["opsz"] });
const body = Manrope({ variable: "--font-body", subsets: ["latin"], weight: "variable" });

export const metadata: Metadata = {
  title: { default: "Hop — split the ride home", template: "%s · Hop" },
  description: "Find KGP students heading your way, agree a plan in chat, lock it, split the fare.",
  applicationName: "Hop",
  openGraph: { title: "Hop — split the ride home", description: "Trip rooms for IIT Kharagpur students: propose, vote, lock, split.", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceee9" },
    { media: "(prefers-color-scheme: dark)", color: "#07100d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
