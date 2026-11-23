import type { Metadata } from "next";
import { Suspense } from "react";
// Shared design language: base.css + portal.css + fonts are copied verbatim from the FTA portal (veri-tax/apps/fta-portal).
import "./base.css";
import "./portal.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmaraTax · Supplier Confirmation",
  description: "Hackathon prototype of a supplier VAT refund confirmation portal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" dir="ltr">
      <body><Suspense>{children}</Suspense></body>
    </html>
  );
}
