import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmaraTax – Supplier Confirmation",
  description: "Hackathon prototype of a supplier VAT refund confirmation portal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" dir="ltr">
      <body><Suspense>{children}</Suspense></body>
    </html>
  );
}
