import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { PlayerProvider } from "./../context/PlayerContext";
import { DownloadProvider } from "./../context/DownloadContext";
import { ThemeProvider } from "./../context/ThemeContext";
import DashboardFloatingButtons from "@/components/DashboardFloatingButtons";
import MobileFooter from "@/components/MobileFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Serenity - Feel the Music",
  description: "Discover music that heals, uplifts, and connects you to your emotions with Serenity+. Features mood-based recommendations, smart search, AI assistant, and more.",
  keywords: ["music streaming", "mood-based music", "music player", "playlists", "AI music assistant", "audio recognition"],
  authors: [{ name: "Serenity" }],
  creator: "Serenity",
  publisher: "Serenity",
  icons: {
    icon: '/new-logo.png',
    apple: '/new-logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Serenity+',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://serenity.app',
    title: 'Serenity - Feel the Music',
    description: 'Discover music that heals, uplifts, and connects you to your emotions. Features mood-based recommendations, smart search, and AI assistance.',
    siteName: 'Serenity',
    images: [
      {
        url: '/new-logo.png',
        width: 1200,
        height: 630,
        alt: 'Serenity Music App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Serenity - Feel the Music',
    description: 'Discover music that heals, uplifts, and connects you to your emotions.',
    images: ['/new-logo.png'],
    creator: '@serenityapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0097b2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Serenity+" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Serenity+" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0097b2" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" sizes="180x180" href="/new-logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <ThemeProvider>
          <DownloadProvider>
            <PlayerProvider>
              <Navbar />
              {children}
              <MobileFooter />
              <DashboardFloatingButtons />
            </PlayerProvider>
          </DownloadProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
