import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giveaway Picker",
  description: "Pick random giveaway winners from comment CSV files.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
