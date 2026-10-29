import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "GrantOS — Funding Operations", template: "%s · GrantOS" },
  description: "Grant Operations & Client Management Platform for federal funding consultancies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <Toaster position="bottom-right" toastOptions={{ classNames: { toast: "!rounded-lg !border-border !shadow-lg", description: "!text-muted-foreground" } }} />
      </body>
    </html>
  );
}
