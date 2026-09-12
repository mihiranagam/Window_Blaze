import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gateway Growth | St. Louis Window Opportunity Map",
  description: "An interactive St. Louis market dashboard for prioritizing window replacement territories.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
