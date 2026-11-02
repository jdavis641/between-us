import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PwaRegistration from "./PwaRegistration";
import Footer from "@/components/Footer";
import { getActiveHolidayTheme } from "@/utils/holidayTheme";

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
  const holidayTheme = getActiveHolidayTheme();

  return (
    <html 
      lang="en" 
      className="dark"
      style={holidayTheme ? {
        ['--color-zinc-950' as any]: holidayTheme.bgHex,
        ['--color-red-500' as any]: holidayTheme.textHex,
        ['--bg-zinc-950' as any]: holidayTheme.bgHex,
        ['--text-red-500' as any]: holidayTheme.textHex,
      } : undefined}
    >
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18533411371" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18533411371');
            `,
          }}
        />
        {holidayTheme && (
          <style dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-zinc-950: ${holidayTheme.bgHex} !important;
                --color-red-500: ${holidayTheme.textHex} !important;
                --bg-zinc-950: ${holidayTheme.bgHex} !important;
                --text-red-500: ${holidayTheme.textHex} !important;
              }
              body {
                background-color: ${holidayTheme.bgHex} !important;
              }
              .bg-zinc-950 {
                background-color: ${holidayTheme.bgHex} !important;
              }
              .text-red-500 {
                color: ${holidayTheme.textHex} !important;
              }
            `
          }} />
        )}
      </head>
      <body 
        className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased min-h-screen flex flex-col`}
        style={holidayTheme ? { backgroundColor: holidayTheme.bgHex } : undefined}
      >
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1681300696758130');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1681300696758130&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        <Footer />
        <PwaRegistration />
      </body>
    </html>
  );
}
