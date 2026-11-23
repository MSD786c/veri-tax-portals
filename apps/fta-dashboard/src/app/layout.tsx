import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "FTA · veri-tax Officer Console",
  description: "Hackathon prototype – not an official FTA service",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Suspense>
          <Shell>{children}</Shell>
        </Suspense>
      </body>
    </html>
  );
}
