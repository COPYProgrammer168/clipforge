import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ClipForge — turn any footage into ten scroll-stopping clips",
    template: "%s — ClipForge",
  },
  description:
    "ClipForge turns long videos into ready-to-post vertical, square and landscape clips with captions, smart reframing and automatic highlight detection.",
  applicationName: "ClipForge",
  keywords: [
    "AI video editor",
    "clipping tool",
    "short-form video",
    "captions",
    "reframe",
    "video repurposing",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground grain">
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" theme="dark" />
        </TooltipProvider>
      </body>
    </html>
  );
}
