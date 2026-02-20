import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import type { Language } from "@/lib/translations";
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
  style: "italic",
});

export const metadata: Metadata = {
  title: "Jarre — Deep Technical Learning",
  description: "Validate real understanding of complex papers, books, and concepts through AI-generated evaluations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detect user language for voice overlay
  let language: Language = 'es';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('language')
        .eq('id', user.id)
        .single();
      language = (profile?.language || 'es') as Language;
    }
  } catch {
    // Not authenticated or DB error — default to 'es'
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent FOWT (Flash of Wrong Theme) */}
        <script
          id="theme-init"
          // eslint-disable-next-line react/no-danger -- Required to prevent FOWT; content is static and safe
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('jarre-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark');if(!t){localStorage.setItem('jarre-theme','dark')}}}catch(e){document.documentElement.classList.add('dark')}})()`,
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
        <AppShell language={language}>
          <main id="main-content">
            {children}
          </main>
        </AppShell>
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
