import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BlackStone eIT — Delivery Hub",
  description: "Project Delivery, Milestone & Invoice Coordination System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <TooltipProvider delay={200}>{children}</TooltipProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!bg-card !border-border/50 !text-foreground !shadow-xl !shadow-black/20",
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
