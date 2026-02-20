import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Jarre — Deep Technical Learning",
  description: "Validate real understanding of complex papers, books, and concepts through AI-generated evaluations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent FOWT (Flash of Wrong Theme) */}
        <script
          id="theme-init"
          // eslint-disable-next-line react/no-danger -- Required to prevent FOWT; content is static and safe
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('jarre-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-j-accent focus:text-j-text-on-accent font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          Saltar al contenido principal
        </a>
        <main id="main-content">
          {children}
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'font-mono text-[11px] tracking-wide',
          }}
        />
      </body>
    </html>
  );
}
