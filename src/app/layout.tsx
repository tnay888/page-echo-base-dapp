import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  keywords: ["Base", "Base builder", "onchain", "dApp", "wallet"],
  title: "Page Echo",
  // Base builder identity: project-level proof uses Build ID, Builder Wallet, Builder Code, Vercel Live Demo, and GitHub repository.
  description:
    "Save a reading note with book, page, mood, wallet, and timestamp on Base.",
};

const configuredBaseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID?.trim();
const baseAppId =
  configuredBaseAppId && !configuredBaseAppId.includes("replace_with")
    ? configuredBaseAppId
    : "6a0809bcbc175abcdd5651d2";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {baseAppId ? <meta name="base:app_id" content={baseAppId} /> : null}
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
