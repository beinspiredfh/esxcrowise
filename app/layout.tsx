import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Esxcrowise MVP",
  description:
    "A D1-backed WhatsApp escrow MVP for Nigerian social commerce sellers.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
