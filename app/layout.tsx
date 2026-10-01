import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timedoor Academy — Event Revamp",
  description: "Interactive prototype for event scheduling and rescheduling",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}