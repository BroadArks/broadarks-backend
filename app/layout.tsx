import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE.panelName,
  description: `Applications and enquiries submitted on ${SITE.websiteLabel}.`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
