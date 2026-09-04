import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PwaRegistration from "./PwaRegistration";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Between Us",
  description: "An intimacy and role-play app for couples",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Between Us",
  },
  metadataBase: new URL('https://betweenusapp.io'),
  openGraph: {
    title: 'Between Us',
    description: 'An intimacy and role-play app for couples',
    url: 'https://betweenusapp.io',
    siteName: 'Between Us',
    type: 'website',
  },
  alternates: {
    canonical: 'https://betweenusapp.io',
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased min-h-screen flex flex-col`}>
        {children}
        <Footer />
        <PwaRegistration />
      </body>
    </html>
  );
}
