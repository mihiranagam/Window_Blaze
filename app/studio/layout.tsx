import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gateway Growth Studio | St. Louis Opportunity Map",
  description: "Version 2 of the St. Louis window-replacement opportunity dashboard, with an inset analytics layout.",
};

export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
